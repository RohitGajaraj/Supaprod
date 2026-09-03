/**
 * The one defect this product cannot ship is a fabricated citation on the brain
 * surface, so the first test in this file is the one that says nothing gets
 * invented, and the rest are about what a real fact turns into.
 */
import { describe, expect, it } from "bun:test";
import { recordCitationFor } from "./ask-record";
import type { AnswerBlock } from "./ask-blocks";
import type { ChatMeta } from "@/lib/chat-meta";

const meta = (over: Partial<ChatMeta> = {}): ChatMeta => ({
  model: "test",
  via: "gateway",
  latency_ms: 1,
  tokens_in: 1,
  tokens_out: 1,
  cost_usd: 0,
  sources: [],
  web_used: false,
  workspace_chunks: 0,
  ...over,
});

const DEC: AnswerBlock = {
  kind: "decision",
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  title: "Fix it in the caller",
  status: "approved",
  rationale: null,
  decidedBy: null,
  sourceKind: "manual",
  createdAt: "2026-03-14T09:00:00.000Z",
};

describe("ask-record: it never invents one", () => {
  it("returns null when there is no block and no source at all", () => {
    expect(recordCitationFor({})).toBeNull();
    expect(recordCitationFor({ blocks: [], meta: meta() })).toBeNull();
  });

  it("returns null when the only sources are web pages", () => {
    // A page on the internet is not this workspace's history, and the register
    // claims history. Silence is the correct output.
    expect(
      recordCitationFor({
        meta: meta({
          sources: [{ n: 1, kind: "web", title: "A blog post", url: "https://example.com" }],
        }),
      }),
    ).toBeNull();
  });

  it("returns null for an internal source with no deep link to stand on", () => {
    expect(
      recordCitationFor({
        meta: meta({ sources: [{ n: 1, kind: "decision", title: "Something" }] }),
      }),
    ).toBeNull();
  });

  it("returns null for a timeline block carrying no events", () => {
    expect(
      recordCitationFor({ blocks: [{ kind: "timeline", label: "Last 14 days", events: [] }] }),
    ).toBeNull();
  });

  it("ignores the status digest, which is the present and not the record", () => {
    expect(
      recordCitationFor({
        blocks: [
          {
            kind: "status",
            scopeLabel: "Missions",
            counts: { running: 2, waiting: 1, done: 9, failed: 0 },
            running: [],
          },
        ],
      }),
    ).toBeNull();
  });
});

describe("ask-record: what a real fact turns into", () => {
  it("a standing decision contradicts or confirms you, and carries its audit tag", () => {
    const c = recordCitationFor({ blocks: [DEC] });
    expect(c?.text).toBe("This was decided already: Fix it in the caller. It still stands.");
    expect(c?.evidence).toContain("DEC");
    expect(c?.href).toBe("/brain?tab=decisions&decision=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  });

  it("a rejected decision says it was turned down, never that it stands", () => {
    const c = recordCitationFor({ blocks: [{ ...DEC, status: "rejected" }] });
    expect(c?.text).toContain("turned down");
    expect(c?.text).not.toContain("still stands");
  });

  it("an open decision is not reported as settled", () => {
    const c = recordCitationFor({ blocks: [{ ...DEC, status: "pending" }] });
    expect(c?.text).toContain("already open");
  });

  it("a finished run reads as precedent and links to the run", () => {
    const c = recordCitationFor({
      blocks: [
        {
          kind: "mission",
          id: "11111111-2222-3333-4444-555555555555",
          title: "Rename the caller",
          status: "completed",
          goal: null,
          createdAt: "2026-03-01T09:00:00.000Z",
        },
      ],
    });
    expect(c?.text).toContain("has run this before");
    // P-14 (A-QUEUE.md, R-35): /runs/$missionId is deleted; the citation
    // falls back to Start rather than a dead link.
    expect(c?.href).toBe("/start");
  });

  it("a failed run says it failed, which is the fact that matters", () => {
    const c = recordCitationFor({
      blocks: [
        {
          kind: "mission",
          id: "11111111-2222-3333-4444-555555555555",
          title: "Rename the caller",
          status: "failed",
          goal: null,
          createdAt: "2026-03-01T09:00:00.000Z",
        },
      ],
    });
    expect(c?.text).toContain("failed");
  });

  it("a timeline counts what actually happened and quotes the newest entry", () => {
    const c = recordCitationFor({
      blocks: [
        {
          kind: "timeline",
          label: "Last 14 days",
          events: [
            { at: "2026-03-14T09:00:00.000Z", label: "Merged the fix", detail: null, ref: "MIS" },
            { at: "2026-03-12T09:00:00.000Z", label: "Opened it", detail: null, ref: null },
          ],
        },
      ],
    });
    expect(c?.text).toBe("2 things touched this in the last 14 days.");
    expect(c?.evidence).toContain("Merged the fix");
  });

  it("falls back to a retrieved internal record, which is weaker but still true", () => {
    const c = recordCitationFor({
      meta: meta({
        sources: [{ n: 1, kind: "prd", title: "Checkout spec", href: "/prds/9", sub: "Spec" }],
      }),
    });
    expect(c?.text).toBe("This is on the record already, as a spec: Checkout spec.");
    expect(c?.href).toBe("/prds/9");
  });

  // Order is by how much the fact CLAIMS, not by what arrived first: a decision
  // that contradicts you outranks a document that merely mentions the subject.
  it("prefers the decision over a retrieved source", () => {
    const c = recordCitationFor({
      blocks: [DEC],
      meta: meta({ sources: [{ n: 1, kind: "doc", title: "A note", href: "/outcomes" }] }),
    });
    expect(c?.text).toContain("decided already");
  });
});
