/**
 * The declined ledger's classification rules, tested without a database.
 *
 * The invariants worth protecting are the honesty ones. A ledger that
 * overstates how often the boundary bites is worse than no ledger, because the
 * whole surface exists to be believed. So the tests that matter here are: a
 * failed tool is not a declined one, a warn is not a refusal, and one decline
 * disqualifies a pair from ever being proposed for removal.
 */

import { describe, expect, it } from "bun:test";
import {
  buildLedger,
  isRefusal,
  outcomeOfApproval,
  patternKey,
  promotionCandidates,
  summarizeBoundary,
  PROMOTION_MIN_DECIDED,
  type LedgerApprovalRow,
  type LedgerGuardrailRow,
} from "./boundary-ledger";

const approval = (over: Partial<LedgerApprovalRow> = {}): LedgerApprovalRow => ({
  id: over.id ?? "a1",
  agent_slug: over.agent_slug ?? "engineer",
  tool_name: over.tool_name ?? "open_pull_request",
  rationale: over.rationale ?? "the spec asks for a migration",
  status: over.status ?? "pending",
  created_at: over.created_at ?? "2026-08-01T10:00:00Z",
  decided_at: over.decided_at ?? null,
  decision_reason: over.decision_reason ?? null,
});

const hit = (over: Partial<LedgerGuardrailRow> = {}): LedgerGuardrailRow => ({
  id: over.id ?? "g1",
  rule_name: over.rule_name ?? "no customer emails",
  kind: over.kind ?? "pii",
  action: over.action ?? "block",
  side: over.side ?? "output",
  created_at: over.created_at ?? "2026-08-01T09:00:00Z",
});

describe("outcomeOfApproval", () => {
  it("reads a post-approval failure as allowed, not declined", () => {
    // The boundary let it through; the tool then broke. That is the run's
    // story. Counting it as a decline would overstate how often policy bites.
    expect(outcomeOfApproval("failed")).toBe("allowed");
    expect(outcomeOfApproval("executed")).toBe("allowed");
    expect(outcomeOfApproval("approved")).toBe("allowed");
  });

  it("distinguishes a refusal from an expiry", () => {
    // Someone saying no and nobody answering are different failures. One is a
    // boundary working; the other is a queue nobody is serving.
    expect(outcomeOfApproval("rejected")).toBe("declined");
    expect(outcomeOfApproval("expired")).toBe("expired");
  });

  it("treats anything unrecognised as still waiting", () => {
    expect(outcomeOfApproval("pending")).toBe("waiting");
    expect(outcomeOfApproval("snoozed")).toBe("waiting");
    expect(outcomeOfApproval(null)).toBe("waiting");
    expect(outcomeOfApproval("  APPROVED  ")).toBe("allowed");
  });
});

describe("isRefusal", () => {
  it("counts block and redact, never warn", () => {
    // A warn annotates and lets the content travel. Listing it as a refusal
    // would inflate the ledger with events where nothing was actually stopped.
    expect(isRefusal("block")).toBe(true);
    expect(isRefusal("redact")).toBe(true);
    expect(isRefusal("warn")).toBe(false);
    expect(isRefusal(null)).toBe(false);
  });
});

