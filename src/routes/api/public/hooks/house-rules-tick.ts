import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callModel } from "@/lib/ai/runtime.server";
import { withJobRun } from "@/lib/observability";
import { assessAndQuarantine } from "@/lib/injection-classifier";

/**
 * RF-04: the weekly steward pass — house-rules distillation.
 *
 * Clusters this week's not-yet-distilled, workspace-confirmed `learnings`
 * (any verdict — a validated bet AND a missed one both carry standing
 * judgment worth keeping) into short, versioned house rules, inserted as
 * 'pending' drafts (house_rules.functions.ts). A human decides each one; only
 * approved rules ever reach the chokepoint (renderHouseRulesBlock in
 * loop.server.ts). This route makes zero writes beyond the drafts.
 *
 * Idempotent two ways: (1) a learning already cited by ANY existing
 * house_rules.source_learning_ids is excluded from the candidate pool, so a
 * learning is distilled at most once; (2) a workspace that already drafted a
 * rule this ISO week is skipped, so a cron double-fire this week is a no-op.
 * Runs weekly (migration schedules it Monday 10:00 UTC).
 */

const MAX_WORKSPACES = 5;
const LOOKBACK_DAYS = 30;
const MIN_LEARNINGS_TO_CLUSTER = 3;
const MAX_LEARNINGS_PER_PASS = 40;
const MAX_RULES_PER_PASS = 3;

type LearningRow = {
  id: string;
  verdict: string;
  summary: string;
  metric_label: string | null;
  metric_value: string | null;
};

type DraftedRule = { rule_text: string; rationale: string; source_indices: number[] };

const SYSTEM_PROMPT = `You are a product-operations steward. Given a workspace's recent, human-confirmed learnings (each already carries a verdict: validated, missed, or mixed), find real PATTERNS across two or more of them and draft short, standing operating rules a PM team should keep in mind on every future bet.

Good rule examples: "bets touching checkout convert 2x when scoped under a week", "this team consistently underestimates infra work", "positioning changes need two weeks of signal before a verdict is safe to call".

Rules:
- Only draft a rule when at least 2 learnings genuinely support the same pattern. Never draft a rule from a single learning.
- Each rule is one sentence, plain language, no markdown, no em dashes.
- Draft at most 3 rules. Fewer, sharper rules beat many vague ones.
- source_indices are the 1-based indices (from the numbered list you were given) of the learnings that support each rule.

Return STRICT JSON only: {"rules":[{"rule_text":"...","rationale":"one line: why this pattern is real","source_indices":[1,3]}]}
If no genuine pattern exists, return {"rules":[]}.`;

function parseDraft(text: string): DraftedRule[] {
  try {
    const parsed = JSON.parse(text) as { rules?: unknown };
    if (!Array.isArray(parsed.rules)) return [];
    return parsed.rules.filter(
      (r): r is DraftedRule =>
        !!r &&
        typeof (r as DraftedRule).rule_text === "string" &&
        (r as DraftedRule).rule_text.trim().length > 0 &&
        Array.isArray((r as DraftedRule).source_indices),
    );
  } catch {
    return [];
  }
}

/** ISO week label, e.g. "2026-W27". Deterministic, no external dep. */
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function startOfIsoWeekUtc(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() - (dayNum - 1));
  return date.toISOString();
}

