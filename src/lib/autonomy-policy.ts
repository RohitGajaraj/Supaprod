/**
 * The two bars the platform crosses on its own, made into workspace policy.
 *
 * THE FLOOR THIS CLOSES. Governance canon, fourth floor: "a default the user
 * never set is our choice, not their policy, so it must be visible and
 * changeable". Two live thresholds were failing it, and both of them decide
 * something a person would want to have decided:
 *
 *   1. THE PROMOTION BAR (`DEFAULT_PROMOTION_BAR` in lib/spine/promote.ts).
 *      Frequency 8, severity 4, confidence 0.75 decide when a cluster of
 *      evidence turns itself into a piece of work that starts spending, with
 *      nobody clicking anything.
 *   2. THE SETTLE-OR-ASK BAR (`SETTLE_FLOOR` / `SETTLE_STAKES_SPAN` in
 *      lib/ai/outcome-review.ts). 0.45 plus 0.40 times the stakes decides when
 *      an AGENT puts a shipped bet's verdict on the record instead of handing
 *      the call to a person. This one is sharper, because it is autonomy over
 *      judgment rather than over spend.
 *
 * WHAT THIS MODULE IS AND IS NOT. It is not a second rule. Both rules stay
 * exactly where they are and keep deciding; this only supplies the numbers they
 * were previously holding as constants, and it supplies THE SAME NUMBERS unless
 * a person has deliberately moved them. `SHIPPED_AUTONOMY_POLICY` is built from
 * the constants themselves rather than from copies, so the defaults cannot drift
 * away from the shipped behaviour even by accident.
 *
 * THE FALLBACK IS THE SHIPPED DEFAULT, NEVER AN EXTREME. A missing row, a
 * column that does not exist yet, an unreadable value: every one of those
 * resolves to what the product does today. Falling closed would freeze the loop
 * (nothing is ever promoted, nothing is ever settled, and the human is back to
 * approving everything, which is the exact failure the canon calls a policy
 * failure). Falling open would let an agent settle a verdict on nothing. Neither
 * is a defensible reading of "we could not read your policy".
 *
 * THE CARVE-OUT IS SAID OUT LOUD, NOT INFERRED. Founder ruling: he wants to be
 * able to state "never settle a bet above impact 8" rather than have it fall out
 * of a threshold he tuned. `neverSettleAboveImpact` is that sentence as a field.
 * It can only ever ESCALATE: it takes calls away from the agent and gives them
 * to a person, and it can never hand the agent one that the shipped rule refused.
 *
 * Pure and IO-free on purpose: the cron sweeps decide with it, the boundary
 * surface renders it, and both read the same arithmetic.
 */
import { DEFAULT_PROMOTION_BAR, type PromotionBar } from "@/lib/spine/promote";
import {
  classifyOutcomeSettlement,
  SETTLE_FLOOR,
  SETTLE_STAKES_SPAN,
  type SettleBar,
  type SettlementDecision,
  type SettlementInputs,
} from "@/lib/ai/outcome-review";

/** Every number on this policy, named so the UI can say which ones are yours. */
export type AutonomyField =
  | "minFrequency"
  | "minSeverity"
  | "minConfidence"
  | "settleFloor"
  | "settleStakesSpan"
  | "neverSettleAboveImpact";

export type AutonomyPolicy = {
  /** How many independent signals must say it before a cluster becomes work. */
  minFrequency: number;
  /** How much it must hurt the people who reported it, 1 to 5. */
  minSeverity: number;
  /** How sure the clustering must be that these belong together, 0 to 1. */
  minConfidence: number;
  /** The evidence a verdict needs when nothing at all rides on it, 0 to 1. */
  settleFloor: number;
  /** How much higher that bar climbs at maximum stakes, 0 to 1. */
  settleStakesSpan: number;
  /**
   * The spoken carve-out: an agent never settles a bet scored ABOVE this,
   * whatever the evidence says. Null when the workspace has not stated one.
   */
  neverSettleAboveImpact: number | null;
  /**
   * Which of these numbers this workspace actually chose. Everything absent
   * from this list is ours, and the fourth floor is the reason the difference
   * is carried at all: a person has to be able to see which numbers are their
   * policy and which are our decision standing in for one.
   */
  chosen: AutonomyField[];
};

/**
 * What the product does today, taken from the constants rather than copied.
 *
 * If either shipped constant ever moves, this moves with it, so "the default
 * reproduces today's behaviour" stays true without anybody remembering to
 * update a second number.
 */
