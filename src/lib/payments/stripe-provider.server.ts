/**
 * PC-05 — the Stripe adapter, refactored INTO the PaymentsProvider seam.
 * The event handlers here are the exact bodies that lived in
 * routes/api/public/payments/webhook.ts (moved, not rewritten — that rail is
 * sandbox-verified end-to-end), now feeding the shared grant core plus the
 * new charge.refunded → clawback path.
 */
import { type StripeEnv, createStripeClient, verifyWebhook } from "@/lib/stripe.server";
import {
  resolveTopupCredits,
  isTopupCheckout,
  isRenewalInvoice,
  resolvePriceLookup,
  buildSubscriptionUpsert,
  buildSubscriptionUpdate,
} from "@/lib/billing-webhook";
import { invoiceSubscriptionId } from "@/lib/stripe-invoice";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckoutInput, CheckoutSession, PaymentsProviderAdapter } from "./provider.server";
import {
  applyRefundClawback,
  applyTierForUser,
  applyTopupPurchase,
  findTopupForRefund,
  getServiceClient,
  grantForSubscription,
  type PaymentsEnv,
} from "./grant-core.server";
import { readCreditRpcResult } from "./credit-rpc-envelope";

/**
 * How long the line-items lookup may hold the webhook open. Stripe abandons a
 * webhook delivery well inside a minute; a request with no deadline can outlive
 * that and burn the retry on a connection nobody is listening to any more.
 */
const LINE_ITEMS_TIMEOUT_MS = 10_000;

/**
 * The verified Stripe event, as much of it as this file reads. `id` is typed
 * unknown rather than string on purpose: it is the field whose absence used to
 * be invisible, and narrowing it at the one place it is read is what makes a
 * malformed payload impossible to process by accident.
 */
type StripeEventEnvelope = { id?: unknown; type: string; data: { object: any } };

function hasKeys(env: PaymentsEnv): boolean {
  const key =
    env === "sandbox" ? process.env.STRIPE_SANDBOX_API_KEY : process.env.STRIPE_LIVE_API_KEY;
  const secret =
    env === "sandbox"
      ? process.env.PAYMENTS_SANDBOX_WEBHOOK_SECRET
      : process.env.PAYMENTS_LIVE_WEBHOOK_SECRET;
  return Boolean(key && secret && process.env.LOVABLE_API_KEY);
}

/**
 * Resolve-or-create the Stripe customer for a Supaprod user. Metadata.userId is
 * the join key the webhook relies on; e-mail is a fallback match that gets the
 * metadata backfilled.
 */
export async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

/** The one checkout-session creator both server fns and the adapter share. */
export async function stripeCreateCheckout(input: CheckoutInput): Promise<CheckoutSession> {
  const stripe = createStripeClient(input.env);
  const prices = await stripe.prices.list({ lookup_keys: [input.lookupKey] });
  if (!prices.data.length) throw new Error(`Price not found: ${input.lookupKey}`);
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";

  const customerId = await resolveOrCreateCustomer(stripe, {
    email: input.email,
    userId: input.userId,
  });

  let productDescription: string | undefined;
  if (!isRecurring) {
    const productId =
      typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
    const product = await stripe.products.retrieve(productId);
    productDescription = product.name;
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: input.quantity || 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded_page",
    return_url: input.returnUrl,
    customer: customerId,
    ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
    // Preserve the pre-seam metadata semantics: a non-recurring, non-top-up
    // price is a one-time purchase regardless of what the caller assumed.
    metadata: {
      userId: input.userId,
      kind: input.kind === "topup" ? "topup" : isRecurring ? "subscription" : "one_time",
    },
    ...(isRecurring && {
      subscription_data: { metadata: { userId: input.userId, price_lookup_key: input.lookupKey } },
    }),
  } as Parameters<typeof stripe.checkout.sessions.create>[0]);

  return { provider: "stripe", mode: "embedded_secret", clientSecret: session.client_secret ?? "" };
}

