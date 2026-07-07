/**
 * Mission 3.8a (SW-3): outcome reviews close the loop.
 *
 * When a launch plan's outcome window (launch_plans.check_by) expires with no
 * review recorded, the system drafts the review instead of waiting for a
 * human. This module is the deterministic half: pure, IO-free, fully tested.
 * The sweep that reads the database and writes the learnings row lives in
 * outcome-review.server.ts; the AI draft rides the existing Historian path
 * (draftOutcomeVerdict, surface "judge"), so no new CallSurface is needed.
 */
import { deriveDesignation, type Designation } from "@/components/discover/ranking";
import { verdictFor, type OpportunityVerdictInput } from "@/components/discover/format";

/** Same closed vocabulary as learnings.verdict (CHECK constraint) and
 *  recordOutcome's zod enum. Defined locally so this pure module and its test
 *  never pull the server-function chain in. */
export type ReviewVerdict = "validated" | "missed" | "mixed";

/** How the original bet designation scored against reality. */
export type BetCall = "right call" | "wrong call" | "unclear";

/** Narrow an untrusted jsonb field to the learnings verdict vocabulary. */
export function asReviewVerdict(v: unknown): ReviewVerdict | null {
  return v === "validated" || v === "missed" || v === "mixed" ? v : null;
}

/** The opportunity fields the review needs to recompute a designation. */
export type ReviewableOpportunity = {
  status: string;
  critic_review?: { verdict?: string } | null;
  impact: number | null;
  ease: number | null;
};

/**
 * Designations are derived at render time by rankOpportunities and never
 * persisted, so the review recomputes the rank-free subset of the same rules
 * from the bet's own numbers (deriveDesignation with rank 2 and corroboration
 * 0). "best bet" and "watch this week" need list context that no longer
 * exists at review time, so they can never fire here; scoreBetCall treats
 * that honestly as "unclear" rather than guessing.
 */
export function designationForReview(opp: ReviewableOpportunity | null): Designation {
  if (!opp) return null;
  return deriveDesignation({
    rank: 2,
    verdict: verdictFor(opp as OpportunityVerdictInput),
    impact: opp.impact ?? 5,
    ease: opp.ease ?? 5,
    corroboration: 0,
  });
}

/**
 * Score the original bet designation against the reviewed verdict. A
 * deterministic matrix; anything the designation did not actually claim is
 * "unclear" rather than force-fit:
 *  - "best bet" / "quick win" claimed the bet would pay off: validated is a
 *    right call, missed is a wrong call.
 *  - "needs validation" claimed the bet was unproven: missed vindicates the
 *    caution (right call); validated only shows the caution was unnecessary,
 *    not wrong (unclear).
 *  - "heavy lift" and "watch this week" speak to cost and attention, not
 *    outcome, and a null designation claimed nothing: always unclear.
 *  - a "mixed" verdict decides nothing: always unclear.
 */
