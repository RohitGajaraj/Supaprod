import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callModel } from "@/lib/ai/runtime.server";
import { withJobRun } from "@/lib/observability";
import {
  quarantineUntrusted,
  quarantineUntrustedCorpus,
} from "@/lib/ai/guardrails-injection.server";
import {
  RETRO_LOOKBACK_DAYS,
  RETRO_MIN_RUNS_TO_CLUSTER,
  RETRO_MAX_RUNS_PER_PASS,
  RETRO_MAX_RULES_PER_PASS,
  RETRO_SYSTEM_PROMPT,
  buildActiveRulesBlock,
  buildRetroDigest,
  isoWeekKey,
  parseRetroDraft,
  snippetOf,
  startOfDayUtc,
  type ScreenedRun,
} from "@/lib/ai/nightly-retro";

/**
 * RPT-39: the nightly retro pass, the AI/trace rung of self-improvement.
 *
 * Reads the trailing week's agent execution traces (`agent_runs`) for each
 * workspace, finds recurring OPERATIONAL patterns (repeated failures, halts,
 * wasted steps), and drafts short standing operating rules as 'pending'
 * `house_rules` drafts. A human decides each one; only approved rules ever reach
 * the chokepoint (renderHouseRulesBlock in loop.server.ts). This route makes
 * zero writes beyond the drafts, and never auto-applies: reviewable, auditable,
 * never silent drift.
 *
 * Sibling to RF-04 (house-rules-tick, which distills human `learnings`) and
 * RF-07 (prompt-optimize-tick). The distinguishing input is TRACE text, which
 * unlike `learnings.summary` is model-generated and therefore untrusted: the
 * whole trace corpus is run through quarantineUntrustedCorpus BEFORE it reaches
 * the drafting prompt, and each drafted rule is screened again on the way out.
 * Retro-sourced drafts are marked by a non-empty `source_run_ids`, which keeps
 * them independent of RF-04's rows (its provenance is `source_learning_ids`).
 *
 * Idempotent two ways: (1) a run already cited by ANY non-rejected retro draft
 * is excluded from the candidate pool, so a trace is distilled at most once;
 * (2) a workspace that already has a retro draft created today (a house_rule
 * with non-empty source_run_ids, created since 00:00 UTC) is skipped, so a
 * nightly double-fire is a no-op. Runs nightly (migration schedules 09:00 UTC).
 */

const MAX_WORKSPACES = 5;

type RunRow = {
  id: string;
  agent_slug: string | null;
  agent_name: string | null;
  status: string | null;
  failure_kind: string | null;
  halted_reason: string | null;
  input: string | null;
  output: string | null;
};

