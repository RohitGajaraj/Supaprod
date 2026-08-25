/**
 * The consent card is a write door onto approvals, and `pending_gates` is the
 * only thing that scopes it.
 *
 * `agent_approvals` has **no track back-reference**. Its columns are `user_id`,
 * `run_id`, `mission_id`, `workspace_id` — and none of those identifies a spine
 * track. The migration that created `spine_tracks.pending_gates` rejects every
 * correlational alternative in its own words: matching on user and time *"would
 * be the same time-window guess the attachment pass already rejected for
 * lying"*.
 *
 * So the whole safety of these three functions rests on one predicate: **is this
 * approval listed in THIS track's `pending_gates`?** Without it, a run page
 * becomes an unscoped write door onto every approval the caller holds, reachable
 * by changing one id in a request.
 *
 * That is what most of this file asserts. The rest asserts the two rules that
 * decide whether a bulk answer is safe.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { expiryDefaultFor } from "@/lib/ai/approval-expiry";
import { MAX_BULK_DECISIONS } from "@/lib/approvals-queue.functions";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const ONE = SRC.slice(
  SRC.indexOf("export const decideTrackGate ="),
  SRC.indexOf("export type DecideClassResult"),
);
const CLASS = SRC.slice(
  SRC.indexOf("export const decideTrackGateClass ="),
  SRC.indexOf("export const getTrackChain"),
);
const READ = SRC.slice(
  SRC.indexOf("export const getTrackGates ="),
  SRC.indexOf("export type DecideTrackGateResult"),
);

describe("a gate belongs to one run, and the server is what says so", () => {
  it("refuses an approval this track does not list", () => {
    expect(ONE).toContain("listed.some((g) => g.id === data.approvalId)");
    expect(ONE).toContain("does not belong to this run");
  });

  /** The scope check must precede every write, or it is decoration. */
  it("checks ownership before it claims the decision", () => {
    expect(ONE.indexOf("does not belong to this run")).toBeLessThan(
      ONE.indexOf("claimApprovalDecision"),
    );
  });

  /** The five prohibitions in SPEC-CONSENT §1.2, as absences. */
  it("never reaches for a correlational link", () => {
    for (const wrong of ["getApprovalsQueue", "created_at.gte", "mission_id"]) {
      expect(ONE).not.toContain(wrong);
    }
  });

  it("reads gates only from pending_gates", () => {
    expect(READ).toContain("readPendingGates(");
    expect(READ).toContain('.in(\n          "id",');
  });
});

describe("a partial write is reported as partial", () => {
  /**
   * Three existing doors each lost something: one loses the reason, one writes
   * no gate signal, one refuses `tool_call` outright. A card calling two in
   * sequence could half-write, and a half-written decision is worse than a
   * refused one because it looks complete.
   */
  it("reports each of the four writes independently", () => {
    for (const f of ["reasonRecorded", "signalRecorded", "steered", "alreadyDecided"]) {
      expect(ONE).toContain(f);
    }
  });

  it("reads the status back rather than assuming the decision took", () => {
    expect(ONE).toContain('.select("status")');
  });

  /** Losing the race is ordinary — two tabs must not run the tool twice. */
  it("treats a lost claim as ok, not as an error", () => {
    expect(ONE).toContain("alreadyDecided: true");
    expect(ONE).toContain("had already been answered");
  });

  /**
   * Telemetry must never break the gate it observes. `recordGateSignalCore`
   * returns `{ ok }` and swallows its own failure by contract, so the decision
   * records whether the signal landed instead of depending on it.
   */
  it("records whether the gate signal landed rather than depending on it", () => {
    expect(ONE).toContain("const signal = await recordGateSignalCore(");
    expect(ONE).toContain("out.signalRecorded = signal.ok;");
  });

  /**
   * Approving EXECUTES. An approve that does not execute leaves the run paused
   * forever waiting for a status it will never reach — the audit finding that
   * `resolveApproval`'s own header records.
   */
  it("executes on approve, and survives the tool failing", () => {
    expect(ONE).toContain("await executeApproval(supabase, userId, data.approvalId)");
    expect(ONE).toContain("the tool did not run");
  });
});

describe("declining records why, and the server is the floor", () => {
  it("refuses a reject with no reason", () => {
    expect(SRC).toContain('d.verdict !== "reject" || !!d.reason?.trim()');
    expect(SRC).toContain("Declining records why");
  });

  it("applies the same floor to the class decision", () => {
    expect(SRC).toContain("Declining records why. Say what was wrong with them.");
  });
});

describe("approve-all is offered only where silence would already say yes", () => {
  /**
   * `expiryDefaultFor(tool) === "proceed"` means reversible AND internal, so the
   * declared outcome of saying nothing is already "run it". Approving the class
   * therefore grants nothing that waiting would not. Anything else is refused.
   */
  it("gates approve-all on the call's own declared default", () => {
    expect(CLASS).toContain('expiryDefaultFor(data.toolName) !== "proceed"');
    expect(CLASS).toContain("refusedAsUnsafeClass: true");
  });

  it("checks it before reading anything, so no rows are touched on refusal", () => {
    expect(CLASS.indexOf("refusedAsUnsafeClass: true")).toBeLessThan(
      CLASS.indexOf('.from("spine_tracks"'),
    );
  });

  /** The premise, asserted against the real catalogue rather than restated. */
  it("is arguing about real tools: cluster.trigger proceeds, pr.merge does not", () => {
    expect(expiryDefaultFor("cluster.trigger")).toBe("proceed");
    expect(expiryDefaultFor("studio.pr.merge")).toBe("cancel");
  });

  /** Declining N can never be worse than each of them expiring. */
  it("never blocks decline-all", () => {
    expect(CLASS).toContain('data.verdict === "approve" && expiryDefaultFor');
  });
});

describe("the class is scoped to what the button claims", () => {
  it("scopes by workspace, caller, pending and tool_name", () => {
    for (const f of [
      '.eq("user_id", userId)',
      '.eq("workspace_id", workspaceId)',
      '.eq("status", "pending")',
      '.eq("tool_name", data.toolName)',
    ]) {
      expect(CLASS).toContain(f);
    }
  });

  /** No workspace, no class. An unscoped bulk write is never the safe default. */
  it("refuses the class when there is no workspace to scope it to", () => {
    expect(CLASS).toContain("if (!workspaceId) return out;");
  });

  /** Never a silent cap: what was not attempted is counted and returned. */
  it("caps the batch and reports what it did not touch", () => {
    expect(CLASS).toContain("MAX_BULK_DECISIONS");
    expect(CLASS).toContain("out.remaining = Math.max(0, all.length - batch.length)");
    expect(MAX_BULK_DECISIONS).toBe(50);
  });
});

describe("the read tells absence apart from ignorance", () => {
  /**
   * A card rendering "nothing is waiting on you" over an unreadable table tells
   * a person their run is fine when nobody looked.
   */
  it("reports unreadable rather than empty when the approvals read fails", () => {
    expect(READ).toContain("unreadable: true");
    expect(READ).toContain("if (error) return");
  });

  it("counts the class on the server, never leaving it to the client", () => {
    expect(READ).toContain("classPendingElsewhere");
    expect(READ).toContain("classCount");
  });

  /** This gate excluded from its own class count, or every label reads one too high. */
  it("excludes the gate from its own class count", () => {
    expect(READ).toContain("Math.max(0, (classCount.get(toolName) ?? 0) - 1)");
  });
});
