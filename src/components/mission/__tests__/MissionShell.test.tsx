// MissionShellView: the room's five regions with mock data. The pure view is
// tested (no router, no query client, no providers); the connected
// MissionShell only wires live hooks onto the same props. There is no repo
// pattern for mounted route tests (src/routes/__tests__ holds a template
// only), so route behavior is covered by the Playwright smoke instead.
//
// Phase 2: the placeholder thread and strip are gone - the view renders the
// real Thread and Composer, the Spine takes the journey slice, and the done
// journey's handoff door (NextLine) lands in the thread column. The journey
// helpers (journeyActivation / journeyIsDone / journeyHandoffFor) are pure
// exports of MissionShell and are tested here without providers.
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { MissionShellView, type MissionShellViewProps } from "../MissionShellView";
import { journeyActivation, journeyIsDone, journeyHandoffFor } from "../journey-wiring";
import type { StageId, StageLoopState } from "../Spine";
import type { JourneyId } from "@/lib/journeys";
import { journeyById } from "@/lib/journeys";
import type { DictationState, ReadAloudState } from "@/hooks/use-voice";

const loopStages: StageLoopState[] = [
  { stage: "discover", state: "done", receipt: "SIG-208" },
  { stage: "decide", state: "gate", gateCount: 2 },
  { stage: "build", state: "active", liveVerb: "writing the change" },
];

function makeDictation(): DictationState {
  return { supported: false, listening: false, interim: "", start: mock(), stop: mock() };
}

function makeReadAloud(): ReadAloudState {
  return { supported: false, speakingId: null, toggle: mock(), stop: mock() };
}

function makeThread(
  overrides: Partial<MissionShellViewProps["thread"]> = {},
): MissionShellViewProps["thread"] {
  return {
    dayLabel: "Sunday, July 19",
    briefing: {
      dayLabel: "Sunday, July 19",
      paragraphs: ["Agents finished 2 pieces of work overnight."],
      receipts: [],
      needsYouCount: 3,
    },
    briefingLoaded: true,
    gates: [],
    onDecideGate: mock(() => {}),
    onOpenApprovals: mock(() => {}),
    messages: [],
    streaming: false,
    liveStatus: null,
    promotedByMsg: {},
    onPromote: mock(() => {}),
    onRetry: mock(() => {}),
    readAloud: makeReadAloud(),
    ...overrides,
  };
}

function makeComposer(
  overrides: Partial<MissionShellViewProps["composer"]> = {},
): MissionShellViewProps["composer"] {
  return {
    draft: "",
    onDraftChange: mock(() => {}),
    onSubmitIntent: mock(() => {}),
    onActivateJourney: mock(() => {}),
    onRun: mock(() => {}),
    streaming: false,
    dictation: makeDictation(),
    expanded: false,
    onExpandedChange: mock(() => {}),
    ...overrides,
  };
}

function makeProps(overrides: Partial<MissionShellViewProps> = {}): MissionShellViewProps {
  return {
    workspaceName: "Helio Labs",
    productName: "Relay",
    products: [
      { id: "p-1", name: "Relay" },
      { id: "p-2", name: "Comet" },
    ],
    activeProductId: "p-1",
    onSelectProduct: mock(() => {}),
    queueCount: 3,
    onOpenDoor: mock(() => {}),
    stage: "discover",
    onStageSelect: mock(() => {}),
    loopStages,
    onAsk: mock(() => {}),
    thread: makeThread(),
    composer: makeComposer(),
    canvasMarker: "01 Discover",
    canvasTitle: "Relay",
    canvas: <div data-testid="canvas-face">the face</div>,
    ...overrides,
  };
}

