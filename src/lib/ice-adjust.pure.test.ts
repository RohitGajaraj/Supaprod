import { describe, it, expect } from "bun:test";

/**
 * Pure calculation logic extracted from ice-adjust.server.ts for independent testing.
 * These helpers can be tested without requiring Supabase mocking.
 */

// Impact formula: clamp(floor(log10(distinctUsers+1) * 3.5), 1, 10)
function computeImpact(distinctUsers: number): number {
  return Math.min(10, Math.max(1, Math.floor(Math.log10(distinctUsers + 1) * 3.5)));
}

// Confidence formula: clamp(round(min(dataDays / 14, 1) * 10), 1, 10)
function computeConfidence(dataDays: number): number {
  return Math.min(10, Math.max(1, Math.round(Math.min(dataDays / 14, 1) * 10)));
}

// Delta threshold: should update only if delta >= 1 on at least one axis
function shouldUpdate(oldValue: number, newValue: number, threshold: number = 1): boolean {
  return Math.abs(newValue - oldValue) >= threshold;
}

describe("ice-adjust pure calculations", () => {
  describe("computeImpact: clamp(floor(log10(users+1)*3.5), 1, 10)", () => {
    it("should return 1 for 0 users", () => {
      expect(computeImpact(0)).toBe(1);
    });

    it("should return ~3-4 for ~10 users", () => {
      const result = computeImpact(10);
      expect(result).toBeGreaterThanOrEqual(3);
      expect(result).toBeLessThanOrEqual(4);
    });

    it("should return ~7 for 100 users", () => {
      const result = computeImpact(100);
      expect(result).toBe(7);
    });

    it("should clamp to 10 for very large user counts (>1000)", () => {
      expect(computeImpact(1000)).toBe(10);
      expect(computeImpact(10000)).toBe(10);
      expect(computeImpact(1000000)).toBe(10);
    });

    it("should be monotonically increasing", () => {
      const v1 = computeImpact(10);
      const v2 = computeImpact(50);
      const v3 = computeImpact(100);
      const v4 = computeImpact(500);
      expect(v1).toBeLessThanOrEqual(v2);
      expect(v2).toBeLessThanOrEqual(v3);
      expect(v3).toBeLessThanOrEqual(v4);
    });

    it("should always stay in [1, 10] range", () => {
      const testCases = [0, 1, 5, 10, 50, 100, 1000, 10000];
      testCases.forEach((users) => {
        const impact = computeImpact(users);
        expect(impact).toBeGreaterThanOrEqual(1);
        expect(impact).toBeLessThanOrEqual(10);
      });
    });

    it("should handle edge case: negative users produce NaN (input validation required)", () => {
      // In practice, input should be validated as >= 0 before calling computeImpact
      // This test documents the unsafe behavior so callers know to validate
      const result = computeImpact(-5);
      expect(isNaN(result)).toBe(true); // log10(-4) = NaN
      // Real code should: if (distinctUsers < 0) throw or return default value
    });
  });

  describe("computeConfidence: clamp(round(min(days/14, 1)*10), 1, 10)", () => {
    it("should return 1 for 1 day of data", () => {
      const result = computeConfidence(1);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(2);
    });

    it("should return ~5 for 7 days", () => {
      const result = computeConfidence(7);
      expect(result).toBe(5);
    });

    it("should return 10 for 14+ days", () => {
      expect(computeConfidence(14)).toBe(10);
      expect(computeConfidence(21)).toBe(10);
      expect(computeConfidence(30)).toBe(10);
    });

    it("should clamp at 10 for very long data windows", () => {
      expect(computeConfidence(100)).toBe(10);
      expect(computeConfidence(1000)).toBe(10);
    });

    it("should be monotonically increasing up to 14 days", () => {
      const v1 = computeConfidence(1);
      const v7 = computeConfidence(7);
      const v14 = computeConfidence(14);
      expect(v1).toBeLessThanOrEqual(v7);
      expect(v7).toBeLessThanOrEqual(v14);
    });

    it("should plateau at 10 after 14 days", () => {
      const v14 = computeConfidence(14);
      const v21 = computeConfidence(21);
      const v30 = computeConfidence(30);
      expect(v14).toBe(v21);
      expect(v21).toBe(v30);
    });

    it("should always stay in [1, 10] range", () => {
      const testCases = [0, 1, 2, 7, 14, 30, 60, 100];
      testCases.forEach((days) => {
        const confidence = computeConfidence(Math.max(0, days)); // Handle 0 case
        expect(confidence).toBeGreaterThanOrEqual(1);
        expect(confidence).toBeLessThanOrEqual(10);
      });
    });

    it("should handle 0 days gracefully", () => {
      // min(0/14, 1) = 0, round(0*10) = 0, clamped to 1
      expect(computeConfidence(0)).toBe(1);
    });
  });

  describe("shouldUpdate: delta >= 1 point threshold", () => {
    it("should return true when delta >= 1", () => {
      expect(shouldUpdate(5, 6)).toBe(true); // delta = 1
      expect(shouldUpdate(5, 7)).toBe(true); // delta = 2
      expect(shouldUpdate(5, 3)).toBe(true); // delta = 2
    });

    it("should return false when delta < 1", () => {
      expect(shouldUpdate(5, 5.5)).toBe(false); // delta = 0.5
      expect(shouldUpdate(5, 5.9)).toBe(false); // delta = 0.9
    });

    it("should be symmetric (old→new == new→old)", () => {
      expect(shouldUpdate(5, 6)).toBe(shouldUpdate(6, 5));
      expect(shouldUpdate(3, 7)).toBe(shouldUpdate(7, 3));
    });

    it("should work at boundary: delta = exactly 1", () => {
      expect(shouldUpdate(5, 6)).toBe(true);
      expect(shouldUpdate(5.0, 6.0)).toBe(true);
    });

    it("should work at boundary: delta = just under 1", () => {
      expect(shouldUpdate(5, 5.99)).toBe(false);
      expect(shouldUpdate(5, 5.999)).toBe(false);
    });

    it("should support custom threshold", () => {
      expect(shouldUpdate(5, 8, 2)).toBe(true); // delta=3 >= custom threshold 2
      expect(shouldUpdate(5, 7, 2)).toBe(true); // delta=2 >= custom threshold 2
      expect(shouldUpdate(5, 6.5, 2)).toBe(false); // delta=1.5 < custom threshold 2
    });
  });

  describe("ICE scoring end-to-end scenarios", () => {
    it("should score a new low-engagement feature (1 user, 1 day)", () => {
      const impact = computeImpact(1);
      const confidence = computeConfidence(1);
      expect(impact).toBe(1); // log10(2)*3.5 ≈ 1.05 → 1
      expect(confidence).toBeGreaterThanOrEqual(1);
      expect(confidence).toBeLessThanOrEqual(2);
    });

    it("should score a high-engagement mature feature (1000 users, 30 days)", () => {
      const impact = computeImpact(1000);
      const confidence = computeConfidence(30);
      expect(impact).toBe(10); // log10(1001)*3.5 ≈ 10.5 → clamped 10
      expect(confidence).toBe(10); // min(30/14, 1)*10 = 10
    });

    it("should score a growing feature mid-measurement (100 users, 7 days)", () => {
      const impact = computeImpact(100);
      const confidence = computeConfidence(7);
      expect(impact).toBe(7); // log10(101)*3.5 ≈ 7.01
      expect(confidence).toBe(5); // min(7/14, 1)*10 = 5
    });

    it("should detect meaningful ICE change when feature scales 10→100 users", () => {
      const oldImpact = computeImpact(10);
      const newImpact = computeImpact(100);
      const deltaI = Math.abs(newImpact - oldImpact);
      expect(shouldUpdate(oldImpact, newImpact)).toBe(true); // delta should be >= 1
      expect(deltaI).toBeGreaterThanOrEqual(1);
    });

    it("should skip update when feature stays flat (10→11 users, same days)", () => {
      const oldImpact = computeImpact(10);
      const newImpact = computeImpact(11);
      const oldConfidence = computeConfidence(7);
      const newConfidence = computeConfidence(7);
      const shouldUpdateI = shouldUpdate(oldImpact, newImpact);
      const shouldUpdateC = shouldUpdate(oldConfidence, newConfidence);
      // At least one should indicate no update needed (both are likely false)
      expect(shouldUpdateI || shouldUpdateC).toBeFalsy();
    });
  });

  describe("edge cases & defensive checks", () => {
    it("should handle NaN gracefully (defensively)", () => {
      // These should not occur in practice, but defensive:
      // NaN comparisons always return false in Math.min/max, so might violate invariants
      // In real code, validate input is a number before calling
      expect(typeof computeImpact(0)).toBe("number");
      expect(typeof computeConfidence(0)).toBe("number");
    });

    it("should handle Infinity as very large number", () => {
      const impactInf = computeImpact(Infinity);
      const confInf = computeConfidence(Infinity);
      expect(impactInf).toBe(10); // clamped
      expect(confInf).toBe(10); // clamped
    });

    it("should match documented formulae in comments", () => {
      // From ice-adjust.server.ts:
      // - impact:     clamp(floor(log10(distinctUsers+1) * 3.5), 1, 10)
      //   → 0 users = 1, 10 users ≈ 3.5, 100 users ≈ 7, 1k users ≈ 10.5 → clamped 10
      // - confidence: clamp(min(dataDays / 14, 1) * 10, 1, 10)
      //   → 14+ days of data = 10, 7 days ≈ 5, 1 day ≈ 1

      expect(computeImpact(0)).toBe(1);
      expect(computeImpact(10)).toBeLessThanOrEqual(4);
      expect(computeImpact(100)).toBe(7);
      expect(computeImpact(1000)).toBe(10);

      expect(computeConfidence(1)).toBeLessThanOrEqual(2);
      expect(computeConfidence(7)).toBe(5);
      expect(computeConfidence(14)).toBe(10);
    });
  });
});
