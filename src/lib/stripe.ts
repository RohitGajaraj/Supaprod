import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

/**
 * Pure function to parse Stripe environment from a publishable key token.
 *
 * Testable in isolation without depending on import.meta.env capture.
 * @param token - Stripe publishable key (pk_test_*, pk_live_*, or undefined)
 * @returns "sandbox" for pk_test_*, "live" for pk_live_*, null if undefined/unconfigured
 * @throws if token is a non-standard prefix (should not happen with real Stripe keys)
 */
export function parseStripeEnv(token: string | undefined): StripeEnv | null {
  if (!token) return null;

  const trimmed = token.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("pk_test_")) return "sandbox";
  if (trimmed.startsWith("pk_live_")) return "live";

  // Reject malformed tokens (not a recognized Stripe prefix)
  throw new Error(
    "Payments are not configured for this build. Complete payment provider go-live to enable production checkout.",
  );
}

function paymentsEnvironment(): StripeEnv {
  const env = parseStripeEnv(clientToken);
  if (env === null) {
    throw new Error(
      "Payments are not configured for this build. Complete payment provider go-live to enable production checkout.",
    );
  }
  return env;
}

/**
 * Dormant-payments probe. Payments being unconfigured is a LEGAL state
 * (metering off until go-live, founder ruling) — ambient UI must branch on
 * this instead of calling the throwing helpers, so the dormant state never
 * surfaces as an uncaught exception. Only a real checkout attempt may throw.
 */
export function paymentsConfigured(): boolean {
  return parseStripeEnv(clientToken) !== null;
}

/** Non-throwing variant for ambient consumers (banners, polls). */
export function getStripeEnvironmentOrNull(): StripeEnv | null {
  return parseStripeEnv(clientToken);
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
