// M-C-BILLING-TESTS — the pure, testable decision/extraction layer of the Stripe
// payments webhook (`src/routes/api/public/payments/webhook.ts`).
//
// The webhook handlers mix three concerns: (1) PURE decisions on the Stripe event
// (which price? how many credits? is this a top-up / a renewal?), (2) timestamp
// shaping, and (3) the DB writes. A bug in (1)/(2) silently mis-bills EVERY
// customer, yet it was untested. This module lifts (1)+(2) out as pure functions so
// they are unit-tested and DRY across the six handlers (they can't drift). The tier
// rules live in the sibling `billing-tier.ts`; the DB writes stay in the route.
//
// Server-free. Every extractor here is total -- a malformed Stripe payload gets
// undefined/null/false back, never an exception. The ONE exception is
// `buildSubscriptionUpsert`, which refuses (throws) rather than emit a row missing
// a NOT NULL identity column; see the comment on `requireStripeField` for why
// silence was the worse option there.
import { creditsFromLookupKey } from "./billing-tier";

/** Per-bundle top-up credit fallback for legacy lookup keys (catalog keys resolve via creditsFromLookupKey). */
export const TOPUP_CREDITS: Record<string, number> = {
  topup_250: 250,
  topup_1k: 1000,
  topup_2_5k: 2500,
};

/** A minimal shape of a Stripe subscription/line item's price (only the fields we read). */
type PriceLike =
  | {
      price?: {
        lookup_key?: string | null;
        metadata?: { lovable_external_id?: string | null } | null;
        id?: string | null;
      } | null;
    }
  | null
  | undefined;

/**
 * PURE. Resolve the price key from a subscription line item: prefer the catalog
 * `lookup_key`, then the Lovable external id, then the raw Stripe price id. This is
 * the key every tier/credit decision keys off, so the fallback order is load-bearing
 * (a missed lookup_key must still resolve to SOMETHING, never undefined-mis-tier).
 */
export function resolvePriceLookup(item: PriceLike): string | undefined {
  const price = item?.price;
  return price?.lookup_key || price?.metadata?.lovable_external_id || price?.id || undefined;
}

/**
 * PURE. Credits for a one-time top-up checkout: the catalog amount for the bundle's
 * lookup_key, falling back to the static legacy map. Returns null when neither knows
 * the key (the handler then skips crediting rather than guessing).
 */
export function resolveTopupCredits(lookupKey: string | null | undefined): number | null {
  if (!lookupKey) return null;
  const catalog = creditsFromLookupKey(lookupKey);
  if (catalog && catalog > 0) return catalog;
  const legacy = TOPUP_CREDITS[lookupKey];
  return legacy && legacy > 0 ? legacy : null;
}

/** PURE. Stripe unix-seconds → ISO string, or null when absent/invalid (no fake epoch-0). */
export function unixSecondsToIso(sec: number | null | undefined): string | null {
  if (typeof sec !== "number" || !Number.isFinite(sec) || sec <= 0) return null;
  return new Date(sec * 1000).toISOString();
}

/** A minimal Stripe checkout.session shape (only the fields the top-up gate reads). */
type CheckoutSessionLike =
  | {
      mode?: string;
      metadata?: { userId?: string; kind?: string } | null;
    }
  | null
  | undefined;

/**
 * PURE. True only for a genuine top-up purchase: a one-time `payment` checkout
 * tagged `kind=topup` with a userId. A subscription checkout (`mode=subscription`)
 * or any untagged session must NOT mint top-up credits.
 */
export function isTopupCheckout(session: CheckoutSessionLike): boolean {
  return (
    session?.mode === "payment" &&
    session?.metadata?.kind === "topup" &&
    !!session?.metadata?.userId
  );
}

/**
 * PURE. True only on a true RENEWAL invoice (`subscription_cycle`). The first
 * invoice (`subscription_create`) is already covered by grant-on-subscribe, so
 * refilling on it would double-grant; every other reason refills nothing.
 */
export function isRenewalInvoice(invoice: { billing_reason?: string } | null | undefined): boolean {
  return invoice?.billing_reason === "subscription_cycle";
}

/** A minimal Stripe subscription shape for building DB rows (only the fields we map). */
type SubscriptionLike = {
  id?: string;
  customer?: string;
  status?: string;
  cancel_at_period_end?: boolean;
  current_period_start?: number | null;
  current_period_end?: number | null;
  metadata?: { userId?: string } | null;
  items?: {
    data?: Array<
      PriceLike & {
        current_period_start?: number | null;
        current_period_end?: number | null;
        price?: { product?: string } | null;
      }
    >;
  } | null;
};

/** The `subscriptions` row we write on a `customer.subscription.created` upsert.
 *  The required-string fields match the table's Insert type; a real subscription
 *  event always carries them (the inline handler relied on the same, via `any`). */
export type SubscriptionUpsertRow = {
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
  updated_at: string;
};

