/**
 * Mission 3.8a (SW-3): the outcome-review sweep.
 * Extended 2026-08-02 (founder ruling): the sweep now SETTLES.
 *
 * launch_plans.check_by is the outcome window; until SW-3 nothing fired when it
 * CLOSED (outcome-tick only used it to suppress early RF-01 suggestions), so a
 * window could expire silently. This sweep, run from outcome-tick's hourly
 * supaprod, finds expired windows and closes them: predicted vs actual via the
 * existing Historian path (draftOutcomeVerdict, surface "judge"; no new
 * CallSurface), the original bet designation scored against reality
 * (deterministic matrix), and the verdict itself put ON THE RECORD when the
 * evidence supports it.
 *
 * WHAT CHANGED, AND WHY IT IS NOT A LOWERED FLOOR.
 * The founder's ruling: "Why should it always be the user giving the verdict?
 * Primarily it should be the AGENT giving the verdict." Until now this sweep
 * only RECORDED: it wrote a learnings row and deliberately never touched
 * prds.outcome, never moved opportunity confidence, never recomputed ICE. So
 * every verdict in the product still waited on a person, which is the approval
 * queue the governance canon calls a policy failure to surface.
 *
 * It now settles, and the reason that does not lower the "genuine judgment with
 * no oracle" floor is that `classifyOutcomeSettlement` (pure, unit-tested, in
 * ./outcome-review.ts) refuses to settle exactly the cases where there is no
 * oracle. The agent closes the loop when the bet declared something checkable
 * and it was checked; it hands the call to a person when nothing was ever
 * attached to the bet, when a decisive verdict has no number behind it, when a
 * miss would cost another agent its promotion on a soft read, or when the
 * evidence is thin for what the verdict moves.
 *
 * An escalated window is NOT dropped and NOT silently reviewed. It writes
 * nothing at all, so it stays in `listPendingOutcomes`, which recomputes the
 * same decision with the same function and shows the person why it is on their
 * desk. Next tick it is re-examined, so a window that escalated on thin
 * evidence settles itself once the usage data arrives.
 *
 * Idempotency: one settlement per launch plan. A launch plan is keyed by prd_id
 * and a settlement IS a learnings row, so any learnings row for the PRD (a human
 * recordOutcome, an agent settlement, or a legacy skeleton review) marks the
 * window closed. No schema change needed.
 *
 * Attribution and reversal: the write goes through `applyOutcome`, the ONE copy
 * of the outcome arithmetic, tagged `settled_by: "agent"` with the evidence
 * score and the facts it rested on. A person overturning it on /learn records
 * the overturn against the agent's original.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  agentArc,
  applyOutcome,
  decidingAgentSlug,
  draftOutcomeVerdict,
  VERDICT_CONFIDENCE_DELTA,
} from "@/lib/outcome.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { gradeOutcomeContract } from "@/lib/outcome-contract-grade";
import type { OutcomeContract } from "@/lib/discovery.functions";
import {
  asReviewVerdict,
  basisFor,
  buildSkeletonReview,
  classifyOutcomeSettlement,
  composeReviewSummary,
  designationForReview,
  metricWasDeclared,
  metricWasObserved,
  scoreBetCall,
  type ReviewVerdict,
  type ReviewableOpportunity,
  type SettlementInputs,
} from "./outcome-review";

export const HISTORIAN_AGENT_SLUG = "historian";

/** Expired windows considered per tick; the review cap keeps the AI spend
 *  bounded while a backlog drains oldest-window-first. */
const CANDIDATE_LIMIT = 25;
const REVIEWS_PER_TICK = 5;

type PlanRow = {
  prd_id: string;
  workspace_id: string | null;
  check_by: string | null;
  success_metric: string | null;
};

