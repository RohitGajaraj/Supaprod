import { describe, it, expect } from "bun:test";
import {
  renderHouseRulesBlock,
  filterActiveRules,
  filterRulesForAgent,
  selectDistillTargets,
  type HouseRule,
  type HouseRuleProvenance,
  type SelectDistillTargetsInput,
} from "./house-rules.functions";

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
    agent_slug: null,
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

describe("filterRulesForAgent", () => {
  it("returns every rule unchanged when no agentSlug is passed (unscoped callers)", () => {
    const rules = [rule("a"), rule("b", { agent_slug: "engineer" })];
    expect(filterRulesForAgent(rules, undefined)).toEqual(rules);
    expect(filterRulesForAgent(rules, null)).toEqual(rules);
  });

  it("keeps workspace-wide rules (agent_slug null) for every agent", () => {
    const rules = [rule("a", { agent_slug: null })];
    expect(filterRulesForAgent(rules, "engineer").map((r) => r.id)).toEqual(["a"]);
  });

  it("keeps a rule scoped to the requested agent", () => {
    const rules = [rule("a", { agent_slug: "engineer" })];
    expect(filterRulesForAgent(rules, "engineer").map((r) => r.id)).toEqual(["a"]);
  });

  it("excludes a rule scoped to a DIFFERENT agent (no leak)", () => {
    const rules = [rule("a", { agent_slug: "release" })];
    expect(filterRulesForAgent(rules, "engineer")).toEqual([]);
  });

  it("mixes workspace-wide and per-agent rules correctly", () => {
    const rules = [
      rule("global", { agent_slug: null }),
      rule("mine", { agent_slug: "engineer" }),
      rule("theirs", { agent_slug: "release" }),
    ];
    expect(filterRulesForAgent(rules, "engineer").map((r) => r.id)).toEqual(["global", "mine"]);
  });
});

