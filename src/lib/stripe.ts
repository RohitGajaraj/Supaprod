import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Payments are not configured for this build. Complete payment provider go-live to enable production checkout.",
  );
}

/**
 * Dormant-payments probe. Payments being unconfigured is a LEGAL state
 * (metering off until go-live, founder ruling) — ambient UI must branch on
 * this instead of calling the throwing helpers, so the dormant state never
 * surfaces as an uncaught exception. Only a real checkout attempt may throw.
 */
export function paymentsConfigured(): boolean {
  return !!clientToken?.startsWith("pk_test_") || !!clientToken?.startsWith("pk_live_");
}

/** Non-throwing variant for ambient consumers (banners, polls). */
export function getStripeEnvironmentOrNull(): StripeEnv | null {
  return paymentsConfigured() ? paymentsEnvironment() : null;
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}
