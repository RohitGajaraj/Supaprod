/**
 * AN ANSWER YOU ALREADY GAVE IS NOT ASKED AGAIN (2026-08-27).
 *
 * `resolveApprovalPolicy` shipped written, fully tested, and reachable from
 * nothing: zero callers outside its own tests, plus a comment in
 * `BoundaryControls` describing what it WOULD do once something called it. This
 * wires it to the gate that comment was written about.
 *
 * The behaviour it buys: a workspace that has turned a tool down every time it
 * was offered has said what it thinks. Putting the question in the queue an
 * eighth time is not caution, it is not listening, and every one of those rows
 * expires unanswered into the queue F-84 measured.
 *
 * ── WHY THIS IS SAFE TO PUT INSIDE THE GATE RATHER THAN BESIDE IT ──────────
 * The policy can only ever TIGHTEN. `isNeverLaxerThanDefault` is the invariant
 * and the module exports it so a caller can assert it against real numbers
 * rather than trusting the docstring. Nothing a workspace does with its record
 * can make a tool ask LESS than the trust ramp already decided.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  resolveApprovalPolicy,
  isNeverLaxerThanDefault,
  APPROVAL_DEMOTE_N,
} from "./approval-policy";

const LOOP = readFileSync(fileURLToPath(new URL("./loop.server.ts", import.meta.url)), "utf8");

describe("the gate consults the record", () => {
  it("calls the resolver at the tool gate, which had no caller before", () => {
    expect(LOOP).toContain("resolveApprovalPolicy({");
    expect(LOOP).toContain("approvalRecordFor(supabase, ctx.workspaceId, call.name)");
  });

  it("a switched-off tool is refused and NOT queued", () => {
    /*
     * The whole point. Raising an approval for a tool the workspace has already
     * refused every time asks a question whose answer is on the record, and the
     * row ages in the queue until it expires unanswered.
     */
    const at = LOOP.indexOf('policy.decision === "disabled"');
    expect(at).toBeGreaterThan(-1);
    const branch = LOOP.slice(at, at + 900);
    expect(branch).toContain("Tool refused:");
    expect(branch).not.toContain("agent_approvals");
  });

  it("and the refusal carries the policy's own sentence, which says how to undo it", () => {
    expect(LOOP).toContain("policy.reason");
  });

  it("a record can turn an auto call into one that waits", () => {
    expect(LOOP).toContain('policy.decision === "always-human" && mode === "auto"');
  });
});

describe("THE INVARIANT, asserted against real shapes rather than trusted", () => {
  const TOOLS = [
    "repo.read",
    "prd.revise",
    "studio.commit",
    "release.publish",
    "delegate.openhands",
  ];

  it("no record of any shape makes any tool laxer than its default", () => {
    for (const tool of TOOLS) {
      for (const record of [
        undefined,
        { approved: 0, rejected: APPROVAL_DEMOTE_N, consecutiveRejections: APPROVAL_DEMOTE_N },
        { approved: 50, rejected: 0, consecutiveRejections: 0 },
        { approved: 3, rejected: APPROVAL_DEMOTE_N, consecutiveRejections: APPROVAL_DEMOTE_N },
        { approved: 99, rejected: 1, consecutiveRejections: 1 },
      ]) {
        expect(
          isNeverLaxerThanDefault({ tool, record: record as never }),
          `${tool} was loosened by a record`,
        ).toBe(true);
      }
    }
  });

  it("a spotless record does not unlock anything either", () => {
    // The reward for never being refused is the default, not more than it.
    for (const tool of TOOLS) {
      const spotless = { approved: 100, rejected: 0, consecutiveRejections: 0 };
      expect(resolveApprovalPolicy({ tool, record: spotless as never }).decision).toBe(
        resolveApprovalPolicy({ tool }).decision,
      );
    }
  });
});
