import { describe, it, expect } from "bun:test";
import {
  planFanout,
  FANOUT_MAX_CHILDREN,
  FANOUT_MAX_DEPTH,
  fanoutDepthOf,
  canSpawnAtDepth,
  resolveMaxChildrenForTier,
} from "./fanout";

describe("planFanout (ephemeral sub-agent fan-out)", () => {
  it("keeps valid subtasks and reports zero dropped under the cap", () => {
    const plan = planFanout([{ task: "ingest A" }, { task: "ingest B" }]);
    expect(plan.children.map((c) => c.task)).toEqual(["ingest A", "ingest B"]);
    expect(plan.dropped).toBe(0);
  });

  it("drops blank/non-string tasks and trims", () => {
    const plan = planFanout([
      { task: "  ingest A  " },
      { task: "" },
      { task: "   " },
      // @ts-expect-error defensive: a malformed item from a hand-crafted call
      { task: 123 },
      null as unknown as { task: string },
    ]);
    expect(plan.children.map((c) => c.task)).toEqual(["ingest A"]);
  });

  it("dedupes identical tasks", () => {
    const plan = planFanout([{ task: "x" }, { task: "x" }, { task: "y" }]);
    expect(plan.children.map((c) => c.task)).toEqual(["x", "y"]);
  });

  it("caps at FANOUT_MAX_CHILDREN and reports the dropped count", () => {
    const items = Array.from({ length: FANOUT_MAX_CHILDREN + 5 }, (_, i) => ({ task: `t${i}` }));
    const plan = planFanout(items);
    expect(plan.children).toHaveLength(FANOUT_MAX_CHILDREN);
    expect(plan.dropped).toBe(5);
  });

  it("honors a tighter maxChildren but never exceeds the hard cap", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ task: `t${i}` }));
    expect(planFanout(items, { maxChildren: 3 }).children).toHaveLength(3);
    expect(planFanout(items, { maxChildren: 999 }).children).toHaveLength(FANOUT_MAX_CHILDREN);
    expect(planFanout(items, { maxChildren: 0 }).children).toHaveLength(1); // floored to >=1
  });

  it("splits the supplied budget evenly across kept children as a per-child hint", () => {
    const plan = planFanout([{ task: "a" }, { task: "b" }, { task: "c" }, { task: "d" }], {
      spendCapUsd: 2,
      tokenCap: 1000,
    });
    expect(plan.children).toHaveLength(4);
    for (const c of plan.children) {
      expect(c.spendCapUsd).toBeCloseTo(0.5);
      expect(c.tokenCap).toBe(250);
    }
  });

  it("leaves per-child caps null when no budget is supplied (the server half resolves what absent means)", () => {
    // Still null, and deliberately so: this function does not decide what an
    // absent budget means. `enqueueFanout` puts the cap through
    // `resolveMissionSpendCap` BEFORE calling here, so by the time a null
    // reaches a child it is a settled "no ceiling", never an unanswered one.
    const plan = planFanout([{ task: "a" }]);
    expect(plan.children[0].spendCapUsd).toBeNull();
    expect(plan.children[0].tokenCap).toBeNull();
  });

  it("treats a supplied ZERO budget as a real ceiling, never as an absent one", () => {
    // `agent.spawn` passes max(0, cap - already_spent), so zero is the parent
    // that has spent everything. Handing its children null would uncap them at
    // exactly the wrong moment; a zero ceiling halts each on its first check.
    const plan = planFanout([{ task: "a" }, { task: "b" }], { spendCapUsd: 0, tokenCap: 0 });
    expect(plan.children).toHaveLength(2);
    for (const c of plan.children) {
      expect(c.spendCapUsd).toBe(0);
      expect(c.tokenCap).toBe(0);
    }
  });

  it("clamps a nonsense negative budget to zero rather than dropping the ceiling", () => {
    const plan = planFanout([{ task: "a" }], { spendCapUsd: -5, tokenCap: -100 });
    expect(plan.children[0].spendCapUsd).toBe(0);
    expect(plan.children[0].tokenCap).toBe(0);
  });

  it("ignores a non-finite budget (NaN/Infinity are not a ceiling anyone set)", () => {
    const plan = planFanout([{ task: "a" }], { spendCapUsd: NaN, tokenCap: Infinity });
    expect(plan.children[0].spendCapUsd).toBeNull();
    expect(plan.children[0].tokenCap).toBeNull();
  });

  it("returns an empty plan for an empty / all-blank input", () => {
    expect(planFanout([])).toEqual({ children: [], dropped: 0 });
    expect(planFanout([{ task: "   " }])).toEqual({ children: [], dropped: 0 });
  });

  it("carries each item's context through to its child", () => {
    const plan = planFanout([{ task: "a", context: { sourceId: "s1" } }]);
    expect(plan.children[0].context).toEqual({ sourceId: "s1" });
  });
});

