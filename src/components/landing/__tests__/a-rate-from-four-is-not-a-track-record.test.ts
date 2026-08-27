/**
 * /proof PUBLISHED A PERCENTAGE FROM FOUR OBSERVATIONS.
 *
 * The page's own argument is in its own copy: "We would rather show you an
 * honest zero than a number that isn't real yet." It then printed a rate the
 * moment `total > 0`.
 *
 * Measured on the live database on 2026-08-27, with the sample workspaces
 * excluded exactly as computePredictionHitRate excludes them: FOUR scored
 * outcomes, two of them hits, published as "Supaprod called 2 of the last 4
 * calls right. That is 50%." A proportion from four observations carries a 95%
 * interval of roughly 15% to 85%. One more row moves it eight points.
 */
import { describe, it, expect } from "bun:test";
import { calibrationClaim, ENOUGH_TO_RATE } from "../calibration-claim";

describe("a rate from four is not a track record", () => {
  it("the live shape publishes no percentage at all", () => {
    const c = calibrationClaim({ hits: 2, total: 4, rate: 0.5, tableReady: true });
    expect(c.kind).toBe("too-few");
    expect(`${c.headline} ${c.body}`).not.toContain("%");
    // And it still says what we actually know, which is more than the old
    // empty state said and less than the old number claimed.
    expect(c.headline).toBe("Supaprod has called 2 of 4 recorded outcomes right.");
  });

  it("the percentage returns at the threshold and not before", () => {
    const under = calibrationClaim({
      hits: 5,
      total: ENOUGH_TO_RATE - 1,
      rate: 5 / (ENOUGH_TO_RATE - 1),
      tableReady: true,
    });
    expect(under.kind).toBe("too-few");

    const at = calibrationClaim({ hits: 7, total: ENOUGH_TO_RATE, rate: 0.7, tableReady: true });
    expect(at.kind).toBe("rate");
    expect(at.body).toContain("70%");
    expect(at.body).toContain("including the misses");
  });

  /**
   * A FAILED READ IS NOT A ZERO. Printing "not enough recorded outcomes yet"
   * over a query that never ran is a claim made out of silence, which is the
   * thing this page exists to not do.
   */
  it("an unreadable table falls to the honest-zero state, never to a number", () => {
    for (const input of [
      { hits: 9, total: 40, rate: 0.225, tableReady: false },
      { hits: 0, total: 0, rate: null, tableReady: true },
      { hits: 3, total: 6, rate: null, tableReady: true },
    ]) {
      const c = calibrationClaim(input);
      expect(c.kind).toBe("none");
      expect(c.body).toContain("honest zero");
    }
  });

  /**
   * "OF THE LAST N CALLS" WAS NEVER TRUE. computePredictionHitRate selects
   * every scored prediction with `.limit(5000)` and no ordering, so the rows
   * are whatever Postgres returns. The page claimed a recency the query cannot
   * deliver.
   */
  it("no state claims recency the query cannot deliver", () => {
    for (const input of [
      { hits: 2, total: 4, rate: 0.5, tableReady: true },
      { hits: 30, total: 40, rate: 0.75, tableReady: true },
      { hits: 0, total: 0, rate: null, tableReady: true },
    ]) {
      const c = calibrationClaim(input);
      expect(`${c.headline} ${c.body}`.toLowerCase()).not.toContain("the last");
    }
  });
});
