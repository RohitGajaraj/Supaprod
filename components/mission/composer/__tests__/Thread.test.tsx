// Thread: day divider + briefing placement (the Briefing card sits directly
// under the day divider, top of day), inline gate cards on the shared
// GateChip with real decide wiring, streamed answers, promote chips on
// settled results, read-aloud affordance, cost-quiet.
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { Thread, type ThreadProps } from "../Thread";
import type { Briefing } from "@/lib/briefing.functions";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";
import type { AskStreamMsg } from "@/lib/ask-stream-core";
import type { ChatMeta } from "@/components/chat/MessageMeta";
import type { ReadAloudState } from "@/hooks/use-voice";

const briefing: Briefing = {
  dayLabel: "Sunday, July 19",
  paragraphs: [
    "Agents finished 2 pieces of work in the last 24 hours across Plan and Build.",
    "1 call waits on you: 1 at Decide.",
  ],
  receipts: [
    {
      id: "r-1",
      text: "Spec approved 3 hours ago",
      at: "2026-07-19T07:00:00Z",
      stage: "plan",
      actor: "draft",
    },
  ],
  needsYouCount: 1,
};

function makeGate(overrides: Partial<ApprovalQueueItem> = {}): ApprovalQueueItem {
  return {
    id: "q-1",
    kind: "PROPOSAL",
    title: "Ship the saved replies spec",
    evidence: ["12 signals point at checkout friction"],
    approveConsequence: "Agents start the build the moment you approve.",
    rejectConsequence: "The spec goes back to draft.",
    kindKey: "spec",
    sourceId: "spec-1",
    filterBucket: "proposals",
    projectId: "p-1",
    projectName: "Relay",
    project: "Relay",
    ...overrides,
  };
}

const meta: ChatMeta = {
  model: "test-model",
  via: "gateway",
  latency_ms: 900,
  tokens_in: 10,
  tokens_out: 20,
  cost_usd: 0.42,
  sources: [],
  web_used: false,
  workspace_chunks: 0,
};

function makeReadAloud(overrides: Partial<ReadAloudState> = {}): ReadAloudState {
  return {
    supported: true,
    speakingId: null,
    toggle: mock(() => {}),
    stop: mock(() => {}),
    ...overrides,
  };
}

function makeProps(overrides: Partial<ThreadProps> = {}): ThreadProps {
  return {
    dayLabel: "Sunday, July 19",
    briefing,
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

const userMsg: AskStreamMsg = {
  id: "u-1",
  role: "user",
  content: "What should we build next?",
  at: Date.parse("2026-07-19T10:00:00Z"),
};

const answerMsg: AskStreamMsg = {
  id: "a-1",
  role: "assistant",
  content: "The checkout friction cluster is the strongest bet.",
  at: Date.parse("2026-07-19T10:00:05Z"),
  meta,
};

describe("Thread: day divider and briefing placement", () => {
  test("the day divider renders the day label, and the Briefing card sits directly under it", () => {
    render(<Thread {...makeProps()} />);
    const divider = screen.getByTestId("thread-day-divider");
    const card = screen.getByTestId("briefing-card");
    expect(divider.textContent).toContain("Sunday, July 19");
    // Placement: divider first, briefing immediately next among the column's children.
    const thread = screen.getByTestId("thread");
    expect(thread.children[0]).toBe(divider);
    expect(thread.children[1]).toBe(card);
  });

  test("the briefing renders its paragraphs and receipts", () => {
    render(<Thread {...makeProps()} />);
    expect(
      screen.getByText(
        "Agents finished 2 pieces of work in the last 24 hours across Plan and Build.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("1 call waits on you: 1 at Decide.")).toBeTruthy();
    expect(screen.getByText("Spec approved 3 hours ago")).toBeTruthy();
  });

  test("an unsettled briefing shows the honest reading line, never blank", () => {
    render(<Thread {...makeProps({ briefing: null, briefingLoaded: false })} />);
    expect(screen.getByText("Reading the last 24 hours.")).toBeTruthy();
  });
});

describe("Thread: inline gates", () => {
  test("a gate renders as a GateChip card and Approve or Decline runs the decide seam", () => {
    const props = makeProps({ gates: [makeGate()] });
    render(<Thread {...props} />);
    expect(screen.getByText("Ship the saved replies spec")).toBeTruthy();
    expect(screen.getByText("12 signals point at checkout friction")).toBeTruthy();
    fireEvent.click(screen.getByText("Approve and run"));
    expect(props.onDecideGate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "q-1" }),
      "approve",
    );
    fireEvent.click(screen.getByText("Decline"));
    expect(props.onDecideGate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "q-1" }),
      "reject",
    );
  });

  test("beyond the cap, the remainder collapses to the Approvals door chip", () => {
    const gates = [1, 2, 3, 4, 5].map((n) => makeGate({ id: `q-${n}`, sourceId: `s-${n}` }));
    const props = makeProps({ gates });
    render(<Thread {...props} />);
    const door = screen.getByText("more wait in Approvals");
    expect(door).toBeTruthy();
    fireEvent.click(door);
    expect(props.onOpenApprovals).toHaveBeenCalled();
  });
});

describe("Thread: conversation", () => {
  test("user and assistant messages render on the craft grid, promote chips on the settled result", () => {
    const props = makeProps({ messages: [userMsg, answerMsg] });
    render(<Thread {...props} />);
    expect(screen.getByText("You")).toBeTruthy();
    expect(screen.getByText("What should we build next?")).toBeTruthy();
    expect(screen.getByText("The checkout friction cluster is the strongest bet.")).toBeTruthy();
    fireEvent.click(screen.getByText("Save as note"));
    expect(props.onPromote).toHaveBeenCalledWith(expect.objectContaining({ id: "a-1" }), "note");
  });

  test("a promoted kind swaps its chip for the receipt", () => {
    render(
      <Thread
        {...makeProps({
          messages: [userMsg, answerMsg],
          promotedByMsg: { "a-1": { note: "n-1" } },
        })}
      />,
    );
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.queryByText("Save as note")).toBe(null);
  });

  test("the read-aloud affordance renders on settled answers when supported", () => {
    const readAloud = makeReadAloud();
    render(<Thread {...makeProps({ messages: [userMsg, answerMsg], readAloud })} />);
    fireEvent.click(screen.getByLabelText("Read aloud"));
    expect(readAloud.toggle).toHaveBeenCalledWith(
      "a-1",
      "The checkout friction cluster is the strongest bet.",
    );
  });

  test("an error answer offers Try again, wired to retry", () => {
    const errorMsg: AskStreamMsg = {
      id: "a-err",
      role: "assistant",
      content: "I could not reach the model just now. Try again.",
      at: Date.now(),
      error: true,
      retryContent: "the original question",
    };
    const props = makeProps({ messages: [userMsg, errorMsg] });
    render(<Thread {...props} />);
    fireEvent.click(screen.getByText("Try again"));
    expect(props.onRetry).toHaveBeenCalledWith("a-err", "the original question");
  });

  test("cost never renders inline, even though meta carries it", () => {
    const { container } = render(
      <Thread {...makeProps({ messages: [userMsg, answerMsg], gates: [makeGate()] })} />,
    );
    expect(container.textContent ?? "").not.toContain("$");
    expect((container.textContent ?? "").toLowerCase()).not.toContain("credit");
  });
});
