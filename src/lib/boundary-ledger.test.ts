/**
 * The declined ledger's classification rules, tested without a database.
 *
 * The invariants worth protecting are the honesty ones. A ledger that
 * overstates how often the boundary bites is worse than no ledger, because the
 * whole surface exists to be believed. So the tests that matter here are: a
 * failed tool is not a declined one, a warn is not a refusal, and a rule hit is
 * never attributed to an agent that did not choose it.
 */

import { describe, expect, it } from "bun:test";
import {
  buildLedger,
  isRefusal,
  outcomeOfApproval,
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
