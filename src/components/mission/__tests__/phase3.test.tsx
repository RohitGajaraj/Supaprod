// Phase 3 (front-end reimagining): the net-new comprehension surfaces.
// CanvasFace (the contract), ApprovalsTray (keyed verdicts), and WorkingStrip
// (the always-on line) are pure views, so they test without providers, the
// same pattern as MissionShellView. Wired behavior (faces reading real data,
// the signature moment through react-query) is covered by the Playwright
// smoke, per the repo convention.

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { CanvasFace } from "../CanvasFace";
import { ApprovalsTray } from "../ApprovalsTray";
import { WorkingStrip } from "../WorkingStrip";
import type { StageLoopState } from "../Spine";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

function makeItem(over: Partial<ApprovalQueueItem> = {}): ApprovalQueueItem {
  return {
    id: over.id ?? "q-1",
    kind: "PROPOSAL",
    title: over.title ?? "The pricing spec is ready for you.",
    evidence: over.evidence ?? ["Draft recommends approving. 7 requirements."],
    approveConsequence: over.approveConsequence ?? "Approving starts the build.",
    rejectConsequence: over.rejectConsequence ?? "Declining drops it, on the record.",
    kindKey: over.kindKey ?? "spec",
    sourceId: over.sourceId ?? "spec-1",
    filterBucket: "proposals",
    projectId: over.projectId ?? "p-1",
    projectName: over.projectName ?? "Relay",
    ...over,
  } as ApprovalQueueItem;
}

