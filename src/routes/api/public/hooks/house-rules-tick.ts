import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callModel } from "@/lib/ai/runtime.server";
import { withJobRunHttp, recordErrorEvent } from "@/lib/observability";
import { assessAndQuarantine } from "@/lib/injection-classifier";
import {
  selectDistillTargets,
  type DistillTarget,
  type HouseRuleProvenance,
} from "@/lib/house-rules.functions";

/**
 * RF-04: the weekly steward pass — house-rules distillation.
 *
 * Clusters a workspace's not-yet-distilled `learnings` (any verdict — a
 * validated bet AND a missed one both carry standing judgment worth keeping)
 * into short, versioned house rules, inserted as 'pending' drafts
 * (house-rules.functions.ts). A human decides each one in the Safety room
 * (src/components/governance/HouseRulesPanel.tsx, reachable at
 * /engine-room?room=safety) or in the approvals queue; only approved rules
 * ever reach the chokepoint (renderHouseRulesBlock in loop.server.ts). This
 * route makes zero writes beyond the drafts.
 *
 * WHY THIS PASS PRODUCED NOTHING FOR ITS WHOLE LIFE (fixed 2026-08-05): it
 * picked workspaces with `order(created_at asc).limit(5)` — the five OLDEST —
 * and every one of those five held zero learnings, all time. The eleven
 * workspaces that DID hold learnings had all been created later, so they were
 * structurally unreachable. `job_runs` recorded the pass finishing ok in 515ms
 * (2026-08-03) and 278ms (2026-07-27): too fast to have reached a model,
 * because it never did. Selection is now driven by where the undistilled
 * learnings are (selectDistillTargets), not by workspace age, and the five
 * model calls a pass still buys are spent on the five workspaces holding the
 * most undistilled material.
 *
 * Idempotent two ways, both now enforced inside selectDistillTargets: (1) a
 * learning already cited by ANY non-rejected house rule is excluded from the
 * candidate pool, so a learning is distilled at most once; (2) a workspace
 * this pass already drafted for this ISO week is skipped, so a cron
 * double-fire this week is a no-op. Runs weekly (migration schedules it Monday
 * 10:00 UTC).
 *
 * Every read failure here is recorded with recordErrorEvent rather than
 * swallowed. The previous version destructured only `data` from each query, so
 * a broken read was indistinguishable from an empty workspace and the pass
 * reported "ok" either way — the exact shape of failure that let this sit inert
 * for a month.
 */

const SURFACE = "ambient.house-rules-tick";
const REQUEST_PATH = "/api/public/hooks/house-rules-tick";

/** Model calls a single pass will spend. The cost ceiling, unchanged. */
const MAX_WORKSPACES = 5;
/** How many workspaces the selection scan may consider. Not a cost: it buys
 *  zero model calls, it only decides which five get them. */
const WORKSPACE_SCAN_CAP = 200;
/** Ceiling on the learnings scan. Well above the live corpus; a pass that ever
 *  hits it would silently favor recently-active workspaces, so it is recorded
 *  as an error event rather than trimmed in silence. */
const LEARNING_SCAN_CAP = 2000;
const LOOKBACK_DAYS = 30;
const MIN_LEARNINGS_TO_CLUSTER = 3;
const MAX_LEARNINGS_PER_PASS = 40;
const MAX_RULES_PER_PASS = 3;

type LearningRow = {
  id: string;
  workspace_id: string | null;
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

export function startOfIsoWeekUtc(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() - (dayNum - 1));
  return date.toISOString();
}

/** Failures are recorded, never printed. console.error in a Worker reaches
 *  nobody the founder can read; error_events is the always-on floor. */
async function note(err: unknown, failureKind: string, workspaceId?: string): Promise<void> {
  await recordErrorEvent(err, {
    surface: SURFACE,
    failure_kind: failureKind,
    request_path: REQUEST_PATH,
    ...(workspaceId ? { workspace_id: workspaceId } : {}),
  });
}

type Plan = { targets: DistillTarget[]; learningById: Map<string, LearningRow>; scanned: number };

/**
 * Phase one: read everything the selection needs and work out which workspaces
 * get this pass's model calls. Makes no writes and no model calls, so a plan
 * that comes back empty costs nothing.
 */