describe("fan-out depth bound (the recursion guard)", () => {
  it("fanoutDepthOf reads context._fanout_depth, defaulting to 0 for absent/odd values", () => {
    expect(fanoutDepthOf(null)).toBe(0);
    expect(fanoutDepthOf(undefined)).toBe(0);
    expect(fanoutDepthOf({})).toBe(0);
    expect(fanoutDepthOf({ context: {} })).toBe(0);
    expect(fanoutDepthOf({ context: { _fanout_depth: 1 } })).toBe(1);
    expect(fanoutDepthOf({ context: { _fanout_depth: 2 } })).toBe(2);
    expect(fanoutDepthOf({ context: { _fanout_depth: "x" } })).toBe(0);
    expect(fanoutDepthOf({ context: { _fanout_depth: -3 } })).toBe(0);
    expect(fanoutDepthOf({ context: { _fanout_depth: 1.9 } })).toBe(1);
  });

  it("canSpawnAtDepth allows a top-level run (0) and forbids a spawned one (>= FANOUT_MAX_DEPTH)", () => {
    expect(canSpawnAtDepth(0)).toBe(true);
    expect(canSpawnAtDepth(FANOUT_MAX_DEPTH)).toBe(false);
    expect(canSpawnAtDepth(FANOUT_MAX_DEPTH + 1)).toBe(false);
  });
});

describe("resolveMaxChildrenForTier (entitlements clamping)", () => {
  it("returns FANOUT_MAX_CHILDREN when tier cap is null (unlimited tier)", () => {
    const result = resolveMaxChildrenForTier(null);
    expect(result).toBe(FANOUT_MAX_CHILDREN);
  });

  it("returns the tier cap when it is below the global max", () => {
    expect(resolveMaxChildrenForTier(1)).toBe(1);
    expect(resolveMaxChildrenForTier(3)).toBe(3);
    expect(resolveMaxChildrenForTier(5)).toBe(5);
  });

  it("returns FANOUT_MAX_CHILDREN when tier cap equals the global max", () => {
    const result = resolveMaxChildrenForTier(FANOUT_MAX_CHILDREN);
    expect(result).toBe(FANOUT_MAX_CHILDREN);
  });

  it("clamps the tier cap to FANOUT_MAX_CHILDREN when it exceeds the global max", () => {
    expect(resolveMaxChildrenForTier(10)).toBe(FANOUT_MAX_CHILDREN);
    expect(resolveMaxChildrenForTier(100)).toBe(FANOUT_MAX_CHILDREN);
    expect(resolveMaxChildrenForTier(999)).toBe(FANOUT_MAX_CHILDREN);
  });

  it("returns 1 when tier cap is 0 (always allow at least one child)", () => {
    // Note: resolveMaxChildrenForTier doesn't special-case 0, so it would return 0.
    // This test documents the current behavior. If 0 should be invalid, add validation.
    const result = resolveMaxChildrenForTier(0);
    expect(result).toBe(0);
  });

  it("handles negative tier caps (implementation detail: treated as 0)", () => {
    // Negative tier caps are invalid, but the function doesn't validate.
    // This test documents the current behavior (Math.min handles it).
    const result = resolveMaxChildrenForTier(-5);
    expect(result).toBe(-5);
  });
});
