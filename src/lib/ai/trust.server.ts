/**
 * Agent Trust Score + Autonomy Dial — server-only compute.
 *
 * Trust score is computed on read from real signals already in the DB
 * (mission outcomes, approval acceptance, eval scores). No cached score
 * column → can never go stale.
 *
 * The dial (`arc`) lives in `agent_autonomy` and is composed with each
 * tool's own `agent_tools.mode` via `resolveApprovalMode` to decide
 * whether the agent loop executes inline, queues a confirm, or queues
 * a review. The combiner is a SAFETY FLOOR — it never makes a tool
 * more permissive than its own mode requires.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Arc = "observing" | "proving" | "trusted" | "ambient";
export type ToolMode = "auto" | "confirm" | "review";

export type TrustBreakdown = {
  missions_total: number;
  missions_completed: number;
  mission_success_rate: number;
  approvals_total: number;
  approvals_approved: number;
  approval_acceptance_rate: number;
  evals_total: number;
  eval_mean_score: number;
  // RF-06: did the agent's decided-on work actually turn out well (public.learnings,
  // validated vs missed), not just whether it ran clean or the human said yes.
  // 'mixed' verdicts are excluded from both — no clean directional signal.
  outcomes_total: number;
  outcomes_validated: number;
  outcome_validated_rate: number;
  samples: number;
};

export type AgentTrust = {
  agent_id: string;
  score: number; // 0–100
  arc: Arc;
  suggested_arc: Arc;
  breakdown: TrustBreakdown;
};

const PRIOR = 0.5;
const PRIOR_WEIGHT = 10;

function shrink(rate: number, n: number): number {
  // Bayesian shrinkage toward 0.5 when sample size is small.
  return (rate * n + PRIOR * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT);
}

/**
 * ── SEVEN DIMENSIONS INTO ONE NUMBER ──────────────────────────────────────────
 *
 * The eval leg of the trust score was dead, and dead in a direction that
 * flattered every agent. It selected `ai_evals.ai_event_id` and `.score`, and
 * **neither column exists**: the real key is `event_id` and there is no `score`
 * at all, only seven named dimensions. So the filter matched nothing,
 * `evals_total` was always 0, and `shrink(0, 0)` returned `PRIOR` exactly.
 *
 * **That is not a neutral failure. It is a flat +0.10 on every agent, forever**,
 * because the leg carries 0.2 of the raw score and PRIOR is 0.5. An agent whose
 * other three legs sum to 0.65 displays 75, and `suggestArc` calls 75
 * **"trusted"**. Agents have been graduating on a constant.
 *
 * ── THE COMPOSITION, AND WHY IT IS NOT AN AVERAGE OF SEVEN ────────────────────
 *
 * The seven are two different kinds of question and averaging them together
 * would be a category error:
 *
 *   QUALITY, higher is better   groundedness · relevance · coherence
 *   RISK,    lower is better    hallucination_score · toxicity · pii_risk ·
 *                               prompt_injection_risk
 *
 * **Quality is a mean. Risk is a MAX.** Risks are not fungible: a response with
 * `pii_risk` 0.9 and `toxicity` 0 is not "average risk 0.45", it is a response
 * that leaked personal data. The worst one is the one that matters, which is the
 * same reasoning `toolRisk` uses when it fails closed rather than averaging.
 *
 * **They MULTIPLY rather than average**, and that is the load-bearing choice:
 * `quality × (1 - worstRisk)`. Averaged, three good quality scores would wash
 * out one serious safety failure and the agent would keep its trust. Multiplied,
 * a maximally risky answer scores 0 no matter how well written it was. **A trust
 * score that can be talked out of a safety failure by good prose is not a trust
 * score.**
 *
 * ── A DIMENSION NOBODY SCORED IS IGNORED, NOT ASSUMED ─────────────────────────
 *
 * `prompt_injection_risk` is NULL in all 77 rows on this database. Reading null
 * as 0 would claim a safety nobody measured. Reading it as 1 would make every
 * historical row maximally risky and zero out agents for a column the judge
 * never returned. **So it is skipped and the ones that were scored decide**,
 * which is the same shape as `unknown` not counting as terminal in
 * `run-status.ts`: an absence of evidence is not evidence.
 *
 * **A row with no quality dimension at all returns `null` and contributes
 * nothing**, rather than scoring 0. Zero is a damning number, and a row nobody
 * judged has not earned it.
 *
 * ── WHAT THIS DELIBERATELY DOES NOT DO ────────────────────────────────────────
 *
 * It does not change the 0.2 weight, and it does not need to. `shrink` already
 * holds a leg near PRIOR until real samples arrive, so an agent with two evals
 * is not swung by them. The defect was never the weight; it was that the leg
 * could never accumulate a sample at all.
 *
 * And it does not rewrite the 77 existing rows, which are seeded, sit in sample
 * workspaces, and were judged under a prompt that contradicted itself about
 * `hallucination_score`'s direction (fixed 2026-08-20 in `eval-tick.ts`). This
 * function reads the corrected contract. The old rows will read as worse than
 * they should under it, and that is the right way round: a score that flatters
 * on bad data is the thing being removed.
 */
