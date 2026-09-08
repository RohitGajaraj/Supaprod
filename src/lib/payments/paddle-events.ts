/**
 * PC-05 — Paddle Billing webhook grammar, PURE (no IO, unit-tested).
 *
 * Paddle is the recommended merchant-of-record rail (dissolves the
 * Stripe-India entity blocker). Its catalog carries our shared price
 * vocabulary in `custom_data.lookup_key` (the same billing-tier.ts keys the
 * Stripe catalog uses), so the tier map, credit math, and top-up caps never
 * fork per provider.
 *
 * These helpers translate raw Paddle events into the provider-neutral
 * actions the grant core executes. The server adapter owns signatures + IO.
 */

/** Parse the Paddle-Signature header: `ts=1671552777;h1=abc[;h1=def]`. */
export function parsePaddleSignature(
  header: string | null,
): { ts: string; signatures: string[] } | null {
  if (!header) return null;
  let ts: string | undefined;
  const signatures: string[] = [];
  for (const part of header.split(";")) {
    const [key, value] = part.split("=", 2);
    if (key === "ts") ts = value;
    if (key === "h1" && value) signatures.push(value);
  }
  if (!ts || signatures.length === 0) return null;
  return { ts, signatures };
}

/**
 * Paddle subscription status → the house status vocabulary that
 * effectiveTierForStatus / subscriptionStatusGrantsCredits already reason
 * about. Paddle's `paused` deliberately maps to itself (not tier-preserving,
 * same as Stripe's rule); `past_due` keeps access through dunning.
 */
export function mapPaddleSubscriptionStatus(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
      return "canceled";
    default:
      return status ?? "unknown";
  }
}

type PaddleItem = {
  price?: {
    id?: string;
    product_id?: string;
    custom_data?: { lookup_key?: string } | null;
  } | null;
};

/** The Paddle product id behind the first priced item (subscriptions.product_id is NOT NULL). */
export function paddleItemProductId(items: PaddleItem[] | null | undefined): string | null {
  for (const item of items ?? []) {
    if (item?.price?.product_id) return item.price.product_id;
  }
  return null;
}

/** The shared lookup key a Paddle subscription/transaction item carries. */
export function paddleItemLookupKey(items: PaddleItem[] | null | undefined): string | undefined {
  for (const item of items ?? []) {
    const key = item?.price?.custom_data?.lookup_key;
    if (key) return key;
  }
  return undefined;
}

export type PaddleNormalizedAction =
  | {
      kind: "subscription";
      userId: string | undefined;
      subscriptionId: string;
      customerId: string | null;
      lookupKey: string | undefined;
      /** subscriptions.product_id is NOT NULL; Paddle's product id fills it. */
      productId: string | null;
      status: string;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
    }
  | {
      kind: "topup";
      userId: string | undefined;
      transactionId: string;
      lookupKey: string | undefined;
      amountCents: number;
      currency: string;
    }
  | {
      kind: "refund";
      /** The refunded transaction (joins to the recorded purchase). */
      transactionId: string | null;
      adjustmentId: string;
    }
  | { kind: "ignore"; eventType: string };

/**
 * One Paddle event → one provider-neutral action. Renewal refills need no
 * special case: Paddle re-sends subscription.updated with the new period on
 * renewal, and transaction.completed for a subscription cycle carries
 * custom_data.kind !== 'topup' so it is ignored (the grant path is
 * subscription-driven, mirroring the Stripe rail's design).
 */
/**
 * The fields this mapper reads off a Paddle event's `data`, typed loosely on
 * purpose: the HMAC proves the payload came from Paddle, not that it has any
 * particular shape, so every field is narrowed where it is read.
 */
export type PaddleEventData = {
  status?: unknown;
  custom_data?: { userId?: unknown; kind?: unknown; lookup_key?: unknown } | null;
  id?: unknown;
  customer_id?: unknown;
  items?: unknown;
  current_billing_period?: { ends_at?: unknown } | null;
  scheduled_change?: { action?: unknown } | null;
  details?: { totals?: { total?: unknown } | null } | null;
  currency_code?: unknown;
  [key: string]: unknown;
};

export function mapPaddleEvent(event: {
  event_type?: string;
  data?: PaddleEventData | null;
}): PaddleNormalizedAction {
  const type = event.event_type ?? "unknown";
  const data: PaddleEventData = event.data ?? {};

  if (
    type === "subscription.created" ||
    type === "subscription.activated" ||
    type === "subscription.updated" ||
    type === "subscription.trialing" ||
    type === "subscription.past_due" ||
    type === "subscription.paused" ||
    type === "subscription.resumed" ||
    type === "subscription.canceled"
  ) {
    const status =
      type === "subscription.canceled"
        ? "canceled"
        : mapPaddleSubscriptionStatus(data.status as string | undefined);
    return {
      kind: "subscription",
      userId: (data.custom_data?.userId as string | undefined) ?? undefined,
      subscriptionId: String(data.id ?? ""),
      customerId: (data.customer_id as string | undefined) ?? null,
      lookupKey: paddleItemLookupKey(data.items as PaddleItem[] | undefined),
      productId: paddleItemProductId(data.items as PaddleItem[] | undefined),
      status,
      currentPeriodEnd: (data.current_billing_period?.ends_at as string | undefined) ?? null,
      cancelAtPeriodEnd: Boolean(data.scheduled_change?.action === "cancel"),
    };
  }

  if (type === "transaction.completed") {
    if (data.custom_data?.kind !== "topup") return { kind: "ignore", eventType: type };
    return {
      kind: "topup",
      userId: (data.custom_data?.userId as string | undefined) ?? undefined,
      transactionId: String(data.id ?? ""),
      lookupKey:
        paddleItemLookupKey(data.items as PaddleItem[] | undefined) ??
        (data.custom_data?.lookup_key as string | undefined),
      amountCents: Number(data.details?.totals?.total ?? 0),
      currency: String(data.currency_code ?? "usd").toLowerCase(),
    };
  }

  // A refund lands as an adjustment with action 'refund' once approved.
  if (type === "adjustment.created" || type === "adjustment.updated") {
    const action = data.action as string | undefined;
    const status = data.status as string | undefined;
    if (action === "refund" && (status === "approved" || status === "reversed" || !status)) {
      return {
        kind: "refund",
        transactionId: (data.transaction_id as string | undefined) ?? null,
        adjustmentId: String(data.id ?? ""),
      };
    }
    return { kind: "ignore", eventType: type };
  }

  return { kind: "ignore", eventType: type };
}
