/**
 * P-141: a decision's own spend is the sum of every run any of ITS tracks
 * ran, not a run-shaped figure -- Outcomes' own unit is the decision.
 */
import { describe, expect, it } from "bun:test";
import { decisionSpendCredits } from "@/lib/decisions.functions";

describe("a decision's own total spend", () => {
  it("sums a fixture decision with two runs across two tracks into one figure", () => {
    // trace-a belongs to track 1's run, trace-b to track 2's -- the caller
    // already resolved both tracks' `spine_track_members` rows before this
    // point, so this function never sees which track a trace came from. It
    // sums regardless, which is the point: the decision is the unit.
    const creditsByTrace = { "trace-a": 40, "trace-b": 12 };
    expect(decisionSpendCredits(creditsByTrace)).toBe(52);
  });

  it("is zero for a decision with no debited traces", () => {
    expect(decisionSpendCredits({})).toBe(0);
  });

  it("sums three or more traces the same way", () => {
    expect(decisionSpendCredits({ a: 1, b: 2, c: 3 })).toBe(6);
  });
});