/**
 * ── ROWS WRITTEN BEFORE 2026-08-20 CANNOT BE SCORED BY THIS FUNCTION ──────────
 *
 * **The reason recorded here on 2026-08-20 was wrong, and the correction matters
 * more than the original claim.** It said the judge's prompt had inverted
 * `hallucination_score`, citing production: `corr(hallucination_score,
 * groundedness) = +0.999`. That correlation is real. **It is not the judge.**
 *
 * All 77 rows that existed when this was written are SEED DATA, inserted by
 * `20260725130000_helio_demo_seed_rich.sql` as 11 rows cloned into each of seven
 * Helio Labs demo workspaces. **The eval tick had never written a row** -- it
 * could not, because `ai_evals.workspace_id` was NOT NULL defaulting to
 * `current_user_default_workspace()`, which returns null under the service role
 * (fixed by trigger in `20260820072500`), and its cron job was posting to a 404
 * (fixed in `20260820074000`).
 *
 * So the +0.999 was a property of the seed generator, measured on rows the judge
 * never produced, and offered as evidence about the judge. **A number measured on
 * fixtures is not evidence about the product.**
 *
 * WHAT THE LIVE JUDGE ACTUALLY DOES, measured the first time it ever ran, at
 * 2026-08-20 02:30 UTC, on the prompt then deployed:
 *
 *   cohort              n    corr(hall, ground)   mean ground   mean hall
 *   seed rows          77         +0.999             0.865        0.853
 *   live judge         20         -1.000             0.900        0.100
 *
 * **Perfectly anti-correlated, which is the correct polarity.** The judge reads
 * `hallucination_score` as risk-shaped, exactly as both consumers do. The prompt
 * edit in `eval-tick.ts` remains worth keeping -- the header did say "six
 * dimensions" over a list of seven, and every field now states its own direction
 * -- but it was a clarity fix, not the repair of an observed defect, and this
 * comment claimed otherwise.
 *
 * ── THE CUTOFF STANDS, ON A REASON THAT SURVIVES THE CORRECTION ───────────────
 *
 * **Two independent grounds, either sufficient:**
 *
 * 1. **They are fixtures.** They describe a demo tenant's scripted content, not
 *    any agent's work. Scoring them would rank agents on rows they did not write.
 * 2. **Their values are inverted whatever produced them.** Mean
 *    `hallucination_score` 0.853 alongside mean `groundedness` 0.865 -- the same
 *    number twice, once flipped. Under `evalScore` they come out near **0.119**
 *    against the 0.5 the frozen leg contributed, so counting them would collapse
 *    every agent at once.
 *
 * The rows are not deleted and not rewritten. They stay as the record of what the
 * demo contains. **They are simply not evidence about agent quality**, and this
 * leg says so by not counting them.
 *
 * CONSEQUENCE, AND IT IS NO LONGER HYPOTHETICAL: the eval leg held at PRIOR for
 * as long as the table held nothing but fixtures. **As of 2026-08-20 02:30 the
 * tick runs and writes real rows** -- 20 on its first fire, every one after this
 * cutoff -- so the leg now has evidence and will move as it accumulates.
 */
export const EVAL_CONTRACT_FIXED_AT = Date.parse("2026-08-20T00:00:00Z");

export function judgedUnderCurrentContract(createdAt: string | null): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  return Number.isFinite(t) && t >= EVAL_CONTRACT_FIXED_AT;
}

export function evalScore(r: {
  groundedness: number | null;
  relevance: number | null;
  coherence: number | null;
  hallucination_score: number | null;
  toxicity: number | null;
  pii_risk: number | null;
  prompt_injection_risk: number | null;
}): number | null {
  const num = (v: number | null): v is number => typeof v === "number" && Number.isFinite(v);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  const quality = [r.groundedness, r.relevance, r.coherence].filter(num).map(clamp);
  if (quality.length === 0) return null;

  const risks = [r.hallucination_score, r.toxicity, r.pii_risk, r.prompt_injection_risk]
    .filter(num)
    .map(clamp);

  const q = quality.reduce((s, v) => s + v, 0) / quality.length;
  const worstRisk = risks.length > 0 ? Math.max(...risks) : 0;
  return clamp(q * (1 - worstRisk));
}

