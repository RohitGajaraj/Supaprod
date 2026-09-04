/**
 * WHEN A RECORDED NUMBER LETS LEARN RUN BEFORE ITS HORIZON.
 *
 * ── THE RULE, STATED WHERE THE WAIT IS SET ────────────────────────────────
 * The forecast's due date is the LATEST Learn returns, not the earliest. A
 * reading can bring it forward. Prose never can, and neither can a band that
 * cannot answer or one founded on noise.
 *
 * ── THE FOUR CONDITIONS, AND WHY THE FOURTH IS THE ONE THAT BITES ─────────
 * 1. A reading exists, on the clause the forecast is about.
 * 2. The forecast carries a band at all. `driver.ts`'s own filing rule says
 *    prose plus a date is still a real forecast; it simply cannot be settled
 *    early, because there is no threshold to cross.
 * 3. The band can answer this reading -- `bandFor` is not `unknown`. That
 *    function returns `unknown` for a missing direction, a missing or
 *    non-finite threshold, and thresholds ordered against their own direction,
 *    and its note is explicit that a band that guesses is worse than no band.
 * 4. The band is WELL FOUNDED: at least `MIN_OBSERVATIONS_FOR_A_BAND` readings
 *    behind it.
 *
 * The fourth is the one a reasonable implementation leaves out, because
 * conditions 1 to 3 already read like the whole rule. It is not optional here.
 * `driver.ts`'s filing instruction says a band from one reading "is logged and
 * never opens work", and `forecast-band.ts` keeps `bandIsWellFounded` separate
 * from `bandFor` precisely because a band can be perfectly well-formed and
 * still rest on a single observation. BRINGING LEARN FORWARD IS OPENING WORK:
 * it runs a station, spends a seat, and files a verdict. So a thin band lifting
 * the wait would fire the loop on noise through a door the tier rules were
 * written to keep shut, and it would do it while passing every check that only
 * asked whether the band answered.
 *
 * ── AND WHY AN AMBIGUOUS MATCH DOES NOT LIFT ──────────────────────────────
 * The reading has to be on the clause the forecast's observable names. Matching
 * a decision's `forecast_metric` to a contract clause's prose is not something
 * this file is willing to guess at: attaching a number to the wrong metric and
 * then grading against it is a worse failure than waiting until the date, which
 * is the behaviour we already have. So the match must be unambiguous -- exactly
 * one standing clause carrying a reading -- and anything else keeps the date.
 *
 * Waiting is the safe direction. Nothing is lost by a forecast graded on its
 * horizon; a forecast graded early against the wrong number is on the record
 * as a measurement.
 */

import { bandFor, bandIsWellFounded, type ForecastBand } from "./forecast-band";
import { whatWouldMeasure, isStanding, type MetricClause } from "./what-would-measure-this";

/** Why Learn did or did not come forward, in a form a caller can log. */
export type LiftDecision =
  | { readonly lift: true; readonly reading: number; readonly verdict: string }
  | { readonly lift: false; readonly because: string };

const KEEPS_THE_DATE = (because: string): LiftDecision => ({ lift: false, because });

/**
 * The single hand-recorded reading on this spec, or null when there is not
 * exactly one.
 *
 * Exported because "how many readings are there" is the fact the ambiguity rule
 * turns on, and a caller that wants to explain itself needs it separately from
 * the decision.
 */
export function theOneReading(contract: unknown): number | null {
  const raw = (contract as { success_metrics?: unknown } | null)?.success_metrics;
  if (!Array.isArray(raw)) return null;
  const readings = raw
    .filter(
      (c): c is MetricClause =>
        typeof c === "object" && c !== null && isStanding(c as MetricClause),
    )
    .map((c) => whatWouldMeasure(c, new Set<string>()))
    .filter((s) => s.kind === "hand")
    .map((s) => (s.kind === "hand" ? s.reading.value : null))
    .filter((v): v is number => typeof v === "number");
  return readings.length === 1 ? readings[0] : null;
}

/**
 * Whether this reading settles this forecast early.
 *
 * `band` null means the forecast is prose. That is a real forecast and it waits.
 */
export function aReadingCanBringLearnForward(
  contract: unknown,
  band: ForecastBand | null,
): LiftDecision {
  const reading = theOneReading(contract);
  if (reading === null) {
    return KEEPS_THE_DATE(
      "no single recorded reading on this spec, so there is nothing unambiguous to settle it with",
    );
  }
  if (!band) {
    return KEEPS_THE_DATE(
      "this forecast is prose and carries no band, so a number cannot settle it early",
    );
  }

  const verdict = bandFor(reading, band);
  if (verdict === "unknown") {
    return KEEPS_THE_DATE("the band cannot answer this reading, and a band that guesses is worse than no band");
  }
  if (!bandIsWellFounded(band)) {
    return KEEPS_THE_DATE(
      "the band rests on too few observations to open work, so the reading is recorded and the date still governs",
    );
  }
  return { lift: true, reading, verdict };
}
