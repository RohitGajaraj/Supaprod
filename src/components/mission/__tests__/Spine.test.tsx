import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import {
  Spine,
  SPINE_STAGES,
  resolveLoopState,
  isStageDimmed,
  primaryActiveStage,
  stageStateWord,
  stageAriaLabel,
  type StageLoopState,
} from "../Spine";

describe("pure helpers", () => {
  describe("resolveLoopState", () => {
    test("finds a reported stage", () => {
      const states: StageLoopState[] = [
        { stage: "build", state: "active", liveVerb: "writing the change" },
      ];
      expect(resolveLoopState(states, "build").state).toBe("active");
      expect(resolveLoopState(states, "build").liveVerb).toBe("writing the change");
    });

    test("an unreported stage is quiet, never missing", () => {
      expect(resolveLoopState([], "design")).toEqual({ stage: "design", state: "quiet" });
    });
  });

  describe("isStageDimmed (slice highlighting)", () => {
    test("no slice lights the whole loop", () => {
      for (const { id } of SPINE_STAGES) {
        expect(isStageDimmed(id)).toBe(false);
        expect(isStageDimmed(id, [])).toBe(false);
      }
    });

    test("a slice dims stages outside it and keeps stages inside lit", () => {
      const slice = ["discover", "decide", "plan"] as const;
      expect(isStageDimmed("discover", [...slice])).toBe(false);
      expect(isStageDimmed("plan", [...slice])).toBe(false);
      expect(isStageDimmed("design", [...slice])).toBe(true);
      expect(isStageDimmed("learn", [...slice])).toBe(true);
    });
  });

  describe("primaryActiveStage (one live locus)", () => {
    test("null when nothing is active", () => {
      expect(primaryActiveStage([{ stage: "decide", state: "gate" }])).toBe(null);
    });

    test("picks the earliest active stage in loop order, not input order", () => {
      const states: StageLoopState[] = [
        { stage: "ship", state: "active" },
        { stage: "plan", state: "active" },
      ];
      expect(primaryActiveStage(states)).toBe("plan");
    });
  });

  describe("stageStateWord", () => {
    test("active uses the live verb, with an honest fallback", () => {
      expect(
        stageStateWord({ stage: "build", state: "active", liveVerb: "writing the change" }),
      ).toBe("writing the change");
      expect(stageStateWord({ stage: "build", state: "active" })).toBe("working");
    });

    test("gate says your call", () => {
      expect(stageStateWord({ stage: "decide", state: "gate", gateCount: 3 })).toBe("your call");
    });

    test("inferred names itself, quiet carries its note or stays silent", () => {
      expect(stageStateWord({ stage: "plan", state: "inferred" })).toBe("inferred");
      expect(stageStateWord({ stage: "learn", state: "quiet", receipt: "Mon 9am" })).toBe(
        "Mon 9am",
      );
      expect(stageStateWord({ stage: "learn", state: "quiet" })).toBe(null);
      expect(stageStateWord({ stage: "ship", state: "done", receipt: "REL-19" })).toBe(null);
    });
  });

  describe("stageAriaLabel", () => {
    test("done carries its receipt", () => {
      expect(
        stageAriaLabel({ stage: "plan", state: "done", receipt: "SPEC-52" }, "03", "Plan"),
      ).toBe("03 Plan: done, SPEC-52");
    });

    test("gate carries the waiting count", () => {
      expect(stageAriaLabel({ stage: "decide", state: "gate", gateCount: 3 }, "02", "Decide")).toBe(
        "02 Decide: your call, 3 waiting",
      );
    });
  });
});

describe("Spine rendering", () => {
  const states: StageLoopState[] = [
    { stage: "discover", state: "done", receipt: "SIG-208" },
    { stage: "decide", state: "gate", gateCount: 3 },
    { stage: "build", state: "active", liveVerb: "writing the change" },
  ];

  test("renders all seven numbered nodes, always whole", () => {
    const { container } = render(<Spine states={states} />);
    const nodes = container.querySelectorAll("button[data-stage]");
    expect(nodes.length).toBe(7);
    expect(screen.getByText("01")).toBeTruthy();
    expect(screen.getByText("Discover")).toBeTruthy();
    expect(screen.getByText("07")).toBeTruthy();
    expect(screen.getByText("Learn")).toBeTruthy();
  });

  test("entry and exit caps render in plain words", () => {
    render(<Spine states={states} startsFrom="a ticket spike" endsWith="outcomes read" />);
    expect(screen.getByText("Starts from: a ticket spike")).toBeTruthy();
    expect(screen.getByText("Ends with: outcomes read")).toBeTruthy();
  });

  test("ember rides the gate node only, with its count", () => {
    const { container } = render(<Spine states={states} />);
    const gate = container.querySelector('button[data-stage="decide"]');
    expect(gate?.className).toContain("voice-human");
    expect(screen.getByText("3")).toBeTruthy();
    const done = container.querySelector('button[data-stage="discover"]');
    expect(done?.className).not.toContain("voice-human");
  });

  test("the single active node carries the working pulse", () => {
    const { container } = render(<Spine states={states} />);
    const active = container.querySelector('button[data-stage="build"] .ink-working');
    expect(active).toBeTruthy();
    expect(container.querySelectorAll(".ink-working").length).toBe(1);
  });

  test("a second active stage renders without the pulse (one live locus)", () => {
    const twoActive: StageLoopState[] = [
      { stage: "plan", state: "active" },
      { stage: "ship", state: "active" },
    ];
    const { container } = render(<Spine states={twoActive} />);
    expect(container.querySelectorAll(".ink-working").length).toBe(1);
    expect(container.querySelector('button[data-stage="plan"] .ink-working')).toBeTruthy();
    expect(container.querySelector('button[data-stage="ship"] .ink-working')).toBe(null);
  });

  test("journeyStages dims nodes outside the slice", () => {
    const { container } = render(
      <Spine states={states} journeyStages={["discover", "decide", "plan"]} />,
    );
    expect(container.querySelector('button[data-stage="ship"]')?.className).toContain("opacity-40");
    expect(container.querySelector('button[data-stage="decide"]')?.className).not.toContain(
      "opacity-40",
    );
  });

  test("clicking a node reports its stage", () => {
    const onStageSelect = mock(() => {});
    const { container } = render(<Spine states={states} onStageSelect={onStageSelect} />);
    fireEvent.click(container.querySelector('button[data-stage="decide"]')!);
    expect(onStageSelect).toHaveBeenCalledWith("decide");
  });

  test("done nodes show their artifact chip; the return edge labels the loop", () => {
    render(<Spine states={states} />);
    expect(screen.getByText("SIG-208")).toBeTruthy();
    expect(screen.getByText("what Learn records feeds the next loop")).toBeTruthy();
  });
});