describe("CanvasFace: the one contract", () => {
  test("renders the header (marker + title) and the body content", () => {
    render(
      <CanvasFace stageMarker="03 Plan" title="Spec" deepLink="/m/p1?stage=plan">
        <div data-testid="body">the spec</div>
      </CanvasFace>,
    );
    expect(screen.getByText("03 Plan")).toBeTruthy();
    expect(screen.getByText("Spec")).toBeTruthy();
    expect(screen.getByTestId("body")).toBeTruthy();
  });

  test("renders the working triple only when working is set", () => {
    const { rerender, container } = render(<CanvasFace stageMarker="05 Build" title="Code" />);
    expect(container.querySelector('[data-testid="working-triple"]')).toBe(null);
    rerender(
      <CanvasFace
        stageMarker="05 Build"
        title="Code"
        working={{ agentSlug: "builder", line: "writing the change" }}
      />,
    );
    expect(screen.getByTestId("working-triple")).toBeTruthy();
    expect(screen.getByText("writing the change")).toBeTruthy();
  });

  test("empty renders a WarmSlot line, never a blank", () => {
    render(
      <CanvasFace
        stageMarker="01 Discover"
        title="Evidence"
        emptyLine={{ text: "Nothing to read yet. Connect a source." }}
      />,
    );
    expect(screen.getByText("Nothing to read yet. Connect a source.")).toBeTruthy();
  });

  test("error renders the blocked reason + recovery verb", () => {
    const onAction = mock(() => {});
    render(
      <CanvasFace
        stageMarker="01 Discover"
        title="Evidence"
        error={{ message: "Could not read the signals.", actionLabel: "Try again", onAction }}
      />,
    );
    expect(screen.getByText("Could not read the signals.")).toBeTruthy();
    fireEvent.click(screen.getByText("Try again"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test("no cost figures render in the header or working triple", () => {
    const { container } = render(
      <CanvasFace
        stageMarker="05 Build"
        title="Code"
        working={{ agentSlug: "builder", line: "writing the change", time: "About 4 minutes" }}
      >
        <div>body</div>
      </CanvasFace>,
    );
    const text = container.textContent ?? "";
    expect(/credit|token|\$\d|\bcost\b/i.test(text)).toBe(false);
  });
});

describe("ApprovalsTray: keyed verdicts, one source", () => {
  const items = [
    makeItem({ id: "q-1", sourceId: "s-1", title: "First gate" }),
    makeItem({ id: "q-2", sourceId: "s-2", title: "Second gate" }),
  ];

  test("renders one GateChip card per item, closed hides nothing but is inert", () => {
    render(
      <ApprovalsTray
        open
        onClose={mock(() => {})}
        items={items}
        focusedId="q-1"
        onFocusChange={mock(() => {})}
        onDecide={mock(() => {})}
      />,
    );
    expect(screen.getByText("First gate")).toBeTruthy();
    expect(screen.getByText("Second gate")).toBeTruthy();
    // Two honest verbs are wired; Send back / Snooze are not faked.
    expect(screen.getAllByText(/Approve and run/).length).toBe(2);
    expect(screen.queryByText("Send back")).toBe(null);
    expect(screen.queryByText("Snooze")).toBe(null);
  });

  test("1 approves and 3 declines the focused item with the real verdict", () => {
    const onDecide = mock(() => {});
    render(
      <ApprovalsTray
        open
        onClose={mock(() => {})}
        items={items}
        focusedId="q-1"
        onFocusChange={mock(() => {})}
        onDecide={onDecide}
      />,
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
    expect(onDecide).toHaveBeenCalledWith(items[0], "approve");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "3" }));
    expect(onDecide).toHaveBeenCalledWith(items[0], "reject");
  });

  test("J moves focus down, Escape closes", () => {
    const onFocusChange = mock(() => {});
    const onClose = mock(() => {});
    render(
      <ApprovalsTray
        open
        onClose={onClose}
        items={items}
        focusedId="q-1"
        onFocusChange={onFocusChange}
        onDecide={mock(() => {})}
      />,
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    expect(onFocusChange).toHaveBeenCalledWith("q-2");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("when onSnooze is wired, the Snooze verb renders and H snoozes the focused item", () => {
    const onSnooze = mock(() => {});
    render(
      <ApprovalsTray
        open
        onClose={mock(() => {})}
        items={items}
        focusedId="q-2"
        onFocusChange={mock(() => {})}
        onDecide={mock(() => {})}
        onSnooze={onSnooze}
      />,
    );
    expect(screen.getAllByText("Snooze").length).toBeGreaterThan(0);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    expect(onSnooze).toHaveBeenCalledWith(items[1]);
  });

  test("Enter opens the focused item's evidence", () => {
    const onOpenEvidence = mock(() => {});
    render(
      <ApprovalsTray
        open
        onClose={mock(() => {})}
        items={items}
        focusedId="q-2"
        onFocusChange={mock(() => {})}
        onDecide={mock(() => {})}
        onOpenEvidence={onOpenEvidence}
      />,
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onOpenEvidence).toHaveBeenCalledWith(items[1]);
  });

  test("empty queue shows the honest line, and no cost figures anywhere", () => {
    const { container } = render(
      <ApprovalsTray
        open
        onClose={mock(() => {})}
        items={[]}
        focusedId={null}
        onFocusChange={mock(() => {})}
        onDecide={mock(() => {})}
      />,
    );
    expect(screen.getByText(/Nothing needs you/)).toBeTruthy();
    expect(/credit|token|\$\d/i.test(container.textContent ?? "")).toBe(false);
  });
});

describe("WorkingStrip: always-on, cost-quiet", () => {
  const loop: StageLoopState[] = [
    { stage: "build", state: "active", liveVerb: "writing the change" },
    { stage: "discover", state: "quiet" },
  ];

  test("renders the live line and the summary with the waiting count", () => {
    render(
      <WorkingStrip
        loopStages={loop}
        waitingCount={3}
        onOpenApprovals={mock(() => {})}
      />,
    );
    expect(screen.getByText("writing the change")).toBeTruthy();
    expect(screen.getByText(/1 agent working/)).toBeTruthy();
    expect(screen.getByText("3 waiting on you")).toBeTruthy();
  });

  test("clicking the waiting clause opens the tray", () => {
    const onOpenApprovals = mock(() => {});
    render(
      <WorkingStrip loopStages={loop} waitingCount={2} onOpenApprovals={onOpenApprovals} />,
    );
    fireEvent.click(screen.getByText("2 waiting on you"));
    expect(onOpenApprovals).toHaveBeenCalledTimes(1);
  });

  test("nothing waiting reads honestly, and no cost figures render", () => {
    const { container } = render(
      <WorkingStrip loopStages={[]} waitingCount={0} onOpenApprovals={mock(() => {})} />,
    );
    expect(screen.getByText(/nothing waiting on you/)).toBeTruthy();
    expect(/credit|token|\$\d/i.test(container.textContent ?? "")).toBe(false);
  });
});
