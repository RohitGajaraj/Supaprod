import { describe, it, expect } from "bun:test";
import { usageRemainingFraction } from "./UsageIndicator";

describe("usageRemainingFraction (PR-A4 quiet usage indicator)", () => {
  it("is 0 at zero usage, 1 at full usage", () => {
    expect(usageRemainingFraction(0, 300)).toBe(0);
    expect(usageRemainingFraction(300, 300)).toBe(1);
  });

  it("clamps overuse to 1 (never renders a negative bar)", () => {
    expect(usageRemainingFraction(500, 300)).toBe(1);
  });

  it("clamps a negative used to 0", () => {
    expect(usageRemainingFraction(-10, 300)).toBe(0);
  });

  it("is 1 (full/no-render-signal) for a non-positive allowance", () => {
    expect(usageRemainingFraction(50, 0)).toBe(1);
    expect(usageRemainingFraction(50, -5)).toBe(1);
  });

  it("is proportional for a mid-range value", () => {
    expect(usageRemainingFraction(120, 300)).toBeCloseTo(0.4, 5);
  });
});
