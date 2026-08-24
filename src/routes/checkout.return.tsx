import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironmentOrNull } from "@/lib/stripe";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const navigate = useNavigate();
  // Poll the subscriptions table for up to ~20s after return; the moment the
  // webhook lands (or we hit the cap) we bounce back to the Plan page so the
  // user never has to read a Stripe-facing screen.
  // "signed-out" (audit D-08): the old tick() silently returned when no auth
  // session existed, stranding a logged-out user on "Confirming your payment"
  // forever. Now the state gets its own message and a way back in.
  const [status, setStatus] = useState<"pending" | "confirmed" | "timeout" | "signed-out">(
    "pending",
  );
  useEffect(() => {
    if (!session_id) return;
    const goBack = (flag: "success" | "pending") => {
      navigate({
        to: "/settings",
        search: { section: "billing", checkout: flag } as never,
        replace: true,
      });
    };
    // Payments dormant: there is no environment to poll against — landing
    // here can only be a stale/hand-typed URL. Bounce home instead of
    // throwing inside tick() and stranding the user on "Confirming...".
    const environment = getStripeEnvironmentOrNull();
    if (!environment) {
      setStatus("timeout");
      goBack("pending");
      return;
    }
    let cancelled = false;
    let tries = 0;
    const tick = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!u.user) {
        setStatus("signed-out");
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", u.user.id)
        .eq("environment", environment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data && (data.status === "active" || data.status === "trialing")) {
        setStatus("confirmed");
        goBack("success");
        return;
      }
      if (tries++ < 10) {
        setTimeout(tick, 2000);
      } else {
        setStatus("timeout");
        // Top-ups and async flows: webhook may still arrive shortly.
        // Bounce back anyway so the user lands somewhere familiar.
        goBack("pending");
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [session_id, navigate]);

  // Send a signed-out user back through login and straight back here, so the
  // confirmation can finish once they are in.
  const loginNext = session_id
    ? `/checkout/return?session_id=${encodeURIComponent(session_id)}`
    : "/checkout/return";

  const heading = !session_id
    ? "Nothing to confirm"
    : status === "signed-out"
      ? "Sign in to finish"
      : status === "confirmed"
        ? "Payment confirmed"
        : status === "timeout"
          ? "Still confirming"
          : "Confirming your payment";

  const body = !session_id
    ? "This link is missing its payment reference. If you just paid, your plan page will show the update shortly."
    : status === "signed-out"
      ? "You are signed out, so we cannot confirm the payment against your account. Sign back in and we will pick up where this left off."
      : status === "confirmed"
        ? "Your plan is live. Returning to your plan page."
        : status === "timeout"
          ? "Still confirming. Returning to your plan page."
          : "Confirming your payment. One moment.";

  return (
    <div
      className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center"
      // Nothing on this public route defines --paper/--ink, so without the
      // spread they flip light when the user prefers light, mid-payment-flow.
      style={{ ...PUBLIC_INK_THEME, background: "var(--mrd-bg)", color: "var(--ink)" }}
    >
      <div className="font-display text-3xl font-medium">{heading}</div>
      <p className="text-sm text-[var(--color-ink-muted)]">{body}</p>
      {status === "signed-out" && session_id ? (
        <Link
          to="/login"
          search={{ next: loginNext }}
          className="btn btn-primary"
          style={{ justifyContent: "center" }}
        >
          Sign in · finishes the confirmation
        </Link>
      ) : null}
      {!session_id ? (
        <Link to="/" className="btn btn-ghost" style={{ justifyContent: "center" }}>
          Back to Supaprod
        </Link>
      ) : null}
    </div>
  );
}
