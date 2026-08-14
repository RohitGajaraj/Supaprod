/**
 * A PAYMENT RPC THAT REFUSES MUST REACH THE WEBHOOK ROUTE.
 *
 * THE DEFECT THIS PINS, confirmed 2026-08-14. grant-core called
 * `grant_subscription_credits`, `apply_topup_credits` and
 * `apply_refund_clawback` as bare `await admin.rpc(...)` with no destructured
 * `error` and no inspection of the returned envelope. supabase-js RESOLVES a
 * refused write, so the try/catch wrapped around each call could never fire:
 * a permission error, a `cap_exceeded` refusal and a successful grant were the
 * same resolved promise. The webhook then answered 200 and Stripe never
 * retried, so a customer who had been charged got nothing and no alarm rang.
 *
 * WHY THE TEST LOOKS LIKE THIS. `getServiceClient` is called by name from
 * inside grant-core, and an intra-module call cannot be intercepted by mocking
 * grant-core's own exports. The seam that does work is the client factory it
 * imports, so this file replaces `createClient` for the duration of the suite
 * and puts the real module back afterwards. bun's module registry is
 * process-wide and this file shares a process with every other suite.
 */
import { describe, expect, test, beforeEach, afterAll, mock } from "bun:test";

const realSupabaseJs = await import("@supabase/supabase-js");

type RpcHandler = (fn: string, args: Record<string, unknown>) => { data: unknown; error: unknown };

const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
let handler: RpcHandler = () => ({ data: null, error: null });

/**
 * One stable client object: grant-core memoizes the first client it builds, so
 * handing back a fresh object per call would leave the suite driving a stale
 * one. Behaviour is swapped through `handler` instead.
 */
const fakeClient = {
  rpc: async (fn: string, args: Record<string, unknown>) => {
    calls.push({ fn, args });
    return handler(fn, args);
  },
};

mock.module("@supabase/supabase-js", () => ({
  ...realSupabaseJs,
  createClient: () => fakeClient,
}));

const { applyRefundClawback, applyTopupPurchase, grantForSubscription, resolveAccountId } =
  await import("./grant-core.server");

afterAll(() => {
  mock.module("@supabase/supabase-js", () => realSupabaseJs);
});

/** The account lookup every money path starts with, answered as it is in production. */
function accountResolves(accountId: string | null) {
  return (fn: string) =>
    fn === "ensure_user_default_account"
      ? { data: accountId, error: null }
      : { data: null, error: null };
}

const TOPUP = {
  userId: "11111111-1111-4111-8111-111111111111",
  sessionId: "cs_test_1",
  paymentIntentId: "pi_test_1",
  credits: 500,
  amountCents: 2000,
  currency: "usd",
  lookupKey: "topup_500",
  env: "sandbox" as const,
};

beforeEach(() => {
  calls.length = 0;
  handler = accountResolves("acct-1");
});

describe("applyTopupPurchase", () => {
  test("throws when the grant RPC is refused, so the route can answer non-2xx", async () => {
    handler = (fn) =>
      fn === "ensure_user_default_account"
        ? { data: "acct-1", error: null }
        : { data: null, error: { message: "permission denied for function apply_topup_credits" } };

    await expect(applyTopupPurchase(TOPUP)).rejects.toThrow(/apply_topup_credits/);
  });

  test("throws on cap_exceeded: the customer paid and the credits were withheld", async () => {
    handler = (fn) =>
      fn === "ensure_user_default_account"
        ? { data: "acct-1", error: null }
        : { data: { applied: false, reason: "cap_exceeded", cap: 7500 }, error: null };

    await expect(applyTopupPurchase(TOPUP)).rejects.toThrow(/cap_exceeded/);
  });

  test("is silent on a duplicate: that is the idempotency guard doing its job", async () => {
    handler = (fn) =>
      fn === "ensure_user_default_account"
        ? { data: "acct-1", error: null }
        : { data: { applied: false, reason: "duplicate" }, error: null };

    await applyTopupPurchase(TOPUP);
    expect(calls.some((c) => c.fn === "apply_topup_credits")).toBe(true);
  });

  test("throws when no account can be resolved, instead of logging and returning 200", async () => {
    handler = accountResolves(null);

    await expect(applyTopupPurchase(TOPUP)).rejects.toThrow(/account/i);
    expect(calls.some((c) => c.fn === "apply_topup_credits")).toBe(false);
  });
});

describe("grantForSubscription", () => {
  test("throws when the grant RPC is refused", async () => {
    handler = (fn) =>
      fn === "ensure_user_default_account"
        ? { data: "acct-1", error: null }
        : { data: null, error: { message: "deadlock detected" } };

    await expect(
      grantForSubscription(TOPUP.userId, "cluster_1k_monthly", "active"),
    ).rejects.toThrow(/grant_subscription_credits/);
  });

  test("is silent when the allowance already matches (reason 'unchanged')", async () => {
    handler = (fn) =>
      fn === "ensure_user_default_account"
        ? { data: "acct-1", error: null }
        : { data: { granted: false, reason: "unchanged" }, error: null };

    await grantForSubscription(TOPUP.userId, "cluster_1k_monthly", "active");
    expect(calls.some((c) => c.fn === "grant_subscription_credits")).toBe(true);
  });

  test("stays a no-op for an event that carries no user or price, which is not a failure", async () => {
    await grantForSubscription(undefined, "cluster_1k_monthly", "active");
    await grantForSubscription(TOPUP.userId, undefined, "active");
    expect(calls.length).toBe(0);
  });
});

describe("applyRefundClawback", () => {
  test("throws when the clawback RPC is refused, so the refund is retried", async () => {
    handler = () => ({ data: null, error: { message: "statement timeout" } });

    await expect(
      applyRefundClawback({
        accountId: "acct-1",
        userId: TOPUP.userId,
        refundRef: "re_1",
        credits: 500,
        provider: "stripe",
        note: "refund_clawback:stripe:ch_1",
      }),
    ).rejects.toThrow(/apply_refund_clawback/);
  });

  test("is silent on a duplicate refund reference", async () => {
    handler = () => ({ data: { applied: false, reason: "duplicate" }, error: null });

    await applyRefundClawback({
      accountId: "acct-1",
      userId: TOPUP.userId,
      refundRef: "re_1",
      credits: 500,
      provider: "stripe",
      note: "refund_clawback:stripe:ch_1",
    });
    expect(calls.some((c) => c.fn === "apply_refund_clawback")).toBe(true);
  });
});

describe("resolveAccountId", () => {
  test("surfaces a refused account lookup instead of reporting 'no account'", async () => {
    handler = () => ({ data: null, error: { message: "permission denied" } });
    await expect(resolveAccountId(TOPUP.userId)).rejects.toThrow(/ensure_user_default_account/);
  });
});
