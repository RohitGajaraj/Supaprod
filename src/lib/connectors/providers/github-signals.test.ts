import { describe, test, expect } from "bun:test";
import { starMilestone } from "./github-signals";

describe("starMilestone (SW-5: one signal per crossed star milestone)", () => {
  test("below the first rung → null (no signal)", () => {
    expect(starMilestone(0)).toBeNull();
    expect(starMilestone(9)).toBeNull();
  });

  test("returns the highest crossed rung, not the raw count", () => {
    expect(starMilestone(10)).toBe(10);
    expect(starMilestone(24)).toBe(10);
    expect(starMilestone(25)).toBe(25);
    expect(starMilestone(99)).toBe(50);
    expect(starMilestone(100)).toBe(100);
    expect(starMilestone(1500)).toBe(1000);
  });

  test("caps at the top rung for very large repos", () => {
    expect(starMilestone(999_999)).toBe(100000);
  });

  test("stability: the same count always maps to the same external_id key", () => {
    // 250-star repo polled twice → same milestone → same external_id → dedup.
    expect(starMilestone(260)).toBe(starMilestone(299));
    expect(starMilestone(260)).toBe(250);
  });
});