// --- Event handlers (moved verbatim from the webhook route) -----------------
//
// THE `any` ON EVERY PAYLOAD BELOW IS DELIBERATE AND WAS RE-EXAMINED ON
// 2026-09-01, DURING THE SWEEP THAT TYPED THE REST OF src/lib. It stays for two
// measured reasons.
//
// 1. It is not a database boundary, and the database boundary here is already
//    checked. `getServiceClient()` is `createClient<Database>`, so the tables
//    and payloads these handlers write ARE type-checked today: renaming
//    `.from("subscriptions")` to a table that does not exist produces 16 tsc
//    errors in this file (measured, not assumed). Typing `sub` would not add a
//    single check on anything that reaches Postgres.
//
// 2. The shape genuinely is open at this point. `verifyWebhook` in
//    stripe.server.ts does its own HMAC over the raw body and then returns a
//    bare `JSON.parse(body)`; it never runs the Stripe SDK's `constructEvent`.
//    The HMAC proves the payload came from Stripe, not that it has any
//    particular shape, and Stripe versions its event schemas independently of
//    this deployment. Annotating `sub` as `Stripe.Subscription` would assert a
//    structure nothing verified, and would make the `sub.metadata?.userId` /
//    `sub.items?.data?.[0]` guards below -- which are the checks actually doing
//    the work -- look redundant to the next reader who might then delete them.
//
// If this is ever revisited, the correct order is: validate the parsed body
// against a schema first, then type the handlers from that schema. Typing them
// without the validation would move the lie, not remove it.

async function handleSubscriptionCreated(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error("Webhook: subscription has no userId metadata", sub.id);
    return;
  }
  const priceId = resolvePriceLookup(sub.items?.data?.[0]);

  await getServiceClient()
    .from("subscriptions")
    .upsert(buildSubscriptionUpsert(sub, env, new Date().toISOString()), {
      onConflict: "stripe_subscription_id",
    });
  await applyTierForUser(userId, priceId, sub.status);
  await grantForSubscription(userId, priceId, sub.status);
}

async function handleSubscriptionUpdated(sub: any, env: StripeEnv) {
  const priceId = resolvePriceLookup(sub.items?.data?.[0]);

  await getServiceClient()
    .from("subscriptions")
    .update(buildSubscriptionUpdate(sub, new Date().toISOString()))
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env);
  const userId = sub.metadata?.userId;
  if (userId) await applyTierForUser(userId, priceId, sub.status);
  await grantForSubscription(userId, priceId, sub.status);
}

