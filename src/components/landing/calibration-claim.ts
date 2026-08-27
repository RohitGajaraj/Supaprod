/**
 * WHAT /proof MAY SAY ABOUT ITS OWN TRACK RECORD, AND AT WHAT POPULATION.
 *
 * The page's whole argument is in its own copy: *"We would rather show you an
 * honest zero than a number that isn't real yet."* It then published a
 * percentage the moment `total > 0`.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-27, with the sample workspaces
 * excluded exactly as `computePredictionHitRate` excludes them: FOUR scored
 * outcomes, two of them hits. The public page was printing "Supaprod called 2
 * of the last 4 calls right. That is 50%." A proportion from four observations
 * has a 95% interval running from roughly 15% to 85%; one more row moves it
 * eight points. That is not a track record, it is noise wearing a percent sign,
 * on the one page built to prove we do not do that.
 *
 * SO THERE ARE THREE STATES, NOT TWO.
 *
 *   nothing scored     the honest zero the page already had
 *   too few to rate    the counts, said plainly, and why there is no percentage
 *   a real rate        the percentage, unchanged
 *
 * The middle one is the addition, and it says MORE than the old empty state
 * while claiming LESS than the old number: a reader learns we have graded four
 * calls and got two right, and is not handed a figure that will move.
 *
 * AND "THE LAST" WAS NEVER TRUE. `computePredictionHitRate` selects every
 * scored prediction with `.limit(5000)` and no ordering at all, so the rows are
 * whatever Postgres returns. "Of the last N calls" claims a recency the query
 * cannot deliver. It says "recorded" now, which is what the number is.
 */

/**
 * The smallest population this page will express as a percentage.
 *
 * TEN, and the reason is the interval rather than a round number. At n=10 a
 * 50% observation still carries a 95% interval of roughly 24% to 76%, which is
 * wide -- so ten is not a claim of precision, it is the floor below which a
 * percentage is actively misleading rather than merely imprecise. At n=4 the
 * interval covers almost the whole range and the figure conveys nothing.
 *
 * Raising this later is honest and lowering it is not, which is the direction a
 * threshold like this should be easy to move in.
 */
export const ENOUGH_TO_RATE = 10;

export type CalibrationClaim =
  | { kind: "none"; headline: string; body: string }
  | { kind: "too-few"; headline: string; body: string }
  | { kind: "rate"; headline: string; body: string };

/**
 * `hits` and `total` come from `computePredictionHitRate`, which already drops
 * the inconclusive rows and every sample workspace. `tableReady` is false when
 * the read itself failed, and a failed read is NOT a zero: it is a page that
 * cannot speak, and printing "not enough outcomes yet" over it would be a claim
 * made out of silence.
 */
export function calibrationClaim(input: {
  hits: number;
  total: number;
  rate: number | null;
  tableReady: boolean;
}): CalibrationClaim {
  const { hits, total, rate, tableReady } = input;

  if (!tableReady || total <= 0 || rate === null) {
    return {
      kind: "none",
      headline: "Not enough recorded outcomes yet.",
      body: "This page updates automatically as calibrated outcomes land. We would rather show you an honest zero than a number that isn't real yet.",
    };
  }

  if (total < ENOUGH_TO_RATE) {
    return {
      kind: "too-few",
      headline: `Supaprod has called ${hits} of ${total} recorded outcomes right.`,
      body: `${total} is too few to turn into a percentage that would mean anything, so we are not printing one. It appears here at ${ENOUGH_TO_RATE}, and every outcome up to then is listed below either way.`,
    };
  }

  return {
    kind: "rate",
    headline: `Supaprod called ${hits} of ${total} recorded calls right.`,
    body: `That is ${Math.round(rate * 100)}%, including the misses. We publish this number because a competitor claiming 100% is a competitor not tracking outcomes at all.`,
  };
}
