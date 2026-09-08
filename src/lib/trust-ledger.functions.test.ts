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
  type DecisionLite,
  type ApprovalLite,
  type ChangesetLite,
  type DeploymentLite,
} from "./trust-ledger.functions";

describe("trust-ledger.functions – pure helpers", () => {
  describe("isSupersessionRelation", () => {
    it("should recognize 'supersedes' (any case)", () => {
      expect(isSupersessionRelation("supersedes")).toBe(true);
      expect(isSupersessionRelation("SUPERSEDES")).toBe(true);
      expect(isSupersessionRelation("Supersedes")).toBe(true);
    });

    it("should recognize 'contradicts' (any case)", () => {
      expect(isSupersessionRelation("contradicts")).toBe(true);
      expect(isSupersessionRelation("CONTRADICTS")).toBe(true);
      expect(isSupersessionRelation("Contradicts")).toBe(true);
    });

    it("should return false for non-supersession relations", () => {
      expect(isSupersessionRelation("derived_from")).toBe(false);
      expect(isSupersessionRelation("references")).toBe(false);
      expect(isSupersessionRelation("validates")).toBe(false);
    });

    it("should handle null and undefined", () => {
      expect(isSupersessionRelation(null)).toBe(false);
      expect(isSupersessionRelation(undefined)).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(isSupersessionRelation("  supersedes  ")).toBe(true);
      expect(isSupersessionRelation("\tcontradicts\n")).toBe(true);
      expect(isSupersessionRelation("   ")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isSupersessionRelation("")).toBe(false);
    });
  });

  describe("supersededChildIds", () => {
    it("should extract child->parent map for active supersession edges", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "p1",
          child_id: "c1",
          relation: "supersedes",
          parent_kind: "decision",
          child_kind: "decision",
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.get("c1")).toBe("p1");
      expect(result.size).toBe(1);
    });

    it("should handle 'contradicts' relation", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "p1",
          child_id: "c1",
          relation: "contradicts",
          parent_kind: "decision",
          child_kind: "decision",
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.get("c1")).toBe("p1");
    });

    it("should ignore retired supersessions (valid_to set)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "p1",
          child_id: "c1",
          relation: "supersedes",
          parent_kind: "decision",
          child_kind: "decision",
          valid_to: "2026-07-15T00:00:00Z",
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.has("c1")).toBe(false);
    });

    it("should ignore non-supersession relations", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "p1",
          child_id: "c1",
          relation: "references",
          parent_kind: "decision",
          child_kind: "decision",
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.size).toBe(0);
    });

    it("should handle null/empty edges", () => {
      expect(supersededChildIds(null).size).toBe(0);
      expect(supersededChildIds(undefined).size).toBe(0);
      expect(supersededChildIds([]).size).toBe(0);
    });

    it("should skip edges with null child_id", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "p1",
          child_id: null,
          relation: "supersedes",
          parent_kind: "decision",
          child_kind: "decision",
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.size).toBe(0);
    });

    it("should handle multiple supersessions", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "p1",
          child_id: "c1",
          relation: "supersedes",
          parent_kind: "decision",
          child_kind: "decision",
        },
        {
          parent_id: "p2",
          child_id: "c2",
          relation: "supersedes",
          parent_kind: "decision",
          child_kind: "decision",
        },
      ];
      const result = supersededChildIds(edges);
      expect(result.size).toBe(2);
      expect(result.get("c1")).toBe("p1");
      expect(result.get("c2")).toBe("p2");
    });
  });

  describe("provenDecisionIds", () => {
    it("should link decisions to decisive learnings", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "learning1",
          parent_kind: "learning",
          child_id: "dec1",
          child_kind: "decision",
          relation: "validates",
        },
      ];
      const learnings: LearningLite[] = [
        { id: "learning1", verdict: "validated" }, // validated is in DECISIVE_VERDICTS
      ];
      const result = provenDecisionIds(edges, learnings);
      expect(result.get("dec1")).toBe("learning1");
    });

    it("should link decisions when learning is child", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "dec1",
          parent_kind: "decision",
          child_id: "learning1",
          child_kind: "learning",
          relation: "informs",
        },
      ];
      const learnings: LearningLite[] = [{ id: "learning1", verdict: "confirmed" }];
      const result = provenDecisionIds(edges, learnings);
      expect(result.get("dec1")).toBe("learning1");
    });

    it("should ignore retired proof edges (valid_to set)", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "learning1",
          parent_kind: "learning",
          child_id: "dec1",
          child_kind: "decision",
          relation: "validates",
          valid_to: "2026-07-15T00:00:00Z",
        },
      ];
      const learnings: LearningLite[] = [{ id: "learning1", verdict: "validated" }];
      const result = provenDecisionIds(edges, learnings);
      expect(result.has("dec1")).toBe(false);
    });

    it("should ignore non-decisive verdicts", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "learning1",
          parent_kind: "learning",
          child_id: "dec1",
          child_kind: "decision",
          relation: "validates",
        },
      ];
      const learnings: LearningLite[] = [
        { id: "learning1", verdict: "uncertain" }, // not in DECISIVE_VERDICTS
      ];
      const result = provenDecisionIds(edges, learnings);
      expect(result.has("dec1")).toBe(false);
    });

    it("should ignore supersession edges", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "learning1",
          parent_kind: "learning",
          child_id: "dec1",
          child_kind: "decision",
          relation: "supersedes",
        },
      ];
      const learnings: LearningLite[] = [{ id: "learning1", verdict: "validated" }];
      const result = provenDecisionIds(edges, learnings);
      expect(result.has("dec1")).toBe(false);
    });

    it("should use first decisive link per decision", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "learning1",
          parent_kind: "learning",
          child_id: "dec1",
          child_kind: "decision",
          relation: "validates",
        },
        {
          parent_id: "learning2",
          parent_kind: "learning",
          child_id: "dec1",
          child_kind: "decision",
          relation: "informs",
        },
      ];
      const learnings: LearningLite[] = [
        { id: "learning1", verdict: "validated" },
        { id: "learning2", verdict: "confirmed" },
      ];
      const result = provenDecisionIds(edges, learnings);
      expect(result.get("dec1")).toBe("learning1"); // first wins
    });

    it("should handle null/empty inputs", () => {
      expect(provenDecisionIds(null, null).size).toBe(0);
      expect(provenDecisionIds([], null).size).toBe(0);
      expect(provenDecisionIds(null, []).size).toBe(0);
    });

    it("should handle case-insensitive verdict matching", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "learning1",
          parent_kind: "learning",
          child_id: "dec1",
          child_kind: "decision",
          relation: "validates",
        },
      ];
      const learnings: LearningLite[] = [
        { id: "learning1", verdict: "VALIDATED" }, // uppercase version of DECISIVE_VERDICTS entry
      ];
      const result = provenDecisionIds(edges, learnings);
      expect(result.get("dec1")).toBe("learning1");
    });
  });

  describe("shouldPersistSeal", () => {
    it("should persist when head differs from latest", () => {
      expect(shouldPersistSeal("old_head", "new_head")).toBe(true);
    });

    it("should not persist when head equals latest", () => {
      expect(shouldPersistSeal("same_head", "same_head")).toBe(false);
    });

    it("should persist when no prior seal exists", () => {
      expect(shouldPersistSeal(null, "new_head")).toBe(true);
    });

    it("should not persist when head is empty string", () => {
      expect(shouldPersistSeal("latest", "")).toBe(false);
    });

    it("should not persist when head is null", () => {
      expect(shouldPersistSeal("latest", null as unknown as never)).toBe(false);
    });
  });

  describe("evidenceCounts", () => {
    it("should count edges referencing each id", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "id1",
          child_id: "id2",
          relation: "references",
          parent_kind: "artifact",
          child_kind: "artifact",
        },
        {
          parent_id: "id1",
          child_id: "id3",
          relation: "references",
          parent_kind: "artifact",
          child_kind: "artifact",
        },
        {
          parent_id: "id4",
          child_id: "id2",
          relation: "references",
          parent_kind: "artifact",
          child_kind: "artifact",
        },
      ];
      const result = evidenceCounts(edges);
      expect(result.get("id1")).toBe(2); // appears as parent twice
      expect(result.get("id2")).toBe(2); // appears as child twice
      expect(result.get("id3")).toBe(1);
      expect(result.get("id4")).toBe(1);
    });

    it("should return empty map for null/empty edges", () => {
      expect(evidenceCounts(null).size).toBe(0);
      expect(evidenceCounts([]).size).toBe(0);
    });

    it("should ignore null ids", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: null,
          child_id: "id1",
          relation: "references",
          parent_kind: "artifact",
          child_kind: "artifact",
        },
      ];
      const result = evidenceCounts(edges);
      expect(result.has(null as unknown as never)).toBe(false);
      expect(result.get("id1")).toBe(1);
    });

    it("should skip null/undefined edges in array", () => {
      const edges: LineageEdgeLite[] = [
        null as unknown as never,
        {
          parent_id: "id1",
          child_id: "id2",
          relation: "references",
          parent_kind: "artifact",
          child_kind: "artifact",
        },
        undefined as never,
      ];
      const result = evidenceCounts(edges);
      expect(result.size).toBe(2);
      expect(result.get("id1")).toBe(1);
      expect(result.get("id2")).toBe(1);
    });
  });

  describe("receiptEdgeRows", () => {
    it("should create edge rows for touching artifacts", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "receipt_id",
          child_id: "other_id",
          relation: "references",
          parent_kind: "decision",
          child_kind: "mission",
        },
      ];
      const result = receiptEdgeRows(edges, ["receipt_id"]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("other_id");
      expect(result[0].kind).toBe("mission");
    });

    it("should prefer record_id (selfIds[0]) as self side", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "source_id",
          child_id: "other_id",
          relation: "references",
          parent_kind: "mission",
          child_kind: "artifact",
        },
        {
          parent_id: "record_id",
          child_id: "other_id",
          relation: "references",
          parent_kind: "decision",
          child_kind: "artifact",
        },
      ];
      const result = receiptEdgeRows(edges, ["record_id", "source_id"]);
      // should treat record_id as self, source_id as self
      expect(result.length).toBeGreaterThan(0);
    });

    it("should use labels when available", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "receipt_id",
          child_id: "other_id",
          relation: "references",
          parent_kind: "decision",
          child_kind: "mission",
        },
      ];
      const labels = new Map([["other_id", "My Mission Title"]]);
      const result = receiptEdgeRows(edges, ["receipt_id"], labels);
      expect(result[0].label).toBe("My Mission Title");
    });

    it("should fall back to kind+short-id when label missing", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "receipt_id",
          child_id: "12345678abcdef",
          relation: "references",
          parent_kind: "decision",
          child_kind: "mission",
        },
      ];
      const result = receiptEdgeRows(edges, ["receipt_id"]);
      expect(result[0].label).toBe("mission 12345678");
    });

    it("should dedup identical edges", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "receipt_id",
          child_id: "other_id",
          relation: "references",
          parent_kind: "decision",
          child_kind: "mission",
        },
        {
          parent_id: "receipt_id",
          child_id: "other_id",
          relation: "references",
          parent_kind: "decision",
          child_kind: "mission",
        },
      ];
      const result = receiptEdgeRows(edges, ["receipt_id"]);
      expect(result).toHaveLength(1);
    });

    it("should return empty for no touching edges", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "unrelated1",
          child_id: "unrelated2",
          relation: "references",
          parent_kind: "artifact",
          child_kind: "artifact",
        },
      ];
      const result = receiptEdgeRows(edges, ["receipt_id"]);
      expect(result).toHaveLength(0);
    });

    it("should handle null/empty selfIds", () => {
      const edges: LineageEdgeLite[] = [
        {
          parent_id: "receipt_id",
          child_id: "other_id",
          relation: "references",
          parent_kind: "decision",
          child_kind: "mission",
        },
      ];
      expect(receiptEdgeRows(edges, [])).toHaveLength(0);
      expect(receiptEdgeRows(edges, [null, undefined])).toHaveLength(0);
    });
  });

  describe("buildInfoByArtifact", () => {
    it("should index latest changeset per artifact", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs1",
          branch: "feature",
          pr_number: 123,
          pr_url: "https://example.com/pr/123",
          status: "merged",
          fix_attempts: 0,
          mission_id: "m1",
          prd_id: null,
          created_at: "2026-07-10T00:00:00Z",
        },
        {
          id: "cs2",
          branch: "feature2",
          pr_number: 124,
          pr_url: "https://example.com/pr/124",
          status: "merged",
          fix_attempts: 1,
          mission_id: "m1",
          prd_id: null,
          created_at: "2026-07-15T00:00:00Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, []);
      expect(result.get("m1")?.build.branch).toBe("feature2"); // latest
      expect(result.get("m1")?.build.fixAttempts).toBe(1);
    });

    it("should attach deployments to changesets", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs1",
          branch: "main",
          pr_number: null,
          pr_url: null,
          status: "deployed",
          fix_attempts: null,
          mission_id: "m1",
          prd_id: null,
          created_at: "2026-07-10T00:00:00Z",
        },
      ];
      const deployments: DeploymentLite[] = [
        {
          changeset_id: "cs1",
          environment: "production",
          deploy_url: "https://prod.example.com",
          commit_sha: "abc123",
          deployed_at: "2026-07-10T10:00:00Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, deployments);
      expect(result.get("m1")?.deploys).toHaveLength(1);
      expect(result.get("m1")?.deploys[0].environment).toBe("production");
    });

    it("should support mission_id and prd_id keys", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs1",
          branch: "main",
          pr_number: null,
          pr_url: null,
          status: "deployed",
          fix_attempts: null,
          mission_id: "m1",
          prd_id: "p1",
          created_at: "2026-07-10T00:00:00Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, []);
      expect(result.get("m1")).toBeDefined();
      expect(result.get("p1")).toBeDefined();
      expect(result.get("m1")).toBe(result.get("p1")); // same reference
    });

    it("should dedup changesets by id", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs1",
          branch: "main",
          pr_number: null,
          pr_url: null,
          status: "merged",
          fix_attempts: null,
          mission_id: "m1",
          prd_id: null,
          created_at: "2026-07-10T00:00:00Z",
        },
        {
          id: "cs1", // duplicate
          branch: "other",
          pr_number: 999,
          pr_url: null,
          status: "draft",
          fix_attempts: null,
          mission_id: "m1",
          prd_id: null,
          created_at: "2026-07-15T00:00:00Z",
        },
      ];
      const result = buildInfoByArtifact(changesets, []);
      expect(result.get("m1")?.build.branch).toBe("main"); // first wins
    });

    it("should handle null/empty inputs", () => {
      expect(buildInfoByArtifact(null, null).size).toBe(0);
      expect(buildInfoByArtifact([], []).size).toBe(0);
    });

    it("should provide default environment when missing", () => {
      const changesets: ChangesetLite[] = [
        {
          id: "cs1",
          branch: "main",
          pr_number: null,
          pr_url: null,
          status: "deployed",
          fix_attempts: null,
          mission_id: "m1",
          prd_id: null,
          created_at: "2026-07-10T00:00:00Z",
        },
      ];
      const deployments: DeploymentLite[] = [
        {
          changeset_id: "cs1",
          environment: null,
          deploy_url: null,
          commit_sha: null,
          deployed_at: null,
        },
      ];
      const result = buildInfoByArtifact(changesets, deployments);
      expect(result.get("m1")?.deploys[0].environment).toBe("production");
    });
  });

  describe("summarizeAction", () => {
    it("should extract title from args and prepend tool name", () => {
      const result = summarizeAction("create_task", { title: "My Task" });
      expect(result).toBe("Create Task: My Task");
    });

    it("should try multiple arg keys in order", () => {
      const result = summarizeAction("my_tool", {
        name: "Fallback Name",
        title: "Primary Title",
      });
      expect(result).toContain("Primary Title");
    });

    it("should humanize tool name (convert underscores/dots to spaces, title case)", () => {
      const result = summarizeAction("my_awesome_tool", { title: "Action" });
      expect(result).toContain("My Awesome Tool");
    });

    it("should cap subject at 140 chars", () => {
      const longText = "x".repeat(200);
      const result = summarizeAction("tool", { title: longText });
      expect(result).toContain("…");
      expect(result.length).toBeLessThan(longText.length + 50);
    });

    it("should fall back to tool name when no subject found", () => {
      const result = summarizeAction("my_tool", {});
      expect(result).toBe("My Tool");
    });

    it("should handle missing tool name", () => {
      const result = summarizeAction(null, { title: "Action" });
      expect(result).toBe("Autonomous action: Action");
    });

    it("should default to 'Autonomous action' when no tool and no subject", () => {
      const result = summarizeAction(null, null);
      expect(result).toBe("Autonomous action");
    });

    it("should trim whitespace from subject", () => {
      const result = summarizeAction("tool", { title: "  Trimmed Text  " });
      expect(result).toBe("Tool: Trimmed Text");
    });

    it("should skip empty/whitespace-only subjects", () => {
      const result = summarizeAction("tool", { title: "   ", name: "" });
      expect(result).toBe("Tool");
    });

    it("should try keys in order: title, name, summary, query, message, goal", () => {
      const result = summarizeAction("tool", { goal: "Goal", query: "Query" });
      expect(result).toContain("Query"); // query is tried before goal in the pick() order
    });
  });

  describe("assembleReceipts", () => {
    it("should merge decisions and approvals into time-sorted list (newest first)", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec1",
          title: "Decision 1",
          rationale: "Reason 1",
          status: "approved",
          source_kind: "mission",
          meeting_id: null,
          mission_id: "m1",
          prd_id: null,
          decided_by_agent_slug: "agent1",
          created_at: "2026-07-10T10:00:00Z",
        },
      ];
      const approvals: ApprovalLite[] = [
        {
          id: "app1",
          agent_slug: "agent1",
          tool_name: "my_tool",
          args: { title: "Action" },
          rationale: null,
          decision_reason: "Because...",
          status: "executed",
          decided_at: "2026-07-10T11:00:00Z",
          decided_by: null,
          created_at: "2026-07-10T11:00:00Z",
          mission_id: "m1",
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
      // Sorted by occurredAt descending (newest first), so action (11:00) comes before decision (10:00)
      expect(result[0].kind).toBe("action");
      expect(result[1].kind).toBe("decision");
    });

    it("should mark receipts as superseded when in supersession map", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec1",
          title: "Old Decision",
          rationale: null,
          status: "approved",
          source_kind: null,
          meeting_id: null,
          mission_id: null,
          prd_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-10T00:00:00Z",
        },
      ];

      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map([["dec1", "dec2"]]),
        evidence: new Map(),
        sourceLabels: new Map(),
      });

      expect(result[0].outcome).toBe("superseded");
      expect(result[0].supersededBy).toBe("dec2");
    });

    it("should mark decisions as proven when in proven map", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec1",
          title: "Proven Decision",
          rationale: null,
          status: "approved",
          source_kind: null,
          meeting_id: null,
          mission_id: null,
          prd_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-10T00:00:00Z",
        },
      ];

      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
        proven: new Map([["dec1", "learning1"]]),
      });

      expect(result[0].outcome).toBe("proven");
      expect(result[0].provenBy?.id).toBe("learning1");
    });

    it("should prefer superseded over proven (superseded wins)", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec1",
          title: "Decision",
          rationale: null,
          status: "approved",
          source_kind: null,
          meeting_id: null,
          mission_id: null,
          prd_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-10T00:00:00Z",
        },
      ];

      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map([["dec1", "dec2"]]),
        evidence: new Map(),
        sourceLabels: new Map(),
        proven: new Map([["dec1", "learning1"]]),
      });

      expect(result[0].outcome).toBe("superseded");
    });

    it("should include evidence counts from evidence map", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec1",
          title: "Decision",
          rationale: null,
          status: "approved",
          source_kind: null,
          meeting_id: null,
          mission_id: "m1",
          prd_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-10T00:00:00Z",
        },
      ];

      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map(),
        evidence: new Map([
          ["dec1", 3],
          ["m1", 2],
        ]),
        sourceLabels: new Map(),
      });

      expect(result[0].evidenceCount).toBe(5); // 3 + 2
    });

    it("should attach build info to receipts when available", () => {
      const decisions: DecisionLite[] = [
        {
          id: "dec1",
          title: "Decision",
          rationale: null,
          status: "approved",
          source_kind: null,
          meeting_id: null,
          mission_id: "m1",
          prd_id: null,
          decided_by_agent_slug: null,
          created_at: "2026-07-10T00:00:00Z",
        },
      ];

      const buildInfo = new Map([
        [
          "m1",
          {
            build: {
              branch: "feature",
              prNumber: 123,
              prUrl: "https://example.com",
              status: "merged",
              fixAttempts: 0,
            },
            deploys: [],
          },
        ],
      ]);

      const result = assembleReceipts({
        decisions,
        approvals: [],
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
        buildInfo,
      });

      expect(result[0].build?.branch).toBe("feature");
      expect(result[0].build?.prNumber).toBe(123);
    });

    it("should return empty list for no decisions/approvals", () => {
      const result = assembleReceipts({
        decisions: [],
        approvals: [],
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
      });

      expect(result).toHaveLength(0);
    });

    it("should handle null input arrays gracefully", () => {
      const result = assembleReceipts({
        decisions: null as unknown as never,
        approvals: null as unknown as never,
        superseded: new Map(),
        evidence: new Map(),
        sourceLabels: new Map(),
      });

      expect(result).toEqual([]);
    });
  });
});