async function handleSubscriptionDeleted(sub: any, env: StripeEnv) {
  await getServiceClient()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env);
  const userId = sub.metadata?.userId;
  const item = sub.items?.data?.[0];
  const priceId = resolvePriceLookup(item);
  if (userId && priceId) await applyTierForUser(userId, priceId, "canceled");
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  if (!isTopupCheckout(session)) return;
  const userId = session.metadata?.userId;

  /**
   * A REFUSED LOOKUP IS NOT AN EMPTY CART.
   *
   * This was `fetch(...).then(r => r.json())` with no status check and no
   * deadline. A 401, a 429 or a 500 from the gateway returns a body that parses
   * as JSON perfectly well, so `data` came back undefined, `lookup_key` came
   * back undefined, `resolveTopupCredits` answered null, and the handler logged
   * and RETURNED. The route then answered 200. The customer's card had been
   * charged, no credits were granted, and because 200 means "handled" Stripe
   * never redelivered, so the loss was permanent and invisible.
   *
   * Throwing is the fix, not the symptom: the route turns it into a non-2xx and
   * the redelivery gets another chance at a transient gateway failure.
   */
  const response = await fetch(
    `https://connector-gateway.lovable.dev/stripe/v1/checkout/sessions/${session.id}/line_items`,
    {
      headers: {
        "X-Connection-Api-Key":
          env === "sandbox"
            ? process.env.STRIPE_SANDBOX_API_KEY!
            : process.env.STRIPE_LIVE_API_KEY!,
        "Lovable-API-Key": process.env.LOVABLE_API_KEY!,
      },
      signal: AbortSignal.timeout(LINE_ITEMS_TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Stripe line_items lookup failed for paid session ${session.id}: ${response.status} ${body.slice(0, 300)}`,
    );
  }
  const lineItems = (await response.json()) as {
    data?: Array<{ price?: { lookup_key?: string; id?: string } }>;
  };

  const lookupKey = lineItems.data?.[0]?.price?.lookup_key;
  const credits = resolveTopupCredits(lookupKey);
  if (!credits) {
    // Same money, different cause: the lookup succeeded and named a price the
    // catalog does not know, which means a paid top-up cannot be sized. A retry
    // will not fix a mis-registered price, but a 200 would bury it forever,
    // and a failing delivery in the Stripe dashboard is the only alarm that
    // reaches a person.
    throw new Error(
      `Stripe top-up session ${session.id} was paid against an unknown lookup_key ${String(lookupKey)}, so no credits could be granted`,
    );
  }

  await applyTopupPurchase({
    userId,
    sessionId: session.id,
    paymentIntentId: session.payment_intent ?? null,
    credits,
    amountCents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    lookupKey: lookupKey ?? null,
    env,
  });
}

async function handleInvoicePaymentFailed(invoice: any, env: StripeEnv) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;
  await getServiceClient()
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId)
    .eq("environment", env);
}

async function handleInvoicePaymentSucceeded(invoice: any, env: StripeEnv) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;
  const admin = getServiceClient() as unknown as SupabaseClient;
  await admin
    .from("subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId)
    .eq("environment", env);
  if (!isRenewalInvoice(invoice)) return;
  const { data: sub } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subId)
    .eq("environment", env)
    .maybeSingle();
  const userId = (sub as { user_id?: string } | null)?.user_id;
  if (!userId) {
    // Not thrown: a renewal for a subscription this database never recorded is
    // not something a redelivery can repair. It IS logged, because it used to
    // be a bare return and the missed refill left the subscriber short.
    console.error("Webhook: renewal invoice for unknown subscription", subId);
    return;
  }
  const { resolveAccountId } = await import("./grant-core.server");
  const accountId = await resolveAccountId(userId);
  if (!accountId) {
    throw new Error(
      `reset_subscription_cycle: no account for user ${userId}, so the renewal of ${subId} refilled nothing`,
    );
  }
  // The try/catch here was decorative for the same reason it was in grant-core:
  // supabase-js resolves a refused RPC. A renewal that silently fails to refill
  // is a paid month the subscriber cannot spend.
  const { data: reset, error: resetError } = await admin.rpc("reset_subscription_cycle", {
    _account_id: accountId,
  });
  const verdict = readCreditRpcResult({
    rpc: "reset_subscription_cycle",
    successKey: "reset",
    // 'no_grant' is an account that has never been granted an allowance, which
    // grantForSubscription owns; there is nothing for a reset to refill.
    benignReasons: ["no_grant"],
    result: reset,
    error: resetError,
  });
  if (!verdict.ok) throw new Error(verdict.failure);
}

/**
 * PC-05 refund path (new): a refunded charge whose payment intent matches a
 * completed top-up purchase claws those credits back, floored at zero.
 * Subscription-fee refunds deliberately do NOT claw the monthly allowance —
 * the subscription lifecycle events (cancel/downgrade) already govern that.
 */
async function handleChargeRefunded(charge: any, _env: StripeEnv) {
  const paymentIntentId: string | null =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);
  if (!paymentIntentId) return;
  const topup = await findTopupForRefund({ paymentIntentId });
  if (!topup) return;
  const refundRef: string = charge.refunds?.data?.[0]?.id ?? `stripe_charge_${charge.id as string}`;
  await applyRefundClawback({
    accountId: topup.accountId,
    userId: topup.userId,
    refundRef,
    credits: topup.credits,
    provider: "stripe",
    note: `refund_clawback:stripe:${charge.id as string}`,
    topupSessionId: topup.sessionId,
  });
}

/**
 * Take the exactly-once claim on a Stripe event id. True means this delivery
 * owns the event; false means another delivery already processed it.
 *
 * The insert-and-count idiom is the one already proven in this repo by
 * `apply_topup_credits` and `apply_refund_clawback`: ON CONFLICT DO NOTHING
 * plus GET DIAGNOSTICS row_count, decided inside one statement. A
 * SELECT-then-INSERT here would reproduce, at the outermost layer, precisely
 * the race every inner guard exists to close.
 */
async function claimStripeEvent(eventId: string, type: string): Promise<boolean> {
  const admin = getServiceClient() as unknown as SupabaseClient;
  const { data, error } = await admin.rpc("claim_stripe_event", {
    _event_id: eventId,
    _type: type,
  });
  if (error) {
    // Never assume the claim succeeded. Assuming it failed would re-run a grant
    // that may already have landed; assuming it succeeded would drop the event
    // entirely. Refusing the delivery keeps both doors shut and lets Stripe retry.
    throw new Error(`claim_stripe_event failed for ${eventId}: ${error.message}`);
  }
  return data === true;
}

/**
 * Give the claim back after a handler failed, so the redelivery Stripe is about
 * to send is not discarded as a duplicate of a delivery that did nothing.
 *
 * This is the hinge between the two fixes in this file. Without it, adding
 * idempotency would CANCEL the retry that answering non-2xx exists to trigger,
 * and a transient database blip during a paid top-up would become the same
 * permanent silent loss it was before, just by a new route.
 */
async function releaseStripeEvent(eventId: string): Promise<void> {
  const admin = getServiceClient() as unknown as SupabaseClient;
  const { error } = await admin.rpc("release_stripe_event", { _event_id: eventId });
  if (error) {
    // Deliberately not thrown: the handler's own failure is the one worth
    // reporting to the route. But an unreleased claim means the retry will be
    // ignored, so this line is the operator's only warning that the event needs
    // replaying by hand.
    console.error(
      `release_stripe_event failed for ${eventId}, so its Stripe redelivery will be dropped as a duplicate:`,
      error.message,
    );
  }
}

/**
 * STRIPE DELIVERS AT LEAST ONCE, SO THIS FUNCTION MUST ACT AT MOST ONCE.
 *
 * Verified on 2026-08-14: nothing here read `event.id` (the type cast did not
 * even name the field) and no table recorded which events had been handled. The
 * cost was not theoretical. `reset_subscription_cycle` sets
 * `balance_credits = monthly_grant` unconditionally, so a redelivered
 * `invoice.payment_succeeded` after a customer had spent their month restored
 * the full balance, free, every time Stripe retried.
 *
 * The claim is taken BEFORE the switch, so it covers every handler including
 * ones added later, and it is released if the handler throws. The window
 * between claim and release is the only thing a concurrent duplicate delivery
 * can lose to, which is the correct trade: a duplicate that arrives mid-flight
 * is dropped rather than doubled.
 */
async function stripeGrantFromEvent(event: unknown, env: PaymentsEnv): Promise<void> {
  const e = event as StripeEventEnvelope;
  const eventId = typeof e.id === "string" && e.id.length > 0 ? e.id : null;
  if (!eventId) {
    // Every event Stripe signs carries an id, so this is a malformed or
    // hand-rolled payload. Processing it would mean granting credits with no
    // way to recognize the same grant arriving twice.
    throw new Error(
      `Stripe event of type ${String(e.type)} carries no id, so it cannot be processed exactly once`,
    );
  }
  if (!(await claimStripeEvent(eventId, e.type))) return;
  try {
    await dispatchStripeEvent(e, env);
  } catch (err) {
    await releaseStripeEvent(eventId);
    throw err;
  }
}

async function dispatchStripeEvent(e: StripeEventEnvelope, env: PaymentsEnv): Promise<void> {
  switch (e.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(e.data.object, env);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(e.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(e.data.object, env);
      break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(e.data.object, env);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(e.data.object, env);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(e.data.object, env);
      break;
    case "charge.refunded":
      await handleChargeRefunded(e.data.object, env);
      break;
    default:
      console.log("Webhook unhandled event:", e.type);
  }
}

export const stripeProvider: PaymentsProviderAdapter = {
  id: "stripe",
  configured: hasKeys,
  createCheckout: stripeCreateCheckout,
  verifyWebhook: (req, env) => verifyWebhook(req, env),
  grantFromEvent: stripeGrantFromEvent,
};