/** Score → suggested arc. Operator can override; this is just the hint. */
export function suggestArc(score: number, samples: number): Arc {
  if (samples < 3) return "observing";
  if (score >= 90) return "ambient";
  if (score >= 75) return "trusted";
  if (score >= 55) return "proving";
  return "observing";
}

/**
 * Compose the per-tool `mode` with the agent's `arc`. SAFETY FLOOR:
 * - `review` is sticky — the dial never downgrades a `review` tool.
 * - `calendar.create` and any other hard-locked tool stay `confirm`.
 * The dial only ever loosens `auto`/`confirm` tools toward `auto`.
 *
 * NOTE: orchestrator control-flow tools (mission.plan/dispatch/observe/
 * finalize) are exempt from gating entirely and always run inline. That
 * exemption lives at the loop's gate (ORCHESTRATION_CONTROL_FLOW_TOOLS in
 * loop.server.ts), not here, because this combiner is a pure name-agnostic
 * mode function reused by read-only surfaces (the trust UI). Keeping the
 * allowlist at the single queue-vs-execute decision point avoids leaking
 * tool names into the dial math.
 */
export function resolveApprovalMode(toolMode: ToolMode, arc: Arc): ToolMode {
  if (toolMode === "review") return "review";
  switch (arc) {
    case "ambient":
      return "auto";
    case "trusted":
      // confirm tools execute inline; review tools (filtered above) untouched.
      return toolMode === "confirm" ? "auto" : toolMode;
    case "proving":
      // auto tools must confirm; confirm stays confirm.
      return toolMode === "auto" ? "confirm" : toolMode;
    case "observing":
    default:
      // Every action visible: even auto tools queue a review.
      return "review";
  }
}

type AgentRow = { id: string; slug: string };
type RunRow = { agent_id: string; status: string };
type ApprovalRow = { agent_id: string; status: string };
type EvalRow = {
  event_id: string;
  created_at: string | null;
  groundedness: number | null;
  relevance: number | null;
  coherence: number | null;
  hallucination_score: number | null;
  toxicity: number | null;
  pii_risk: number | null;
  prompt_injection_risk: number | null;
};
type EventRow = { id: string; agent_id: string | null };
type AutonomyRow = { agent_id: string; arc: Arc };
type LearningRow = { prd_id: string | null; verdict: string | null };
type DecisionRow = { prd_id: string | null; decided_by_agent_slug: string | null };

/**
 * Compute trust for every agent owned by the user in a single round-trip.
 * Returns one entry per agent (always, even with zero history).
 */
