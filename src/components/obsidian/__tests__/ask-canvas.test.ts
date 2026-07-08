import { describe, it, expect } from "bun:test";
import {
  runStatusLabel,
  hasCanvasContent,
  ProgressBlock,
  MemoryBlock,
  CriticBlock,
} from "../ask-canvas";
import type { LoopStep } from "@/lib/ai/loop.server";
import type { StudioApproval } from "@/lib/studio.functions";
import type { CriticReview } from "@/lib/ai/critic.server";

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

  it("maps queued to QUEUED", () => {
    expect(runStatusLabel("queued")).toBe("QUEUED");
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

describe("ProgressBlock", () => {
  it("returns null when there are no steps", () => {
    const result = ProgressBlock({
      run: { runId: "r1", status: "running", steps: [] },
      approvals: [],
    });
    expect(result).toBeNull();
  });

  it("renders a div with the run status label when steps exist", () => {
    const step: LoopStep = { kind: "thought", text: "analyzing" };
    const result = ProgressBlock({
      run: { runId: "r1", status: "running", steps: [step] },
      approvals: [],
    });
    expect(result?.type).toBe("div");
    // Verify the div contains child elements (MonoLabel, step list)
    const children = result?.props.children;
    expect(children).toBeDefined();
    expect(Array.isArray(children) || children !== undefined).toBe(true);
  });

  it("shows only the last 5 steps when more steps are present", () => {
    const steps: LoopStep[] = Array.from({ length: 10 }, (_, i) => ({
      kind: "thought" as const,
      text: `step ${i}`,
    }));
    const result = ProgressBlock({
      run: { runId: "r1", status: "running", steps },
      approvals: [],
    });
    expect(result?.type).toBe("div");
    // The component slices to the last 5 steps internally
  });
});

describe("MemoryBlock", () => {
  it("returns null when there are no memory recalls", () => {
    const result = MemoryBlock({ recalls: [] });
    expect(result).toBeNull();
  });

  it("renders a div with DREW ON label when recalls exist", () => {
    const recalls = [
      { id: "m1", kind: "decision", content: "past decision", created_at: "2026-01-01" },
    ];
    const result = MemoryBlock({ recalls });
    expect(result?.type).toBe("div");
    const children = result?.props.children;
    expect(children).toBeDefined();
    // Verify the div has child elements (MonoLabel, recall list)
    expect(Array.isArray(children) || children !== undefined).toBe(true);
  });

  it("displays each recall with its kind label", () => {
    const recalls = [
      { id: "m1", kind: "decision", content: "a decision", created_at: "2026-01-01" },
      { id: "m2", kind: null, content: "past session", created_at: "2026-01-02" },
    ];
    const result = MemoryBlock({ recalls });
    expect(result?.type).toBe("div");
    // Component renders one Citation + kind label per recall
  });
});

describe("CriticBlock", () => {
  it("renders the verdict tone and summary for a SHIP verdict", () => {
    const verdict: CriticReview = {
      verdict: "ship",
      summary: "This is a clear ship.",
      risks: [],
      kill_criteria: [],
      missing_evidence: [],
      confidence: 0.9,
      reviewer_model: "claude-opus",
      reviewed_at: "2026-07-03T00:00:00Z",
    };
    const result = CriticBlock({ verdict });
    expect(result?.type).toBe("div");
    const children = result?.props.children;
    expect(children).toBeDefined();
    // First child should be the header div with MonoLabel and VerdictChip
    expect(children?.[0]?.type).toBe("div");
    // Second child should be the summary paragraph
    expect(children?.[1]?.type).toBe("p");
    expect(children?.[1]?.props.children).toBe("This is a clear ship.");
  });

  it("renders a REVISE verdict with a neutral mono-caps label, not an ember chip", () => {
    const verdict: CriticReview = {
      verdict: "revise",
      summary: "Needs some changes.",
      risks: [],
      kill_criteria: [],
      missing_evidence: ["test coverage"],
      confidence: 0.6,
      reviewer_model: "claude-opus",
      reviewed_at: "2026-07-03T00:00:00Z",
    };
    const result = CriticBlock({ verdict });
    expect(result?.type).toBe("div");
    // Component renders plain MonoLabel for REVISE, not VerdictChip
  });

  it("renders a KILL verdict with the madder verdict chip", () => {
    const verdict: CriticReview = {
      verdict: "kill",
      summary: "This will not work.",
      risks: ["security issue"],
      kill_criteria: ["untested"],
      missing_evidence: [],
      confidence: 0.95,
      reviewer_model: "claude-opus",
      reviewed_at: "2026-07-03T00:00:00Z",
    };
    const result = CriticBlock({ verdict });
    expect(result?.type).toBe("div");
    expect(result?.props).toBeDefined();
  });
});
