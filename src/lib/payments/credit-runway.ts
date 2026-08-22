/**
 * The low-credit warning, rebuilt as RUNWAY instead of as a count.
 *
 * WHAT WAS WRONG. `LOW_CREDITS_WARN = 100` is a fixed number of credits, and a
 * fixed number of credits is not a warning — it is a warning only if you also
 * know how fast the account spends. Measured in production on 2026-08-22, the
 * one real (non-sample) workspace burned 731 credits across 130 `agent` calls
 * between 14:00:09 and 15:20:18 UTC: 80.15 minutes, 9.12 credits a minute. At
 * that rate the 100-credit banner fires ELEVEN MINUTES before the pool is
 * empty, and it fires into a browser banner (`BillingBanner`) for a loop whose
 * entire promise is running when nobody is watching. Both halves miss: too
 * late, and addressed to a screen no one is in front of.
 *
 * WHAT THIS DOES INSTEAD. The threshold is derived, per account, from that
 * account's OWN recent burn, so it is denominated in minutes of remaining work
 * rather than in credits. `RUNWAY_WARN_MINUTES` is the lead time; the credit
 * number it corresponds to is whatever that account happens to spend in that
 * many minutes. A workspace running one ambient tick an hour and a workspace
 * running four agent tracks flat out get the same amount of NOTICE, which is
 * the only thing a person can act on, rather than the same amount of credit.
 *
 * WHY THE BURN WINDOW IS SHORT, AND WHY THE CYCLE AVERAGE IS NOT USED. The
 * cycle average is available for free (`grant - balance` over time since
 * `cycle_anchor`) and it is wrong. That same account's cycle opened at 02:20
 * and sat idle until 14:00, so its cycle-average burn at the moment it ran dry
 * was 0.96 credits a minute — a tenth of the rate that was actually emptying
 * it. An idle prefix drags the average down exactly when the burst that
 * matters is under way. The window has to be short enough to see the burst.
 *
 * WHY THE FLOOR IS `LOW_CREDITS_WARN`. A derived threshold must never warn
 * LATER than the banner already does, so the runway threshold is floored at the
 * existing constant. A quiet account keeps today's behaviour exactly; a busy
 * one gets warned earlier. This is a mechanism change and not a re-tuning: the
 * founder's number is still the floor and is not touched here.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. It does not change the grant, the bands,
 * or `LOW_CREDITS_WARN`. Those are founder numbers. It also does not decide
 * WHETHER the account should be allowed to keep spending — `assertAccountCredits`
 * owns the refusal, this owns the notice that the refusal is coming.
 */
import { LOW_CREDITS_WARN } from "@/lib/entitlements";

/**
 * How much notice the warning has to give. One hour, and the argument is that
 * the warning has to survive a trip through a mail queue and a person who is
 * doing something else — the thing the eleven-minute banner could not do.
 *
 * This is the one dial in this file. It is a lead TIME, not a price and not an
 * allowance, so it is not one of the founder numbers frozen in `entitlements.ts`.
 */
export const RUNWAY_WARN_MINUTES = 60;

/**
 * The trailing window the burn rate is measured over. Fifteen minutes is long
 * enough that a single expensive call does not read as a rate, and short enough
 * to see a burst that started twelve minutes ago — the 2026-08-22 burn reached
 * full speed inside its first ten.
 */
export const BURN_WINDOW_MINUTES = 15;

/** Credits a minute, from a window's worth of debits. Zero window, zero rate. */
export function burnPerMinute(creditsInWindow: number, windowMinutes: number): number {
  if (!Number.isFinite(creditsInWindow) || !Number.isFinite(windowMinutes)) return 0;
  if (windowMinutes <= 0 || creditsInWindow <= 0) return 0;
  return creditsInWindow / windowMinutes;
}

/**
 * Minutes of work left in a balance at a rate. A zero rate means the account is
 * not spending, which is unbounded runway rather than zero — `Infinity` is
 * returned so callers cannot accidentally read "idle" as "about to die".
 */