describe("buildLedger", () => {
  it("folds both sources newest first", () => {
    const out = buildLedger(
      [approval({ id: "a", created_at: "2026-08-01T08:00:00Z" })],
      [hit({ id: "g", created_at: "2026-08-01T12:00:00Z" })],
    );
    expect(out.map((e) => e.id)).toEqual(["g", "a"]);
  });

  it("keeps asked and refused apart", () => {
    const out = buildLedger([approval()], [hit()]);
    expect(out.find((e) => e.kind === "asked")?.subject).toBe("open_pull_request");
    expect(out.find((e) => e.kind === "refused")?.subject).toBe("no customer emails");
  });

  it("drops warn hits entirely", () => {
    const out = buildLedger([], [hit({ action: "warn" })]);
    expect(out).toEqual([]);
  });

  it("says which direction a rule hit was travelling", () => {
    // An input block and an output block mean different things to a reader:
    // one stopped something coming in, the other stopped us leaking.
    const outbound = buildLedger([], [hit({ side: "output" })])[0];
    const inbound = buildLedger([], [hit({ id: "g2", side: "input" })])[0];
    expect(outbound.wanted).toBe("on the way out");
    expect(inbound.wanted).toBe("on the way in");
  });

  it("never attributes a rule hit to an agent", () => {
    // Nothing chose to do this; a match happened. Naming an agent would invent
    // an actor the row does not record.
    expect(buildLedger([], [hit()])[0].agent).toBeNull();
  });

  it("blanks empty rationale rather than rendering whitespace", () => {
    expect(buildLedger([approval({ rationale: "   " })], [])[0].wanted).toBeNull();
  });

  it("survives malformed input", () => {
    expect(buildLedger(null as never, null as never)).toEqual([]);
    expect(buildLedger([{ id: "" } as never], [])).toEqual([]);
  });
});

describe("summarizeBoundary", () => {
  const events = buildLedger(
    [
      approval({ id: "1", status: "executed" }),
      approval({ id: "2", status: "approved", created_at: "2026-08-01T11:00:00Z" }),
      approval({ id: "3", status: "rejected" }),
      approval({ id: "4", status: "pending" }),
      approval({ id: "5", tool_name: "send_email", status: "executed" }),
    ],
    [hit()],
  );

  it("tallies only the asked events", () => {
    const pairs = summarizeBoundary(events);
    const pr = pairs.find((p) => p.tool === "open_pull_request");
    expect(pr).toBeDefined();
    expect(pr!.asked).toBe(4);
    expect(pr!.allowed).toBe(2);
    expect(pr!.declined).toBe(1);
    expect(pr!.waiting).toBe(1);
  });

  it("ignores refusals, which have no agent to promote", () => {
    expect(summarizeBoundary(events).some((p) => p.tool === "no customer emails")).toBe(false);
  });

  it("keeps the most recent timestamp per pair", () => {
    const pr = summarizeBoundary(events).find((p) => p.tool === "open_pull_request");
    expect(pr!.lastAt).toBe("2026-08-01T11:00:00Z");
  });

  it("ranks the noisiest pair first", () => {
    expect(summarizeBoundary(events)[0].tool).toBe("open_pull_request");
  });

  it("separates the same tool used by different agents", () => {
    // Two agents earn autonomy separately. Merging them would propose handing
    // a tool to an agent that never touched it.
    const mixed = buildLedger(
      [
        approval({ id: "x", agent_slug: "engineer", status: "executed" }),
        approval({ id: "y", agent_slug: "designer", status: "executed" }),
      ],
      [],
    );
    expect(summarizeBoundary(mixed)).toHaveLength(2);
    expect(patternKey("engineer", "t")).not.toBe(patternKey("designer", "t"));
  });
});

describe("promotionCandidates", () => {
  const pair = (allowed: number, declined: number) => ({
    agent: "engineer",
    tool: "open_pull_request",
    asked: allowed + declined,
    allowed,
    declined,
    waiting: 0,
    lastAt: null,
  });

  it("proposes a pair approved every time, past the threshold", () => {
    expect(promotionCandidates([pair(PROMOTION_MIN_DECIDED, 0)])).toHaveLength(1);
  });

  it("ONE decline disqualifies the pair, however lopsided the record", () => {
    // The single no is the entire justification for the gate. A ratio would
    // average away the only evidence that the boundary is real.
    expect(promotionCandidates([pair(50, 1)])).toEqual([]);
  });

  it("does not act on a short run", () => {
    expect(promotionCandidates([pair(PROMOTION_MIN_DECIDED - 1, 0)])).toEqual([]);
  });

  it("survives malformed input", () => {
    expect(promotionCandidates(null as never)).toEqual([]);
  });
});
