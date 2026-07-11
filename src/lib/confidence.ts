/**
 * PC-11: the shared confidence-tier convention for agent-drafted artifacts.
 * No new scoring model -- each writer maps a signal it already has (sample
 * size, an existing score) onto this one vocabulary. Where a writer has no
 * cheap signal, it defaults to "medium" (no gate), never fabricates one.
 *
 * Reuses generateOutcomeSuggestion's confidence_tier naming
 * (outcome-suggestion.server.ts), widened from that pattern's two tiers
 * (high/low) to three, since "medium, ungated" is this row's own explicit
 * default for writers with no signal.
 */

export type ConfidenceTier = "high" | "medium" | "low";

/** Low confidence is the only tier that gates -- routes to review instead
 *  of landing on the surface silently. Medium and high behave identically
 *  today; medium exists so "no signal" is honest, not a fabricated "high". */
export function shouldGateForReview(tier: ConfidenceTier): boolean {
  return tier === "low";
}

/** Sample-size-backed tiers for writers whose only cheap signal is "how many
 *  supporting rows fed this draft" (e.g. a playbook proposal compounded
 *  from N similar learnings). `low` sits at exactly the writer's own
 *  minimum-to-propose threshold -- the weakest case that still qualifies. */
export function tierFromSampleSize(count: number, minThreshold: number): ConfidenceTier {
  if (count <= minThreshold) return "low";
  if (count < minThreshold * 2) return "medium";
  return "high";
}

/**
 * RPT-08: the same three-tier vocabulary, applied to a 0-1 model-reported
 * probability (the Critic's own `confidence` field on every review, already
 * computed for every opportunity/PRD verdict -- no new scoring model, this
 * just names the existing number honestly instead of hiding it behind a
 * flat verdict chip that reads as uniform certainty). Thresholds are a
 * deliberately simple split: below 0.4 is "unsure enough to flag", 0.7+ is
 * "confident enough not to need a caveat", the middle third is the honest
 * default the rest of this module already uses for "no strong signal".
 */
export function tierFromProbability(p: number): ConfidenceTier {
  const clamped = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0.5;
  if (clamped < 0.4) return "low";
  if (clamped >= 0.7) return "high";
  return "medium";
}
