/**
 * STRIPE DELIVERS AT LEAST ONCE, AND THIS ADAPTER HAD NO MEMORY.
 *
 * TWO DEFECTS ARE PINNED HERE, both confirmed against production on
 * 2026-08-14.
 *
 * (1) NO IDEMPOTENCY AT ALL. `stripeGrantFromEvent` never read `event.id` (the
 * type cast around the switch did not even name the field) and no
 * `stripe_events` table existed. `reset_subscription_cycle` unconditionally
 * sets `balance_credits = monthly_grant`, so a redelivered
 * `invoice.payment_succeeded` after the customer had spent restored the
 * balance to full, free. A redelivered `checkout.session.completed` was only
 * saved by a unique key one layer down, which is a guard the adapter did not
 * know it was leaning on.
 *
 * (2) A REFUSED LINE-ITEMS LOOKUP LOOKED LIKE AN EMPTY CART. The Lovable
 * gateway fetch had no `r.ok` check and no timeout: a 401/429/500 body parses
 * as JSON perfectly well, `lookup_key` came back undefined, and the handler
 * logged and RETURNED. The route then answered 200, so Stripe never retried
 * and a paid top-up granted nothing, permanently and invisibly.
 *
 * The interaction between the two is the subtle part and it has its own test:
 * a claim taken at the top of the handler must be RELEASED when the handler
 * throws, or fix (1) would eat the retry that fix (2) exists to trigger.
 *
 * `getServiceClient`, `applyTopupPurchase` and `resolveAccountId` are crossed
 * module boundaries, so replacing grant-core's exports genuinely intercepts
 * them. bun's module registry is process-wide; the real module goes back in
 * afterAll.
 */
import { describe, expect, test, beforeEach, afterAll, mock } from "bun:test";

const realGrantCore = await import("./grant-core.server");
const realFetch = globalThis.fetch;

type Rpc = { fn: string; args: Record<string, unknown> };

const rpcCalls: Rpc[] = [];
const topupCalls: Array<Record<string, unknown>> = [];
const processedEvents = new Set<string>();
const fetchInits: Array<RequestInit | undefined> = [];

let topupBehaviour: () => void = () => {};
let lineItemsResponse: { ok: boolean; status: number; body: unknown } = {
  ok: true,
  status: 200,
  body: { data: [{ price: { lookup_key: "topup_500", id: "price_1" } }] },
};

/**
 * A stand-in service client that answers only what the event handlers under
 * test actually read: the subscriptions row behind a renewal invoice, and the
 * two idempotency RPCs. Table writes resolve with no rows because nothing in
 * these paths inspects them.
 */
type Answer = { data: unknown; error: unknown };
type Chain = PromiseLike<Answer> & {
  select: () => Chain;
  update: () => Chain;
  upsert: () => Chain;
  insert: () => Chain;
  delete: () => Chain;
  eq: () => Chain;
  in: () => Chain;
  limit: () => Chain;
  maybeSingle: () => Chain;
  single: () => Chain;
};

function fakeServiceClient() {
  const chain: Chain = {
    select: () => chain,
    update: () => chain,
    upsert: () => chain,
    insert: () => chain,
    delete: () => chain,
    eq: () => chain,
    in: () => chain,
    limit: () => chain,
    maybeSingle: () => chain,
    single: () => chain,
    then: (resolve, reject) =>
      Promise.resolve({ data: { user_id: "user-1" }, error: null }).then(resolve, reject),
  };
  return {
    from: () => chain,
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      if (fn === "claim_stripe_event") {
        const id = String(args._event_id);
        if (processedEvents.has(id)) return { data: false, error: null };
        processedEvents.add(id);
        return { data: true, error: null };
      }
      if (fn === "release_stripe_event") {
        processedEvents.delete(String(args._event_id));
        return { data: null, error: null };
      }
      if (fn === "reset_subscription_cycle") {
        return { data: { reset: true, credits: 3750, delta: 3750 }, error: null };
      }
      return { data: null, error: null };
    },
  };
}

const serviceClient = fakeServiceClient();

mock.module("./grant-core.server", () => ({
  ...realGrantCore,
  getServiceClient: () => serviceClient,
  resolveAccountId: async () => "acct-1",
  applyTopupPurchase: async (args: Record<string, unknown>) => {
    topupCalls.push(args);
    topupBehaviour();
  },
}));

const { stripeProvider } = await import("./stripe-provider.server");

afterAll(() => {
  mock.module("./grant-core.server", () => realGrantCore);
  globalThis.fetch = realFetch;
});

