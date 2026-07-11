/**
 * Mission 3.8a (SW-3): the outcome-review sweep.
 *
 * launch_plans.check_by is the outcome window; until now nothing fired when it
 * CLOSED (outcome-tick only used it to suppress early RF-01 suggestions), so a
 * window could expire silently. This sweep, run from outcome-tick's hourly
 * cadence, finds expired windows with no review yet and drafts the review:
 * predicted vs actual via the existing Historian path (draftOutcomeVerdict,
 * surface "judge"; no new CallSurface), the original bet designation scored
 * against reality (deterministic matrix), and one learnings row with
 * attribution (recorded_by_agent_slug "historian", mission_id when a decision
 * links the spec to a mission).
 *
 * Idempotency: one review per launch plan. A launch plan is keyed by prd_id
 * and a review IS a learnings row, so any learnings row for the PRD (a human
 * recordOutcome or a prior auto review) marks the window reviewed. No schema
 * change needed.
 *
 * The review only RECORDS: it never writes prds.outcome, never moves ICE or
 * opportunity confidence (recordOutcome stays the only human-gated re-scorer),
 * and when AI drafting is unavailable it writes the deterministic skeleton
 * review honestly instead of skipping.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { draftOutcomeVerdict } from "@/lib/outcome.functions";
import {
  buildSkeletonReview,
  composeReviewSummary,
  designationForReview,
  scoreBetCall,
  type ReviewVerdict,
  type ReviewableOpportunity,
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

export type OutcomeReviewResult = { reviewed: number; drafted: number; skeletons: number };

/**
 * Draft reviews for expired, unreviewed outcome windows. `db` is expected to
 * be supabaseAdmin (cron path, no session); the workspace owner is whose
 * identity the Historian's AI call bills against, same as outcome-tick's
 * RF-01 pass. Best-effort per plan: one failure never blocks the rest.
 */
export async function runOutcomeReviews(
  db: SupabaseClient,
  now: Date = new Date(),
  // SW-4 loop mode: a user-owned loop reviews only its own workspace; the
  // outcome-tick cron passes nothing and sweeps every workspace as before.
  workspaceId?: string | null,
): Promise<OutcomeReviewResult> {
  const result: OutcomeReviewResult = { reviewed: 0, drafted: 0, skeletons: 0 };

  let planQuery = db
    .from("launch_plans")
    .select("prd_id,workspace_id,check_by,success_metric")
    .not("check_by", "is", null)
    .lte("check_by", now.toISOString());
  if (workspaceId) planQuery = planQuery.eq("workspace_id", workspaceId);
  const { data: planRows } = await planQuery
    .order("check_by", { ascending: true })
    .limit(CANDIDATE_LIMIT);
  const plans = (planRows ?? []) as PlanRow[];
  if (!plans.length) return result;

  // Idempotency filter: any learnings row for the PRD means reviewed already.
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
          "id,title,user_id,workspace_id,opportunity_id,shipped_at,outcome,outcome_suggestion",
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
      };
      const workspaceId = prd.workspace_id ?? plan.workspace_id;
      if (!workspaceId) continue; // learnings.workspace_id is NOT NULL; nowhere honest to place it

      const { data: ws } = await db
        .from("workspaces")
        .select("owner_id")
        .eq("id", workspaceId)
        .maybeSingle();
      const userId = (ws as { owner_id?: string } | null)?.owner_id ?? prd.user_id ?? null;
      if (!userId) continue;

      // The prediction substrate + designation inputs = the linked opportunity.
      type OppRow = ReviewableOpportunity & {
        id: string;
        ice_score: number | string | null;
        problem: string | null;
        hypothesis: string | null;
      };
      let opp: OppRow | null = null;
      if (prd.opportunity_id) {
        const { data: o } = await db
          .from("opportunities")
          .select("id,status,impact,ease,ice_score,problem,hypothesis,critic_review")
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
        | ({ verdict?: unknown; summary?: unknown; confidence_tier?: unknown } & MetricFields)
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
      // Only spend an AI draft when no human outcome exists; a recorded
      // outcome already IS the review's substance.
      if (skeleton.provisional) {
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

      const designation = designationForReview(opp);
      const betCall = scoreBetCall(designation, verdict);
      const prdOutcome = (prd as { outcome?: unknown }).outcome as MetricFields | null | undefined;
      const metricSource = prdOutcome ?? suggestion;
      const summary = composeReviewSummary({
        checkBy: plan.check_by,
        predicted,
        happened,
        betCall,
        designation,
        provisional: skeleton.provisional,
      });

      // mission_id + recorded_by_agent_slug are post-types-generation columns
      // (20260707190000 section D); the untyped-client cast admits them.
      const { error: insErr } = await db.from("learnings").insert({
        user_id: userId,
        workspace_id: workspaceId,
        prd_id: prd.id,
        opportunity_id: prd.opportunity_id,
        verdict,
        summary,
        metric_label: str(metricSource?.metric_label),
        metric_value: str(metricSource?.metric_value),
        prior_ice: opp?.ice_score == null ? null : Number(opp.ice_score),
        new_ice: null,
        mission_id: missionId,
        recorded_by_agent_slug: HISTORIAN_AGENT_SLUG,
      });
      if (insErr) {
        console.error(`outcome-review: learnings insert failed for ${prd.id}:`, insErr.message);
        continue;
      }
      result.reviewed++;
      if (drafted) result.drafted++;
      else result.skeletons++;
    } catch (e) {
      console.error(`outcome-review: review failed for ${plan.prd_id}:`, e);
    }
  }
  return result;
}
