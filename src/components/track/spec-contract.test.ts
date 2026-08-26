import { describe, expect, it } from "bun:test";

import { NO_CONTRACT, NO_NON_GOALS, specContract } from "./spec-contract";

describe("what a spec promises", () => {
  it("reads the three clauses a person needs", () => {
    const c = specContract({
      intent: "Let returning customers reuse a saved address.",
      success_metrics: ["Checkout abandonment below 22%"],
      non_goals: ["No changes to guest checkout"],
    });
    expect(c.intent).toContain("saved address");
    expect(c.measures).toEqual(["Checkout abandonment below 22%"]);
    expect(c.nonGoals).toEqual(["No changes to guest checkout"]);
    expect(c.empty).toBe(false);
  });

  it("calls an empty contract empty, which is 113 of the 115 specs on production", () => {
    expect(specContract({}).empty).toBe(true);
    expect(specContract(null).empty).toBe(true);
    expect(specContract(undefined).empty).toBe(true);
  });

  it("does not coerce a shape it did not expect", () => {
    /*
     * `contract` is jsonb, so anything can be in it. A clause that is not a
     * string must come out ABSENT rather than as a rendered [object Object],
     * which is the failure this repo calls a fiction on the record.
     */
    const c = specContract({
      intent: { nested: true },
      success_metrics: "not a list",
      non_goals: [1, 2, { a: 3 }, "  ", "a real one"],
    });
    expect(c.intent).toBeNull();
    expect(c.measures).toEqual([]);
    expect(c.nonGoals).toEqual(["a real one"]);
  });

  it("distinguishes bounded from half-bounded", () => {
    // The commonest half-state: something was written, but no edges were drawn.
    const half = specContract({ intent: "Ship the thing.", non_goals: [] });
    expect(half.empty).toBe(false);
    expect(half.nonGoals).toEqual([]);
  });

  it("names what is missing without calling it bad", () => {
    for (const line of [NO_CONTRACT, NO_NON_GOALS]) {
      expect(line).not.toMatch(/[—–]/);
      expect(line.toLowerCase()).not.toContain("should");
      expect(line.toLowerCase()).not.toContain("failed");
    }
  });
});