export function runwayMinutes(balance: number, ratePerMinute: number): number {
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  if (!Number.isFinite(ratePerMinute) || ratePerMinute <= 0) return Number.POSITIVE_INFINITY;
  return balance / ratePerMinute;
}

/**
 * The credit balance at which this account should be warned, given how fast it
 * is currently spending.
 *
 * Floored at `LOW_CREDITS_WARN` so the new mechanism can never be quieter than
 * the banner it supersedes, and capped at the account's own monthly grant,
 * because a threshold above the grant would fire on the first call of every
 * cycle and stop meaning anything. The cap is load-bearing rather than
 * defensive: at the observed 9.12 credits a minute, sixty minutes of runway is
 * 548 credits against a 750-credit free grant, so the free tier is already
 * within a factor of 1.4 of the point where NO threshold can give an hour's
 * notice. A grant smaller than an hour's burn cannot be warned about in
 * advance; it can only be reported at the start of the cycle.
 */
export function warnThresholdCredits(
  ratePerMinute: number,
  monthlyGrantCredits: number,
  leadMinutes: number = RUNWAY_WARN_MINUTES,
): number {
  const derived = Math.ceil(Math.max(0, ratePerMinute) * Math.max(0, leadMinutes));
  const floored = Math.max(LOW_CREDITS_WARN, derived);
  if (!Number.isFinite(monthlyGrantCredits) || monthlyGrantCredits <= 0) return floored;
  return Math.min(floored, Math.floor(monthlyGrantCredits));
}

export type RunwayVerdict = {
  warn: boolean;
  /** The balance this account should have been warned at. */
  thresholdCredits: number;
  /** Minutes of work left after this call is paid for. `Infinity` when idle. */
  minutesLeft: number;
  ratePerMinute: number;
};

/**
 * Should this call trigger the warning?
 *
 * The test is on the balance the call LEAVES BEHIND, not the balance it starts
 * with, so the notice goes out on the call that crosses the line rather than
 * one call late. Deliberately not a crossing test (`was above, is now below`):
 * a burst can lift the derived threshold above a balance that was already under
 * it, and a crossing test would then never fire at all — silence produced by the
 * very acceleration the warning exists to catch. Firing on "below" and letting
 * the caller own not-repeating is the safer half to get wrong.
 */
export function shouldWarnRunway(input: {
  balance: number;
  projected: number;
  ratePerMinute: number;
  monthlyGrantCredits: number;
  leadMinutes?: number;
}): RunwayVerdict {
  const thresholdCredits = warnThresholdCredits(
    input.ratePerMinute,
    input.monthlyGrantCredits,
    input.leadMinutes ?? RUNWAY_WARN_MINUTES,
  );
  const after = input.balance - Math.max(0, input.projected);
  const minutesLeft = runwayMinutes(after, input.ratePerMinute);
  return {
    // A balance that is already gone is the REFUSAL's story, not the warning's:
    // `assertAccountCredits` logs a `gate_credit_exhausted` event and halts, and
    // a "you are running low" mail arriving alongside a "you have stopped" halt
    // is noise. The warning only speaks while there is still something to spend.
    warn: after > 0 && after < thresholdCredits,
    thresholdCredits,
    minutesLeft,
    ratePerMinute: input.ratePerMinute,
  };
}

/** Plain-worded body for the warning. Practitioner language, no category words. */
export function runwayMessage(v: RunwayVerdict, balanceAfter: number): string {
  const mins = Number.isFinite(v.minutesLeft) ? Math.max(1, Math.round(v.minutesLeft)) : null;
  const rate = v.ratePerMinute > 0 ? `${v.ratePerMinute.toFixed(1)} credits a minute` : null;
  const parts = [
    `${balanceAfter} AI credits left on this account.`,
    rate && mins
      ? `At the last ${BURN_WINDOW_MINUTES} minutes' rate (${rate}) that is about ${mins} minute${mins === 1 ? "" : "s"} of agent work.`
      : null,
    "Agents already running will stop when it reaches zero. Top up or upgrade in Settings → Usage.",
  ].filter((p): p is string => p !== null);
  return parts.join(" ");
}
