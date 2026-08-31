import { describe, expect, test } from "bun:test";

import {
  countLineage,
  isLiveEdge,
  nodeKey,
  walkLineage,
  type LineageEdgeRow,
} from "./lineage-graph";

function edge(parent: string, child: string, over: Partial<LineageEdgeRow> = {}): LineageEdgeRow {
  const [parent_kind, parent_id] = parent.split(":");
  const [child_kind, child_id] = child.split(":");
  return {
    parent_kind,
    parent_id,
    child_kind,
    child_id,
    relation: "produced",
    rationale: null,
    created_by_agent: null,
    valid_to: null,
    invalidated_by: null,
    ...over,
  };
}

/**
 * The founder's own workspace, edge for edge, from a live read on 2026-07-30.
 * The forward half uses `changeset` and `deployment`, which appear in NEITHER
 * ARTIFACT_KINDS nor AUDIT_KINDS: that is the whole reason this walk refuses
 * to validate kinds.
 */
const LOOP: LineageEdgeRow[] = [
  edge("theme:t1", "opportunity:o1"),
  edge("opportunity:o1", "decision:d1"),
  edge("decision:d1", "prd:p1"),
  edge("prd:p1", "mission:m1"),
  edge("mission:m1", "changeset:c1"),
  edge("changeset:c1", "deployment:dep1"),
  edge("deployment:dep1", "learning:l1"),
  edge("learning:l1", "decision:d2"),
];

describe("walkLineage", () => {
  test("walks backward to the origin: a build knows it came from a signal's theme", () => {
    const w = walkLineage({ kind: "mission", id: "m1" }, LOOP);
    const up = w.upstream.map((s) => `${s.from.kind}->${s.to.kind}`);
    expect(up).toContain("prd->mission");
    expect(up).toContain("decision->prd");
    expect(up).toContain("opportunity->decision");
    expect(up).toContain("theme->opportunity");
  });

  test("walks forward to the outcome, which is the half that did not exist", () => {
    const w = walkLineage({ kind: "mission", id: "m1" }, LOOP);
    const down = w.downstream.map((s) => `${s.from.kind}->${s.to.kind}`);
    expect(down).toContain("mission->changeset");
    expect(down).toContain("changeset->deployment");
    expect(down).toContain("deployment->learning");
  });

  // THE POINT OF THE WHOLE MODULE. A walk validated against either kind
  // vocabulary would drop changeset and deployment, silently shortening the
  // chain to "mission produced nothing" on a mission that shipped.
  test("kinds in no vocabulary are carried, not dropped", () => {
    const w = walkLineage({ kind: "mission", id: "m1" }, LOOP);
    const kinds = w.nodes.map((n) => n.kind);
    expect(kinds).toContain("changeset");
    expect(kinds).toContain("deployment");
  });

  test("distance is the true shortest hop count, breadth first", () => {
    const w = walkLineage({ kind: "mission", id: "m1" }, LOOP);
    const byTo = new Map(w.upstream.map((s) => [s.to.kind, s.distance]));
    expect(byTo.get("mission")).toBe(1); // prd -> mission, one hop up
    const downByTo = new Map(w.downstream.map((s) => [s.to.kind, s.distance]));
    expect(downByTo.get("changeset")).toBe(1);
    expect(downByTo.get("deployment")).toBe(2);
    expect(downByTo.get("learning")).toBe(3);
  });

  test("a step always reads in the direction of causation, both ways", () => {
    // Walking UP must not flip the arrow, or the surface renders "the spec
    // came from the mission".
    const w = walkLineage({ kind: "mission", id: "m1" }, LOOP);
    const step = w.upstream.find((s) => s.to.kind === "mission");
    expect(step?.from.kind).toBe("prd");
    expect(step?.to.kind).toBe("mission");
  });

  describe("the loop closes, and that must terminate", () => {
    test("a learning re-opening its own decision does not hang the walk", () => {
      // The single most valuable edge in the product: the record acting on
      // itself. It is also a cycle, so a tree-shaped walk would spin.
      const cyclic = [
        edge("decision:d1", "prd:p1"),
        edge("prd:p1", "mission:m1"),
        edge("mission:m1", "learning:l1"),
        edge("learning:l1", "decision:d1"),
      ];
      const w = walkLineage({ kind: "decision", id: "d1" }, cyclic);
      expect(w.downstream.length).toBeGreaterThan(0);
      expect(w.nodes.map(nodeKey)).not.toContain("decision:d1"); // the focus is never its own node
    });

    test("a two-node cycle terminates", () => {
      const w = walkLineage({ kind: "a", id: "1" }, [edge("a:1", "b:2"), edge("b:2", "a:1")]);
      expect(w.nodes).toHaveLength(1);
    });
  });

  describe("a superseded edge is history, not lineage", () => {
    test("valid_to closes an edge", () => {
      const w = walkLineage({ kind: "prd", id: "p1" }, [
        edge("decision:old", "prd:p1", { valid_to: "2026-07-01T00:00:00Z" }),
        edge("decision:new", "prd:p1"),
      ]);
      const from = w.upstream.map((s) => s.from.id);
      expect(from).toContain("new");
      expect(from).not.toContain("old");
    });

    test("invalidated_by closes an edge", () => {
      const w = walkLineage({ kind: "prd", id: "p1" }, [
        edge("decision:old", "prd:p1", { invalidated_by: "someone" }),
      ]);
      expect(w.upstream).toHaveLength(0);
    });

    test("isLiveEdge is the single gate both paths use", () => {
      expect(isLiveEdge(edge("a:1", "b:2"))).toBe(true);
      expect(isLiveEdge(edge("a:1", "b:2", { valid_to: "x" }))).toBe(false);
      expect(isLiveEdge(edge("a:1", "b:2", { invalidated_by: "x" }))).toBe(false);
    });
  });

  describe("limits are reported, never silent", () => {
    test("depth truncation sets the flag", () => {
      const w = walkLineage({ kind: "theme", id: "t1" }, LOOP, { maxDepth: 2 });
      expect(w.truncated).toBe(true);
    });

    test("node cap sets the flag", () => {
      const many = Array.from({ length: 30 }, (_, i) => edge("root:r", `child:c${i}`));
      const w = walkLineage({ kind: "root", id: "r" }, many, { maxNodes: 5 });
      expect(w.truncated).toBe(true);
      expect(w.nodes.length).toBeLessThanOrEqual(6);
    });

    test("a graph that fits is NOT reported as truncated", () => {
      // A false truncation flag would make a complete chain look partial,
      // which is its own kind of lie.
      const w = walkLineage({ kind: "mission", id: "m1" }, LOOP, { maxDepth: 10, maxNodes: 50 });
      expect(w.truncated).toBe(false);
    });
  });

  test("an isolated node reports nothing rather than guessing", () => {
    const w = walkLineage({ kind: "prd", id: "orphan" }, LOOP);
    expect(w.upstream).toHaveLength(0);
    expect(w.downstream).toHaveLength(0);
    expect(w.nodes).toHaveLength(0);
    expect(w.truncated).toBe(false);
  });

  test("nodeKey splits on the first colon only, so uuids survive", () => {
    const w = walkLineage({ kind: "mission", id: "60000000-0005-4000-8000-000000000003" }, [
      edge("prd:p1", "mission:60000000-0005-4000-8000-000000000003"),
    ]);
    expect(w.upstream[0]?.to.id).toBe("60000000-0005-4000-8000-000000000003");
  });
});

