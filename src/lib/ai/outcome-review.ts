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
import type { ContractVerdict } from "@/lib/outcome-contract-grade";

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

/* ========================================================================== *
 * SETTLE OR ASK.
 *
 * The founder's push (2026-08-02): "Why should it always be the user giving
 * the verdict? Primarily it should be the AGENT giving the verdict. Sometimes,
 * if it is very critical, we'll give the very important decisions to a human."
 *
 * The governance canon it has to live inside says the same thing from the
 * other side: policy is set in advance and does not block, the gate is the
 * exception rather than the loop, AND there are four floors no boundary may
 * lower. One of those floors is named almost word for word against this
 * feature: "genuine judgment with no oracle (which bet, WHAT AN OUTCOME
 * MEANT)".
 *
 * Both are true, and the way they reconcile is that "what an outcome meant" is
 * only judgment WHEN THERE IS NO ORACLE. When the bet declared a success
 * metric, the metric was read, and the number says what it says, the agent is
 * not exercising judgment, it is reporting. When nothing was ever attached to
 * the bet that could check it, no amount of model confidence turns the reading
 * into a measurement, and the call belongs to a person.
 *
 * So the rule is not "how sure is the model". It is "was there something to
 * check, was it checked, and how much rides on getting it wrong". An agent
 * that says `validated` on no evidence is far worse than one that asks, so
 * three hard gates fire before any score is consulted, and above them the
 * evidence a verdict needs RISES with the stakes it moves.
 *
 * Pure, IO-free and unit-tested on purpose: the hourly sweep decides with it,
 * and `/learn` explains the same decision to the human with the same function,
 * so the queue can never show a reason the sweep did not act on.
 * ========================================================================== */

/** Settle it on the record, or put it on a person's desk. */
export type SettlementAction = "settle" | "escalate";

/** The RF-01 evidence basis (`outcome-suggestion.server.ts`), narrowed to the
 *  fields this rule reads. Null when nothing was ever drafted for the spec. */
export type SettlementBasis = {
  data_days: number;
  sample_users: number;
  has_shipped_changeset: boolean;
  has_prediction: boolean;
};

export type SettlementInputs = {
  /** The verdict on the table. The rule never picks one, it only decides who
   *  gets to put it on the record. */
  verdict: ReviewVerdict;
  /**
   * True when the verdict rests on a fact in our own record rather than a read
   * of a fuzzy signal. Today there is exactly one: the outcome window closed
   * and the spec never shipped. That is not an interpretation of what the
   * outcome meant, it is the calendar, so it carries full evidence.
   */
  verdictIsRecordFact: boolean;
  /** Something was attached to this bet that could check it: the launch plan's
   *  success metric, or a standing outcome-contract metric with a real oracle. */
  metricDeclared: boolean;
  /** A metric label AND a value actually came back for this window. Declaring a
   *  metric and reading one are different facts and the rule needs both. */
  metricObserved: boolean;
  basis: SettlementBasis | null;
  /** The linked bet's impact, 1..10. Null when no bet is linked, which means
   *  settling moves no priority at all. */
  impact: number | null;
  /** Other bets on the same theme that re-rank when this verdict lands. The
   *  blast radius past the one row being written. */
  otherBetsOnTheme: number;
  /** True when this verdict moves the linked bet's confidence at all. Supplied
   *  by the caller from VERDICT_CONFIDENCE_DELTA so the rule can never hold a
   *  second, drifting copy of that table. A verdict that moves nothing is a
   *  cheap thing to be wrong about. */
  movesTheScore: boolean;
  /** The display name of the agent whose promotion a `missed` verdict would
   *  hold (`auto_advance_agent_arc` returns early on exactly that row). Null
   *  when no agent made the call, or when its arc is already trusted. */
  holdsPromotionFor: string | null;
};

export type SettlementDecision = {
  action: SettlementAction;
  /** 0..1. How much there is to go on. */
  evidence: number;
  /** 0..1. How much rides on the verdict landing. */
  stakes: number;
  /** The evidence score this particular verdict had to clear. */
  required: number;
  /** One plain sentence: why the agent settled it, or why it is on your desk. */
  reason: string;
  /** Every input that counted, as facts. This is what the record shows and
   *  what the human reads before overturning. */
  because: string[];
};

/**
 * What each kind of evidence is worth. They sum to exactly 1, and the split is
 * deliberate: a number that was actually read outweighs everything else,
 * because it is the only input that can contradict the model. The merged change
 * and the written-down bet only establish that the work shipped and was
 * measurable in principle, which is the same reasoning `scoreConfidence`
 * already uses in outcome-suggestion.server.ts.
 */
export const EVIDENCE_WEIGHTS = {
  metricObserved: 0.35,
  /** Declared and never read is worth something, but not much: it proves the
   *  bet was falsifiable, not that anyone falsified it. */
  metricDeclared: 0.1,
  usage: 0.3,
  shippedChange: 0.2,
  prediction: 0.15,
} as const;

/** The same 14-day ramp `scoreConfidence` and `ice-adjust.server.ts` use, so
 *  every "how sure are we" number in the product ramps at one rate. */
