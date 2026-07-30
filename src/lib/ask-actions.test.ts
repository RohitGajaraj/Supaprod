import { describe, expect, it } from "bun:test";
import {
  entityIdsFor,
  gatesForAnswer,
  isQueueQuestion,
  openingGates,
  policyProposal,
  withoutPolicy,
} from "./ask-actions";
import type { ApprovalQueueItem } from "./approvals-queue.functions";

const ID_A = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const ID_B = "11111111-2222-3333-4444-555555555555";

function gate(over: Partial<ApprovalQueueItem> = {}): ApprovalQueueItem {
  return {
    id: `decision:${over.sourceId ?? ID_A}`,
    kindKey: "decision",
    sourceId: ID_A,
    filterBucket: "gates",
    kind: "PROPOSAL",
    title: "Ship the caller fix",
    evidence: ["Two of three checks passed."],
    approveConsequence: "Approve · it goes out",
    rejectConsequence: "Reject · it stays put",
    projectId: null,
    projectName: null,
    ...over,
  } as ApprovalQueueItem;
}

describe("ask-actions: what an answer genuinely referenced", () => {
  it("reads ids off the server-resolved blocks", () => {
    const ids = entityIdsFor({
      blocks: [
        {
          kind: "mission",
          id: ID_B,
          title: "t",
          status: "completed",
          goal: null,
          createdAt: "2026-03-01",
        },
      ],
    });
    expect(ids.has(ID_B)).toBe(true);
  });

  it("reads ids out of a retrieved source's own deep link", () => {
    const ids = entityIdsFor({
      meta: {
        model: "m",
        via: "gateway",
        latency_ms: 1,
        tokens_in: 1,
        tokens_out: 1,
        cost_usd: 0,
        web_used: false,
        workspace_chunks: 1,
        sources: [{ n: 1, kind: "mission", title: "t", href: `/runs/${ID_B}` }],
      },
    });
    expect(ids.has(ID_B)).toBe(true);
  });
});

describe("ask-actions: a gate is drawn on an id match, never on a topic", () => {
  const queue = [gate({ sourceId: ID_A }), gate({ sourceId: ID_B, id: `decision:${ID_B}` })];

  it("draws nothing when the answer named no entity", () => {
    expect(gatesForAnswer(queue, { content: "some prose" }, "what is going on")).toEqual([]);
  });

  it("draws only the gate whose entity the answer actually named", () => {
    const hits = gatesForAnswer(
      queue,
      {
        content: "prose",
        blocks: [
          {
            kind: "mission",
            id: ID_B,
            title: "t",
            status: "completed",
            goal: null,
            createdAt: "x",
          },
        ],
      },
      "what happened to that run",
    );
    expect(hits.map((h) => h.sourceId)).toEqual([ID_B]);
  });

  // Asking about the queue makes the queue the answer, which is the one case
  // where drawing gates the prose did not name is honest.
  it("draws the head of the queue when the QUESTION was about the queue", () => {
    expect(isQueueQuestion("what is waiting on me?")).toBe(true);
    expect(isQueueQuestion("anything for me")).toBe(true);
    expect(isQueueQuestion("why did the checkout change")).toBe(false);
    expect(gatesForAnswer(queue, { content: "prose" }, "what is waiting on me?").length).toBe(2);
  });
});

describe("ask-actions: the opening state", () => {
  const queue = [gate({ sourceId: ID_A }), gate({ sourceId: ID_B, id: `decision:${ID_B}` })];

  it("shows what is waiting when the pane is not scoped to one thing", () => {
    expect(openingGates(queue, null).length).toBe(2);
  });

  // A chip that narrows the answer and not the cards is decoration.
  it("shows only the scoped thing's gates when the pane IS scoped", () => {
    expect(openingGates(queue, ID_B).map((g) => g.sourceId)).toEqual([ID_B]);
  });

  it("shows nothing rather than something when the queue is empty", () => {
    expect(openingGates([], null)).toEqual([]);
  });
});

describe("ask-actions: the policy proposal", () => {
  // The streak is the system's own detection (reflection.server.ts writes the
  // proposal row), never a number this layer counts up for the occasion.
  it("finds the graduation proposal and nothing else", () => {
    const grad = gate({ kindKey: "trust_graduation", id: "trust_graduation:x", sourceId: "x" });
    const queue = [gate(), grad];
    expect(policyProposal(queue)?.id).toBe("trust_graduation:x");
    expect(withoutPolicy(queue, grad).length).toBe(1);
  });

  it("is null when the record has proposed nothing, rather than inventing a streak", () => {
    expect(policyProposal([gate(), gate()])).toBeNull();
  });
});
