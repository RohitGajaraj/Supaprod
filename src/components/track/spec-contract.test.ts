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

describe("the shape the column actually holds", () => {
  it("reads object clauses, which is every spec in production", () => {
    // MEASURED 2026-09-04: 16 of 16 specs carrying a contract store
    // success_metrics as an array of objects; none store strings. The reader
    // kept only strings, so `measures` was empty on every spec that exists and
    // the run screen rendered none of them, silently.
    const c = specContract({
      intent: "Remove the redundant address re-confirmation step.",
      success_metrics: [
        {
          id: "5c92f3bd-f182-45de-9211-9f4e794f1f87",
          text: "Increase in tablet checkout completion rate from 67 percent.",
          status: "standing",
          oracle_kind: "eval",
          oracle_ref: "a653a20b-7c05-4eb6-9cc9-7e0ed807467e",
        },
        {
          id: "775f05de-8ee3-42d2-ad13-7c8db40037dc",
          text: "Reduction in abandonment rate on the 'Shipping Address' screen.",
          status: "standing",
          oracle_kind: "eval",
          oracle_ref: "6dbb1c54-9a78-406a-b5ab-9ce0ca7abf42",
        },
      ],
    });
    expect(c.measures).toHaveLength(2);
    expect(c.measures[0]).toContain("67 percent");
    expect(c.empty).toBe(false);
  });

  it("still reads the string shape, so a reader is never narrower than the data", () => {
    const c = specContract({ success_metrics: ["Completion rate rises.", "  "] });
    expect(c.measures).toEqual(["Completion rate rises."]);
  });

  it("leaves a superseded clause out, because it no longer promises anything", () => {
    const c = specContract({
      success_metrics: [
        { text: "The standing one.", status: "standing" },
        { text: "The withdrawn one.", status: "superseded" },
      ],
    });
    expect(c.measures).toEqual(["The standing one."]);
  });

  it("drops a clause whose text is not text rather than rendering an object", () => {
    const c = specContract({
      success_metrics: [{ text: { nested: true }, status: "standing" }, { status: "standing" }],
    });
    expect(c.measures).toEqual([]);
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
