/**
 * Brain's drawn record, guarded.
 *
 * THE DEFECT THIS EXISTS TO PROTECT THE FIX FOR, found 2026-08-05. The product's
 * one genuinely visual asset, a DPR-aware physics canvas with typed edges, a
 * replay over real edge timestamps and per-edge rationale plus agent
 * attribution, sat behind rail row 3, then tab 5 of 5, then a view toggle, on a
 * surface whose entire job is to prove the record guides. Everywhere else in
 * the product, agent work is text. It now has a region above the tabs.
 *
 * WHY A TEST AND NOT A REVIEW NOTE. `graphPreview` decides, on every visit, one
 * of two things that can go badly wrong in ways that typecheck perfectly:
 *
 *   A CANVAS DRAWN WITH NOTHING IN IT. Two dots and a line under a physics
 *   simulation does not read as a young workspace, it reads as a broken
 *   feature, and it is the state EVERY new user is in. The threshold is the
 *   whole reason the empty and thin states were composed at all, and a future
 *   edit that lowers or drops it silently ships the broken-looking screen.
 *
 *   A HEAVY MODULE MOUNTED WHERE IT WILL NOT DRAW. The canvas and its d3-force
 *   dependency are referenced only from the `drawn` branch. Any state that
 *   leaks into `drawn` without the edges to justify it also fetches 36 KB for
 *   nothing, so the same assertion guards both the honesty and the weight.
 *
 * The third rule is the one every read surface in this repo lives by: "nothing
 * is linked yet" and "we could not read it" are different facts, they get
 * different states, and neither may wear the other's clothes.
 */
import { describe, it, expect } from "bun:test";
import { graphPreview, PREVIEW_MIN_EDGES } from "../_authenticated.outcomes";

/** A graph of the requested size. Only the counts matter to this decision, so
 *  the members are placeholders rather than a hand-built KnowledgeGraph. */
function graph(nodes: number, edges: number) {
  return {
    nodes: Array.from({ length: nodes }, (_, i) => `node-${i}`),
    edges: Array.from({ length: edges }, (_, i) => `edge-${i}`),
  };
}

const at = (over: Partial<Parameters<typeof graphPreview>[0]> = {}) =>
  graphPreview({
    graph: graph(8, 12),
    loading: false,
    failed: false,
    onGraphTab: false,
    drilling: false,
    ...over,
  });

describe("Brain draws the record only when there is a shape to draw", () => {
  it("draws a real map, and says how much of it there is", () => {
    expect(at({ graph: graph(8, 12) })).toEqual({ state: "drawn", nodes: 8, edges: 12 });
  });

  it("refuses the canvas at one link, which is a list and not a shape", () => {
    // THE DEFECT: a physics simulation holding two dots and a line reads as a
    // broken feature, not as a young workspace.
    expect(at({ graph: graph(2, 1) })).toEqual({ state: "thin", edges: 1 });
  });

  it("refuses the canvas everywhere below the threshold", () => {
    for (let edges = 1; edges < PREVIEW_MIN_EDGES; edges += 1) {
      const out = at({ graph: graph(edges + 1, edges) });
      expect(out.state).toBe("thin");
    }
  });

  it("refuses the canvas when the links exist but the nodes do not branch", () => {
    // Three links between two nodes is a bundle, not a shape. Counting only
    // edges would draw it.
    expect(at({ graph: graph(2, 3) })).toEqual({ state: "thin", edges: 3 });
  });

  it("draws at exactly the threshold, so the boundary is not off by one", () => {
    const out = at({ graph: graph(PREVIEW_MIN_EDGES, PREVIEW_MIN_EDGES) });
    expect(out).toEqual({ state: "drawn", nodes: PREVIEW_MIN_EDGES, edges: PREVIEW_MIN_EDGES });
  });

  it("keeps a threshold that can branch at all", () => {
    // The number is a judgment about what a picture SAYS. Two links cannot
    // branch, so the claim "this came from that, and so did the other thing"
    // is not drawable below three.
    expect(PREVIEW_MIN_EDGES).toBeGreaterThanOrEqual(3);
  });
});

describe("Brain never dresses one fact as another", () => {
  it("says nothing is linked yet, rather than showing an empty canvas", () => {
    expect(at({ graph: graph(0, 0) })).toEqual({ state: "empty" });
  });

  it("keeps 'nothing is linked' and 'we could not read it' apart", () => {
    // A person acts differently on each: one waits for the work to connect,
    // the other retries.
    expect(at({ graph: null, loading: false, failed: true }).state).toBe("failed");
    expect(at({ graph: graph(0, 0) }).state).toBe("empty");
  });

  it("holds the shape while the read is in flight rather than claiming empty", () => {
    expect(at({ graph: null, loading: true, failed: false })).toEqual({ state: "loading" });
  });

  it("does not report a failure while the retry is still running", () => {
    expect(at({ graph: null, loading: true, failed: true })).toEqual({ state: "loading" });
  });

  it("keeps drawing the map it already has when a refetch fails", () => {
    // A network blip is not the record going away, and blanking a true map
    // over one would lose information the reader already had.
    expect(at({ graph: graph(8, 12), failed: true })).toEqual({
      state: "drawn",
      nodes: 8,
      edges: 12,
    });
  });
});

describe("Brain stands the preview down where it would be noise", () => {
  it("does not draw a second simulation above the full canvas", () => {
    expect(at({ onGraphTab: true }).state).toBe("hidden");
  });

  it("stands down on an open drill, where the reader came for one record", () => {
    // The identical rule the record recess above it already follows.
    expect(at({ drilling: true }).state).toBe("hidden");
  });

  it("stands down before it decides anything else", () => {
    // Hidden outranks every other state, so a suppressed region can never
    // mount the canvas or claim an emptiness it did not check.
    expect(at({ onGraphTab: true, graph: null, failed: true }).state).toBe("hidden");
    expect(at({ drilling: true, graph: graph(0, 0) }).state).toBe("hidden");
  });
});