describe("MissionShellView: the five regions", () => {
  test("renders TopBar, Spine, the real Thread, Canvas, and the real Composer", () => {
    const { container } = render(<MissionShellView {...makeProps()} />);
    for (const region of ["topbar", "spine", "thread", "canvas", "composer"]) {
      expect(container.querySelector(`[data-region="${region}"]`)).toBeTruthy();
    }
    // The Spine is whole: all seven stages present.
    expect(container.querySelectorAll("button[data-stage]").length).toBe(7);
    // Region 3 is the REAL Thread (briefing card included), not a placeholder.
    expect(screen.getByTestId("thread")).toBeTruthy();
    expect(screen.getByTestId("briefing-card")).toBeTruthy();
    expect(screen.getByText("Agents finished 2 pieces of work overnight.")).toBeTruthy();
    // Region 5 is the REAL Composer's docked strip.
    expect(screen.getByTestId("composer-docked")).toBeTruthy();
    // The Canvas renders the provided face under the shared SurfaceHeader.
    expect(screen.getByTestId("canvas-face")).toBeTruthy();
    expect(screen.getByText("01 Discover")).toBeTruthy();
  });

  test("nav is exactly the 4 doors, and a door click reports its id", () => {
    const props = makeProps();
    const { container } = render(<MissionShellView {...props} />);
    const doors = container.querySelectorAll("button[data-door]");
    expect(doors.length).toBe(4);
    expect(screen.getByText("Mission Control")).toBeTruthy();
    fireEvent.click(container.querySelector('button[data-door="approvals"]')!);
    expect(props.onOpenDoor).toHaveBeenCalledWith("approvals");
  });

  test("the needs-you pill shows the one count, and hides at zero", () => {
    const { rerender } = render(<MissionShellView {...makeProps({ queueCount: 3 })} />);
    expect(screen.getByTestId("needs-you-pill").textContent).toBe("3");
    rerender(<MissionShellView {...makeProps({ queueCount: 0 })} />);
    expect(screen.queryByTestId("needs-you-pill")).toBe(null);
  });

  test("collapsed dock: both Ask affordances present, never a second input box", () => {
    const props = makeProps();
    const { container } = render(<MissionShellView {...props} />);
    // TopBar Ask summons the overlay; the collapsed strip expands the dock.
    const askButtons = screen.getAllByLabelText("Ask Supaprod");
    expect(askButtons.length).toBe(2);
    fireEvent.click(askButtons[0]);
    expect(props.onAsk).toHaveBeenCalledTimes(1);
    // One input model: collapsed, the shell renders no text input at all.
    expect(container.querySelector("input, textarea, [contenteditable=true]")).toBe(null);
  });

  test("expanded dock renders exactly ONE input box", () => {
    const { container } = render(
      <MissionShellView {...makeProps({ composer: makeComposer({ expanded: true }) })} />,
    );
    expect(container.querySelectorAll("textarea, input, [contenteditable=true]").length).toBe(1);
  });

  test("clicking a Spine stage reports the stage", () => {
    const props = makeProps();
    const { container } = render(<MissionShellView {...props} />);
    fireEvent.click(container.querySelector('button[data-stage="plan"]')!);
    expect(props.onStageSelect).toHaveBeenCalledWith("plan");
  });

  test("the product switcher lists products and selects one", () => {
    const props = makeProps();
    render(<MissionShellView {...props} />);
    fireEvent.click(screen.getByText("Helio Labs / Relay"));
    fireEvent.click(screen.getByText("Comet"));
    expect(props.onSelectProduct).toHaveBeenCalledWith("p-2");
  });

  test("an unloaded briefing shows the honest reading line, never blank", () => {
    render(
      <MissionShellView
        {...makeProps({ thread: makeThread({ briefing: null, briefingLoaded: false }) })}
      />,
    );
    expect(screen.getByText("Reading the last 24 hours.")).toBeTruthy();
  });
});

