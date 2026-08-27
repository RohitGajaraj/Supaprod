/**
 * THE TRACK RECORD, INCLUDING THE PART NOBODY HAS GRADED.
 *
 * ── WHAT THE BOARD SAID, AND WHAT IT LEFT OUT ──────────────────────────────
 * "Your forecasts came true 1 of 2 times." Honest counts, no percentage, and a
 * door to the record. What it never said is how many forecasts are sitting past
 * their date with nobody's verdict on them. Measured 2026-08-27 by S1: **15**.
 *
 * So a reader met a track record built from two graded calls and had no way to
 * know it was two out of seventeen. That is not a wrong number; it is a number
 * whose denominator is doing work the reader cannot see.
 *
 * ── AND THE WORSE HALF: THE LINE DISAPPEARED WHEN IT MATTERED MOST ─────────
 * The whole band was gated on `calibration.prediction.resolved`, so it drew
 * nothing until at least one forecast had been graded. A workspace that had
 * made fifteen forecasts and graded none saw NO forecast line at all - the moat
 * invisible at exactly the moment it needed a person.
 *
 * The gate was written for a real reason and that reason still holds: "a zero
 * never renders as a finding", because "0 of 0" is not a track record. The fix
 * is not to drop the guard but to notice there are two facts here, and the
 * second one stands on its own.
 *
 * ── THE PRODUCT'S OWN CLAIM IS WHY THIS IS WORTH THE LINE ──────────────────
 * The moat is the forecast captured at decision time - what a team believed
 * would happen, recorded before the outcome was known. A forecast nobody grades
 * never becomes that. It is a claim with no verdict, and the record is worth
 * exactly as much as the fraction of it that has been settled.
 */

export interface ForecastStanding {
  /** Forecasts that have been graded. Null when the read has not answered. */
  resolved: number | null;
  /** Of those, how many held. */
  hits: number | null;
  /**
   * Forecasts past their date with no verdict. Null when unknown.
   *
   * MUST BE THE POPULATION, NOT A PAGE. `listDueForecasts` returns `total`
   * beside a `due` array bounded by `DUE_FORECAST_PAGE`, and the array is the
   * page. S1 shipped `due.length` here on another surface and understated by
   * three the moment it landed.
   */
  ungraded: number | null;
}

/** The graded record, or null when there is nothing graded to report. */
export function gradedLine(s: ForecastStanding): string | null {
  if (s.resolved === null || s.hits === null || s.resolved <= 0) return null;
  return `Your forecasts came true ${s.hits} of ${s.resolved} times.`;
}

/**
 * What is still waiting on a verdict, or null.
 *
 * NULL ON ZERO AND ON UNKNOWN, and they are different reasons for the same
 * silence: nothing is overdue, or we could not find out. Neither earns a
 * sentence, and "0 more are past their date" is furniture.
 */
export function ungradedLine(s: ForecastStanding): string | null {
  if (s.ungraded === null || s.ungraded <= 0) return null;
  return s.ungraded === 1
    ? "1 more is past its date and nobody has said which way."
    : `${s.ungraded} more are past their date and nobody has said which way.`;
}

/**
 * Whether the band should draw at all.
 *
 * Either fact alone earns it. The band used to require a graded forecast, which
 * hid the ungraded backlog precisely when it was the only thing to say.
 */
export function worthDrawing(s: ForecastStanding): boolean {
  return gradedLine(s) !== null || ungradedLine(s) !== null;
}

/**
 * The ungraded sentence when it stands ALONE, which reads differently.
 *
 * "15 more are past their date" is wrong with no first sentence for "more" to
 * refer to. Same fact, and the word "more" is a lie about a sentence that is
 * not there.
 */
export function ungradedAlone(s: ForecastStanding): string | null {
  if (s.ungraded === null || s.ungraded <= 0) return null;
  return s.ungraded === 1
    ? "One forecast is past its date and nobody has said which way."
    : `${s.ungraded} forecasts are past their date and nobody has said which way.`;
}
