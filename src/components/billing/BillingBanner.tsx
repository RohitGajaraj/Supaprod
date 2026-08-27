/**
 * PORTED TO MERIDIAN, 2026-08-27. This drew in `--rose`, `--action-blue` and
 * `--destructive-foreground`, all of which resolve through styles.css into the
 * RETIRED `--ds-*` family. The ratchet cannot see that: it fails a file
 * carrying `--ds-*` directly, and an indirection hides the retired token behind
 * a friendly name.
 *
 * This is the THIRD global banner on every authenticated page, beside
 * BackendHealthBanner and EverythingIsPausedBanner. All three now draw in one
 * system; two of them did not this morning.
 *
 * Mapped by MEANING, not hue, the same rule as U-061 and U-080: a failed
 * renewal is an OUTCOME, which is exactly what `--mrd-fail` means here, and the
 * link that fixes it is an action, which is `--mrd-agent`. The button sits ON
 * the fail colour, so its text takes `--mrd-sheet` as the readable ground
 * rather than a retired "destructive-foreground" that named a role no token in
 * this system has.
 *
 * Top-of-app billing banner. Three layers:
 *   1. (LOOM W1) the test-mode banner moved to billing surfaces only.
 *   2. Dunning notice — if the most recent subscription is `past_due`,
 *      prompts the user to update their card via the Stripe portal.
 *      Access is preserved during Stripe's retry window (founder ruling).
 *   3. Running-low notice (founder ruling 2026-07-09) — when the metered
 *      credit balance drops under LOW_CREDITS_WARN, a quiet line prompts a
 *      top-up or upgrade. Session-dismissable, never a blocker, and only
 *      while the credits engine is actually on (no lying about a 0 balance
 *      in the dormant state).
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { createPortalSession, getMyCreditsView } from "@/lib/payments.functions";
import { getCreditRunway } from "@/lib/billing.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { LOW_CREDITS_WARN } from "@/lib/entitlements";

const LOW_DISMISS_KEY = "supaprod.credits.low-dismissed";

/**
 * Pure decision, extracted so the threshold behavior is testable without a
 * DOM/query shim (the TodayCoachMark precedent): warn only while the credits
 * engine is actually on, the balance is a real number at or under the
 * threshold, and the user has not dismissed it this session.
 */
export function shouldWarnLowCredits(
  enabled: boolean,
  balance: number | null,
  dismissed: boolean,
  threshold: number = LOW_CREDITS_WARN,
): boolean {
  return enabled && balance !== null && balance <= threshold && !dismissed;
}

