/**
 * PC-05 — the Paddle Billing adapter (merchant-of-record rail), built to the
 * live-key seam. Everything here is wired and unit-tested against fixtures;
 * activation needs ONLY the founder's Paddle account [awaiting MoR account]:
 *
 *   1. PADDLE_API_KEY + PADDLE_WEBHOOK_SECRET as wrangler secrets
 *      (sandbox first, then live values — same names, env passed per call)
 *   2. the webhook destination registered in Paddle:
 *        /api/public/payments/webhook?env=<sandbox|live>&provider=paddle
 *   3. the catalog mirrored in Paddle with our lookup keys in each price's
 *      custom_data.lookup_key (cluster_* / constellation_* / galaxy_* / topup_*)
 *   4. PAYMENTS_PROVIDER=paddle to make it the active checkout rail
 *
 * No code changes required at go-live — that is the seam's contract.
 */
import { resolveTopupCredits } from "@/lib/billing-webhook";
import { creditsFromLookupKey } from "@/lib/billing-tier";
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
import { mapPaddleEvent, parsePaddleSignature, type PaddleEventData } from "./paddle-events";

function apiBase(env: PaymentsEnv): string {
  return env === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

function apiKey(): string {
  const key = process.env.PADDLE_API_KEY;
  if (!key) {
    // [awaiting MoR account] — the live-key seam. The founder's Paddle account
    // supplies this secret; until then the adapter reports unconfigured.
    throw new Error("Paddle is not configured yet (PADDLE_API_KEY missing).");
  }
  return key;
}

function webhookSecret(): string {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Paddle is not configured yet (PADDLE_WEBHOOK_SECRET missing).");
  }
  return secret;
}

async function paddleFetch<T>(env: PaymentsEnv, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase(env)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json()) as { data?: T; error?: { detail?: string; code?: string } };
  if (!res.ok) {
    throw new Error(body.error?.detail ?? `Paddle request failed (${res.status})`);
  }
  return body.data as T;
}

/** Find the Paddle price whose custom_data.lookup_key matches our catalog key. */
async function priceIdForLookupKey(env: PaymentsEnv, lookupKey: string): Promise<string> {
  const prices = await paddleFetch<
    Array<{ id: string; custom_data?: { lookup_key?: string } | null }>
  >(env, "/prices?per_page=200&status=active");
  const match = (prices ?? []).find((p) => p.custom_data?.lookup_key === lookupKey);
  if (!match) throw new Error(`Paddle price not found for lookup key: ${lookupKey}`);
  return match.id;
}

/**
 * Hosted checkout: create a transaction; Paddle returns its checkout URL
 * (the account's default payment link must be configured — part of the MoR
 * account setup checklist above).
 */
async function paddleCreateCheckout(input: CheckoutInput): Promise<CheckoutSession> {
  const priceId = await priceIdForLookupKey(input.env, input.lookupKey);
  const txn = await paddleFetch<{ id: string; checkout?: { url?: string | null } }>(
    input.env,
    "/transactions",
    {
      method: "POST",
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: input.quantity || 1 }],
        custom_data: { userId: input.userId, kind: input.kind, lookup_key: input.lookupKey },
        checkout: { url: null },
      }),
    },
  );
  const url = txn.checkout?.url;
  if (!url) {
    throw new Error(
      "Paddle did not return a checkout URL. Set the default payment link in Paddle > Checkout settings.",
    );
  }
  return { provider: "paddle", mode: "hosted_url", url };
}

/** Verify the Paddle-Signature header (ts + HMAC-SHA256 h1 over `${ts}:${body}`). */
async function paddleVerifyWebhook(req: Request, _env: PaymentsEnv): Promise<unknown> {
  const parsed = parsePaddleSignature(req.headers.get("paddle-signature"));
  const body = await req.text();
  if (!parsed || !body) throw new Error("Missing Paddle signature or body");

  const age = Math.abs(Date.now() / 1000 - Number(parsed.ts));
  if (!Number.isFinite(age) || age > 300) throw new Error("Webhook timestamp too old");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${parsed.ts}:${body}`),
  );
  const expected = Buffer.from(new Uint8Array(signed)).toString("hex");
  if (!parsed.signatures.includes(expected)) throw new Error("Invalid webhook signature");

  return JSON.parse(body);
}

async function paddleGrantFromEvent(event: unknown, env: PaymentsEnv): Promise<void> {
  const action = mapPaddleEvent(event as { event_type?: string; data?: PaddleEventData | null });

  if (action.kind === "subscription") {
    if (!action.userId) {
      console.error(
        "Paddle webhook: subscription has no userId custom_data",
        action.subscriptionId,
      );
      return;
    }
    // The subscriptions table's *_id columns predate the seam and keep their
    // legacy names; provider='paddle' marks whose ids they hold.
    const now = new Date().toISOString();
    const admin = getServiceClient();
    await admin.from("subscriptions").upsert(
      {
        stripe_subscription_id: action.subscriptionId,
        stripe_customer_id: action.customerId,
        user_id: action.userId,
        status: action.status,
        // product_id/price_id are NOT NULL legacy-named columns; they hold
        // Paddle's product id and our shared lookup key respectively.
        product_id: action.productId ?? "paddle_unmapped",
        price_id: action.lookupKey ?? "paddle_unmapped",
        current_period_end: action.currentPeriodEnd,
        cancel_at_period_end: action.cancelAtPeriodEnd,
        environment: env,
        provider: "paddle",
        updated_at: now,
      } as never,
      { onConflict: "stripe_subscription_id" },
    );
    await applyTierForUser(action.userId, action.lookupKey, action.status);
    await grantForSubscription(action.userId, action.lookupKey, action.status);
    return;
  }

  if (action.kind === "topup") {
    if (!action.userId) {
      console.error("Paddle webhook: top-up has no userId custom_data", action.transactionId);
      return;
    }
    const credits = resolveTopupCredits(action.lookupKey) ?? creditsFromLookupKey(action.lookupKey);
    if (!credits || credits <= 0) {
      console.error("Paddle webhook: top-up has unknown lookup_key", action.lookupKey);
      return;
    }
    await applyTopupPurchase({
      userId: action.userId,
      sessionId: action.transactionId,
      paymentIntentId: null,
      credits,
      amountCents: action.amountCents,
      currency: action.currency,
      lookupKey: action.lookupKey ?? null,
      env,
    });
    return;
  }

  if (action.kind === "refund") {
    if (!action.transactionId) return;
    const topup = await findTopupForRefund({ sessionId: action.transactionId });
    if (!topup) return;
    await applyRefundClawback({
      accountId: topup.accountId,
      userId: topup.userId,
      refundRef: action.adjustmentId,
      credits: topup.credits,
      provider: "paddle",
      note: `refund_clawback:paddle:${action.transactionId}`,
      topupSessionId: topup.sessionId,
    });
    return;
  }

  console.log("Paddle webhook unhandled event:", action.eventType);
}

export const paddleProvider: PaymentsProviderAdapter = {
  id: "paddle",
  configured: () => Boolean(process.env.PADDLE_API_KEY && process.env.PADDLE_WEBHOOK_SECRET),
  createCheckout: paddleCreateCheckout,
  verifyWebhook: paddleVerifyWebhook,
  grantFromEvent: paddleGrantFromEvent,
};
