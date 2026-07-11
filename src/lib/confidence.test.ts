import { describe, expect, test } from "bun:test";
import { tierFromProbability, tierFromSampleSize, shouldGateForReview } from "./confidence";

describe("tierFromProbability (RPT-08)", () => {
  test("below 0.4 is low", () => {
    expect(tierFromProbability(0)).toBe("low");
    expect(tierFromProbability(0.39)).toBe("low");
  });

  test("0.4 to just under 0.7 is medium", () => {
    expect(tierFromProbability(0.4)).toBe("medium");
    expect(tierFromProbability(0.69)).toBe("medium");
  });

  test("0.7 and above is high", () => {
    expect(tierFromProbability(0.7)).toBe("high");
    expect(tierFromProbability(1)).toBe("high");
  });

  test("clamps out-of-range and non-finite input to the honest medium default", () => {
    expect(tierFromProbability(-5)).toBe("low"); // clamps to 0
    expect(tierFromProbability(5)).toBe("high"); // clamps to 1
    expect(tierFromProbability(Number.NaN)).toBe("medium"); // falls back to 0.5
  });

  test("low is the only tier that gates, consistent with the rest of the module", () => {
    expect(shouldGateForReview(tierFromProbability(0.1))).toBe(true);
    expect(shouldGateForReview(tierFromProbability(0.5))).toBe(false);
    expect(shouldGateForReview(tierFromProbability(0.9))).toBe(false);
  });
});

describe("tierFromSampleSize (pre-existing, unchanged)", () => {
  test("still behaves as before", () => {
    expect(tierFromSampleSize(1, 3)).toBe("low");
    expect(tierFromSampleSize(4, 3)).toBe("medium");
    expect(tierFromSampleSize(7, 3)).toBe("high");
  });
});
