import { describe, expect, it } from "bun:test";

import {
  NO_CONTRACT,
  NO_NON_GOALS,
  contractInBody,
  noContractLine,
  specContract,
} from "./spec-contract";

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

describe("the empty contract does not claim the spec is silent", () => {
  /* The three shapes actually in the database, in their measured proportions. */
  const withMetrics = "## Problem\nSlow checkout.\n\n## Success Metrics\n- p95 under 400ms\n";
  const withNonGoals = "## Problem\nSlow checkout.\n\n**Non-Goals**\n- No redesign of the cart\n";
  const withBoth = `${withMetrics}\n## Non-Goals\n- Nothing about billing\n`;
  const withNeither = "## Problem\nSlow checkout, and we should look at it.\n";

  it("keeps the strong sentence when the body really does say neither", () => {
    expect(noContractLine(withNeither)).toBe(NO_CONTRACT);
    expect(noContractLine("")).toBe(NO_CONTRACT);
    expect(noContractLine(null)).toBe(NO_CONTRACT);
  });

  it("stops saying nothing is on the record when the body sets it out", () => {
    for (const body of [withMetrics, withNonGoals, withBoth]) {
      expect(noContractLine(body)).not.toBe(NO_CONTRACT);
      expect(noContractLine(body)).not.toContain("nothing on the record");
    }
  });

  it("names only what is actually below it", () => {
    expect(noContractLine(withMetrics)).toContain("how anyone would know it worked");
    expect(noContractLine(withMetrics)).not.toContain("leaves out");

    expect(noContractLine(withNonGoals)).toContain("leaves out");
    expect(noContractLine(withNonGoals)).not.toContain("how anyone would know");

    expect(noContractLine(withBoth)).toContain("how anyone would know it worked");
    expect(noContractLine(withBoth)).toContain("leaves out");
  });

  it("still says the contract itself is empty, because Build reads that", () => {
    expect(noContractLine(withBoth)).toContain("No outcome contract is filled in");
    expect(noContractLine(withBoth)).toContain("Build");
  });

  it("wants a heading, not a passing mention", () => {
    /*
     * Two of the 96 matches were a sentence using the words rather than a
     * section setting them out. Pointing a reader down the page to a section
     * that is not there would be a new dead end, so those keep the strong line.
     */
    const mention = "We talked about success metrics and non-goals but wrote none down.\n";
    expect(contractInBody(mention)).toEqual({ metrics: false, nonGoals: false });
    expect(noContractLine(mention)).toBe(NO_CONTRACT);
  });

  it("reads the markdown shapes the specs are actually written in", () => {
    expect(contractInBody("## Success Metrics\n- x").metrics).toBe(true);
    expect(contractInBody("### Acceptance Criteria\n- x").metrics).toBe(true);
    expect(contractInBody("**Success Metric**\n- x").metrics).toBe(true);
    expect(contractInBody("Non-goals:\n- x").nonGoals).toBe(true);
    expect(contractInBody("# NON GOALS\n- x").nonGoals).toBe(true);
    expect(contractInBody("- Non-Goals\n").nonGoals).toBe(true);
  });
});