describe("selectDistillTargets (RF-04 weekly steward pass)", () => {
  const WEEK_START = "2026-08-03T00:00:00.000Z";

  function learningsFor(wsId: string, n: number, prefix = "l") {
    return Array.from({ length: n }, (_, i) => ({
      id: `${prefix}-${wsId}-${i}`,
      workspace_id: wsId,
    }));
  }

  function provenance(over: Partial<HouseRuleProvenance> = {}): HouseRuleProvenance {
    return {
      workspace_id: "ws-1",
      status: "pending",
      source_learning_ids: [],
      source_run_ids: [],
      created_at: "2026-07-01T00:00:00.000Z",
      ...over,
    };
  }

  function input(over: Partial<SelectDistillTargetsInput> = {}): SelectDistillTargetsInput {
    return {
      workspaces: [{ id: "ws-1", owner_id: "owner-1" }],
      existingRules: [],
      learnings: learningsFor("ws-1", 3),
      weekStartIso: WEEK_START,
      minLearnings: 3,
      maxLearningsPerWorkspace: 40,
      maxWorkspaces: 5,
      ...over,
    };
  }

  it("selects a workspace that has enough undistilled learnings", () => {
    const targets = selectDistillTargets(input());
    expect(targets).toHaveLength(1);
    expect(targets[0].workspaceId).toBe("ws-1");
    expect(targets[0].ownerId).toBe("owner-1");
    expect(targets[0].learningIds).toHaveLength(3);
  });

  it("THE REGRESSION: an empty workspace never consumes a slot that a workspace with learnings needs", () => {
    // Production shape on 2026-08-05: the five oldest workspaces held zero
    // learnings all-time and the pass took exactly those five, so it could
    // never see the workspaces that had material. Age must not be a criterion.
    const empties = ["old-1", "old-2", "old-3", "old-4", "old-5"];
    const targets = selectDistillTargets(
      input({
        workspaces: [
          ...empties.map((id) => ({ id, owner_id: "owner-old" })),
          { id: "young", owner_id: "owner-young" },
        ],
        learnings: learningsFor("young", 4),
        maxWorkspaces: 5,
      }),
    );
    expect(targets.map((t) => t.workspaceId)).toEqual(["young"]);
  });

  it("skips a workspace under the minimum rather than drafting from a thin pool", () => {
    expect(selectDistillTargets(input({ learnings: learningsFor("ws-1", 2) }))).toEqual([]);
  });

  it("excludes learnings already cited by a non-rejected rule", () => {
    const learnings = learningsFor("ws-1", 4);
    const targets = selectDistillTargets(
      input({
        learnings,
        existingRules: [provenance({ source_learning_ids: [learnings[0].id, learnings[1].id] })],
      }),
    );
    // Two of four are spent, leaving two, which is under the minimum of three.
    expect(targets).toEqual([]);
  });

  it("releases the learnings behind a REJECTED draft so a pattern is never buried forever", () => {
    const learnings = learningsFor("ws-1", 3);
    const targets = selectDistillTargets(
      input({
        learnings,
        existingRules: [
          provenance({ status: "rejected", source_learning_ids: learnings.map((l) => l.id) }),
        ],
      }),
    );
    expect(targets[0]?.learningIds).toHaveLength(3);
  });

  it("skips a workspace this pass already drafted for this ISO week (cron double-fire is a no-op)", () => {
    const targets = selectDistillTargets(
      input({
        existingRules: [provenance({ created_at: "2026-08-04T10:00:00.000Z", source_run_ids: [] })],
      }),
    );
    expect(targets).toEqual([]);
  });

  it("is NOT suppressed by the nightly retro's drafts, which carry source_run_ids", () => {
    const targets = selectDistillTargets(
      input({
        existingRules: [
          provenance({
            created_at: "2026-08-04T10:00:00.000Z",
            source_run_ids: ["run-a", "run-b"],
          }),
        ],
      }),
    );
    expect(targets.map((t) => t.workspaceId)).toEqual(["ws-1"]);
  });

  it("ranks by how much undistilled material a workspace holds, then caps at maxWorkspaces", () => {
    const targets = selectDistillTargets(
      input({
        workspaces: [
          { id: "small", owner_id: "o" },
          { id: "big", owner_id: "o" },
          { id: "mid", owner_id: "o" },
        ],
        learnings: [
          ...learningsFor("small", 3),
          ...learningsFor("big", 9),
          ...learningsFor("mid", 5),
        ],
        maxWorkspaces: 2,
      }),
    );
    expect(targets.map((t) => t.workspaceId)).toEqual(["big", "mid"]);
  });

  it("caps the per-workspace pool AFTER dedup, so spent learnings cannot hide fresh ones", () => {
    // The newest two are spent. With a cap of 3 applied BEFORE dedup only one
    // fresh learning would survive and the workspace would fall under the
    // minimum; applied after, the three older ones fill the pool.
    const learnings = learningsFor("ws-1", 6);
    const targets = selectDistillTargets(
      input({
        learnings,
        maxLearningsPerWorkspace: 3,
        existingRules: [provenance({ source_learning_ids: [learnings[0].id, learnings[1].id] })],
      }),
    );
    expect(targets[0]?.learningIds).toEqual([learnings[2].id, learnings[3].id, learnings[4].id]);
  });

  it("ignores learnings whose workspace is not in scope, and null-workspace rows", () => {
    const targets = selectDistillTargets(
      input({
        learnings: [
          ...learningsFor("ws-1", 3),
          { id: "orphan-1", workspace_id: null },
          { id: "elsewhere-1", workspace_id: "ws-unknown" },
        ],
      }),
    );
    expect(targets).toHaveLength(1);
    expect(targets[0].learningIds).toHaveLength(3);
  });

  it("returns nothing when there are no workspaces at all", () => {
    expect(selectDistillTargets(input({ workspaces: [], learnings: [] }))).toEqual([]);
  });
});
