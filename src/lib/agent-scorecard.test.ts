import { describe, expect, test } from "bun:test";
import {
  acceptanceRate,
  computeAgentScorecard,
  outcomeHitRate,
  REVERT_TOOL,
  type ScorecardApprovalRow,
} from "@/lib/agent-scorecard";
import type { DecidedLearningRow } from "@/lib/agent-track-record";

const A = (agent_slug: string, tool_name: string, status: string): ScorecardApprovalRow => ({
  agent_slug,
  tool_name,
  status,
});

describe("computeAgentScorecard", () => {
  test("separates revert rows from the approve tally and counts them", () => {
    const rows: ScorecardApprovalRow[] = [
      A("build", "studio.write_file", "approved"),
      A("build", "studio.write_file", "approved"),
      A("build", "studio.write_file", "rejected"),
      A("build", REVERT_TOOL, "rejected"), // a rewind: a revert, NOT a gate rejection
      A("build", REVERT_TOOL, "rejected"),
    ];
    const [card] = computeAgentScorecard(rows, []);
    expect(card.slug).toBe("build");
    // approve rate is over the 3 non-revert gate decisions only (2 approved / 3), reverts excluded
    expect(card.approve).toEqual({ approved: 2, total: 3 });
    expect(card.reverts).toBe(2);
    // the revert tool never appears as a task type
    expect(card.byTool.map((t) => t.tool_name)).toEqual(["studio.write_file"]);
  });

  test("buckets per task type and drops sub-threshold tools", () => {
    const rows: ScorecardApprovalRow[] = [
      A("critic", "critic.review", "approved"),
      A("critic", "critic.review", "approved"),
      A("critic", "critic.score", "approved"), // only 1 decided -> below MIN_TOOL_SAMPLES, dropped
    ];
    const [card] = computeAgentScorecard(rows, []);
    expect(card.byTool).toHaveLength(1);
    expect(card.byTool[0]).toEqual({ tool_name: "critic.review", approved: 2, total: 2 });
  });

  test("orders tools most-active first", () => {
    const rows: ScorecardApprovalRow[] = [
      A("x", "b_tool", "approved"),
      A("x", "b_tool", "rejected"),
      A("x", "a_tool", "approved"),
      A("x", "a_tool", "approved"),
      A("x", "a_tool", "rejected"),
    ];
    const [card] = computeAgentScorecard(rows, []);
    expect(card.byTool.map((t) => t.tool_name)).toEqual(["a_tool", "b_tool"]); // 3 before 2
  });

  test("joins outcomes and ignores pending/mixed rows", () => {
    const approvals: ScorecardApprovalRow[] = [
      A("planner", "prd.draft", "approved"),
      A("planner", "prd.draft", "pending"), // undecided, dropped from the tally
    ];
    const learnings: DecidedLearningRow[] = [
      { agent_slug: "planner", verdict: "validated" },
      { agent_slug: "planner", verdict: "missed" },
      { agent_slug: "planner", verdict: "mixed" }, // no clean signal, dropped
    ];
    const [card] = computeAgentScorecard(approvals, learnings);
    expect(card.approve).toEqual({ approved: 1, total: 1 });
    expect(card.outcome).toEqual({ validated: 1, total: 2 });
  });

  test("includes an agent that only has outcomes or only reverts", () => {
    const cards = computeAgentScorecard(
      [A("reverter", REVERT_TOOL, "rejected"), A("reverter", REVERT_TOOL, "rejected")],
      [{ agent_slug: "measurer", verdict: "validated" }],
    );
    const bySlug = Object.fromEntries(cards.map((c) => [c.slug, c]));
    expect(bySlug["reverter"].reverts).toBe(2);
    expect(bySlug["reverter"].approve.total).toBe(0);
    expect(bySlug["measurer"].outcome).toEqual({ validated: 1, total: 1 });
  });

  test("sorts most-active agents first", () => {
    const rows: ScorecardApprovalRow[] = [
      A("quiet", "t", "approved"),
      A("busy", "t", "approved"),
      A("busy", "t", "approved"),
      A("busy", "t", "rejected"),
    ];
    const cards = computeAgentScorecard(rows, []);
    expect(cards[0].slug).toBe("busy");
  });

  test("empty / null inputs yield no cards, never throw", () => {
    expect(computeAgentScorecard([], [])).toEqual([]);
    expect(computeAgentScorecard(null, null)).toEqual([]);
  });
});

describe("rate helpers", () => {
  test("acceptanceRate", () => {
    expect(acceptanceRate({ approved: 3, total: 4 })).toBe(0.75);
    expect(acceptanceRate({ approved: 0, total: 0 })).toBeNull();
    expect(acceptanceRate(null)).toBeNull();
  });

  test("outcomeHitRate", () => {
    expect(outcomeHitRate({ validated: 1, total: 2 })).toBe(0.5);
    expect(outcomeHitRate({ validated: 0, total: 0 })).toBeNull();
  });
});
