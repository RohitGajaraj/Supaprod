import { describe, it, expect } from "bun:test";
import {
  isSupersessionRelation,
  supersededChildIds,
  provenDecisionIds,
  shouldPersistSeal,
  evidenceCounts,
  receiptEdgeRows,
  buildInfoByArtifact,
  summarizeAction,
  assembleReceipts,
  type LineageEdgeLite,
  type LearningLite,
  type ReceiptEdge,
  type ChangesetLite,
  type DeploymentLite,
  type DecisionLite,
  type ApprovalLite,
} from "../trust-ledger.functions";

describe("trust-ledger.functions", () => {
  // ─────────────────────────────────────────────────────────────
  // isSupersessionRelation: string | null → boolean
  // ─────────────────────────────────────────────────────────────
  describe("isSupersessionRelation", () => {
    it("returns true for 'supersedes' (exact match, case-insensitive)", () => {
      expect(isSupersessionRelation("supersedes")).toBe(true);
      expect(isSupersessionRelation("SUPERSEDES")).toBe(true);
      expect(isSupersessionRelation("Supersedes")).toBe(true);
      expect(isSupersessionRelation("  supersedes  ")).toBe(true);
    });

    it("returns true for 'contradicts' (exact match, case-insensitive)", () => {
      expect(isSupersessionRelation("contradicts")).toBe(true);
      expect(isSupersessionRelation("CONTRADICTS")).toBe(true);
      expect(isSupersessionRelation("Contradicts")).toBe(true);
      expect(isSupersessionRelation("  contradicts  ")).toBe(true);
    });

    it("returns false for other relations", () => {
      expect(isSupersessionRelation("derived_from")).toBe(false);
      expect(isSupersessionRelation("validatedBy")).toBe(false);
      expect(isSupersessionRelation("relates_to")).toBe(false);
      expect(isSupersessionRelation("")).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isSupersessionRelation(null)).toBe(false);
      expect(isSupersessionRelation(undefined)).toBe(false);
    });

    it("ignores leading/trailing whitespace", () => {
      expect(isSupersessionRelation("\n  supersedes  \t")).toBe(true);
      expect(isSupersessionRelation("  contradicts\n")).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // supersededChildIds: LineageEdgeLite[] → Map<childId, parentId>
  // ─────────────────────────────────────────────────────────────
  describe("supersededChildIds", () => {
    it("returns map of child->parent for active supersession edges", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "decision",
          child_id: "child-1",
          relation: "supersedes",
          valid_to: null, // ACTIVE
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.get("child-1")).toBe("parent-1");
    });

    it("ignores retired edges (valid_to set)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "decision",
          child_id: "child-1",
          relation: "supersedes",
          valid_to: "2026-07-01T00:00:00.000Z", // RETIRED
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.has("child-1")).toBe(false);
    });

    it("ignores non-supersession relations", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "decision",
          child_id: "child-1",
          relation: "derived_from",
          valid_to: null,
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.size).toBe(0);
    });

    it("handles both 'supersedes' and 'contradicts' relations", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "parent-1",
          child_id: "child-1",
          relation: "supersedes",
          valid_to: null,
        },
        {
          parent_id: "parent-2",
          child_id: "child-2",
          relation: "contradicts",
          valid_to: null,
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.size).toBe(2);
      expect(result.get("child-1")).toBe("parent-1");
      expect(result.get("child-2")).toBe("parent-2");
    });

    it("returns empty map for null/undefined input", () => {
      expect(supersededChildIds(null).size).toBe(0);
      expect(supersededChildIds(undefined).size).toBe(0);
    });

    it("handles null child_id (skipped)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "parent-1",
          child_id: null,
          relation: "supersedes",
          valid_to: null,
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.size).toBe(0);
    });

    it("handles null parent_id (maps to empty string)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: null,
          child_id: "child-1",
          relation: "supersedes",
          valid_to: null,
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.get("child-1")).toBe("");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // provenDecisionIds: (edges, learnings) → Map<decisionId, learningId>
  // ─────────────────────────────────────────────────────────────
  describe("provenDecisionIds", () => {
    it("links decisions to learnings via current edges with decisive verdicts", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "learning",
          parent_id: "learning-1",
          child_kind: "decision",
          child_id: "decision-1",
          relation: "derived_from",
          valid_to: null,
        },
      ];
      const learnings: LearningLite[] = [{ id: "learning-1", verdict: "confirmed" }];
      const result = provenDecisionIds(edges, learnings);
      expect(result.get("decision-1")).toBe("learning-1");
    });

    it("ignores learnings without decisive verdict", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "learning",
          parent_id: "learning-1",
          child_kind: "decision",
          child_id: "decision-1",
          relation: "derived_from",
          valid_to: null,
        },
      ];
      const learnings: LearningLite[] = [{ id: "learning-1", verdict: "uncertain" }];
      const result = provenDecisionIds(edges, learnings);
      expect(result.size).toBe(0);
    });

    it("ignores retired edges (valid_to set)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "learning",
          parent_id: "learning-1",
          child_kind: "decision",
          child_id: "decision-1",
          relation: "derived_from",
          valid_to: "2026-07-01T00:00:00.000Z",
        },
      ];
      const learnings: LearningLite[] = [{ id: "learning-1", verdict: "confirmed" }];
      const result = provenDecisionIds(edges, learnings);
      expect(result.size).toBe(0);
    });

    it("ignores supersession relations (they encode replacement, not proof)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "learning",
          parent_id: "learning-1",
          child_kind: "decision",
          child_id: "decision-1",
          relation: "supersedes",
          valid_to: null,
        },
      ];
      const learnings: LearningLite[] = [{ id: "learning-1", verdict: "confirmed" }];
      const result = provenDecisionIds(edges, learnings);
      expect(result.size).toBe(0);
    });

    it("handles edges in either direction (learning->decision or decision->learning)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "learning",
          parent_id: "learning-1",
          child_kind: "decision",
          child_id: "decision-1",
          relation: "derived_from",
          valid_to: null,
        },
        {
          parent_kind: "decision",
          parent_id: "decision-2",
          child_kind: "learning",
          child_id: "learning-2",
          relation: "cites",
          valid_to: null,
        },
      ];
      const learnings: LearningLite[] = [
        { id: "learning-1", verdict: "validated" },
        { id: "learning-2", verdict: "confirmed" },
      ];
      const result = provenDecisionIds(edges, learnings);
      expect(result.get("decision-1")).toBe("learning-1");
      expect(result.get("decision-2")).toBe("learning-2");
    });

    it("returns empty map for null/undefined inputs", () => {
      expect(provenDecisionIds(null, null).size).toBe(0);
      expect(provenDecisionIds(undefined, []).size).toBe(0);
    });

    it("returns first matching edge per decision (first-win rule)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "learning",
          parent_id: "learning-1",
          child_kind: "decision",
          child_id: "decision-1",
          relation: "derived_from",
          valid_to: null,
        },
        {
          parent_kind: "learning",
          parent_id: "learning-2",
          child_kind: "decision",
          child_id: "decision-1", // same decision
          relation: "validates",
          valid_to: null,
        },
      ];
      const learnings: LearningLite[] = [
        { id: "learning-1", verdict: "validated" },
        { id: "learning-2", verdict: "confirmed" },
      ];
      const result = provenDecisionIds(edges, learnings);
      expect(result.get("decision-1")).toBe("learning-1"); // first one wins
    });
  });

  // ─────────────────────────────────────────────────────────────
  // shouldPersistSeal: (latestHead, head) → boolean
  // ─────────────────────────────────────────────────────────────
  describe("shouldPersistSeal", () => {
    it("returns true when head is new (latestHead !== head)", () => {
      expect(shouldPersistSeal("old-hash", "new-hash")).toBe(true);
    });

    it("returns false when head matches latestHead (no change)", () => {
      expect(shouldPersistSeal("same-hash", "same-hash")).toBe(false);
    });

    it("returns true when latestHead is null (first seal)", () => {
      expect(shouldPersistSeal(null, "new-hash")).toBe(true);
    });

    it("returns false when head is empty string", () => {
      expect(shouldPersistSeal("old-hash", "")).toBe(false);
      expect(shouldPersistSeal(null, "")).toBe(false);
    });

    it("returns true when head is non-empty and differs from latestHead", () => {
      expect(shouldPersistSeal("a", "b")).toBe(true);
      expect(shouldPersistSeal(null, "abc")).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // evidenceCounts: LineageEdgeLite[] → Map<id, count>
  // ─────────────────────────────────────────────────────────────
  describe("evidenceCounts", () => {
    it("counts edges touching each id on either end", () => {
      const edges: LineageEdgeLite[] = [
        { parent_id: "a", child_id: "b", relation: "relates_to" },
        { parent_id: "a", child_id: "c", relation: "relates_to" },
        { parent_id: "b", child_id: "d", relation: "relates_to" },
      ];
      const result = evidenceCounts(edges);
      expect(result.get("a")).toBe(2); // touches edges 1 and 2
      expect(result.get("b")).toBe(2); // touches edges 1 and 3
      expect(result.get("c")).toBe(1); // touches edge 2
      expect(result.get("d")).toBe(1); // touches edge 3
    });

    it("returns empty map for empty edges", () => {
      expect(evidenceCounts([]).size).toBe(0);
    });

    it("returns empty map for null/undefined", () => {
      expect(evidenceCounts(null).size).toBe(0);
      expect(evidenceCounts(undefined).size).toBe(0);
    });

    it("ignores null ids", () => {
      const edges: LineageEdgeLite[] = [
        { parent_id: "a", child_id: null, relation: "relates_to" },
        { parent_id: null, child_id: "b", relation: "relates_to" },
      ];
      const result = evidenceCounts(edges);
      expect(result.get("a")).toBe(1);
      expect(result.get("b")).toBe(1);
      expect(result.has(null)).toBe(false);
    });

    it("counts both parent and child contributions separately", () => {
      const edges: LineageEdgeLite[] = [
        { parent_id: "a", child_id: "a", relation: "self" },
      ];
      const result = evidenceCounts(edges);
      expect(result.get("a")).toBe(2); // counted as both parent and child
    });
  });

  // ─────────────────────────────────────────────────────────────
  // receiptEdgeRows: (edges, selfIds, labels) → ReceiptEdge[]
  // ─────────────────────────────────────────────────────────────
  describe("receiptEdgeRows", () => {
    it("converts lineage edges to displayable receipt edges", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "artifact",
          child_id: "child-1",
          relation: "relates_to",
        },
      ];
      const result = receiptEdgeRows(edges, ["child-1"]);
      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe("decision");
      expect(result[0]?.id).toBe("parent-1");
    });

    it("prefers recordId (selfIds[0]) as the self side", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "record-id",
          child_kind: "artifact",
          child_id: "record-id",
          relation: "relates_to",
        },
      ];
      const result = receiptEdgeRows(edges, ["record-id"]);
      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe("artifact");
      expect(result[0]?.id).toBe("record-id");
      // The "other" side is the child
    });

    it("uses labels when available, else falls back to kind + id", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "mission",
          child_id: "mission-123",
          relation: "from",
        },
      ];
      const labels = new Map([["parent-1", "Decision Title"]]);
      const result = receiptEdgeRows(edges, ["mission-123"], labels);
      expect(result[0]?.label).toBe("Decision Title");

      // Without label, falls back to "kind id-slice"
      const result2 = receiptEdgeRows(edges, ["mission-123"]);
      expect(result2[0]?.label).toMatch(/^decision /);
    });

    it("deduplicates edges by kind|id|relation key", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "mission",
          child_id: "mission-123",
          relation: "from",
        },
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "mission",
          child_id: "mission-123",
          relation: "from",
        },
      ];
      const result = receiptEdgeRows(edges, ["mission-123"]);
      expect(result).toHaveLength(1);
    });

    it("returns empty array for empty selfIds", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "mission",
          child_id: "mission-1",
          relation: "from",
        },
      ];
      expect(receiptEdgeRows(edges, [])).toHaveLength(0);
      expect(receiptEdgeRows(edges, [null])).toHaveLength(0);
    });

    it("filters selfIds to only string ids", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_kind: "decision",
          parent_id: "parent-1",
          child_kind: "mission",
          child_id: "mission-1",
          relation: "from",
        },
      ];
      const result = receiptEdgeRows(edges, ["mission-1", null]);
      expect(result).toHaveLength(1);
    });

    it("returns empty array for null/undefined edges", () => {
      expect(receiptEdgeRows(null, ["self-1"])).toHaveLength(0);
      expect(receiptEdgeRows(undefined, ["self-1"])).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // buildInfoByArtifact: (changesets, deployments) → Map<artifactId, buildInfo>
  // ─────────────────────────────────────────────────────────────
  describe("buildInfoByArtifact", () => {
    it("indexes changesets by mission_id and prd_id", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs-1",
          branch: "feat/1",
          pr_number: 123,
          pr_url: "https://github.com/...",
          status: "merged",
          fix_attempts: null,
          mission_id: "mission-1",
          prd_id: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, []);
      expect(result.get("mission-1")).toBeDefined();
      expect(result.get("mission-1")?.build.branch).toBe("feat/1");
    });

    it("attaches deployments to their changeset", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs-1",
          branch: "main",
          pr_number: null,
          pr_url: null,
          status: "merged",
          fix_attempts: null,
          mission_id: "mission-1",
          prd_id: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const deployments: DeploymentLite[] = [
        {
          changeset_id: "cs-1",
          environment: "production",
          deploy_url: "https://example.com",
          commit_sha: "abc123",
          deployed_at: "2026-07-02T00:00:00.000Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, deployments);
      expect(result.get("mission-1")?.deploys).toHaveLength(1);
      expect(result.get("mission-1")?.deploys[0]?.environment).toBe("production");
    });

    it("sorts changesets newest-first by created_at", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs-1",
          branch: "old",
          pr_number: null,
          pr_url: null,
          status: "merged",
          fix_attempts: null,
          mission_id: "mission-1",
          prd_id: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
        {
          id: "cs-2",
          branch: "new",
          pr_number: null,
          pr_url: null,
          status: "merged",
          fix_attempts: null,
          mission_id: "mission-1",
          prd_id: null,
          created_at: "2026-07-02T00:00:00.000Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, []);
      // cs-2 is newer, so it should be the "latest" for mission-1
      expect(result.get("mission-1")?.build.branch).toBe("new");
    });

    it("returns first changeset per artifact (newest wins for duplicates)", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs-1",
          branch: "feat",
          pr_number: null,
          pr_url: null,
          status: "merged",
          fix_attempts: null,
          mission_id: "mission-1",
          prd_id: "prd-1",
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, []);
      expect(result.get("mission-1")).toBe(result.get("prd-1")); // same info
    });

    it("handles null/undefined changesets and deployments", () => {
      expect(buildInfoByArtifact(null, null).size).toBe(0);
      expect(buildInfoByArtifact([], null).size).toBe(0);
      expect(buildInfoByArtifact(null, []).size).toBe(0);
    });

    it("ignores changesets without mission_id or prd_id", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs-1",
          branch: "feat",
          pr_number: null,
          pr_url: null,
          status: "merged",
          fix_attempts: null,
          mission_id: null,
          prd_id: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, []);
      expect(result.size).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // summarizeAction: (toolName, args) → string
  // ─────────────────────────────────────────────────────────────
  describe("summarizeAction", () => {
    it("formats 'tool_name: title' when args has subject", () => {
      const result = summarizeAction("create_issue", { title: "Bug fix" });
      expect(result).toBe("Create Issue: Bug fix");
    });

    it("falls back to tool name alone if no subject in args", () => {
      const result = summarizeAction("close_issue", { issue_id: "123" });
      expect(result).toBe("Close Issue");
    });

    it("uses 'Autonomous action' when tool_name is null", () => {
      const result = summarizeAction(null, { message: "Some action" });
      expect(result).toBe("Autonomous action: Some action");
    });

    it("picks subject from title/name/summary/query/message/goal in order", () => {
      expect(summarizeAction("tool", { name: "First" })).toContain("First");
      expect(summarizeAction("tool", { summary: "Second" })).toContain("Second");
      expect(summarizeAction("tool", { query: "Third" })).toContain("Third");
      expect(summarizeAction("tool", { message: "Fourth" })).toContain("Fourth");
      expect(summarizeAction("tool", { goal: "Fifth" })).toContain("Fifth");
    });

    it("caps subject length at 140 characters", () => {
      const longText = "a".repeat(200);
      const result = summarizeAction("tool", { title: longText });
      expect(result.length).toBeLessThanOrEqual(150); // 140 + "Tool: " + "…"
      expect(result).toContain("…");
    });

    it("normalizes tool_name: underscores and dots become spaces, title-cased", () => {
      expect(summarizeAction("create.issue", { title: "Test" })).toContain("Create Issue");
      expect(summarizeAction("create_issue", { title: "Test" })).toContain("Create Issue");
      expect(summarizeAction("create_pull_request", { title: "Test" })).toContain("Create Pull Request");
    });

    it("ignores whitespace-only subjects", () => {
      const result = summarizeAction("tool", { title: "   " });
      expect(result).toBe("Tool");
    });

    it("returns 'Autonomous action' when all fields are empty", () => {
      const result = summarizeAction(null, null);
      expect(result).toBe("Autonomous action");
    });

    it("handles empty tool_name gracefully", () => {
      const result = summarizeAction("", { title: "Action" });
      expect(result).toContain("Action");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // assembleReceipts: (input) → TrustReceipt[]
  // ─────────────────────────────────────────────────────────────
  describe("assembleReceipts", () => {
    it("merges decisions and approvals into time-sorted receipt list", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec-1",
          title: "Decision 1",
          rationale: "Because",
          status: "approved",
          source_kind: "mission",
          mission_id: "mission-1",
          prd_id: null,
          meeting_id: null,
          decided_by_agent_slug: "builder",
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const approvals: ApprovalLite[] = [
        {
          id: "app-1",
          agent_slug: "executor",
          tool_name: "deploy",
          args: { target: "prod" },
          rationale: "Go live",
          decision_reason: null,
          status: "approved",
          decided_at: "2026-07-02T00:00:00.000Z",
          decided_by: "user-1",
          created_at: "2026-07-02T00:00:00.000Z",
          mission_id: "mission-1",
        },
      ];
      const result = assembleReceipts({
        decisions,
        approvals,
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.kind).toBe("action"); // newer approval first
      expect(result[1]?.kind).toBe("decision");
    });

    it("marks decision as 'proven' when in proven map and not superseded", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec-1",
          title: "Decision 1",
          rationale: null,
          status: "approved",
          source_kind: null,
          mission_id: null,
          prd_id: null,
          meeting_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
        proven: new Map([["dec-1", "learning-1"]]),
      });
      expect(result[0]?.outcome).toBe("proven");
      expect(result[0]?.provenBy?.id).toBe("learning-1");
    });

    it("marks record as 'superseded' when in superseded map", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec-1",
          title: "Old Decision",
          rationale: null,
          status: "approved",
          source_kind: null,
          mission_id: null,
          prd_id: null,
          meeting_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map([["dec-1", "dec-2"]]),
        evidence: new Map(),
        sourceLabels: new Map(),
      });
      expect(result[0]?.outcome).toBe("superseded");
      expect(result[0]?.supersededBy).toBe("dec-2");
    });

    it("superseded outcome beats proven outcome", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec-1",
          title: "Old Decision",
          rationale: null,
          status: "approved",
          source_kind: null,
          mission_id: null,
          prd_id: null,
          meeting_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map([["dec-1", "dec-2"]]),
        evidence: new Map(),
        sourceLabels: new Map(),
        proven: new Map([["dec-1", "learning-1"]]),
      });
      expect(result[0]?.outcome).toBe("superseded"); // superseded wins
    });

    it("extracts source from mission_id, prd_id, or meeting_id (first-win)", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec-1",
          title: "Decision",
          rationale: null,
          status: "approved",
          source_kind: "prd",
          mission_id: null,
          prd_id: "prd-1",
          meeting_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ];
      const sourceLabels = new Map([["prd-1", "PRD Title"]]);
      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels,
      });
      expect(result[0]?.source.id).toBe("prd-1");
      expect(result[0]?.source.label).toBe("PRD Title");
    });

    it("includes humanDecided flag for approvals", () => {
      const approvals: ApprovalLite[] = [
        {
          id: "app-1",
          agent_slug: "executor",
          tool_name: "deploy",
          args: null,
          rationale: null,
          decision_reason: null,
          status: "approved",
          decided_at: "2026-07-01T00:00:00.000Z",
          decided_by: "user-1",
          created_at: "2026-07-01T00:00:00.000Z",
          mission_id: null,
        },
      ];
      const result = assembleReceipts({
        decisions: [],
        approvals,
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
      });
      expect(result[0]?.humanDecided).toBe(true);
    });

    it("sorts receipts by occurredAt (newest first)", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec-1",
          title: "Old",
          rationale: null,
          status: "approved",
          source_kind: null,
          mission_id: null,
          prd_id: null,
          meeting_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
        {
          id: "dec-2",
          title: "New",
          rationale: null,
          status: "approved",
          source_kind: null,
          mission_id: null,
          prd_id: null,
          meeting_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-02T00:00:00.000Z",
        },
      ];
      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
      });
      expect(result[0]?.title).toBe("New");
      expect(result[1]?.title).toBe("Old");
    });

    it("handles empty decisions and approvals", () => {
      const result = assembleReceipts({
        decisions: [],
        approvals: [],
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
      });
      expect(result).toHaveLength(0);
    });
  });
});