export function BillingBanner() {
  const [pastDue, setPastDue] = useState(false);
  const [opening, setOpening] = useState(false);
  const fPortal = useServerFn(createPortalSession);
  const fGetCredits = useServerFn(getMyCreditsView);
  const fRunway = useServerFn(getCreditRunway);

  // Same env-fallback idiom as Settings' Credits tab: a missing Stripe client
  // token must never block the balance read itself.
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
    staleTime: 5 * 60_000,
  });
  const [lowDismissed, setLowDismissed] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(LOW_DISMISS_KEY) === "1",
  );
  const balance = credits.data?.balanceCredits ?? null;
  const runningLow = shouldWarnLowCredits(!!credits.data?.enabled, balance, lowDismissed);
  /*
   * EXHAUSTED IS A DIFFERENT FACT FROM LOW, AND IT GETS ITS OWN LINE (queue
   * item 29). The measured failure this closes: `gate_credit_low_runway` fired
   * at 20:50 and by 23:4x the pool was empty and every run was blocked -- and
   * nothing in the product said so, because the only line treated zero as
   * "running low", sat under a session dismiss, and vanished exactly when it
   * mattered. At zero there is nothing left to spend, so there is nothing to
   * defer: this one is not dismissable, and it says what happened and what
   * undoes it.
   */
  const exhausted =
    !!credits.data?.enabled && balance !== null && balance <= 0 && !credits.isLoading;

  /*
   * RUNWAY IN RUNS, NOT MINUTES (RL0-024). MAIN's typed wrapper resolves the
   * account through the caller's own client and does the scoped arithmetic in
   * the definer RPC. `runsLeft: null` means the window holds no runs yet, and
   * that unknown renders as words -- never Infinity, never a fabricated zero.
   */
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const runwayQ = useQuery({
    queryKey: ["credit-runway", workspaceId],
    queryFn: () => fRunway({ data: { workspaceId: workspaceId! } }),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
  const runwayRaw = runwayQ.data;
  const runway: number | "unknown" | null =
    !workspaceId || !runwayQ.isSuccess || runwayRaw === undefined
      ? null
      : runwayRaw === null || runwayRaw.runsLeft === null
        ? "unknown"
        : runwayRaw.runsLeft;

  useEffect(() => {
    // Dormant payments = no subscriptions to dun. Skip entirely rather than
    // let getStripeEnvironment() throw inside this un-awaited async closure
    // (was an unhandled rejection on every authenticated session in prod).
    if (!paymentsConfigured()) return;
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", u.user.id)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setPastDue(data?.status === "past_due");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openPortal = async () => {
    setOpening(true);
    try {
      const r = await fPortal({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      });
      if ("error" in r) throw new Error(r.error);
      window.open(r.url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setOpening(false);
    }
  };

  function dismissLow() {
    window.sessionStorage.setItem(LOW_DISMISS_KEY, "1");
    setLowDismissed(true);
  }

  return (
    <>
      {/* LOOM W1: the checkout-preview banner is contextual to billing
          surfaces only (chrome-quiet law); Settings mounts its own. */}
      {/* `data-mrd` on both banner roots, because the ring is inherited rather
          than declared. All three controls in this file used to ask for a
          `focus-visible:outline-*` of their own and none of them got one: the
          authenticated app mounts `[data-obsidian]` on <html>, `src/styles.css`
          carries an UNLAYERED `[data-obsidian] :focus-visible` rule, and
          unlayered CSS beats every layer whatever the specificity, so a Tailwind
          utility in the `utilities` layer could not win. They also named the
          legacy `--focus-ring` alias rather than Meridian's status-free neutral.
          Both branches are tagged because each is a root in its own right: a
          banner that renders only when the card failed cannot borrow the
          attribute from a sibling that is not on screen. */}
      {pastDue ? (
        <div
          data-mrd=""
          className="flex w-full items-center justify-center gap-3 px-4 py-2 text-xs"
          style={{
            borderBottom: "1px solid color-mix(in oklab, var(--mrd-fail) 35%, transparent)",
            background: "color-mix(in oklab, var(--mrd-fail) 10%, transparent)",
            color: "var(--mrd-body)",
          }}
        >
          <span>Your last renewal payment failed. Update your card to keep your plan active.</span>
          <button
            type="button"
            onClick={openPortal}
            disabled={opening}
            className="rounded-[8px] px-2.5 py-1 text-mrd-tiny font-medium hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--mrd-fail)", color: "var(--mrd-sheet)" }}
          >
            {opening ? "Opening..." : "Update card"}
          </button>
        </div>
      ) : null}
      {exhausted ? (
        <div
          data-mrd=""
          className="flex w-full items-center justify-center gap-3 px-4 py-2 text-xs"
          style={{
            borderBottom: "1px solid color-mix(in oklab, var(--mrd-fail) 35%, transparent)",
            background: "color-mix(in oklab, var(--mrd-fail) 10%, transparent)",
            color: "var(--mrd-body)",
          }}
        >
          <span>
            The AI credits ran out, so agent runs have stopped. Top up and they start again from
            where each one stopped.
          </span>
          <Link
            to="/settings"
            search={{ section: "credits" }}
            className="rounded-[8px] px-2.5 py-1 font-medium hover:opacity-90"
            style={{ background: "var(--mrd-fail)", color: "var(--mrd-sheet)" }}
          >
            Add credits
          </Link>
        </div>
      ) : null}
      {!exhausted && !pastDue && runningLow ? (
        <div
          data-mrd=""
          className="flex w-full items-center justify-center gap-3 px-4 py-1.5 text-xs"
          style={{
            borderBottom: "1px solid var(--mrd-edge)",
            background: "color-mix(in oklab, var(--mrd-you) 10%, transparent)",
            color: "var(--mrd-body)",
          }}
        >
          <span>
            {balance !== null && balance > 0
              ? `Running low: ${balance} AI ${balance === 1 ? "credit" : "credits"} left. `
              : ""}
            {typeof runway === "number"
              ? `That is about ${runway} more ${runway === 1 ? "run" : "runs"} at the recent rate. `
              : runway === "unknown"
                ? "How many runs that buys is not known yet. "
                : ""}
            Top up or upgrade so the loop keeps running.
          </span>
          <Link
            to="/settings"
            search={{ section: "credits" }}
            className="hover:underline"
            style={{ color: "var(--mrd-agent)", fontWeight: 500 }}
          >
            Add credits
          </Link>
          <button
            type="button"
            onClick={dismissLow}
            className="cursor-pointer [color:var(--mrd-mute)] hover:underline hover:[color:var(--mrd-ink)]"
            style={{ background: "transparent", border: "none" }}
          >
            Later
          </button>
        </div>
      ) : null}
    </>
  );
}
