import { describe, it, expect } from "bun:test";
import { runStatusLabel, hasCanvasContent } from "../ask-canvas";
import type { LoopStep } from "@/lib/ai/loop.server";

// CMD-0 (H2 Command Canvas, first increment): the two pure derivations
// behind the Ask mission-canvas blocks: a run's outcome-named status word,
// and whether there is anything real to render at all (the no-filler law).

describe("runStatusLabel", () => {
  it("maps a running mission to an outcome-named BUILDING label", () => {
    expect(runStatusLabel("running")).toBe("BUILDING");
  });

  it("maps both waiting_approval and blocked to the same plain-words gate label", () => {
    expect(runStatusLabel("waiting_approval")).toBe("WAITING ON YOU");
    expect(runStatusLabel("blocked")).toBe("WAITING ON YOU");
  });

  it("maps every failure status to BLOCKED, never a false SHIPPED", () => {
    expect(runStatusLabel("failed")).toBe("BLOCKED");
    expect(runStatusLabel("halted")).toBe("BLOCKED");
    expect(runStatusLabel("cancelled")).toBe("BLOCKED");
    expect(runStatusLabel("completed_with_failures")).toBe("BLOCKED");
  });

  it("maps both completed and done to SHIPPED", () => {
    expect(runStatusLabel("completed")).toBe("SHIPPED");
    expect(runStatusLabel("done")).toBe("SHIPPED");
  });

  it("falls back to the raw status, uppercased, for an unrecognized string", () => {
    expect(runStatusLabel("some_new_status")).toBe("SOME_NEW_STATUS");
  });
});

const THOUGHT_STEP: LoopStep = { kind: "thought", text: "checking the schema" };

describe("hasCanvasContent", () => {
  it("is false when there is nothing at all", () => {
    expect(hasCanvasContent({ run: null, memoryRecalls: [], criticVerdict: null })).toBe(false);
  });

  it("is false for a run with zero steps (not yet started)", () => {
    expect(
      hasCanvasContent({
        run: { steps: [] },
        memoryRecalls: [],
        criticVerdict: null,
      }),
    ).toBe(false);
  });

  it("is true once the run has at least one step", () => {
    expect(
      hasCanvasContent({
        run: { steps: [THOUGHT_STEP] },
        memoryRecalls: [],
        criticVerdict: null,
      }),
    ).toBe(true);
  });

  it("is true with memory recalls alone, even with no run", () => {
    expect(
      hasCanvasContent({
        run: null,
        memoryRecalls: [{ id: "m1", content: "a past decision", kind: "decision" }],
        criticVerdict: null,
      }),
    ).toBe(true);
  });

  it("is true with a Critic verdict alone, even with no run or citations", () => {
    expect(
      hasCanvasContent({
        run: null,
        memoryRecalls: [],
        criticVerdict: {
          verdict: "ship",
          summary: "clear win",
          risks: [],
          kill_criteria: [],
          missing_evidence: [],
          confidence: 0.8,
          reviewer_model: "test",
          reviewed_at: "2026-07-03T00:00:00Z",
        },
      }),
    ).toBe(true);
  });
});
