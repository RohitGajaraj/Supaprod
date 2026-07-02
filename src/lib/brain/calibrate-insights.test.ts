import { describe, expect, test } from "bun:test";
import {
  computeBrierScore,
  summarizeResolutions,
  shouldThrottle,
} from "./calibrate-insights.server";

describe("computeBrierScore (FS-01)", () => {
  test("a confident hit scores near zero", () => {
    expect(computeBrierScore(0.9, "hit")).toBeCloseTo(0.01, 5);
  });

  test("a confident miss scores near one", () => {
    expect(computeBrierScore(0.9, "miss")).toBeCloseTo(0.81, 5);
  });

  test("an unconfident hit still costs something", () => {
    expect(computeBrierScore(0.5, "hit")).toBeCloseTo(0.25, 5);
  });

  test("inconclusive never scores", () => {
    expect(computeBrierScore(0.9, "inconclusive")).toBeNull();
  });

  test("missing confidence falls back to 0.5", () => {
    expect(computeBrierScore(null, "hit")).toBeCloseTo(0.25, 5);
  });

  test("out-of-range confidence is clamped to [0,1]", () => {
    expect(computeBrierScore(1.4, "hit")).toBeCloseTo(0, 5);
    expect(computeBrierScore(-0.4, "miss")).toBeCloseTo(0, 5);
  });
});

describe("summarizeResolutions (FS-01)", () => {
  test("no resolved rows yields a null hit rate and an honest label", () => {
    const s = summarizeResolutions([], "prediction");
    expect(s.resolved).toBe(0);
    expect(s.hitRate).toBeNull();
    expect(s.recentLabel).toBe("Not enough resolved calls yet");
  });

  test("counts hits vs misses into a hit rate and a quotable label", () => {
    const rows = [{ resolution: "hit" }, { resolution: "hit" }, { resolution: "miss" }];
    const s = summarizeResolutions(rows, "risk");
    expect(s.resolved).toBe(3);
    expect(s.hits).toBe(2);
    expect(s.hitRate).toBeCloseTo(2 / 3, 5);
    expect(s.recentLabel).toBe("Cadence called 2 of the last 3");
  });
});

describe("shouldThrottle (FS-01)", () => {
  test("does not throttle below the minimum sample size", () => {
    expect(
      shouldThrottle({ kind: "prediction", resolved: 2, hits: 0, hitRate: 0, recentLabel: "" }),
    ).toBe(false);
  });

  test("throttles a kind whose hit rate is below the floor with enough samples", () => {
    expect(
      shouldThrottle({ kind: "prediction", resolved: 5, hits: 1, hitRate: 0.2, recentLabel: "" }),
    ).toBe(true);
  });

  test("does not throttle a kind performing at or above the floor", () => {
    expect(
      shouldThrottle({ kind: "risk", resolved: 5, hits: 3, hitRate: 0.6, recentLabel: "" }),
    ).toBe(false);
  });
});
