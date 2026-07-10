import { describe, expect, test } from "bun:test";
import {
  mapPaddleEvent,
  mapPaddleSubscriptionStatus,
  paddleItemLookupKey,
  parsePaddleSignature,
} from "./paddle-events";

describe("parsePaddleSignature", () => {
  test("parses the documented ts;h1 shape", () => {
    const parsed = parsePaddleSignature("ts=1671552777;h1=abc123");
    expect(parsed).toEqual({ ts: "1671552777", signatures: ["abc123"] });
  });

  test("collects multiple h1 values (key rotation window)", () => {
    const parsed = parsePaddleSignature("ts=1;h1=aaa;h1=bbb");
    expect(parsed?.signatures).toEqual(["aaa", "bbb"]);
  });

  test("rejects a missing header, missing ts, or missing h1", () => {
    expect(parsePaddleSignature(null)).toBeNull();
    expect(parsePaddleSignature("h1=abc")).toBeNull();
    expect(parsePaddleSignature("ts=123")).toBeNull();
  });
});

describe("mapPaddleSubscriptionStatus", () => {
  test("maps the entitlement-bearing and terminating states to the house vocabulary", () => {
    expect(mapPaddleSubscriptionStatus("active")).toBe("active");
    expect(mapPaddleSubscriptionStatus("trialing")).toBe("trialing");
    expect(mapPaddleSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapPaddleSubscriptionStatus("paused")).toBe("paused");
    expect(mapPaddleSubscriptionStatus("canceled")).toBe("canceled");
  });
});

describe("paddleItemLookupKey", () => {
  test("reads the shared catalog key from price custom_data", () => {
    const items = [
      { price: { id: "pri_1", custom_data: null } },
      { price: { id: "pri_2", custom_data: { lookup_key: "cluster_1k_monthly" } } },
    ];
    expect(paddleItemLookupKey(items)).toBe("cluster_1k_monthly");
  });

  test("returns undefined when no item carries a key", () => {
    expect(paddleItemLookupKey([{ price: { id: "x", custom_data: {} } }])).toBeUndefined();
    expect(paddleItemLookupKey(undefined)).toBeUndefined();
  });
});

describe("mapPaddleEvent", () => {
  const subData = {
    id: "sub_123",
    status: "active",
    customer_id: "ctm_9",
    custom_data: { userId: "user-1" },
    items: [
      {
        price: {
          id: "pri_1",
          product_id: "pro_88",
          custom_data: { lookup_key: "constellation_5k_monthly" },
        },
      },
    ],
    current_billing_period: { ends_at: "2026-08-10T00:00:00Z" },
    scheduled_change: null,
  };

  test("subscription.activated becomes a subscription action with the shared key", () => {
    const action = mapPaddleEvent({ event_type: "subscription.activated", data: subData });
    expect(action).toEqual({
      kind: "subscription",
      userId: "user-1",
      subscriptionId: "sub_123",
      customerId: "ctm_9",
      lookupKey: "constellation_5k_monthly",
      productId: "pro_88",
      status: "active",
      currentPeriodEnd: "2026-08-10T00:00:00Z",
      cancelAtPeriodEnd: false,
    });
  });

  test("subscription.canceled forces status canceled regardless of data.status", () => {
    const action = mapPaddleEvent({
      event_type: "subscription.canceled",
      data: { ...subData, status: "active" },
    });
    expect(action.kind).toBe("subscription");
    if (action.kind === "subscription") expect(action.status).toBe("canceled");
  });

  test("a scheduled cancel maps to cancelAtPeriodEnd", () => {
    const action = mapPaddleEvent({
      event_type: "subscription.updated",
      data: { ...subData, scheduled_change: { action: "cancel" } },
    });
    if (action.kind === "subscription") expect(action.cancelAtPeriodEnd).toBe(true);
  });

  test("transaction.completed with kind=topup becomes a topup action", () => {
    const action = mapPaddleEvent({
      event_type: "transaction.completed",
      data: {
        id: "txn_55",
        currency_code: "USD",
        custom_data: { userId: "user-1", kind: "topup", lookup_key: "topup_1k" },
        items: [{ price: { id: "pri_t", custom_data: { lookup_key: "topup_1k" } } }],
        details: { totals: { total: "3000" } },
      },
    });
    expect(action).toEqual({
      kind: "topup",
      userId: "user-1",
      transactionId: "txn_55",
      lookupKey: "topup_1k",
      amountCents: 3000,
      currency: "usd",
    });
  });

  test("a subscription-cycle transaction (no topup kind) is ignored — grants are subscription-driven", () => {
    const action = mapPaddleEvent({
      event_type: "transaction.completed",
      data: { id: "txn_56", custom_data: { userId: "user-1" } },
    });
    expect(action.kind).toBe("ignore");
  });

  test("an approved refund adjustment becomes a refund action", () => {
    const action = mapPaddleEvent({
      event_type: "adjustment.updated",
      data: { id: "adj_7", action: "refund", status: "approved", transaction_id: "txn_55" },
    });
    expect(action).toEqual({ kind: "refund", transactionId: "txn_55", adjustmentId: "adj_7" });
  });

  test("a non-refund adjustment and unknown events are ignored", () => {
    expect(
      mapPaddleEvent({
        event_type: "adjustment.created",
        data: { id: "adj_8", action: "credit", status: "approved" },
      }).kind,
    ).toBe("ignore");
    expect(mapPaddleEvent({ event_type: "transaction.paid", data: {} }).kind).toBe("ignore");
  });
});
