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
import { X } from "lucide-react";
import { getMyCreditsView } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

const DISMISSED_KEY = "cadence.welcome.credits";
const HOLD_MS = 9000;

export function creditsWelcomeDismissed(): boolean {
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

/**
 * Pure decision, extracted so the honesty rules are testable without a
 * DOM/query shim: the card exists only while metering is actually on AND the
 * account holds a real positive grant. Anything else renders nothing at all -
 * never a hardcoded promise.
 */
export function creditsWelcomeVisible(enabled: boolean, monthlyGrantCredits: number): boolean {
  return enabled && monthlyGrantCredits > 0;
}

export function CreditsWelcome({ onDismiss }: { onDismiss: () => void }) {
  const fGetCredits = useServerFn(getMyCreditsView);
  // Hover cue for the icon-only close control (inline styles, so it rides
  // state); the focus-visible ring stays on the global rule.
  const [closeHover, setCloseHover] = useState(false);

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
  const show = creditsWelcomeVisible(!!credits.data?.enabled, grant);

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

  // Tempo v5 (2026-07-11): the floating card wears the menu material preset
  // (12px radius + the border-in-shadow menu stack on background-100); the
  // grant number is this surface's one Geist Pixel brand moment. A click
  // anywhere dismisses; the labeled close button carries the keyboard path.
  return (
    <div
      role="status"
      onClick={dismiss}
      className="material-menu"
      style={{
        position: "fixed",
        top: 22,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "var(--ds-z-toast)",
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        padding: "16px 18px",
        animation: "cadRise 0.3s var(--ds-motion-timing-swift) both",
        cursor: "pointer",
      }}
    >
      <button
        type="button"
        aria-label="Dismiss"
        className="loom-press"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        onMouseEnter={() => setCloseHover(true)}
        onMouseLeave={() => setCloseHover(false)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 24,
          height: 24,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: closeHover ? "var(--ds-gray-alpha-200)" : "transparent",
          border: "none",
          borderRadius: "var(--ds-radius-small)",
          color: closeHover ? "var(--ds-gray-1000)" : "var(--ds-gray-700)",
          cursor: "pointer",
          padding: 0,
          transition: "background-color 0.2s var(--ds-motion-timing-swift)",
        }}
      >
        <X size={16} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <p className="text-heading-16" style={{ color: "var(--ds-gray-1000)", margin: 0 }}>
        <span style={{ fontFamily: "var(--font-pixel)", fontWeight: 400, letterSpacing: 0 }}>
          {grant.toLocaleString()}
        </span>{" "}
        credits, on the house.
      </p>
      <p className="text-copy-13" style={{ color: "var(--ds-gray-900)", margin: "6px 18px 0 0" }}>
        That is a full first run: capture what you hear, pressure-test the call, and ship the
        outcome. When the meter runs low, we will say so quietly.
      </p>
    </div>
  );
}