async function planPass(db: SupabaseClient): Promise<Plan> {
  const { data: wsRows, error: wsErr } = await db
    .from("workspaces")
    .select("id, owner_id")
    .eq("is_sample", false)
    .order("created_at", { ascending: true })
    .limit(WORKSPACE_SCAN_CAP);
  if (wsErr) throw new Error(`workspaces read failed: ${wsErr.message}`);
  const workspaces = (wsRows ?? []) as { id: string; owner_id: string }[];
  if (workspaces.length === 0) return { targets: [], learningById: new Map(), scanned: 0 };

  const workspaceIds = workspaces.map((w) => w.id);

  const { data: ruleRows, error: ruleErr } = await db
    .from("house_rules")
    .select("workspace_id,status,source_learning_ids,source_run_ids,created_at")
    .in("workspace_id", workspaceIds);
  // A failed provenance read must NOT fall through to an empty set: an empty
  // set means "nothing distilled yet", which would re-offer already-spent
  // learnings and duplicate rules a human has already ruled on.
  if (ruleErr) throw new Error(`house_rules provenance read failed: ${ruleErr.message}`);

  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data: learningRows, error: learnErr } = await db
    .from("learnings")
    .select("id,workspace_id,verdict,summary,metric_label,metric_value")
    .in("workspace_id", workspaceIds)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(LEARNING_SCAN_CAP);
  if (learnErr) throw new Error(`learnings read failed: ${learnErr.message}`);
  const learnings = (learningRows ?? []) as LearningRow[];
  if (learnings.length >= LEARNING_SCAN_CAP) {
    await note(
      new Error(
        `learnings scan hit LEARNING_SCAN_CAP (${LEARNING_SCAN_CAP}); workspaces beyond the newest rows were not considered this pass`,
      ),
      "capacity",
    );
  }

  const targets = selectDistillTargets({
    workspaces,
    existingRules: (ruleRows ?? []) as HouseRuleProvenance[],
    learnings,
    weekStartIso: startOfIsoWeekUtc(new Date()),
    minLearnings: MIN_LEARNINGS_TO_CLUSTER,
    maxLearningsPerWorkspace: MAX_LEARNINGS_PER_PASS,
    maxWorkspaces: MAX_WORKSPACES,
  });

  return {
    targets,
    learningById: new Map(learnings.map((l) => [l.id, l])),
    scanned: workspaces.length,
  };
}

/** Phase two: one model call, up to MAX_RULES_PER_PASS drafts, for one workspace. */
async function distillWorkspace(
  db: SupabaseClient,
  target: DistillTarget,
  learningById: Map<string, LearningRow>,
): Promise<{ drafted: number; skipped: string }> {
  const candidates = target.learningIds
    .map((id) => learningById.get(id))
    .filter((l): l is LearningRow => !!l);
  if (candidates.length < MIN_LEARNINGS_TO_CLUSTER) {
    return { drafted: 0, skipped: `only ${candidates.length} undistilled learnings` };
  }

  const numbered = candidates
    .map((l, i) => {
      const metric = l.metric_label ? ` (${l.metric_label}: ${l.metric_value ?? "?"})` : "";
      return `[${i + 1}] verdict=${l.verdict}${metric}: ${l.summary}`;
    })
    .join("\n");

  // MA-2: respect owner's agentic_model if pinned, then default_model, then Gemini.
  const { data: ownerProf, error: profErr } = await db
    .from("profiles")
    .select("agentic_model, default_model")
    .eq("id", target.ownerId)
    .maybeSingle();
  // A missing profile is normal and falls back; a FAILED read is not, and used
  // to be indistinguishable from it.
  if (profErr) await note(profErr, "db_error", target.workspaceId);
  const prof = ownerProf as { agentic_model?: string | null; default_model?: string | null } | null;
  const model =
    prof?.agentic_model?.trim() || prof?.default_model?.trim() || "google/gemini-2.5-flash";

  const res = await callModel(supabaseAdmin as never, target.ownerId, {
    surface: "judge",
    surface_ref: `house-rules-tick:${target.workspaceId}:${isoWeekKey(new Date())}`,
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
    const sourceIds = [
      ...new Set(
        d.source_indices
          .map((i) => candidates[i - 1]?.id)
          .filter((x): x is string => typeof x === "string"),
      ),
    ];
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
        ? "[Supaprod flagged this draft: possible prompt-injection pattern, original text withheld] "
        : screened.verdict.decision === "flag"
          ? "[Supaprod flagged this draft for review: possible prompt-injection language] "
          : "";

    const { error } = await db.from("house_rules").insert({
      user_id: target.ownerId,
      workspace_id: target.workspaceId,
      rule_text: screened.text.slice(0, 2000),
      rationale: (flagNote + (d.rationale ?? "").trim()).trim().slice(0, 2000) || null,
      status: "pending",
      source_learning_ids: sourceIds,
    });
    // A dropped insert used to leave no trace at all, so a pass that drafted
    // three rules and stored none looked identical to one that found no
    // pattern.
    if (error) await note(error, "db_error", target.workspaceId);
    else drafted += 1;
  }
  return { drafted, skipped: "" };
}

export const Route = createFileRoute("/api/public/hooks/house-rules-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRunHttp(SURFACE, async () => {
          const db = supabaseAdmin as unknown as SupabaseClient;

          let plan: Plan;
          try {
            plan = await planPass(db);
          } catch (e) {
            // Rethrown on purpose: withJobRun writes status='error' to
            // job_runs on a throw, and a pass that could not read its own
            // inputs must not read as a healthy pass in the ledger the watchdog
            // diffs. This was the only tick that got that right; the other
            // fifteen answered with a returned 500, which RESOLVES and was
            // therefore scored 'ok'. They all throw now, and withJobRunHttp
            // gives this one the same JSON 500 body they get.
            await note(e, "db_error");
            throw e;
          }

          const results: Array<{
            workspace_id: string;
            drafted?: number;
            skipped?: string;
            error?: string;
          }> = [];
          for (const target of plan.targets) {
            try {
              const r = await distillWorkspace(db, target, plan.learningById);
              results.push({ workspace_id: target.workspaceId, ...r });
            } catch (e) {
              await note(e, "tool_error", target.workspaceId);
              results.push({
                workspace_id: target.workspaceId,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({
            ok: true,
            scanned: plan.scanned,
            processed: plan.targets.length,
            results,
          });
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
