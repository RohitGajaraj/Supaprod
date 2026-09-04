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
 * ── AND WHAT THE FOURTH CONDITION ACTUALLY BUYS TODAY, MEASURED ───────────
 * **It is a floor, not a defence, and the header said otherwise until this was
 * measured on production 2026-09-04.** All seven banded decisions, with what
 * the seats wrote into `forecast_observations`:
 *
 *   tablet_checkout_completion_rate  baseline 67    observations 41200
 *   tablet_checkout_completion_rate  baseline 67    observations  1420
 *   sign-up completion rate          baseline 0.62  observations  1240
 *   support_ticket_count             baseline 17    observations    17
 *   (no metric named)                baseline 42    observations     7
 *   tablet_checkout_completion_rate  baseline 67    observations     1
 *   tablet checkout completion rate  baseline 67    observations     1
 *
 * `product_analytics` holds 0 rows, so nothing here has read a completion rate
 * 41,200 times. Those are POPULATION sizes, and `support_ticket_count` has
 * observations exactly equal to its baseline, which is a seat copying the
 * neighbouring field. `driver.ts` asks for "how many readings the baseline came
 * from" in plain words; four of seven seats wrote something else.
 *
 * So `bandIsWellFounded` answers TRUE for 41200, 1420, 1240 and 17. This guard
 * stops the two decisions that were honest about being thin and waves through
 * the four that are not counting readings at all. **It is the right rule reading
 * a field that does not yet mean what its name says** -- the family of F-190,
 * F-192 and F-196, arriving this time inside the guard written to prevent it.
 *
 * It is KEPT, because the rule is right and a floor is worth more than nothing,
 * and because the alternative is trusting the same field with no gate at all.
 * It is not RELIED ON, and no caller should describe it as protection from
 * noise until `forecast_observations` is trustworthy. That fix is not here: the
 * field is misread by the seats writing it and by three shipped functions
 * reading it, `tierActionFor` among them, which returns "open-work" on a missed
 * verdict for exactly these bands. That is a live defect in the tier mechanism
 * and is nothing to do with this predicate.
 *
 * ── WHY NOTHING LIFTS AT ALL TODAY, WHICH IS THE HONEST HEADLINE ──────────
 * Measured the same hour: **133 specs, 0 carrying any reading on any clause.**
 * Condition 1 fails universally, so this predicate is correct and inert. P-137
 * built the press and nobody has pressed it. This is not a working behaviour
 * being reported; it is the first reader that will make a recorded number
 * matter, and it starts working the day somebody records one -- which is the
 * same day `tierActionFor`'s defect above stops being latent.
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
 * The latest reading on the one clause that carries readings, or null when
 * more than one clause does -- or none.
 *
 * ── ONE CLAUSE, NOT ONE READING (A1's correction, 2026-09-04) ─────────────
 * The count that matters is CLAUSES, and the value taken is that clause's
 * LATEST. `recordMetricReading` appends rather than replaces, on purpose: a
 * metric's history is the feature, and a person who records 71 on Monday and 73
 * on Thursday has not made the forecast ambiguous -- they have measured twice
 * and the second one is the current truth. Counting readings would refuse them,
 * which punishes the exact behaviour the press exists to encourage.
 *
 * Two CLAUSES carrying readings is the real ambiguity and still keeps the date:
 * see the header on why a clause is never matched to a forecast's metric by
 * guessing.
 *
 * `whatWouldMeasure` already resolves "latest" by `at`, and that is sound here
 * rather than merely inherited: every reading is written by
 * `recordMetricReading` with `new Date().toISOString()`, so `at` is always UTC
 * in one format and the lexical maximum is a true maximum. A mixed-offset
 * timestamp would break that comparison, and nothing can write one today.
 *
 * Exported because "how many clauses carry a reading" is the fact the ambiguity
 * rule turns on, and a caller that wants to explain itself needs it separately
 * from the decision.
 */
export function theLatestReadingOnTheOneClause(contract: unknown): number | null {
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
  const reading = theLatestReadingOnTheOneClause(contract);
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
    return KEEPS_THE_DATE(
      "the band cannot answer this reading, and a band that guesses is worse than no band",
    );
  }
  if (!bandIsWellFounded(band)) {
    return KEEPS_THE_DATE(
      "the band rests on too few observations to open work, so the reading is recorded and the date still governs",
    );
  }
  return { lift: true, reading, verdict };
}