/**
 * COUNTING A BOARD IN ONE READ (S2's half of §0.5, 2026-08-31).
 *
 * The counts have to agree with what the sheet draws when a person clicks the
 * row, so they are ADJACENT edges rather than reachable-set sizes. A transitive
 * count would make two rows incomparable and could not be checked by eye.
 */
describe("countLineage", () => {
  const edge = (
    p: string,
    c: string,
    extra: Partial<LineageEdgeRow & { seeded?: boolean | null }> = {},
  ) => {
    const [parent_kind, parent_id] = p.split(":");
    const [child_kind, child_id] = c.split(":");
    return {
      parent_kind,
      parent_id,
      child_kind,
      child_id,
      relation: "produced",
      rationale: null,
      created_by_agent: null,
      valid_to: null,
      invalidated_by: null,
      ...extra,
    } as LineageEdgeRow & { seeded?: boolean | null };
  };

  test("counts what produced a row and what it fed, separately", () => {
    const counts = countLineage(
      [{ kind: "mission", id: "m1" }],
      [edge("decision:d1", "mission:m1"), edge("mission:m1", "changeset:c1")],
    );
    expect(counts.get("mission:m1")).toEqual({ producedBy: 1, fed: 1, seededExcluded: 0 });
  });

  test("answers for every id asked about, so absent never reads as zero", () => {
    // The default-as-data trap one layer up: a caller doing `counts.get(id) ?? 0`
    // cannot tell "counted, and it is zero" from "never looked at".
    const counts = countLineage([{ kind: "mission", id: "quiet" }], []);
    expect(counts.has("mission:quiet")).toBe(true);
    expect(counts.get("mission:quiet")).toEqual({ producedBy: 0, fed: 0, seededExcluded: 0 });
  });

  test("leaves demo fixtures out of the number and REPORTS that it did", () => {
    // 283 of 2,142 live edges are seeded (13%), which is more than enough to
    // move a small per-row count. `producedBy: 0, seededExcluded: 2` and
    // `0, 0` are different facts and only one of them is a gap in the product.
    const counts = countLineage(
      [{ kind: "mission", id: "m1" }],
      [
        edge("decision:d1", "mission:m1", { seeded: true }),
        edge("mission:m1", "changeset:c1", { seeded: true }),
        edge("decision:d2", "mission:m1"),
      ],
    );
    expect(counts.get("mission:m1")).toEqual({ producedBy: 1, fed: 0, seededExcluded: 2 });
  });

  test("obeys isLiveEdge, the single gate the walk already uses", () => {
    const counts = countLineage(
      [{ kind: "mission", id: "m1" }],
      [
        edge("decision:d1", "mission:m1", { valid_to: "2026-01-01T00:00:00Z" }),
        edge("decision:d2", "mission:m1", { invalidated_by: "someone" }),
      ],
    );
    // A superseded edge is history, not lineage — and it is not a fixture
    // either, so it must not inflate `seededExcluded` on its way out.
    expect(counts.get("mission:m1")).toEqual({ producedBy: 0, fed: 0, seededExcluded: 0 });
  });

  test("counts a self-edge once rather than on both ends", () => {
    const counts = countLineage(
      [{ kind: "mission", id: "m1" }],
      [edge("mission:m1", "mission:m1")],
    );
    expect(counts.get("mission:m1")).toEqual({ producedBy: 0, fed: 1, seededExcluded: 0 });
  });

  test("ignores an edge touching nothing that was asked about", () => {
    const counts = countLineage(
      [{ kind: "mission", id: "m1" }],
      [edge("decision:d9", "changeset:c9")],
    );
    expect(counts.get("mission:m1")).toEqual({ producedBy: 0, fed: 0, seededExcluded: 0 });
  });
});
