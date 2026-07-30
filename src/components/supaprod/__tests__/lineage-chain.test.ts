import { describe, expect, test } from "bun:test";

import { chainOf } from "../AuditLineageSheet";
import type { LineageNodeView } from "@/lib/lineage-graph.functions";
import type { LineageStep } from "@/lib/lineage-graph";

/**
 * These cases came from LIVE DATA, not imagination. Rendering the founder's own
 * mission at the walk's default depth produced 24 nodes with four duplicated
 * titles and a CHANGESET presented as the mission's ancestor. Both symptoms are
 * the loop: walking up from a mission eventually re-enters the forward half
 * through `learning -> decision`, so "where did this come from" wraps around
 * into "what it caused".
 *
 * The data was right and the story was nonsense, which is the kind of bug a
 * fixture never shows you.
 */

function node(kind: string, id: string, title: string | null = `${kind} ${id}`): LineageNodeView {
  return { kind, id, title, status: null, at: null, ref: null, resolved: true };
}

function step(
  from: [string, string],
  to: [string, string],
  distance: number,
  relation = "promoted",
): LineageStep {
  return {
    from: { kind: from[0], id: from[1] },
    to: { kind: to[0], id: to[1] },
    relation,
    rationale: null,
    byAgent: null,
    distance,
  };
}

const FOCUS = node("mission", "m1", "Ship the checkout and notification pass");

describe("chainOf", () => {
  test("reads origin first, focus in the middle, outcomes last", () => {
    const graph = {
      focus: FOCUS,
      upstream: [
        step(["prd", "p1"], ["mission", "m1"], 1),
        step(["decision", "d1"], ["prd", "p1"], 2),
      ],
      downstream: [step(["mission", "m1"], ["changeset", "c1"], 1)],
      nodes: [node("prd", "p1"), node("decision", "d1"), node("changeset", "c1")],
    };
    expect(chainOf(graph).map((e) => e.node.kind)).toEqual([
      "decision", // furthest ancestor
      "prd",
      "mission", // you are here
      "changeset",
    ]);
  });

  test("the focus is marked, and only the focus", () => {
    const graph = {
      focus: FOCUS,
      upstream: [step(["prd", "p1"], ["mission", "m1"], 1)],
      downstream: [],
      nodes: [node("prd", "p1")],
    };
    const marked = chainOf(graph).filter((e) => e.focus);
    expect(marked).toHaveLength(1);
    expect(marked[0].node.id).toBe("m1");
  });

  // THE BUG THE LIVE WALK EXPOSED.
  test("a node reachable BOTH ways appears once, not twice", () => {
    const changeset = node("changeset", "c1", "Simplify checkout flow");
    const graph = {
      focus: FOCUS,
      // The loop puts the changeset upstream too, three hops round the back.
      upstream: [step(["changeset", "c1"], ["learning", "l1"], 3)],
      downstream: [step(["mission", "m1"], ["changeset", "c1"], 1)],
      nodes: [changeset, node("learning", "l1")],
    };
    const ids = chainOf(graph).map((e) => `${e.node.kind}:${e.node.id}`);
    expect(ids.filter((i) => i === "changeset:c1")).toHaveLength(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("upstream wins the tie, because an origin is the more surprising fact", () => {
    const graph = {
      focus: FOCUS,
      upstream: [step(["prd", "p1"], ["mission", "m1"], 1)],
      downstream: [step(["mission", "m1"], ["prd", "p1"], 1)],
      nodes: [node("prd", "p1")],
    };
    const chain = chainOf(graph);
    // The prd sits BEFORE the focus, not after it.
    expect(chain.findIndex((e) => e.node.kind === "prd")).toBeLessThan(
      chain.findIndex((e) => e.focus),
    );
  });

  test("a self-referencing entity yields no chain, and never lists itself twice", () => {
    // My first version of this test asserted the focus should still appear
    // once. The code was right and the test was wrong: a self-loop is not a
    // story, so it collapses to the same empty answer as an isolated node.
    // Rendering "The chain" over an entity pointing at itself would imply a
    // provenance that does not exist.
    const graph = {
      focus: FOCUS,
      upstream: [step(["mission", "m1"], ["mission", "m1"], 1)],
      downstream: [step(["mission", "m1"], ["mission", "m1"], 1)],
      nodes: [FOCUS],
    };
    const chain = chainOf(graph);
    expect(chain).toEqual([]);
    expect(chain.filter((e) => e.node.id === "m1").length).toBeLessThanOrEqual(1);
  });

  test("an isolated entity yields NO chain rather than a chain of one", () => {
    // A lone focus is not a story, and rendering "The chain" over a single node
    // implies a provenance that is not there.
    const graph = { focus: FOCUS, upstream: [], downstream: [], nodes: [] };
    expect(chainOf(graph)).toEqual([]);
  });

  test("a step whose node did not resolve is skipped, not rendered blank", () => {
    const graph = {
      focus: FOCUS,
      upstream: [step(["ghost", "g1"], ["mission", "m1"], 1)],
      downstream: [],
      nodes: [], // the walk named it, the resolver could not view it
    };
    expect(chainOf(graph)).toEqual([]);
  });

  test("relation is carried through, so a row can say HOW it connects", () => {
    const graph = {
      focus: FOCUS,
      upstream: [step(["prd", "p1"], ["mission", "m1"], 1, "derived_from")],
      downstream: [],
      nodes: [node("prd", "p1")],
    };
    expect(chainOf(graph)[0].relation).toBe("derived_from");
  });
});