async function retroDistillWorkspace(
  workspaceId: string,
  ownerId: string,
): Promise<{ drafted: number; skipped: string }> {
  const db = supabaseAdmin as unknown as SupabaseClient;

  // Guard 1: skip if this workspace already got a retro draft today. A retro
  // draft is any house_rule with a non-empty source_run_ids; checked in JS to
  // avoid depending on PostgREST array-operator semantics for "non-empty".
  const { data: todays } = await db
    .from("house_rules")
    .select("source_run_ids")
    .eq("workspace_id", workspaceId)
    .gte("created_at", startOfDayUtc(new Date()));
  const retroDraftedToday = ((todays ?? []) as { source_run_ids: string[] | null }[]).some(
    (r) => (r.source_run_ids ?? []).length > 0,
  );
  if (retroDraftedToday) return { drafted: 0, skipped: "already drafted a retro today" };

  // Provenance dedup: a run cited by any non-rejected retro draft is spent. A
  // rejected draft's runs are eligible again (a human rejecting one framing
  // should not permanently bury that trace pattern).
  const { data: existingRules } = await db
    .from("house_rules")
    .select("source_run_ids")
    .eq("workspace_id", workspaceId)
    .neq("status", "rejected");
  const usedRunIds = new Set(
    ((existingRules ?? []) as { source_run_ids: string[] | null }[]).flatMap(
      (r) => r.source_run_ids ?? [],
    ),
  );

  // The rules already standing (approved OR pending), so the model never
  // restates a live rule (its own OR RF-04's outcome-distilled ones).
  const { data: liveRules } = await db
    .from("house_rules")
    .select("rule_text")
    .eq("workspace_id", workspaceId)
    .in("status", ["approved", "pending"])
    .order("created_at", { ascending: false })
    .limit(40);
  const activeRuleTexts = ((liveRules ?? []) as { rule_text: string | null }[])
    .map((r) => r.rule_text ?? "")
    .filter((t) => t.length > 0);

  const since = new Date(Date.now() - RETRO_LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data: runRows } = await db
    .from("agent_runs")
    .select("id,agent_slug,agent_name,status,failure_kind,halted_reason,input,output")
    .eq("workspace_id", workspaceId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(RETRO_MAX_RUNS_PER_PASS);
  const candidates = ((runRows ?? []) as RunRow[]).filter((r) => !usedRunIds.has(r.id));
  if (candidates.length < RETRO_MIN_RUNS_TO_CLUSTER) {
    return {
      drafted: 0,
      skipped: `only ${candidates.length} fresh traces (need ${RETRO_MIN_RUNS_TO_CLUSTER})`,
    };
  }

  // The trace free-text (input/output/halted_reason) is model-generated, so it
  // is the untrusted case quarantineUntrustedCorpus exists for: screen the whole
  // corpus (with cross-chunk escalation) BEFORE any of it reaches the prompt.
  const rawChunks = candidates.map((r) =>
    snippetOf([r.input, r.output, r.halted_reason].filter(Boolean).join(" ")),
  );
  const screened = quarantineUntrustedCorpus(rawChunks);
  const screenedRuns: ScreenedRun[] = candidates.map((r, i) => ({
    agent: r.agent_slug || r.agent_name || "unknown",
    status: r.status || "unknown",
    failure: r.failure_kind,
    snippet: screened.chunks[i]?.text ?? "",
  }));

  const digest = buildRetroDigest(screenedRuns);
  const activeBlock = buildActiveRulesBlock(activeRuleTexts);

  // Respect the owner's pinned agentic_model, then default_model, then Gemini.
  const { data: ownerProf } = await db
    .from("profiles")
    .select("agentic_model, default_model")
    .eq("id", ownerId)
    .maybeSingle();
  const prof = ownerProf as { agentic_model?: string | null; default_model?: string | null } | null;
  const model =
    prof?.agentic_model?.trim() || prof?.default_model?.trim() || "google/gemini-2.5-flash";

  const res = await callModel(supabaseAdmin as never, ownerId, {
    surface: "judge",
    surface_ref: `retro-tick:${workspaceId}:${isoWeekKey(new Date())}`,
    model,
    fallbackModel: "google/gemini-2.5-flash",
    responseFormat: "json_object",
    messages: [
      { role: "system", content: RETRO_SYSTEM_PROMPT },
      { role: "user", content: `${activeBlock}\n\nTraces:\n${digest}` },
    ],
  });

  const drafts = parseRetroDraft(res.output ?? "").slice(0, RETRO_MAX_RULES_PER_PASS);
  if (drafts.length === 0) return { drafted: 0, skipped: "no genuine pattern found" };

  let drafted = 0;
  for (const d of drafts) {
    const sourceIds = [
      ...new Set(
        d.source_indices
          .map((i) => candidates[i - 1]?.id)
          .filter((x): x is string => typeof x === "string"),
      ),
    ];
    if (sourceIds.length < 2) continue; // never draft from fewer than 2 DISTINCT traces

    // Defense in depth: a drafted rule reaches every future agent's system
    // prompt at the chokepoint on approval, so it is screened at the untrusted
    // boundary before being stored, matching RF-04/RF-07.
    const cleaned = quarantineUntrusted(d.rule_text.trim());
    const flagNote =
      cleaned.verdict.decision === "quarantine"
        ? "[Supaprod flagged this draft: possible prompt-injection pattern, original text withheld] "
        : cleaned.verdict.decision === "flag"
          ? "[Supaprod flagged this draft for review: possible prompt-injection language] "
          : "";

    const rationale =
      `Nightly retro (${isoWeekKey(new Date())}): ${flagNote}${(d.rationale ?? "").trim()}`
        .trim()
        .slice(0, 2000);

    const { error } = await db.from("house_rules").insert({
      user_id: ownerId,
      workspace_id: workspaceId,
      rule_text: cleaned.text.slice(0, 2000),
      rationale,
      status: "pending",
      source_run_ids: sourceIds,
    });
    if (!error) drafted += 1;
  }
  return { drafted, skipped: "" };
}

export const Route = createFileRoute("/api/public/hooks/retro-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("ambient.retro-tick", async () => {
          const { data: workspaces, error: wsErr } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id")
            .eq("is_sample", false)
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
              const r = await retroDistillWorkspace(ws.id, ws.owner_id);
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