export function scoreBetCall(designation: Designation, verdict: ReviewVerdict): BetCall {
  if (verdict === "mixed") return "unclear";
  if (designation === "best bet" || designation === "quick win") {
    return verdict === "validated" ? "right call" : "wrong call";
  }
  if (designation === "needs validation") {
    return verdict === "missed" ? "right call" : "unclear";
  }
  return "unclear";
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Recorded fields the deterministic skeleton review is built from. */
export type SkeletonReviewInput = {
  shippedAt: string | null;
  checkBy: string | null;
  successMetric: string | null;
  problem: string | null;
  hypothesis: string | null;
  /** prds.outcome jsonb, when a human already recorded one. */
  outcome: {
    verdict?: unknown;
    summary?: unknown;
    metric_label?: unknown;
    metric_value?: unknown;
  } | null;
  /** prds.outcome_suggestion jsonb (RF-01), when one was drafted. */
  suggestion: {
    verdict?: unknown;
    summary?: unknown;
    confidence_tier?: unknown;
    metric_label?: unknown;
    metric_value?: unknown;
  } | null;
};

export type SkeletonReview = {
  verdict: ReviewVerdict;
  predicted: string;
  /** What actually happened, from recorded fields only. */
  actual: string;
  /** True when no human-recorded outcome backs the verdict. */
  provisional: boolean;
};

function metricOf(m: { metric_label?: unknown; metric_value?: unknown } | null): string | null {
  if (!m) return null;
  const label = str(m.metric_label);
  const value = str(m.metric_value);
  if (!label && !value) return null;
  return `${label ?? "Metric"}: ${value ?? "(no value)"}.`;
}

/**
 * The honest no-AI review, from recorded fields only. Precedence for the
 * verdict: a human-recorded outcome wins; then a high-confidence RF-01
 * suggestion (provisional); then the window facts themselves: a window that
 * closed with nothing shipped is a miss, and a shipped spec with no readable
 * signal is mixed. Never invents a metric or a result.
 */
export function buildSkeletonReview(input: SkeletonReviewInput): SkeletonReview {
  const predictedParts: string[] = [];
  const problem = str(input.problem);
  const hypothesis = str(input.hypothesis);
  const successMetric = str(input.successMetric);
  if (problem) predictedParts.push(`Problem: ${problem}.`);
  if (hypothesis) predictedParts.push(`Hypothesis: ${hypothesis}.`);
  if (successMetric) predictedParts.push(`Success metric: ${successMetric}.`);
  const predicted = predictedParts.join(" ") || "No recorded prediction.";

  const outcomeVerdict = asReviewVerdict(input.outcome?.verdict);
  if (outcomeVerdict) {
    const parts = [str(input.outcome?.summary), metricOf(input.outcome)].filter(Boolean);
    return {
      verdict: outcomeVerdict,
      predicted,
      actual: parts.join(" ") || "A human recorded this outcome without notes.",
      provisional: false,
    };
  }

  const suggestionVerdict = asReviewVerdict(input.suggestion?.verdict);
  if (suggestionVerdict && input.suggestion?.confidence_tier === "high") {
    const parts = [str(input.suggestion?.summary), metricOf(input.suggestion)].filter(Boolean);
    return {
      verdict: suggestionVerdict,
      predicted,
      actual: parts.join(" ") || "High-confidence suggested outcome with no notes.",
      provisional: true,
    };
  }

  const closedOn = str(input.checkBy)?.slice(0, 10) ?? null;
  const closedClause = closedOn ? ` on ${closedOn}` : "";
  if (!str(input.shippedAt)) {
    return {
      verdict: "missed",
      predicted,
      actual: `The outcome window closed${closedClause} without the spec shipping.`,
      provisional: true,
    };
  }
  return {
    verdict: "mixed",
    predicted,
    actual: `Shipped ${String(input.shippedAt).slice(0, 10)}, but the window closed${closedClause} with no recorded result and no strong signal.`,
    provisional: true,
  };
}

/** learnings.summary cap, matching recordOutcome's zod max. */
export const REVIEW_SUMMARY_MAX = 2000;

/**
 * The one summary written to the learnings row, same shape for the AI-drafted
 * and the skeleton path: window provenance, predicted vs what happened, the
 * bet call, and an explicit provisional note when no human confirmed it.
 */
export function composeReviewSummary(input: {
  checkBy: string | null;
  predicted: string;
  happened: string;
  betCall: BetCall;
  designation: Designation;
  provisional: boolean;
}): string {
  const closedOn = str(input.checkBy)?.slice(0, 10) ?? null;
  const head = `Outcome window closed${closedOn ? ` ${closedOn}` : ""}; review drafted by the Historian.`;
  const betLine = input.designation
    ? `Bet call: ${input.betCall} (designated "${input.designation}").`
    : `Bet call: ${input.betCall} (no designation derivable at review time).`;
  const provisionalNote = input.provisional ? " Provisional: no human-recorded outcome yet." : "";
  return `${head} Predicted: ${input.predicted} What happened: ${input.happened} ${betLine}${provisionalNote}`.slice(
    0,
    REVIEW_SUMMARY_MAX,
  );
}
