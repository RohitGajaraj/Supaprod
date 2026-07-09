/**
 * Founder ruling 2026-07-09: right after onboarding hands off to Today, tell
 * the new user - lightly, in premium plain words - that their starter credits
 * are on the house and what a full run buys. Shows once (localStorage), holds
 * for a few seconds, then leaves on its own; a click dismisses it early.
 *
 * Honesty rules: the number is the REAL monthly grant read from the account,
 * never a hardcoded promise. While credit metering is dormant (enabled=false)
 * or the grant is 0, this renders nothing at all.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyCreditsView } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

const DISMISSED_KEY = "cadence.welcome.credits";
const HOLD_MS = 9000;

export function creditsWelcomeDismissed(): boolean {
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

export function CreditsWelcome({ onDismiss }: { onDismiss: () => void }) {
  const fGetCredits = useServerFn(getMyCreditsView);

  // Same fallback idiom as Settings' Credits tab: a missing Stripe client
  // token must never block the balance read (environment only scopes topups).
  let envSafe: ReturnType<typeof getStripeEnvironment> | null = null;
  try {
    envSafe = getStripeEnvironment();
  } catch {
    envSafe = null;
  }
  const creditsEnv: "sandbox" | "live" = envSafe ?? "sandbox";
  const credits = useQuery({
    queryKey: ["my-credits", creditsEnv],
    queryFn: () => fGetCredits({ data: { environment: creditsEnv } }),
    staleTime: 60_000,
  });

  const grant = credits.data?.monthlyGrantCredits ?? 0;
  const show = !!credits.data?.enabled && grant > 0;

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    onDismiss();
  }

  // The founder's "few seconds, then it moves on": hold, then leave quietly.
  // The timer arms only once the card is actually visible.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!show || armed) return;
    setArmed(true);
    const t = window.setTimeout(() => {
      window.localStorage.setItem(DISMISSED_KEY, "1");
      onDismiss();
    }, HOLD_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="status"
      onClick={dismiss}
      style={{
        position: "fixed",
        top: 22,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        padding: "16px 18px",
        borderRadius: "var(--radius-panel, 14px)",
        background: "rgba(17,17,19,0.78)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: "2px solid var(--glacier)",
        animation: "cadRise 260ms var(--ease) both",
        cursor: "pointer",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 17,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        {grant.toLocaleString()} credits, on the house.
      </p>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, margin: "6px 0 0" }}>
        That is a full first run: capture what you hear, pressure-test the call, and ship the
        outcome. When the meter runs low, we will say so quietly.
      </p>
    </div>
  );
}