type MetricFields = { metric_label?: unknown; metric_value?: unknown };
type SkeletonOutcome = Parameters<typeof buildSkeletonReview>[0]["outcome"];

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export type OutcomeReviewResult = {
  /** Windows this tick reached a decision on. */
  reviewed: number;
  /** Verdicts the agent put on the record itself. */
  settled: number;
  /** Verdicts handed to a person, with the reason recomputed on the surface. */
  escalated: number;
  /** Of the reviewed, how many read a model draft rather than the skeleton. */
  drafted: number;
  skeletons: number;
};

/**
 * Close expired, unsettled outcome windows. `db` is expected to be
 * supabaseAdmin (cron path, no session); the workspace owner is whose identity
 * the Historian's AI call bills against and under whose user_id the learning
 * lands, same as outcome-tick's RF-01 pass. Best-effort per plan: one failure
 * never blocks the rest.
 */
export async function runOutcomeReviews(
  db: SupabaseClient,
  now: Date = new Date(),
  // SW-4 loop mode: a user-owned loop reviews only its own workspace; the
  // outcome-tick cron passes nothing and sweeps every workspace as before.
  workspaceId?: string | null,
): Promise<OutcomeReviewResult> {
  const result: OutcomeReviewResult = {
    reviewed: 0,
    settled: 0,
    escalated: 0,
    drafted: 0,
    skeletons: 0,
  };

  let planQuery = db
    .from("launch_plans")
    .select("prd_id,workspace_id,check_by,success_metric")
    .not("check_by", "is", null)
    .lte("check_by", now.toISOString());
  if (workspaceId) planQuery = planQuery.eq("workspace_id", workspaceId);
  const { data: planRows } = await planQuery
    .order("check_by", { ascending: true })
    .limit(CANDIDATE_LIMIT);
  let plans = (planRows ?? []) as PlanRow[];
  if (!plans.length) return result;

  // THE BOUNDARY THE HUMAN SET HAS TO BIND.
  //
  // `workspace_routine_prefs` carries the per-workspace off switch for the
  // "Outcome check" routine (PC-08). Until this sweep only RECORDED, honouring
  // it here was cosmetic and outcome-tick checked it on the ship-detection pass
  // alone. Now the sweep writes verdicts, moves confidence and rewrites ICE, so
  // a workspace that switched the routine off and still got agent-settled
  // outcomes would be a boundary the product accepted and then ignored. That is
  // the one failure mode the governance canon has no tolerance for, because the
  // whole trade is fewer interrupts in exchange for boundaries that hold.
  const planWorkspaceIds = [
    ...new Set(plans.map((p) => p.workspace_id).filter((v): v is string => !!v)),
  ];
  if (planWorkspaceIds.length > 0) {
    const { data: prefs } = await db
      .from("workspace_routine_prefs")
      .select("workspace_id,enabled")
      .eq("routine_id", "outcome-check")
      .eq("enabled", false)
      .in("workspace_id", planWorkspaceIds);
    const off = new Set(
      ((prefs ?? []) as Array<{ workspace_id: string }>).map((p) => p.workspace_id),
    );
    if (off.size > 0) plans = plans.filter((p) => !p.workspace_id || !off.has(p.workspace_id));
    if (!plans.length) return result;
  }

  // Idempotency filter: any learnings row for the PRD means the window is
  // closed already. An ESCALATED window writes no learning by design, so it
  // comes back next tick with whatever evidence has accumulated since.
  const { data: existing } = await db
    .from("learnings")
    .select("prd_id")
    .in(
      "prd_id",
      plans.map((p) => p.prd_id),
    );
  const reviewedPrdIds = new Set(
    ((existing ?? []) as Array<{ prd_id: string | null }>).map((r) => r.prd_id).filter(Boolean),
  );
  const due = plans.filter((p) => !reviewedPrdIds.has(p.prd_id)).slice(0, REVIEWS_PER_TICK);

  for (const plan of due) {
    try {
      const { data: prdRow } = await db
        .from("prds")
        .select(
          "id,title,user_id,workspace_id,opportunity_id,shipped_at,outcome,outcome_suggestion,contract",
        )
        .eq("id", plan.prd_id)
        .maybeSingle();
      if (!prdRow) continue;
      const prd = prdRow as {
        id: string;
        title: string | null;
        user_id: string | null;
        workspace_id: string | null;
        opportunity_id: string | null;
        shipped_at: string | null;
        outcome: unknown;
        outcome_suggestion: unknown;
        contract: unknown;
      };
      // Already settled by someone. The learnings filter above normally catches
      // this; the guard is here so a spec whose learning was deleted can never
      // have its recorded outcome quietly rewritten by a sweep.
      if (prd.outcome) continue;

      const planWorkspaceId = prd.workspace_id ?? plan.workspace_id;
      if (!planWorkspaceId) continue; // learnings.workspace_id is NOT NULL; nowhere honest to place it

      const { data: ws } = await db
        .from("workspaces")
        .select("owner_id")
        .eq("id", planWorkspaceId)
        .maybeSingle();
      const userId = (ws as { owner_id?: string } | null)?.owner_id ?? prd.user_id ?? null;
      if (!userId) continue;

      // The prediction substrate + designation inputs = the linked opportunity.
      type OppRow = ReviewableOpportunity & {
        id: string;
        ice_score: number | string | null;
        problem: string | null;
        hypothesis: string | null;
        theme_id: string | null;
      };
      let opp: OppRow | null = null;
      if (prd.opportunity_id) {
        const { data: o } = await db
          .from("opportunities")
          .select("id,status,impact,ease,ice_score,problem,hypothesis,critic_review,theme_id")
          .eq("id", prd.opportunity_id)
          .maybeSingle();
        opp = (o as OppRow | null) ?? null;
      }

      // mission_id when derivable: the most recent decision linking this spec
      // to a mission (decisions carry both prd_id and mission_id).
      const { data: dec } = await db
        .from("decisions")
        .select("mission_id")
        .eq("prd_id", prd.id)
        .not("mission_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const missionId = (dec as { mission_id?: string | null } | null)?.mission_id ?? null;

      const suggestion = (prd.outcome_suggestion ?? null) as
        | ({
            verdict?: unknown;
            summary?: unknown;
            predicted?: unknown;
            confidence_tier?: unknown;
            basis?: unknown;
          } & MetricFields)
        | null;
      const skeleton = buildSkeletonReview({
        shippedAt: prd.shipped_at,
        checkBy: plan.check_by,
        successMetric: plan.success_metric,
        problem: opp?.problem ?? null,
        hypothesis: opp?.hypothesis ?? null,
        outcome: (prd.outcome ?? null) as SkeletonOutcome,
        suggestion,
      });

      let verdict: ReviewVerdict = skeleton.verdict;
      let predicted = skeleton.predicted;
      let happened = skeleton.actual;
      let drafted = false;
      if (skeleton.provisional) {
        // RF-01 drafted this earlier in the same tick, from the same Historian
        // path against the same evidence. Asking the model again buys a second
        // opinion from the same model and bills for it, and this sweep now runs
        // repeatedly on an escalated window, so that cost would recur hourly.
        const fromSuggestion = asReviewVerdict(suggestion?.verdict);
        if (fromSuggestion) {
          verdict = fromSuggestion;
          predicted = str(suggestion?.predicted) ?? predicted;
          happened = str(suggestion?.summary) ?? happened;
          drafted = true;
        } else {
          try {
            const draft = await draftOutcomeVerdict(db, userId, {
              prdId: prd.id,
              metricLabel: str(suggestion?.metric_label) ?? undefined,
              metricValue: str(suggestion?.metric_value) ?? undefined,
              notes: skeleton.actual,
            });
            verdict = draft.verdict;
            if (draft.predicted) predicted = draft.predicted;
            if (draft.summary) happened = draft.summary;
            drafted = true;
          } catch (e) {
            // No key / model failure: the deterministic skeleton stands in.
            console.error(`outcome-review: AI draft unavailable for ${prd.id}, using skeleton:`, e);
          }
        }
      }

      const designation = designationForReview(opp);
      const betCall = scoreBetCall(designation, verdict);
      const metricSource = suggestion;
      const summary = composeReviewSummary({
        checkBy: plan.check_by,
        predicted,
        happened,
        betCall,
        designation,
        provisional: skeleton.provisional,
      });

      /* ---- Settle it, or hand it over. ---- */

      // Whose promotion a miss would hold. Only agents still on the observing
      // or proving arc can lose anything, so a trusted agent reads as null and
      // the gate does not fire.
      let holdsPromotionFor: string | null = null;
      try {
        const decidedBy = await decidingAgentSlug(db, prd.id);
        if (decidedBy) {
          const arc = await agentArc(db, userId, decidedBy);
          if (arc === "observing" || arc === "proving") {
            holdsPromotionFor = agentDisplayName(decidedBy);
          }
        }
      } catch (e) {
        console.error(`outcome-review: arc lookup failed for ${prd.id} (non-fatal):`, e);
      }

      // How far the verdict propagates: other bets on the same theme re-rank on
      // /decide when this one lands (outcomeSupportFromCounts).
      let otherBetsOnTheme = 0;
      if (opp?.theme_id) {
        try {
          const { data: siblings } = await db
            .from("opportunities")
            .select("id")
            .eq("theme_id", opp.theme_id);
          otherBetsOnTheme = Math.max(
            0,
            ((siblings ?? []) as Array<{ id: string }>).filter((s) => s.id !== opp!.id).length,
          );
        } catch (e) {
          console.error(`outcome-review: theme lookup failed for ${prd.id} (non-fatal):`, e);
        }
      }

      const contract = gradeOutcomeContract(
        (prd.contract ?? null) as Partial<OutcomeContract> | null,
      );
      const inputs: SettlementInputs = {
        verdict,
        // The one fact-shaped verdict there is: the window closed and the spec
        // never shipped. That is the calendar, not a reading of what it meant.
        verdictIsRecordFact: !str(prd.shipped_at) && verdict === "missed",
        metricDeclared: metricWasDeclared(plan.success_metric, contract.verdict),
        metricObserved: metricWasObserved(metricSource),
        basis: basisFor(suggestion as { basis?: Record<string, unknown> | null } | null),
        impact: opp ? (opp.impact ?? null) : null,
        otherBetsOnTheme,
        movesTheScore: VERDICT_CONFIDENCE_DELTA[verdict] !== 0,
        holdsPromotionFor,
      };
      const decision = classifyOutcomeSettlement(inputs);

      if (decision.action === "escalate") {
        // Deliberately writes NOTHING. The window stays in the human queue,
        // which recomputes this same decision and prints the reason, and the
        // next tick reconsiders it against whatever evidence has arrived. A
        // learnings row here would both close the window and hide the ask.
        result.reviewed++;
        result.escalated++;
        if (drafted) result.drafted++;
        else result.skeletons++;
        continue;
      }

      // The agent's verdict closes the loop through the SAME path a person's
      // does: prds.outcome, opportunity confidence, recomputed ICE, a learnings
      // row carrying prior/new ICE, and the outcome memory.
      await applyOutcome(db, userId, {
        prdId: prd.id,
        verdict,
        summary,
        metricLabel: str(metricSource?.metric_label),
        metricValue: str(metricSource?.metric_value),
        by: { kind: "agent", slug: HISTORIAN_AGENT_SLUG, decision },
        missionId,
      });

      result.reviewed++;
      result.settled++;
      if (drafted) result.drafted++;
      else result.skeletons++;
    } catch (e) {
      console.error(`outcome-review: review failed for ${plan.prd_id}:`, e);
    }
  }
  return result;
}