export const SHIPPED_AUTONOMY_POLICY: AutonomyPolicy = {
  minFrequency: DEFAULT_PROMOTION_BAR.minFrequency,
  minSeverity: DEFAULT_PROMOTION_BAR.minSeverity,
  minConfidence: DEFAULT_PROMOTION_BAR.minConfidence,
  settleFloor: SETTLE_FLOOR,
  settleStakesSpan: SETTLE_STAKES_SPAN,
  // Nothing carved out by default. A carve-out is a sentence a person says, and
  // inventing one for them would be the same defect this file exists to fix.
  neverSettleAboveImpact: null,
  chosen: [],
};

/**
 * What each number may be, and it is a range rather than a clamp.
 *
 * A value outside its range is not quietly pulled to the edge: pulling 500 down
 * to 100 would silently enforce a policy nobody stated. It falls back to the
 * shipped default for that one field and reports itself as not chosen, which is
 * the only reading that never invents a boundary.
 */
export const AUTONOMY_BOUNDS: Record<AutonomyField, { min: number; max: number }> = {
  minFrequency: { min: 1, max: 100 },
  minSeverity: { min: 1, max: 5 },
  minConfidence: { min: 0, max: 1 },
  settleFloor: { min: 0, max: 1 },
  settleStakesSpan: { min: 0, max: 1 },
  neverSettleAboveImpact: { min: 1, max: 10 },
};

/** The stored shape. Numeric columns can arrive as strings over PostgREST, so
 *  every field tolerates both and the coercion happens in one place. */
export type AutonomyPolicyRow = {
  promotion_min_frequency?: number | string | null;
  promotion_min_severity?: number | string | null;
  promotion_min_confidence?: number | string | null;
  settle_evidence_floor?: number | string | null;
  settle_stakes_span?: number | string | null;
  never_settle_above_impact?: number | string | null;
};

/** The columns this policy lives in, in one place so the read and the write
 *  can never name a different set. */
export const AUTONOMY_COLUMNS: Record<AutonomyField, keyof AutonomyPolicyRow> = {
  minFrequency: "promotion_min_frequency",
  minSeverity: "promotion_min_severity",
  minConfidence: "promotion_min_confidence",
  settleFloor: "settle_evidence_floor",
  settleStakesSpan: "settle_stakes_span",
  neverSettleAboveImpact: "never_settle_above_impact",
};

function readable(raw: unknown, field: AutonomyField): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const { min, max } = AUTONOMY_BOUNDS[field];
  if (n < min || n > max) return null;
  return n;
}

/**
 * The stored row, read as a policy. A null, an absent column and a value that
 * makes no sense all resolve the same way: the number the product ships with.
 */
export function resolveAutonomyPolicy(row: AutonomyPolicyRow | null | undefined): AutonomyPolicy {
  if (!row) return SHIPPED_AUTONOMY_POLICY;

  const chosen: AutonomyField[] = [];
  const take = (field: AutonomyField, fallback: number): number => {
    const v = readable(row[AUTONOMY_COLUMNS[field]], field);
    if (v === null) return fallback;
    chosen.push(field);
    return v;
  };

  const minFrequency = take("minFrequency", SHIPPED_AUTONOMY_POLICY.minFrequency);
  const minSeverity = take("minSeverity", SHIPPED_AUTONOMY_POLICY.minSeverity);
  const minConfidence = take("minConfidence", SHIPPED_AUTONOMY_POLICY.minConfidence);
  const settleFloor = take("settleFloor", SHIPPED_AUTONOMY_POLICY.settleFloor);
  const settleStakesSpan = take("settleStakesSpan", SHIPPED_AUTONOMY_POLICY.settleStakesSpan);
  // The carve-out has no shipped value: absent means there is no carve-out,
  // which is a real answer rather than a fallback.
  const carve = readable(row[AUTONOMY_COLUMNS.neverSettleAboveImpact], "neverSettleAboveImpact");
  if (carve !== null) chosen.push("neverSettleAboveImpact");

  return {
    minFrequency,
    minSeverity,
    minConfidence,
    settleFloor,
    settleStakesSpan,
    neverSettleAboveImpact: carve,
    chosen,
  };
}

/** The bar `qualifies` and `rankForPromotion` already take as an argument. */
export function promotionBarFor(policy: AutonomyPolicy): PromotionBar {
  return {
    minFrequency: policy.minFrequency,
    minSeverity: policy.minSeverity,
    minConfidence: policy.minConfidence,
  };
}

