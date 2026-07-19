// MissionShellView: the room's five regions with mock data. The pure view is
// tested (no router, no query client, no providers); the connected
// MissionShell only wires live hooks onto the same props. There is no repo
// pattern for mounted route tests (src/routes/__tests__ holds a template
// only), so route behavior is covered by the Playwright smoke instead.
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { MissionShellView, type MissionShellViewProps } from "../MissionShellView";
import type { StageLoopState } from "../Spine";

const loopStages: StageLoopState[] = [
  { stage: "discover", state: "done", receipt: "SIG-208" },
  { stage: "decide", state: "gate", gateCount: 2 },
  { stage: "build", state: "active", liveVerb: "writing the change" },
];

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
    dayLabel: "Sunday, July 19",
    receipts: [
      { id: "r-1", text: "Saved replies spec moved to approved", actor: "draft", time: "10:26 AM" },
      { id: "r-2", text: "Pricing test moved to staging", actor: "human", time: "9:14 AM" },
    ],
    receiptsLoaded: true,
    onAsk: mock(() => {}),
    canvasMarker: "01 Discover",
    canvasTitle: "Relay",
    canvas: <div data-testid="canvas-face">the face</div>,
    ...overrides,
  };
}

describe("MissionShellView: the five regions", () => {
  test("renders TopBar, Spine, Thread, Canvas, and Composer", () => {
    const { container } = render(<MissionShellView {...makeProps()} />);
    for (const region of ["topbar", "spine", "thread", "canvas", "composer"]) {
      expect(container.querySelector(`[data-region="${region}"]`)).toBeTruthy();
    }
    // The Spine is whole: all seven stages present.
    expect(container.querySelectorAll("button[data-stage]").length).toBe(7);
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

  test("both Ask affordances open Ask; there is never a second input box", () => {
    const props = makeProps();
    const { container } = render(<MissionShellView {...props} />);
    const askButtons = screen.getAllByLabelText("Ask Supaprod");
    expect(askButtons.length).toBe(2); // TopBar button + composer strip
    for (const b of askButtons) fireEvent.click(b);
    expect(props.onAsk).toHaveBeenCalledTimes(2);
    // One input model: the shell itself renders no text input or textarea.
    expect(container.querySelector("input, textarea, [contenteditable=true]")).toBe(null);
    // The shortcut teaches itself on both affordances.
    expect(screen.getAllByText("⌘J").length).toBe(2);
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

  test("the Thread shows the day label and the receipts", () => {
    render(<MissionShellView {...makeProps()} />);
    expect(screen.getByText("Sunday, July 19")).toBeTruthy();
    expect(screen.getByText("Saved replies spec moved to approved")).toBeTruthy();
    expect(screen.getByText("Pricing test moved to staging")).toBeTruthy();
    // A human-authored receipt carries the You byline, not an agent chip.
    expect(screen.getByText("You")).toBeTruthy();
  });

  test("an empty, settled Thread renders the honest WarmSlot line, never blank", () => {
    render(<MissionShellView {...makeProps({ receipts: [], receiptsLoaded: true })} />);
    expect(
      screen.getByText(
        "Nothing has moved in the last 24 hours. Ask for work and the receipts land here.",
      ),
    ).toBeTruthy();
  });
});
