/**
 * PC-05 — the PaymentsProvider seam (the house adapter pattern, the same
 * shape as connectors/RepoProvider/BuildDriver): one interface, one adapter
 * per merchant rail, one shared grant core behind both.
 *
 *   createCheckout  — start a purchase (Stripe: embedded client secret;
 *                     Paddle: hosted checkout URL)
 *   verifyWebhook   — authenticate the provider's webhook signature and
 *                     return the parsed event
 *   grantFromEvent  — translate the verified event into grant-core calls
 *                     (tier flip, credit grant, top-up, refund clawback)
 *
 * Provider selection is platform-level: PAYMENTS_PROVIDER env ('stripe'
 * default). Flipping to 'paddle' requires ZERO code changes — the founder's
 * merchant-of-record account supplies PADDLE_API_KEY / PADDLE_WEBHOOK_SECRET
 * and the webhook registration ([awaiting MoR account] — the live-key seam).
 */
import type { PaymentsEnv, PaymentsProviderId } from "./grant-core.server";

export type { PaymentsEnv, PaymentsProviderId };

export type CheckoutInput = {
  userId: string;
  email?: string;
  /** Catalog lookup key — the provider-neutral price vocabulary (billing-tier.ts). */
  lookupKey: string;
  quantity?: number;
  returnUrl: string;
  env: PaymentsEnv;
  kind: "subscription" | "topup" | "one_time";
};

export type CheckoutSession =
  /** Stripe embedded checkout mounts from a client secret. */
  | { provider: "stripe"; mode: "embedded_secret"; clientSecret: string }
  /** Paddle (and any hosted-page rail) hands the browser a URL. */
  | { provider: "paddle"; mode: "hosted_url"; url: string };

export interface PaymentsProviderAdapter {
  id: PaymentsProviderId;
  /** True when this rail's keys exist for the env (no secret values exposed). */
  configured(env: PaymentsEnv): boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /** Throws on a bad signature; returns the parsed, trusted event. */
  verifyWebhook(req: Request, env: PaymentsEnv): Promise<unknown>;
  /** Applies the event through the shared grant core. Idempotent. */
  grantFromEvent(event: unknown, env: PaymentsEnv): Promise<void>;
}

/** The platform's active rail. Stripe unless the founder flips the env var. */
export function activePaymentsProviderId(): PaymentsProviderId {
  return process.env.PAYMENTS_PROVIDER === "paddle" ? "paddle" : "stripe";
}

export async function paymentsProvider(
  id: PaymentsProviderId = activePaymentsProviderId(),
): Promise<PaymentsProviderAdapter> {
  if (id === "paddle") {
    const { paddleProvider } = await import("./paddle-provider.server");
    return paddleProvider;
  }
  const { stripeProvider } = await import("./stripe-provider.server");
  return stripeProvider;
}

export function isPaymentsProviderId(v: unknown): v is PaymentsProviderId {
  return v === "stripe" || v === "paddle";
}