/** The mutable subset we write on a `customer.subscription.updated` patch. */
export type SubscriptionUpdateRow = {
  status: string;
  product_id: string | undefined;
  price_id: string | undefined;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

/**
 * The five `subscriptions` columns that are `NOT NULL` in the schema and have no
 * DEFAULT -- read from the table's own DDL, migration
 * `20260620194844_b7be3886`: `user_id uuid ... NOT NULL`, `stripe_subscription_id
 * text NOT NULL UNIQUE`, `stripe_customer_id text NOT NULL`, `product_id text NOT
 * NULL`, `price_id text NOT NULL`. (`status` and `environment` are NOT NULL but
 * DEFAULTed, which is why they take a `?? ""` / caller value instead.)
 *
 * These used to be written as `sub?.metadata?.userId!` and friends: an optional
 * chain saying "this may be absent", cancelled by a `!` telling the compiler to
 * stop worrying about exactly that. The failure that hides behind it is NOT a
 * crash -- it is silence. supabase-js serialises the row with JSON.stringify,
 * which DROPS `undefined` keys, so a payload missing any of these produces an
 * upsert with the column omitted; PostgREST answers 23502 (not-null violation);
 * and `stripe-provider.server.ts` does not read `error` off that upsert, so the
 * handler carries on to `applyTierForUser` + `grantForSubscription` and the route
 * still answers `{ received: true }`. Net effect of a malformed event today: the
 * customer is GRANTED THE TIER while the subscriptions row that records what they
 * bought never lands, and neither Stripe (200, so no retry) nor we (no log) hear
 * about it. Refusing to build the row is what should happen instead -- it is loud,
 * it reaches the route's `catch` as a 400 so Stripe retries and eventually flags
 * the endpoint, and it stops the tier grant that has no subscription behind it.
 */
function requireStripeField(
  value: string | null | undefined,
  field: string,
  subId: string | null | undefined,
): string {
  if (typeof value === "string" && value.length > 0) return value;
  throw new Error(
    `billing-webhook: refusing to build a subscriptions row -- ${field} is missing on Stripe ` +
      `subscription ${subId || "<no id>"}. That column is NOT NULL, so the write would be ` +
      `rejected and silently swallowed while the tier grant went ahead.`,
  );
}

/**
 * Assemble the `subscriptions` upsert row from a Stripe subscription event.
 * Maps every field the same way the inline handler did (now testable, drift-proof).
 * `nowIso` is injected so the row is deterministic.
 *
 * Total for every field the schema lets be absent; THROWS, by way of
 * `requireStripeField` above, for the five it does not. Every one of those five is
 * present on a real `customer.subscription.created` (`metadata.userId` because we
 * set it ourselves in `subscription_data.metadata` when the checkout session is
 * created, and `stripe-provider.server.ts` guards on it again before calling here),
 * so the throw is unreachable on a well-formed event and is a named, logged failure
 * on anything else.
 */
export function buildSubscriptionUpsert(
  sub: SubscriptionLike,
  env: string,
  nowIso: string,
): SubscriptionUpsertRow {
  const item = sub?.items?.data?.[0];
  const period = resolvePeriod(item, sub);
  const subId = sub?.id;
  return {
    user_id: requireStripeField(sub?.metadata?.userId, "metadata.userId", subId),
    stripe_subscription_id: requireStripeField(subId, "id", subId),
    stripe_customer_id: requireStripeField(sub?.customer, "customer", subId),
    product_id: requireStripeField(item?.price?.product, "items.data[0].price.product", subId),
    // `resolvePriceLookup` already falls back lookup_key -> external id -> price id,
    // so an undefined here means the line item carried no price identity at all.
    price_id: requireStripeField(resolvePriceLookup(item), "items.data[0].price", subId),
    status: sub?.status ?? "",
    current_period_start: period.start,
    current_period_end: period.end,
    cancel_at_period_end: sub?.cancel_at_period_end || false,
    environment: env,
    updated_at: nowIso,
  };
}

/** PURE. Assemble the `subscriptions` update patch from a `subscription.updated` event. */
export function buildSubscriptionUpdate(
  sub: SubscriptionLike,
  nowIso: string,
): SubscriptionUpdateRow {
  const item = sub?.items?.data?.[0];
  const period = resolvePeriod(item, sub);
  return {
    status: sub?.status ?? "",
    product_id: item?.price?.product,
    price_id: resolvePriceLookup(item),
    current_period_start: period.start,
    current_period_end: period.end,
    cancel_at_period_end: sub?.cancel_at_period_end || false,
    updated_at: nowIso,
  };
}

/** PURE. The subscription period window as ISO, preferring the line-item period over the sub-level one. */
export function resolvePeriod(
  item:
    { current_period_start?: number | null; current_period_end?: number | null } | null | undefined,
  sub:
    { current_period_start?: number | null; current_period_end?: number | null } | null | undefined,
): { start: string | null; end: string | null } {
  return {
    start: unixSecondsToIso(item?.current_period_start ?? sub?.current_period_start),
    end: unixSecondsToIso(item?.current_period_end ?? sub?.current_period_end),
  };
}
