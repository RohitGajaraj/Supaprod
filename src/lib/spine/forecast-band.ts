/**
 * A FORECAST IS A BAND, NOT A POINT — gap #15.
 *
 * ── THE FINDING UNDERNEATH THE GAP, AND IT IS WORSE THAN "NO BAND" ────────
 * Measured 2026-08-31: `decisions` carried eleven `forecast_*` columns and **not
 * one of them held a number.** `forecast_claim` is text,
 * `forecast_how_we_will_know` is text, `forecast_horizon_date` is a date. A
 * forecast was PROSE plus a deadline, so the grader could only ask a model to
 * judge a sentence.
 *
 * **That is why the grader "has processed zero workspaces in its life" (F-51).**
 * It was never short of a band. It was short of anything to compute with.
 *
 * ── WHAT A BAND BUYS THAT A POINT DOES NOT ───────────────────────────────
 * A point is graded once, at the horizon, months later — which is not an
 * instrument anybody can act on. A band says what counts as on-track, what
 * counts as drift and what counts as a miss, **and what the system DOES at
 * each**, which is the part we have never had. Anthropic's three tiers are log ·
 * diagnose read-only · open a change; ours are the same shape, and the third is
 * the return edge that gap #4 just built.
 */

/** Which way is good. Explicit, because inferring it is wrong exactly when baseline equals predicted. */
export type ForecastDirection = "lower-is-better" | "higher-is-better";

/** Where a reading landed. `unknown` is a real answer and is never "on-track". */
export type BandVerdict = "on-track" | "drifting" | "missed" | "unknown";

export interface ForecastBand {
  direction: ForecastDirection | null;
  /** The boundary between on-track and drifting. */
  driftingAt: number | null;
  /** The boundary between drifting and missed. */
  missedAt: number | null;
  /** Legacy seat-declared population. Never use this to decide whether to act. */
  observations: number | null;
  /** Number of attributable readings actually present in the connected record. */
  recordedReadings?: number | null;
}

/**
 * Below this, a band is not evidence and must say so.
 *
 * §3 B: *"a band derived from fewer than N observations must say so; a tier that
 * fires on noise is theatre and gets the feature deleted rather than fixed."*
 * Three is the smallest number from which "this moved" can be distinguished from
 * "this is noisy" at all, and picking a bigger one would refuse bands that are
 * genuinely informative on a young workspace.
 */
export const MIN_OBSERVATIONS_FOR_A_BAND = 3;

/**
 * Which band a reading falls in.
 *
 * **`unknown` whenever the band cannot answer**, and that is the whole design:
 * a missing direction, a missing threshold or a non-finite reading all produce
 * `unknown` rather than a default. **A band that guesses is worse than no band**,
 * because a tier fires off it — and F-76's rule is that not knowing and being
 * fine are different values.
 */
export function bandFor(reading: number | null | undefined, band: ForecastBand): BandVerdict {
  if (typeof reading !== "number" || !Number.isFinite(reading)) return "unknown";
  if (!band.direction) return "unknown";
  if (band.driftingAt === null || band.missedAt === null) return "unknown";
  if (!Number.isFinite(band.driftingAt) || !Number.isFinite(band.missedAt)) return "unknown";

  if (band.direction === "lower-is-better") {
    // Thresholds must be ordered the way the direction implies, or the band is
    // malformed and answering from it would be inventing a verdict.
    if (band.missedAt < band.driftingAt) return "unknown";
    if (reading <= band.driftingAt) return "on-track";
    if (reading <= band.missedAt) return "drifting";
    return "missed";
  }

  if (band.missedAt > band.driftingAt) return "unknown";
  if (reading >= band.driftingAt) return "on-track";
  if (reading >= band.missedAt) return "drifting";
  return "missed";
}

/**
 * Whether this band is founded on enough to act on.
 *
 * Separate from `bandFor` on purpose: a band can be perfectly well-formed and
 * still rest on one reading. **The verdict and its standing are two facts and a
 * surface must be able to show both** — "missed, and we are sure" reads very
 * differently from "missed, from a single observation".
 */
export function bandIsWellFounded(band: ForecastBand): boolean {
  return (
    typeof band.recordedReadings === "number" &&
    band.recordedReadings >= MIN_OBSERVATIONS_FOR_A_BAND
  );
}

/**
 * What the band says about itself when it is thin. Null when it is well founded.
 *
 * NAMED `Note` RATHER THAN THE OBVIOUS WORD, and not by preference: the
 * design-system ratchet forbids the retired "Caveat" face, and it matches the
 * identifier as readily as the font. It caught this on the first full run. The
 * guard is right and the baseline is not widened to accommodate a variable name.
 */
export function thinBandNote(band: ForecastBand): string | null {
  if (bandIsWellFounded(band)) return null;
  const n = typeof band.recordedReadings === "number" ? band.recordedReadings : null;
  if (n === null) {
    return "The record has no readings behind this band, so treat it as a guess rather than a measurement.";
  }
  return n === 1
    ? "This band comes from a single reading, so it can tell you the direction and not the size."
    : `This band comes from ${n} readings, which is fewer than the ${MIN_OBSERVATIONS_FOR_A_BAND} it takes to tell a move from noise.`;
}

/** The three tiers, named for what the system DOES rather than for a sigma. */
export type TierAction = "log" | "diagnose" | "open-work" | "none";

/**
 * What happens at this verdict.
 *
 * **`drifting` diagnoses READ-ONLY and does not open work**, which is the tier
 * distinction worth keeping: a drift that opens a change every time trains a
 * person to ignore it, and Anthropic's own middle tier is a read-only diagnosis
 * for that reason.
 *
 * **A thin band never opens work.** It may still log, because recording that
 * something moved costs nothing and is true. But `open-work` spends a person's
 * attention and a model's budget on a claim that cannot support it — which is
 * the "tier firing on noise" the spec says deletes the feature.
 */
export function tierActionFor(verdict: BandVerdict, band: ForecastBand): TierAction {
  if (verdict === "unknown") return "none";
  if (verdict === "on-track") return "log";
  if (!bandIsWellFounded(band)) return "log";
  return verdict === "drifting" ? "diagnose" : "open-work";
}