export async function computeAllAgentTrust(
  supabase: SupabaseClient,
  userId: string,
): Promise<AgentTrust[]> {
  const [agentsRes, runsRes, apprRes, eventsRes, autoRes, learningsRes] = await Promise.all([
    supabase.from("agents").select("id,slug").eq("user_id", userId),
    supabase.from("agent_runs").select("agent_id,status").eq("user_id", userId),
    supabase.from("agent_approvals").select("agent_id,status").eq("user_id", userId),
    supabase
      .from("ai_events")
      .select("id,agent_id")
      .eq("user_id", userId)
      .not("agent_id", "is", null),
    supabase.from("agent_autonomy").select("agent_id,arc").eq("user_id", userId),
    // RF-06: recorded outcome quality, joined to agent attribution below.
    supabase
      .from("learnings")
      .select("prd_id,verdict")
      .eq("user_id", userId)
      .in("verdict", ["validated", "missed"])
      .not("prd_id", "is", null),
  ]);

  const agents = (agentsRes.data ?? []) as AgentRow[];
  const runs = (runsRes.data ?? []) as RunRow[];
  const apprs = (apprRes.data ?? []) as ApprovalRow[];
  const events = (eventsRes.data ?? []) as EventRow[];
  const autonomy = new Map<string, Arc>(
    ((autoRes.data ?? []) as AutonomyRow[]).map((a) => [a.agent_id, a.arc]),
  );
  const learnings = (learningsRes.data ?? []) as LearningRow[];

  // Fetch evals only for this user's events.
  const eventIds = events.map((e) => e.id);
  let evals: EvalRow[] = [];
  if (eventIds.length > 0) {
    const { data: evalRows } = await supabase
      .from("ai_evals")
      .select(
        "event_id,created_at,groundedness,relevance,coherence,hallucination_score,toxicity,pii_risk,prompt_injection_risk",
      )
      .in("event_id", eventIds);
    evals = (evalRows ?? []) as EvalRow[];
  }
  const eventToAgent = new Map<string, string>(events.map((e) => [e.id, e.agent_id as string]));

  // RF-06: no FK exists between learnings and decisions (both key off prd_id
  // independently), so resolve agent attribution via a second query + JS join,
  // same idiom the rest of this function already uses (eventToAgent above).
  const prdIds = [
    ...new Set(learnings.map((l) => l.prd_id).filter((id): id is string => Boolean(id))),
  ];
  let decisionsByPrd = new Map<string, string>();
  if (prdIds.length > 0) {
    const { data: decisionRows } = await supabase
      .from("decisions")
      .select("prd_id,decided_by_agent_slug")
      .eq("user_id", userId)
      .in("prd_id", prdIds);
    decisionsByPrd = new Map(
      ((decisionRows ?? []) as DecisionRow[])
        .filter((d) => d.prd_id && d.decided_by_agent_slug)
        .map((d) => [d.prd_id as string, d.decided_by_agent_slug as string]),
    );
  }

  const out: AgentTrust[] = [];
  for (const a of agents) {
    const aRuns = runs.filter((r) => r.agent_id === a.id);
    const missions_total = aRuns.length;
    const missions_completed = aRuns.filter((r) => r.status === "completed").length;
    const mission_success_rate = missions_total > 0 ? missions_completed / missions_total : 0;

    const aApprs = apprs.filter(
      (r) => r.agent_id === a.id && (r.status === "approved" || r.status === "rejected"),
    );
    const approvals_total = aApprs.length;
    const approvals_approved = aApprs.filter((r) => r.status === "approved").length;
    const approval_acceptance_rate = approvals_total > 0 ? approvals_approved / approvals_total : 0;

    const aEvalScores = evals
      .filter((e) => eventToAgent.get(e.event_id) === a.id && judgedUnderCurrentContract(e.created_at))
      .map(evalScore)
      .filter((v): v is number => v !== null);
    const evals_total = aEvalScores.length;
    const eval_mean_score =
      evals_total > 0 ? aEvalScores.reduce((s, v) => s + v, 0) / evals_total : 0;

    // RF-06: validated-outcome rate — did this agent's decided-on work actually
    // turn out well, once real signal came in, not just whether it ran clean
    // or the human accepted the gate.
    const aOutcomes = learnings.filter((l) => l.prd_id && decisionsByPrd.get(l.prd_id) === a.slug);
    const outcomes_total = aOutcomes.length;
    const outcomes_validated = aOutcomes.filter((l) => l.verdict === "validated").length;
    const outcome_validated_rate = outcomes_total > 0 ? outcomes_validated / outcomes_total : 0;

    const samples = missions_total + approvals_total + evals_total + outcomes_total;

    const sMission = shrink(mission_success_rate, missions_total);
    const sApproval = shrink(approval_acceptance_rate, approvals_total);
    const sEval = shrink(eval_mean_score, evals_total);
    const sOutcome = shrink(outcome_validated_rate, outcomes_total);

    const raw = 0.3 * sMission + 0.2 * sApproval + 0.2 * sEval + 0.3 * sOutcome;
    const score = Math.round(Math.max(0, Math.min(1, raw)) * 100);

    const suggested_arc = suggestArc(score, samples);
    // "trusted", NOT "observing". This defaulted the other way and disagreed
    // with `loadAgentArc` below, which is the function the agent loop actually
    // calls and which returns "trusted" when no `agent_autonomy` row exists
    // (founder ruling 2026-07-08, SW-7: autonomous by default). Same file,
    // same column, opposite fallbacks.
    //
    // The consequence was not cosmetic. Every workspace that has never touched
    // the dial has no row, so the Trust Dial and getCapabilities told the user
    // their crew was on probation while the loop ran it autonomously. The
    // product was misreporting its own governance posture, in the safe-looking
    // direction, which is the harder kind to notice.
    const arc = autonomy.get(a.id) ?? "trusted";

    out.push({
      agent_id: a.id,
      score,
      arc,
      suggested_arc,
      breakdown: {
        missions_total,
        missions_completed,
        mission_success_rate,
        approvals_total,
        approvals_approved,
        approval_acceptance_rate,
        evals_total,
        eval_mean_score,
        outcomes_total,
        outcomes_validated,
        outcome_validated_rate,
        samples,
      },
    });
  }
  return out;
}

/** Look up just the arc for a single agent (used by the loop). */
export async function loadAgentArc(
  supabase: SupabaseClient,
  userId: string,
  agentId: string,
): Promise<Arc> {
  const { data } = await supabase
    .from("agent_autonomy")
    .select("arc")
    .eq("user_id", userId)
    .eq("agent_id", agentId)
    .maybeSingle();
  // Founder ruling 2026-07-08 (SW-7): autonomous by default - an agent with
  // no earned/operator-set arc runs TRUSTED (confirm-seeded tools execute
  // inline; review-pinned tools and the FORCE_REVIEW floor still hold). The
  // ramp remains the dial for tightening (proving/observing) per agent.
  return (data as { arc?: Arc } | null)?.arc ?? "trusted";
}