export const USAGE_FULL_DAYS = 14;

/** The evidence a verdict needs when literally nothing rides on it. */
export const SETTLE_FLOOR = 0.45;
/** How much higher the bar climbs as the stakes climb. Floor + span = 0.85 at
 *  maximum stakes, which no evidence short of a read metric plus usage plus a
 *  merged change can clear. That is the intent. */
export const SETTLE_STAKES_SPAN = 0.4;

/**
 * Where the sliding bar sits, as a value rather than as two constants.
 *
 * WHY IT IS A PARAMETER NOW. Governance canon, fourth floor: "a default the
 * user never set is our choice, not their policy, so it must be visible and
 * changeable". These two numbers decide when an agent settles a shipped bet's
 * verdict on its own, which is the sharpest thing on this surface, and until
 * now a workspace had no way to say where it wanted them. They stay here,
 * because a workspace that has said nothing must get exactly what the product
 * ships with; `src/lib/autonomy-policy.ts` supplies the other value when a
 * person has stated one.
 *
 * NOTHING ELSE MOVED. The three hard gates below are floors rather than
 * settings and take no argument, so no bar passed here can lower them.
 */
export type SettleBar = { floor: number; span: number };

/** What the product does when nobody has said otherwise. */
export const SHIPPED_SETTLE_BAR: SettleBar = { floor: SETTLE_FLOOR, span: SETTLE_STAKES_SPAN };

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** How much there is to go on, 0..1. */
export function settlementEvidence(i: SettlementInputs): number {
  if (i.verdictIsRecordFact) return 1;
  let score = i.metricObserved
    ? EVIDENCE_WEIGHTS.metricObserved
    : i.metricDeclared
      ? EVIDENCE_WEIGHTS.metricDeclared
      : 0;
  const b = i.basis;
  if (b) {
    const days = Math.max(0, b.data_days);
    score += Math.min(1, days / USAGE_FULL_DAYS) * EVIDENCE_WEIGHTS.usage;
    if (b.has_shipped_changeset) score += EVIDENCE_WEIGHTS.shippedChange;
    if (b.has_prediction) score += EVIDENCE_WEIGHTS.prediction;
  }
  return clamp01(score);
}

/**
 * How much rides on the verdict landing, 0..1. Three things, and only things
 * the write actually causes: how big the bet was, whether the verdict moves
 * the score at all, and how many other bets re-rank behind it.
 */
export function settlementStakes(i: SettlementInputs): number {
  const linked = i.impact !== null;
  const size = linked ? clamp01(i.impact! / 10) : 0;
  const moves = linked && i.movesTheScore ? 1 : 0;
  const blast = Math.min(1, Math.max(0, i.otherBetsOnTheme) / 3);
  return clamp01(0.5 * size + 0.25 * moves + 0.25 * blast);
}

/** The facts that counted, in the order a person would want to read them. */
function factsFor(i: SettlementInputs): string[] {
  const facts: string[] = [];
  if (i.verdictIsRecordFact) {
    facts.push(
      "The outcome window closed and the spec never shipped, which is a fact, not a read.",
    );
  }
  if (i.metricObserved) facts.push("A number came back for this window and was read.");
  else if (i.metricDeclared)
    facts.push("A success metric was declared for this bet and never read.");
  else facts.push("No success metric was ever attached to this bet.");

  const b = i.basis;
  if (b && b.data_days > 0) {
    facts.push(
      `Usage from ${b.sample_users} ${b.sample_users === 1 ? "person" : "people"} over ${b.data_days} ${b.data_days === 1 ? "day" : "days"}.`,
    );
  } else {
    facts.push("No usage data behind it.");
  }
  if (b?.has_shipped_changeset) facts.push("The merged change is on file.");
  if (b?.has_prediction) facts.push("The bet was written down before it shipped.");

  if (i.impact === null) {
    facts.push("No bet is linked, so settling it moves no priority.");
  } else {
    facts.push(
      `The linked bet is scored ${i.impact} for impact, and this verdict ${i.movesTheScore ? "moves" : "does not move"} its confidence.`,
    );
  }
  if (i.otherBetsOnTheme > 0) {
    facts.push(
      `${i.otherBetsOnTheme} other ${i.otherBetsOnTheme === 1 ? "bet" : "bets"} on the same evidence re-rank behind it.`,
    );
  }
  if (i.holdsPromotionFor) {
    facts.push(`${i.holdsPromotionFor} made this call, so a miss holds its promotion.`);
  }
  return facts;
}

/**
 * Settle it, or ask. Three hard gates first, then the sliding bar.
 *
 * The gates exist because a score can always be talked up and these three
 * cannot: there was nothing to check against, the decisive claim was never
 * measured, or the verdict costs another agent its autonomy on a soft read.
 * Each one is the "genuine judgment with no oracle" floor in a concrete form,
 * and none of them can be cleared by a confident model.
 */
