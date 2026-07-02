import { describe, it, expect } from "bun:test";
import { renderHouseRulesBlock, filterActiveRules, type HouseRule } from "./house-rules.functions";

function rule(id: string, overrides: Partial<HouseRule> = {}): HouseRule {
  return {
    id,
    workspace_id: "ws-1",
    rule_text: `Rule ${id}`,
    rationale: null,
    status: "approved",
    source_learning_ids: [],
    decided_by: null,
    decided_at: null,
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("renderHouseRulesBlock", () => {
  it("returns '' for an empty list (never injects noise)", () => {
    expect(renderHouseRulesBlock([])).toBe("");
  });

  it("renders every rule as a bullet inside a labeled block", () => {
    const block = renderHouseRulesBlock([
      rule("a", { rule_text: "Ship checkout bets in under a week." }),
      rule("b", { rule_text: "Positioning needs two weeks of signal." }),
    ]);
    expect(block).toContain("Workspace House Rules");
    expect(block).toContain("- Ship checkout bets in under a week.");
    expect(block).toContain("- Positioning needs two weeks of signal.");
  });
});

describe("filterActiveRules", () => {
  it("returns all approved rules when there are no supersede edges", () => {
    const rules = [rule("a"), rule("b")];
    expect(filterActiveRules(rules, [])).toEqual(rules);
  });

  it("retires a rule superseded by an APPROVED replacement", () => {
    const oldRule = rule("old");
    const newRule = rule("new");
    const active = filterActiveRules([oldRule, newRule], [{ parent_id: "new", child_id: "old" }]);
    expect(active.map((r) => r.id)).toEqual(["new"]);
  });

  it("does NOT retire a rule whose replacement is still pending (not in the approved set)", () => {
    const oldRule = rule("old");
    // "new" is pending, so it is never in the approved-rules array passed in.
    const active = filterActiveRules([oldRule], [{ parent_id: "new", child_id: "old" }]);
    expect(active.map((r) => r.id)).toEqual(["old"]);
  });

  it("ignores edges that reference rules outside the approved set entirely", () => {
    const rules = [rule("a"), rule("b")];
    const active = filterActiveRules(rules, [{ parent_id: "x", child_id: "y" }]);
    expect(active).toEqual(rules);
  });
});