/**
 * ── THE COLD START, AND WHY ONE ABSOLUTE NUMBER CANNOT SERVE BOTH ENDS ──────
 *
 * Measured against production on 2026-08-22. Across all nine real workspaces
 * there are 27 themes, average frequency 1.26 and MAXIMUM 3, against a shipped
 * bar of 8. So no real workspace can ever promote a cluster, no real workspace
 * has ever had a `spine_tracks` row, and the autonomous loop has run only on
 * demo fixtures for its whole life.
 *
 * The bar itself is not wrong. Its own argument, at `DEFAULT_PROMOTION_BAR`, is
 * that fewer than eight independent signals is a hunch rather than something
 * worth spending money on unwatched, and in a workspace holding four hundred
 * signals that is exactly right. The defect is that **frequency is the only one
 * of the three numbers that is relative to the corpus it came from.** Three
 * signals out of four hundred is noise. Three out of five is the dominant thing
 * that workspace knows, and refusing to act on it is the product failing at the
 * one job it claims: telling you what to build.
 *
 * So the bar reads maturity. Below `COLD_START_MATURE_AT` it scales with how
 * much the workspace has actually said, and it is clamped at both ends:
 *
 *   - it NEVER rises above the configured bar, so this can only ever make the
 *     product more willing to act, never less, and a workspace that deliberately
 *     set a low number keeps it;
 *   - it never falls below `COLD_START_FLOOR`, because one signal is a report
 *     and two is a coincidence, at any workspace size.
 *
 * **Severity and confidence deliberately do not scale.** They measure the
 * QUALITY of a cluster, not its weight of evidence: pain is not less severe in a
 * young workspace, and a clustering that is unsure is unsure at any size. Only
 * frequency is corpus-relative, so only frequency moves. Measured on the same
 * data, this is not a theoretical distinction: 17 of those 27 real themes
 * already clear severity AND confidence, and frequency alone is what stops
 * every one of them.
 *
 * Gated per workspace and OFF by default (`workspaces.cold_start_promotion_enabled`),
 * because turning it on is a decision to start spending with nobody watching,
 * which the canon's fourth floor makes a person's call rather than ours.
 */
export const COLD_START_MATURE_AT = 40;
export const COLD_START_FLOOR = 3;

/**
 * The promotion bar a workspace of this size should actually be held to.
 *
 * `totalSignals` is the workspace's whole corpus, not the theme's frequency.
 * Returns the bar unchanged once the workspace is mature, so the steady state is
 * byte-for-byte what shipped.
 */
export function coldStartBarFor(bar: PromotionBar, totalSignals: number): PromotionBar {
  if (!Number.isFinite(totalSignals) || totalSignals >= COLD_START_MATURE_AT) return bar;

  const scaled = Math.ceil((bar.minFrequency * Math.max(0, totalSignals)) / COLD_START_MATURE_AT);
  // The floor may not exceed what the workspace asked for: a deliberate 2 stays 2.
  const floor = Math.min(COLD_START_FLOOR, bar.minFrequency);
  const minFrequency = Math.max(floor, Math.min(bar.minFrequency, scaled));

  return { ...bar, minFrequency };
}

/** The two numbers `classifyOutcomeSettlement` places its sliding bar with. */
export function settleBarFor(policy: AutonomyPolicy): SettleBar {
  return { floor: policy.settleFloor, span: policy.settleStakesSpan };
}

/**
 * Settle it, or ask, under this workspace's policy.
 *
 * The shipped rule decides first and keeps every one of its three hard gates:
 * nothing was ever attached to the bet that could check it, a decisive verdict
 * with no number read, or a miss that costs another agent its promotion on a
 * soft read. No policy on this surface can lower those, which is what stops a
 * loosened bar from ever meaning "everything is allowed".
 *
 * The carve-out then runs in ONE direction. A decision the rule escalated is
 * returned untouched, so a stated carve-out can only ever take work off the
 * agent and put it on a person, never the reverse.
 */
export function decideSettlement(
  i: SettlementInputs,
  policy: AutonomyPolicy = SHIPPED_AUTONOMY_POLICY,
): SettlementDecision {
  const base = classifyOutcomeSettlement(i, settleBarFor(policy));
  if (base.action === "escalate") return base;

  const ceiling = policy.neverSettleAboveImpact;
  if (ceiling === null || i.impact === null || i.impact <= ceiling) return base;

  return {
    ...base,
    action: "escalate",
    reason: `You said an agent never settles a bet above impact ${ceiling}. This one is scored ${i.impact}, so the call stays yours whatever the evidence says.`,
    because: [
      ...base.because,
      `Your carve-out: nothing above impact ${ceiling} is ever settled by an agent.`,
    ],
  };
}
