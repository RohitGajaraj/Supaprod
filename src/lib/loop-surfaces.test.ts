import { describe, test, expect } from "bun:test";
import { LOOP_SURFACES, loopIndexForPath, isLoopSurface, loopNeighbors } from "@/lib/loop-surfaces";

describe("LOOP_SURFACES — the surface-level loop model", () => {
  test("is the seven v11 loop surfaces in order", () => {
    expect(LOOP_SURFACES.map((s) => s.id)).toEqual([
      "today",
      "product",
      "prd",
      "build",
      "missions",
      "brain",
      "trust",
    ]);
  });

  test("every surface has a label, a route, and a forward payload", () => {
    for (const s of LOOP_SURFACES) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.to.startsWith("/")).toBe(true);
      expect(s.produces.length).toBeGreaterThan(0);
    }
  });
});

describe("loopIndexForPath — where the operator currently sits", () => {
  test("matches each surface on its exact route", () => {
    expect(loopIndexForPath("/")).toBe(0);
    expect(loopIndexForPath("/arriving")).toBe(1);
    expect(loopIndexForPath("/plan")).toBe(2);
    expect(loopIndexForPath("/build")).toBe(3);
    expect(loopIndexForPath("/outcomes")).toBe(5);
    // IA SPINE (2026-07-11): the Trust stage's home is the Engine Room
    // (record room); /trust-ledger is a redirect stub.
    expect(loopIndexForPath("/engine-room")).toBe(6);
  });

  test("matches detail routes via longest-prefix (spec/Build detail)", () => {
    expect(loopIndexForPath("/plan/spec/abc-123")).toBe(2);
    expect(loopIndexForPath("/build/m1")).toBe(3);
  });

  // OBS-10: /missions folded into Build — the "missions" stage (id, label,
  // "a shipped outcome" payload) still exists in LOOP_SURFACES for the
  // engine-loop narrative, it just shares Build's URL rather than having its
  // own page. A path can only ever resolve to ONE index, so "/build" and
  // "/build/m1" both land on "build" (index 3, the earlier array entry) —
  // "missions" is never the *active* stage, by design.
  test("the missions stage shares Build's URL and is never independently active", () => {
    expect(LOOP_SURFACES[4].id).toBe("missions");
    expect(LOOP_SURFACES[4].to).toBe("/build");
    expect(loopIndexForPath("/build")).toBe(3);
    expect(loopIndexForPath("/build/m1")).toBe(3);
  });

  test('"/" (Today) only matches exactly — never as a prefix of every path', () => {
    expect(loopIndexForPath("/settings")).toBe(-1);
    expect(loopIndexForPath("/admin/people")).toBe(-1);
  });

  test("does not false-match a sibling route that shares a label prefix", () => {
    // "/budgets" must not match the Build surface ("/build").
    expect(loopIndexForPath("/budgets")).toBe(-1);
  });

  test("returns -1 for surfaces outside the loop", () => {
    expect(loopIndexForPath("/evals")).toBe(-1);
    expect(loopIndexForPath("/guardrails")).toBe(-1);
    expect(isLoopSurface("/settings")).toBe(false);
    expect(isLoopSurface("/arriving")).toBe(true);
  });
});

describe("loopNeighbors — the loop wraps (it has no end)", () => {
  test("interior stage has its immediate prev/next", () => {
    const n = loopNeighbors(loopIndexForPath("/arriving"));
    expect(n?.prev.id).toBe("today");
    expect(n?.next.id).toBe("prd");
  });

  test("Trust's next wraps back to Today; Today's prev wraps to Trust", () => {
    const trust = loopNeighbors(loopIndexForPath("/engine-room"));
    expect(trust?.next.id).toBe("today");
    const today = loopNeighbors(loopIndexForPath("/"));
    expect(today?.prev.id).toBe("trust");
  });

  test("an off-loop index fails closed (null)", () => {
    expect(loopNeighbors(-1)).toBeNull();
    expect(loopNeighbors(LOOP_SURFACES.length)).toBeNull();
  });
});