globalThis.fetch = (async (_url: string, init?: RequestInit) => {
  fetchInits.push(init);
  return {
    ok: lineItemsResponse.ok,
    status: lineItemsResponse.status,
    json: async () => lineItemsResponse.body,
    text: async () => JSON.stringify(lineItemsResponse.body),
  };
}) as unknown as typeof fetch;

function renewalInvoiceEvent(id: string) {
  return {
    id,
    type: "invoice.payment_succeeded",
    data: {
      object: { subscription: "sub_1", billing_reason: "subscription_cycle" },
    },
  };
}

function topupCheckoutEvent(id: string) {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        mode: "payment",
        metadata: { kind: "topup", userId: "user-1" },
        payment_intent: "pi_1",
        amount_total: 2000,
        currency: "usd",
      },
    },
  };
}

beforeEach(() => {
  rpcCalls.length = 0;
  topupCalls.length = 0;
  fetchInits.length = 0;
  processedEvents.clear();
  topupBehaviour = () => {};
  lineItemsResponse = {
    ok: true,
    status: 200,
    body: { data: [{ price: { lookup_key: "topup_500", id: "price_1" } }] },
  };
});

describe("webhook idempotency", () => {
  test("a redelivered renewal invoice resets the credit cycle exactly once", async () => {
    const event = renewalInvoiceEvent("evt_renewal_1");
    await stripeProvider.grantFromEvent(event, "sandbox");
    await stripeProvider.grantFromEvent(event, "sandbox");

    const resets = rpcCalls.filter((c) => c.fn === "reset_subscription_cycle");
    expect(resets.length).toBe(1);
  });

  test("a redelivered top-up checkout grants the credits exactly once", async () => {
    const event = topupCheckoutEvent("evt_topup_1");
    await stripeProvider.grantFromEvent(event, "sandbox");
    await stripeProvider.grantFromEvent(event, "sandbox");

    expect(topupCalls.length).toBe(1);
  });

  test("two different events are both processed", async () => {
    await stripeProvider.grantFromEvent(renewalInvoiceEvent("evt_a"), "sandbox");
    await stripeProvider.grantFromEvent(renewalInvoiceEvent("evt_b"), "sandbox");

    expect(rpcCalls.filter((c) => c.fn === "reset_subscription_cycle").length).toBe(2);
  });

  test("a failed event releases its claim, so the Stripe retry can still run it", async () => {
    // Without the release, fixing idempotency would silently cancel the retry
    // that every other fix in this file depends on: the first delivery would
    // mark the event processed, throw, and the redelivery would return early.
    let attempts = 0;
    topupBehaviour = () => {
      attempts += 1;
      if (attempts === 1) throw new Error("transient database failure");
    };
    const event = topupCheckoutEvent("evt_topup_retry");

    await expect(stripeProvider.grantFromEvent(event, "sandbox")).rejects.toThrow(
      /transient database failure/,
    );
    await stripeProvider.grantFromEvent(event, "sandbox");

    expect(attempts).toBe(2);
  });

  test("an event with no id is refused rather than processed undeduplicated", async () => {
    await expect(
      stripeProvider.grantFromEvent(
        { type: "invoice.payment_succeeded", data: { object: {} } },
        "sandbox",
      ),
    ).rejects.toThrow(/id/i);
  });
});

describe("the top-up line-items lookup", () => {
  test("throws when the gateway refuses, so the route answers non-2xx and Stripe retries", async () => {
    lineItemsResponse = { ok: false, status: 429, body: { error: { message: "rate limited" } } };

    await expect(
      stripeProvider.grantFromEvent(topupCheckoutEvent("evt_topup_429"), "sandbox"),
    ).rejects.toThrow(/429/);
    expect(topupCalls.length).toBe(0);
  });

  test("carries an abort signal, so a hung gateway cannot hold the webhook open", async () => {
    await stripeProvider.grantFromEvent(topupCheckoutEvent("evt_topup_signal"), "sandbox");

    expect(fetchInits.length).toBe(1);
    expect(fetchInits[0]?.signal).toBeInstanceOf(AbortSignal);
  });

  test("an unrecognized price on a PAID top-up is not answered 200", async () => {
    lineItemsResponse = {
      ok: true,
      status: 200,
      body: { data: [{ price: { lookup_key: "topup_not_in_catalog", id: "price_x" } }] },
    };

    await expect(
      stripeProvider.grantFromEvent(topupCheckoutEvent("evt_topup_unknown"), "sandbox"),
    ).rejects.toThrow(/lookup_key|topup_not_in_catalog/);
  });

  test("a successful lookup still grants the credits", async () => {
    await stripeProvider.grantFromEvent(topupCheckoutEvent("evt_topup_ok"), "sandbox");

    expect(topupCalls.length).toBe(1);
    expect(topupCalls[0].credits).toBe(500);
  });
});