export function classifyOutcomeSettlement(
  i: SettlementInputs,
  bar: SettleBar = SHIPPED_SETTLE_BAR,
): SettlementDecision {
  const evidence = settlementEvidence(i);
  const stakes = settlementStakes(i);
  const required = bar.floor + bar.span * stakes;
  const because = factsFor(i);
  const base = { evidence, stakes, required, because };

  // Gate 1. No oracle at all. Nothing was ever attached to this bet that could
  // check it, so what the outcome MEANT is judgment by definition, and the
  // floor says that stays with a person no matter how sure anything is.
  if (!i.verdictIsRecordFact && !i.metricDeclared && !i.metricObserved) {
    return {
      ...base,
      action: "escalate",
      reason:
        "Nothing was ever attached to this bet that could check it, so what the outcome meant is a judgment call and it stays yours.",
    };
  }

  // Gate 2. A decisive verdict with no measurement. "It worked" and "it did
  // not" are the two claims that compound into future guidance and move the
  // score in opposite directions; asserting either from a read of the mood is
  // exactly the failure this whole design exists to prevent. `mixed` is not
  // gated here because it moves nothing and claims nothing decisive.
  if (!i.verdictIsRecordFact && i.verdict !== "mixed" && !i.metricObserved) {
    return {
      ...base,
      action: "escalate",
      reason: `Calling it ${i.verdict === "validated" ? "a win" : "a miss"} needs a number that was actually read, and none came back for this window.`,
    };
  }

  // Gate 3. Conflict of interest. A miss holds another agent's promotion, and
  // an agent grading the crew on a soft signal is the one call where the cost
  // lands on someone who cannot answer back. A record fact is exempt: the
  // window closing with nothing shipped is not a grade, it is a date.
  if (i.verdict === "missed" && i.holdsPromotionFor && !i.verdictIsRecordFact) {
    return {
      ...base,
      action: "escalate",
      reason: `A miss here holds ${i.holdsPromotionFor}'s promotion, and on a read of the signal rather than a fact on the record, that call stays yours.`,
    };
  }

  if (evidence < required) {
    return {
      ...base,
      action: "escalate",
      reason: `The evidence is thin for what this moves, so it is your call. ${pct(evidence)} of the evidence this verdict needs, and it needs ${pct(required)} because ${stakesClause(i)}.`,
    };
  }

  return {
    ...base,
    action: "settle",
    reason: i.verdictIsRecordFact
      ? "The outcome window closed with nothing shipped, which settles itself."
      : `The evidence clears the bar for what this moves: ${pct(evidence)} against the ${pct(required)} this verdict needs.`,
  };
}

function pct(n: number): string {
  return `${Math.round(clamp01(n) * 100)}%`;
}

function stakesClause(i: SettlementInputs): string {
  const bits: string[] = [];
  if (i.impact !== null && i.impact >= 7) bits.push("the bet is a big one");
  if (i.impact !== null && i.movesTheScore) bits.push("the verdict moves its priority");
  if (i.otherBetsOnTheme > 0) bits.push("other bets re-rank behind it");
  if (bits.length === 0) return "little rides on it";
  return bits.join(" and ");
}

/**
 * The confidence move a verdict makes when it REPLACES an earlier one.
 *
 * An overturn is not a fresh verdict. If an agent already moved a bet's
 * confidence by +2 for `validated` and a person overturns it to `missed`, the
 * honest move is -4, not -2: the record has to end where it would have been if
 * the person had settled it in the first place. Written here, generic over the
 * delta table, so `outcome.functions.ts` keeps the ONE copy of the actual
 * numbers and this arithmetic is still unit-testable without dragging the
 * server-function chain into a pure test.
 */
export function overturnMove(
  deltas: Readonly<Record<ReviewVerdict, number>>,
  next: ReviewVerdict,
  prior: ReviewVerdict | null,
): number {
  return deltas[next] - (prior === null ? 0 : deltas[prior]);
}

/* ---- The derived booleans, shared so the two callers cannot disagree ---- */

/** A metric label AND a value both present. Either alone is not a reading. */
export function metricWasObserved(
  m: { metric_label?: unknown; metric_value?: unknown } | null | undefined,
): boolean {
  if (!m) return false;
  return str(m.metric_label) !== null && str(m.metric_value) !== null;
}

/**
 * Something exists that could check this bet: the launch plan's success metric
 * text, or an outcome contract with at least one standing metric carrying a
 * real oracle. A "hazy" contract (metrics, none of them checkable) counts as
 * nothing declared, which is the honest reading of `gradeOutcomeContract`.
 */
export function metricWasDeclared(
  successMetric: string | null | undefined,
  contract: ContractVerdict | null | undefined,
): boolean {
  if (str(successMetric) !== null) return true;
  return contract === "verifiable" || contract === "partial";
}

/** Narrow the RF-01 suggestion basis to what the rule reads. */
export function basisFor(
  suggestion: { basis?: Partial<SettlementBasis> | null } | null | undefined,
): SettlementBasis | null {
  const b = suggestion?.basis;
  if (!b) return null;
  return {
    data_days: Number(b.data_days ?? 0) || 0,
    sample_users: Number(b.sample_users ?? 0) || 0,
    has_shipped_changeset: !!b.has_shipped_changeset,
    has_prediction: !!b.has_prediction,
  };
}