describe("MissionShellView: journey slice and handoff", () => {
  test("a journey slice dims the stages outside it, and only those", () => {
    const { container } = render(
      <MissionShellView {...makeProps({ journeyStages: ["plan"] as StageId[] })} />,
    );
    const dimmed = (id: string) =>
      container.querySelector(`button[data-stage="${id}"]`)!.className.includes("opacity-40");
    expect(dimmed("plan")).toBe(false);
    for (const outside of ["discover", "decide", "design", "build", "ship", "learn"]) {
      expect(dimmed(outside)).toBe(true);
    }
  });

  test("no journey means the whole loop stays lit", () => {
    const { container } = render(<MissionShellView {...makeProps()} />);
    for (const btn of container.querySelectorAll("button[data-stage]")) {
      expect(btn.className.includes("opacity-40")).toBe(false);
    }
  });

  test("the done-journey handoff renders the NextLine door in the thread column", () => {
    const onGo = mock(() => {});
    render(
      <MissionShellView
        {...makeProps({
          journeyHandoff: {
            text: "An approved, cited spec with assumptions on watch and a task graph.",
            doorLabel: "Design this",
            onGo,
          },
        })}
      />,
    );
    const handoff = screen.getByTestId("journey-handoff");
    expect(handoff).toBeTruthy();
    fireEvent.click(screen.getByText("Design this"));
    expect(onGo).toHaveBeenCalledTimes(1);
  });

  test("no handoff renders while the journey is still moving", () => {
    render(<MissionShellView {...makeProps({ journeyHandoff: null })} />);
    expect(screen.queryByTestId("journey-handoff")).toBe(null);
  });
});

describe("journey helpers (pure, from MissionShell)", () => {
  test("activation lands on the slice's first stage with the whole slice lit", () => {
    expect(journeyActivation("j1")).toEqual({ stage: "discover", slice: ["discover", "decide"] });
    expect(journeyActivation("j3")).toEqual({ stage: "plan", slice: ["plan"] });
    expect(journeyActivation("j0").slice.length).toBe(7);
  });

  test("a journey is done only when every stage of its slice reports done", () => {
    const states: StageLoopState[] = [
      { stage: "discover", state: "done" },
      { stage: "decide", state: "gate" },
    ];
    expect(journeyIsDone("j1", states)).toBe(false);
    const allDone: StageLoopState[] = [
      { stage: "discover", state: "done" },
      { stage: "decide", state: "done" },
    ];
    expect(journeyIsDone("j1", allDone)).toBe(true);
    // An unreported stage is quiet, never done.
    expect(journeyIsDone("j3", [])).toBe(false);
  });

  test("the handoff line names the done state and the suggested next journey", () => {
    const states: StageLoopState[] = [
      { stage: "discover", state: "done" },
      { stage: "decide", state: "done" },
    ];
    const activated: JourneyId[] = [];
    const handoff = journeyHandoffFor("j1", states, (id) => activated.push(id));
    expect(handoff).not.toBe(null);
    expect(handoff!.text).toBe(journeyById("j1").doneState);
    expect(handoff!.doorLabel).toBe(journeyById("j2").label);
    handoff!.onGo();
    expect(activated).toEqual(["j2"]);
  });

  test("no handoff while the slice is not done", () => {
    expect(journeyHandoffFor("j1", [], () => {})).toBe(null);
  });
});

/** The activation contract end to end at the view level: a chip click in the
 *  expanded composer drives the Spine slice and the Canvas stage, using the
 *  same pure helper the connected shell uses. */
function JourneyHarness() {
  const [journey, setJourney] = React.useState<JourneyId | null>(null);
  const [stage, setStage] = React.useState<StageId>("discover");
  const props = makeProps({
    stage,
    onStageSelect: setStage,
    journeyStages: journey ? journeyActivation(journey).slice : undefined,
    composer: makeComposer({
      expanded: true,
      onActivateJourney: (id) => {
        const { stage: first } = journeyActivation(id);
        setJourney(id);
        setStage(first);
      },
    }),
    canvasMarker: stage,
    canvas: <div data-testid="canvas-face">{stage}</div>,
  });
  return <MissionShellView {...props} />;
}

describe("journey activation drives the Spine slice", () => {
  test("activating Just write the PRD lights plan and moves the canvas there", () => {
    const { container } = render(<JourneyHarness />);
    fireEvent.click(container.querySelector('button[data-journey="j3"]')!);
    // The slice: plan stays lit, everything else dims.
    expect(
      container.querySelector('button[data-stage="plan"]')!.className.includes("opacity-40"),
    ).toBe(false);
    expect(
      container.querySelector('button[data-stage="discover"]')!.className.includes("opacity-40"),
    ).toBe(true);
    // The canvas landed on the journey's first stage.
    expect(screen.getByTestId("canvas-face").textContent).toBe("plan");
  });
});
