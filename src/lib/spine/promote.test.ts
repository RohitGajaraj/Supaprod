/**
 * The one rule in this product that spends money with nobody watching.
 *
 * So the tests are about REFUSALS, not promotions: every way a weak cluster
 * could talk its way past the bar, and every way a human decision could be
 * overruled by it.
 */
import { describe, expect, it } from "bun:test";
import {
  DEFAULT_PROMOTION_BAR,
  MAX_PROMOTIONS_PER_SWEEP,
  originFor,
  qualifies,
  rankForPromotion,
  type ThemeLike,
} from "./promote";

const strong = (o: Partial<ThemeLike> = {}): ThemeLike => ({
  id: "t1",
  title: "Crews retype homeowner details",
  summary: "Crews enter the same details twice.",
  frequency: 12,
  severity: 5,
  confidence: 0.9,
  status: "active",
  ...o,
});

describe("the promotion bar", () => {
  it("promotes a cluster with real evidence behind it", () => {
    expect(qualifies(strong()).ok).toBe(true);
  });

  it("refuses a loud but harmless cluster", () => {
    // The failure mode a product team is most prone to: forty mentions of
    // something trivial. Requiring all three conditions is what stops it.
    expect(qualifies(strong({ frequency: 40, severity: 1 })).ok).toBe(false);
  });

  it("refuses a severe cluster nobody else reported", () => {
    expect(qualifies(strong({ frequency: 1, severity: 5 })).ok).toBe(false);
  });

  it("refuses a cluster the clustering does not believe in", () => {
    // Low confidence means these signals may not belong together, so the brief
    // would be several unrelated complaints presented as one problem.
    expect(qualifies(strong({ confidence: 0.4 })).ok).toBe(false);
  });

  it("never overrules a person who already settled it", () => {
    for (const status of ["dismissed", "merged", "archived", "done", "DISMISSED"]) {
      const v = qualifies(strong({ status }));
      expect(v.ok, `${status} must not be promoted`).toBe(false);
      expect(v.why).toContain("already settled");
    }
  });

  it("refuses a cluster with no name", () => {
    // A track needs a name a person recognises on a board, and naming it
    // ourselves would be inventing the work's identity.
    expect(qualifies(strong({ title: "  " })).ok).toBe(false);
    expect(qualifies(strong({ title: null })).ok).toBe(false);
  });

  it("treats missing numbers as zero rather than as passing", () => {
    // Fail direction: an unscored cluster must not slip through because a
    // column was null.
    expect(qualifies(strong({ frequency: null })).ok).toBe(false);
    expect(qualifies(strong({ severity: null })).ok).toBe(false);
    expect(qualifies(strong({ confidence: null })).ok).toBe(false);
  });

  it("says why, in words a person can act on", () => {
    expect(qualifies(strong({ frequency: 2 })).why).toContain("2 signals");
    expect(qualifies(strong()).why).toContain("90%");
  });

  it("sits above the average of every live status", () => {
    // Calibrated against 181 real themes: means ran 5.2 to 16.3 frequency,
    // 2.5 to 5.0 severity, 0.68 to 0.91 confidence. A bar at or below the mean
    // would promote roughly half the backlog.
    expect(DEFAULT_PROMOTION_BAR.minFrequency).toBeGreaterThanOrEqual(8);
    expect(DEFAULT_PROMOTION_BAR.minSeverity).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_PROMOTION_BAR.minConfidence).toBeGreaterThanOrEqual(0.75);
  });
});

describe("ranking and bounding a sweep", () => {
  it("never starts more than the sweep bound, whatever the backlog", () => {
    const many = Array.from({ length: 50 }, (_, i) => strong({ id: `t${i}` }));
    expect(rankForPromotion(many).length).toBe(MAX_PROMOTIONS_PER_SWEEP);
    // The first run against 181 themes must open a couple of pieces of work,
    // not 181 of them each spending against its own ceiling.
    expect(MAX_PROMOTIONS_PER_SWEEP).toBeLessThanOrEqual(3);
  });

  it("puts severity ahead of frequency", () => {
    const picked = rankForPromotion([
      strong({ id: "loud", severity: 4, frequency: 40 }),
      strong({ id: "painful", severity: 5, frequency: 9 }),
    ]);
    expect(picked[0].id).toBe("painful");
  });

  it("drops everything under the bar before ranking", () => {
    expect(rankForPromotion([strong({ id: "weak", severity: 1 })])).toEqual([]);
  });
});

describe("the origin written onto the track", () => {
  it("states the problem and why it became work on its own", () => {
    const o = originFor(strong());
    // Load-bearing twice: validateRoute refuses a track with no stated reason,
    // and Learn grades the outcome against what the work was for.
    expect(o).toContain("Crews enter the same details twice.");
    expect(o).toContain("became work on its own because");
    expect(o).toContain("12 signals");
  });

  it("falls back to the title when a cluster has no summary", () => {
    expect(originFor(strong({ summary: null }))).toContain("Crews retype homeowner details");
  });
});
