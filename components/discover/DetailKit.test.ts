import { describe, expect, test } from "bun:test";
import { toneForScore } from "./DetailKit";

describe("toneForScore", () => {
  describe("happy path: three scoring tiers", () => {
    test("score 10 (strong) returns moss", () => {
      expect(toneForScore(10)).toBe("moss");
    });

    test("score 8 (strong boundary) returns moss", () => {
      expect(toneForScore(8)).toBe("moss");
    });

    test("score 7 (strong floor) returns moss", () => {
      expect(toneForScore(7)).toBe("moss");
    });

    test("score 6 (mid tier) returns neutral", () => {
      expect(toneForScore(6)).toBe("neutral");
    });

    test("score 5 (mid-range) returns neutral", () => {
      expect(toneForScore(5)).toBe("neutral");
    });

    test("score 4 (mid floor) returns neutral", () => {
      expect(toneForScore(4)).toBe("neutral");
    });

    test("score 3 (low tier) returns muted", () => {
      expect(toneForScore(3)).toBe("muted");
    });

    test("score 1 (low boundary) returns muted", () => {
      expect(toneForScore(1)).toBe("muted");
    });

    test("score 0 (zero) returns muted", () => {
      expect(toneForScore(0)).toBe("muted");
    });
  });

  describe("boundary conditions: threshold boundaries are exact", () => {
    test("boundary at 7.0: just below 7 (6.9) returns neutral", () => {
      expect(toneForScore(6.9)).toBe("neutral");
    });

    test("boundary at 7.0: exactly 7 returns moss", () => {
      expect(toneForScore(7.0)).toBe("moss");
    });

    test("boundary at 7.0: just above 7 (7.1) returns moss", () => {
      expect(toneForScore(7.1)).toBe("moss");
    });

    test("boundary at 4.0: just below 4 (3.9) returns muted", () => {
      expect(toneForScore(3.9)).toBe("muted");
    });

    test("boundary at 4.0: exactly 4 returns neutral", () => {
      expect(toneForScore(4.0)).toBe("neutral");
    });

    test("boundary at 4.0: just above 4 (4.1) returns neutral", () => {
      expect(toneForScore(4.1)).toBe("neutral");
    });
  });

  describe("edge cases: extreme and unusual values", () => {
    test("negative score returns muted", () => {
      expect(toneForScore(-5)).toBe("muted");
    });

    test("very high score (100) returns moss", () => {
      expect(toneForScore(100)).toBe("moss");
    });

    test("fractional precision in strong tier (7.5) returns moss", () => {
      expect(toneForScore(7.5)).toBe("moss");
    });

    test("fractional precision in mid tier (4.5) returns neutral", () => {
      expect(toneForScore(4.5)).toBe("neutral");
    });

    test("fractional precision in low tier (2.5) returns muted", () => {
      expect(toneForScore(2.5)).toBe("muted");
    });

    test("very small positive (0.001) returns muted", () => {
      expect(toneForScore(0.001)).toBe("muted");
    });
  });

  describe("return type consistency: always returns exactly one of the three tones", () => {
    test("does not return undefined", () => {
      expect(toneForScore(5)).toBeDefined();
    });

    test("does not return null", () => {
      expect(toneForScore(5)).not.toBeNull();
    });

    test("returned value is always a string", () => {
      expect(typeof toneForScore(5)).toBe("string");
    });

    test("all tier returns are in the valid StatTone union", () => {
      const validTones = ["moss", "neutral", "muted"];
      const testScores = [10, 7, 6, 4, 3, 0];
      testScores.forEach((score) => {
        const result = toneForScore(score);
        expect(validTones).toContain(result);
      });
    });
  });

  describe("semantic correctness: tones match their intended strength signal", () => {
    test("moss (strong) is returned only for scores >= 7", () => {
      const mossScores = [7, 7.5, 8, 9, 10];
      mossScores.forEach((score) => {
        expect(toneForScore(score)).toBe("moss");
      });
      // Verify scores below 7 do NOT return moss
      expect(toneForScore(6.99)).not.toBe("moss");
      expect(toneForScore(0)).not.toBe("moss");
    });

    test("neutral (mid) is returned only for 4 <= score < 7", () => {
      const neutralScores = [4, 4.5, 5, 5.5, 6, 6.9];
      neutralScores.forEach((score) => {
        expect(toneForScore(score)).toBe("neutral");
      });
      // Verify boundaries
      expect(toneForScore(3.99)).not.toBe("neutral");
      expect(toneForScore(7.0)).not.toBe("neutral");
    });

    test("muted (low) is returned only for scores < 4", () => {
      const mutedScores = [0, 1, 2, 3, 3.5, 3.99];
      mutedScores.forEach((score) => {
        expect(toneForScore(score)).toBe("muted");
      });
      // Verify boundary
      expect(toneForScore(4.0)).not.toBe("muted");
    });
  });
});