async function distillWorkspace(
  workspaceId: string,
  ownerId: string,
): Promise<{ drafted: number; skipped: string }> {
  const db = supabaseAdmin as unknown as SupabaseClient;

  // Skip if this workspace already drafted a rule this ISO week.
  const { count: draftedThisWeek } = await db
    .from("house_rules")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .gte("created_at", startOfIsoWeekUtc(new Date()));
  if ((draftedThisWeek ?? 0) > 0) return { drafted: 0, skipped: "already drafted this week" };

  // A rejected draft's source learnings are eligible again: a human rejecting
  // one framing of a pattern should not permanently block that pattern from
  // ever being reconsidered in a different combination with newer learnings.
  const { data: existingRules } = await db
    .from("house_rules")
    .select("source_learning_ids")
    .eq("workspace_id", workspaceId)
    .neq("status", "rejected");
  const usedLearningIds = new Set(
    ((existingRules ?? []) as { source_learning_ids: string[] | null }[]).flatMap(
      (r) => r.source_learning_ids ?? [],
    ),
  );

  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data: learningRows } = await db
    .from("learnings")
    .select("id,verdict,summary,metric_label,metric_value")
    .eq("workspace_id", workspaceId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_LEARNINGS_PER_PASS);
  const candidates = ((learningRows ?? []) as LearningRow[]).filter(
    (l) => !usedLearningIds.has(l.id),
  );
  if (candidates.length < MIN_LEARNINGS_TO_CLUSTER) {
    return {
      drafted: 0,
      skipped: `only ${candidates.length} undistilled learnings (need ${MIN_LEARNINGS_TO_CLUSTER})`,
    };
  }

  const numbered = candidates
    .map((l, i) => {
      const metric = l.metric_label ? ` (${l.metric_label}: ${l.metric_value ?? "?"})` : "";
      return `[${i + 1}] verdict=${l.verdict}${metric}: ${l.summary}`;
    })
    .join("\n");

  const { data: ownerProf } = await db
    .from("profiles")
    .select("default_model")
    .eq("id", ownerId)
    .maybeSingle();
  const model =
    (ownerProf as { default_model?: string | null } | null)?.default_model?.trim() ||
    "google/gemini-2.5-flash";

  const res = await callModel(supabaseAdmin as never, ownerId, {
    surface: "judge",
    surface_ref: `house-rules-tick:${workspaceId}:${isoWeekKey(new Date())}`,
    model,
    fallbackModel: "google/gemini-2.5-flash",
    responseFormat: "json_object",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: numbered },
    ],
  });

  const drafts = parseDraft(res.output ?? "").slice(0, MAX_RULES_PER_PASS);
  if (drafts.length === 0) return { drafted: 0, skipped: "no genuine pattern found" };

  let drafted = 0;
  for (const d of drafts) {
    const sourceIds = d.source_indices
      .map((i) => candidates[i - 1]?.id)
      .filter((x): x is string => typeof x === "string");
    if (sourceIds.length < 2) continue; // never draft from a single anecdote

    // Defense in depth (FND-0.7): an AI-drafted rule reaches every future
    // agent's system prompt at the chokepoint, so it is screened at the same
    // untrusted boundary as retrieved/ingested content before it is ever
    // stored, even though today's only learnings-writer (recordOutcome) is
    // human-typed. Quarantine strips a structurally-confirmed injection;
    // a lexical-only "flag" is kept but surfaced to the human reviewer.
    const screened = assessAndQuarantine(d.rule_text.trim());
    const flagNote =
      screened.verdict.decision === "quarantine"
        ? "[Cadence flagged this draft: possible prompt-injection pattern, original text withheld] "
        : screened.verdict.decision === "flag"
          ? "[Cadence flagged this draft for review: possible prompt-injection language] "
          : "";

    const { error } = await db.from("house_rules").insert({
      user_id: ownerId,
      workspace_id: workspaceId,
      rule_text: screened.text.slice(0, 2000),
      rationale: (flagNote + (d.rationale ?? "").trim()).trim().slice(0, 2000) || null,
      status: "pending",
      source_learning_ids: sourceIds,
    });
    if (!error) drafted += 1;
  }
  return { drafted, skipped: "" };
}

export const Route = createFileRoute("/api/public/hooks/house-rules-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("ambient.house-rules-tick", async () => {
          const { data: workspaces, error: wsErr } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id")
            .order("created_at", { ascending: true })
            .limit(MAX_WORKSPACES);
          if (wsErr) return json({ ok: false, error: wsErr.message }, 500);

          const results: Array<{
            workspace_id: string;
            drafted?: number;
            skipped?: string;
            error?: string;
          }> = [];
          for (const ws of (workspaces ?? []) as Array<{ id: string; owner_id: string }>) {
            try {
              const r = await distillWorkspace(ws.id, ws.owner_id);
              results.push({ workspace_id: ws.id, ...r });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({ ok: true, processed: workspaces?.length ?? 0, results });
        });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
