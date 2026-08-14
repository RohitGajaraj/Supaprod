/**
 * THE ENVELOPE IS THE ONLY PLACE A CREDIT RPC SAYS "I DID NOT DO IT".
 *
 * Every credit-moving RPC in this repo returns jsonb rather than raising, so a
 * refusal (cap_exceeded, bad_args) arrives as a RESOLVED promise carrying
 * {applied:false}. Three call sites discarded that value entirely, which made a
 * capped grant indistinguishable from a paid one. This pins the reading of the
 * envelope so the distinction cannot be lost again.
 */
import { describe, expect, test } from "bun:test";
import { readCreditRpcResult } from "./credit-rpc-envelope";

describe("readCreditRpcResult", () => {
  test("a postgrest error is a failure, and its message survives", () => {
    const verdict = readCreditRpcResult({
      rpc: "apply_topup_credits",
      successKey: "applied",
      benignReasons: ["duplicate"],
      result: null,
      error: { message: "permission denied for function apply_topup_credits" },
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.failure).toContain("permission denied");
  });

  test("applied:true is a success", () => {
    const verdict = readCreditRpcResult({
      rpc: "apply_topup_credits",
      successKey: "applied",
      benignReasons: ["duplicate"],
      result: { applied: true, credits: 500 },
      error: null,
    });
    expect(verdict.ok).toBe(true);
  });

  test("a benign reason is a success and reports which one", () => {
    const verdict = readCreditRpcResult({
      rpc: "apply_topup_credits",
      successKey: "applied",
      benignReasons: ["duplicate"],
      result: { applied: false, reason: "duplicate" },
      error: null,
    });
    expect(verdict.ok).toBe(true);
    if (verdict.ok) expect(verdict.reason).toBe("duplicate");
  });

  test("cap_exceeded is a failure: the customer paid and the grant was refused", () => {
    const verdict = readCreditRpcResult({
      rpc: "apply_topup_credits",
      successKey: "applied",
      benignReasons: ["duplicate"],
      result: { applied: false, reason: "cap_exceeded", cap: 7500 },
      error: null,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.failure).toContain("cap_exceeded");
  });

  test("bad_args is a failure even though it is not an error", () => {
    const verdict = readCreditRpcResult({
      rpc: "grant_subscription_credits",
      successKey: "granted",
      benignReasons: ["unchanged"],
      result: { granted: false, reason: "bad_args" },
      error: null,
    });
    expect(verdict.ok).toBe(false);
  });

  test("a benign reason for one rpc is not benign for another", () => {
    // 'unchanged' is grant_subscription_credits saying the allowance already
    // matches. The same word from apply_topup_credits would be unrecognized and
    // must not be waved through by a shared allow-list.
    const verdict = readCreditRpcResult({
      rpc: "apply_topup_credits",
      successKey: "applied",
      benignReasons: ["duplicate"],
      result: { applied: false, reason: "unchanged" },
      error: null,
    });
    expect(verdict.ok).toBe(false);
  });

  test("a missing envelope is a failure, not a success", () => {
    // An RPC that has not been migrated yet answers null. Treating that as
    // success is exactly the silence this helper exists to end.
    for (const result of [null, undefined, "ok", 1, []]) {
      const verdict = readCreditRpcResult({
        rpc: "apply_refund_clawback",
        successKey: "applied",
        benignReasons: ["duplicate"],
        result,
        error: null,
      });
      expect(verdict.ok).toBe(false);
    }
  });

  test("an unrecognized reason is a failure, so a new refusal cannot arrive silently", () => {
    const verdict = readCreditRpcResult({
      rpc: "apply_refund_clawback",
      successKey: "applied",
      benignReasons: ["duplicate"],
      result: { applied: false, reason: "some_future_refusal" },
      error: null,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.failure).toContain("some_future_refusal");
  });

  test("applied:false with no reason at all still fails", () => {
    const verdict = readCreditRpcResult({
      rpc: "apply_topup_credits",
      successKey: "applied",
      benignReasons: ["duplicate"],
      result: { applied: false },
      error: null,
    });
    expect(verdict.ok).toBe(false);
  });
});
