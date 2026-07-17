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

  const lineItems = await fetch(
    `https://connector-gateway.lovable.dev/stripe/v1/checkout/sessions/${session.id}/line_items`,
    {
      headers: {
        "X-Connection-Api-Key":
          env === "sandbox"
            ? process.env.STRIPE_SANDBOX_API_KEY!
            : process.env.STRIPE_LIVE_API_KEY!,
        "Lovable-API-Key": process.env.LOVABLE_API_KEY!,
      },
    },
  ).then(
    (r) => r.json() as Promise<{ data: Array<{ price: { lookup_key?: string; id: string } }> }>,
  );

  const lookupKey = lineItems.data?.[0]?.price?.lookup_key;
  const credits = resolveTopupCredits(lookupKey);
  if (!credits) {
    console.error("Webhook: top-up has unknown lookup_key", lookupKey);
    return;
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
  if (!userId) return;
  const { resolveAccountId } = await import("./grant-core.server");
  const accountId = await resolveAccountId(userId);
  if (!accountId) return;
  try {
    await admin.rpc("reset_subscription_cycle", { _account_id: accountId });
  } catch (e) {
    console.error("reset_subscription_cycle failed:", e);
  }
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

async function stripeGrantFromEvent(event: unknown, env: PaymentsEnv): Promise<void> {
  const e = event as { type: string; data: { object: any } };
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
