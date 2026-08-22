/**
 * Delivery half of the runway warning: measure the burn, decide, and reach a
 * person who is NOT looking at a screen.
 *
 * WHY NOT THE DIGEST. `sendDueDigests` is the obvious home and it is the wrong
 * one. It builds its user list by selecting FROM `user_notification_preferences`,
 * and that table holds ONE row against 16 users (measured 2026-08-22; the same
 * count `src/lib/liveness/registry.ts` already records for this job). A digest
 * entry would therefore be deliverable to exactly one person, on a daily
 * schedule, deferred again by quiet hours — against a pool that empties in
 * eighty minutes. Three separate reasons it could not arrive in time.
 *
 * `dispatchInstantEmail` is the path that does work, and the reason is one line
 * inside it: `if (!prefs) return true; // Default to enabled`. The missing
 * preference row that silences the digest does NOT silence an instant send, so
 * the 15 users with no row are reachable this way and unreachable the other.
 * That file also already names this exact carve-out — "Instant sends are
 * reserved for expiring gates and critical incidents" — and a credit pool with
 * minutes left on an unattended loop is an expiring gate.
 *
 * TWO CHANNELS, ON PURPOSE. The mail is the half that reaches someone away from
 * the product; the `ai_events` row is the half that survives mail being
 * unconfigured, and it is what makes the warning auditable and dedupable
 * without a new table. `sendEmail` no-ops honestly without `RESEND_API_KEY`, so
 * without the event row a deployment with no mail key would warn into a vacuum
 * and leave no trace that it had tried.
 *
 * DEDUPE IS THE EVENT ROW. One warning per account per credit cycle, decided by
 * asking whether this code has already been written since `cycle_anchor`. A
 * per-process memo would have been cheaper and would not survive the isolate
 * churn a Worker runtime does between ticks — the 130 calls of the 2026-08-22
 * burn would have produced one mail per isolate, not one mail.
 *
 * NEVER THROWS. This runs inside the pre-call credit check. A warning that can
 * fail a call is worse than no warning.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  BURN_WINDOW_MINUTES,
  burnPerMinute,
  runwayMessage,
  shouldWarnRunway,
  type RunwayVerdict,
} from "./credit-runway";

/**
 * The refusal vocabulary's word for this notice.
 *
 * It is shaped like a `GATE_CODES` value (`gate_*`, so `isGateCode` reads it as
 * a refusal rather than a failure and the observability gate-pressure panel
 * groups it with the others) but it is declared here rather than in
 * `src/lib/observability/gates.ts` because this lane does not own that file.
 * It belongs there: that file's own doctrine is that it owns the vocabulary.
 * Moving it is a two-line follow-up and changes nothing at runtime —
 * `ai_events.error_code` is free text with no CHECK constraint (verified
 * against production 2026-08-22).
 */
export const GATE_CREDIT_LOW_RUNWAY = "gate_credit_low_runway";

/**
 * Per-account burn cache, the same in-process shape `runtime.server.ts` already
 * uses for the `credits_enabled()` flag.
 *
 * This runs on the pre-call path of every chargeable call, and the 2026-08-22
 * burn was 130 calls in 80 minutes on ONE account — an uncached windowed ledger
 * read would have been 130 extra queries to answer a question whose answer
 * changes slowly. A minute of staleness against a fifteen-minute window moves
 * the rate by at most a fifteenth, which cannot flip a sixty-minute verdict.
 */
const BURN_CACHE_TTL_MS = 60_000;
const burnCache = new Map<string, { credits: number; at: number }>();

/** Debits this account booked in the trailing window, as a positive count. */
async function creditsBurnedInWindow(
  admin: SupabaseClient,
  accountId: string,
  windowMinutes: number,
): Promise<number | null> {
  const now = Date.now();
  const hit = burnCache.get(accountId);
  if (hit && now - hit.at < BURN_CACHE_TTL_MS) return hit.credits;
  const sinceIso = new Date(now - windowMinutes * 60_000).toISOString();
  try {
    const { data, error } = await admin
      .from("credit_ledger")
      .select("delta_credits")
      .eq("account_id", accountId)
      .eq("reason", "debit")
      .gte("created_at", sinceIso);
    if (error) return null;
    let sum = 0;
    for (const r of (data ?? []) as { delta_credits: number | null }[]) {
      const d = Number(r.delta_credits ?? 0);
      // Only `reason='debit'` rows are asked for, but the sign is checked
      // anyway: `reset` and `grant` rows share this table and a reset can be
      // NEGATIVE (production carries four, the largest -4,250), so a filter
      // that ever widened would silently turn a monthly cycle correction into
      // a burn rate and warn every account on the day its cycle rolls.
      if (d < 0) sum += -d;
    }
    burnCache.set(accountId, { credits: sum, at: now });
    return sum;
  } catch {
    // A rate we cannot measure is not a rate of zero. Null means "do not
    // decide", which the caller turns into silence rather than into a warning
    // or into a false all-clear.
    return null;
  }
}

/** Has this account already been warned since its cycle opened? */
async function alreadyWarnedThisCycle(
  admin: SupabaseClient,
  userId: string,
  cycleAnchorIso: string | null,
): Promise<boolean> {
  try {
    let q = admin
      .from("ai_events")
      .select("id")
      .eq("user_id", userId)
      .eq("error_code", GATE_CREDIT_LOW_RUNWAY)
      .limit(1);
    if (cycleAnchorIso) q = q.gte("created_at", cycleAnchorIso);
    const { data, error } = await q;
    if (error) return true; // cannot tell -> stay quiet rather than risk a loop of mail
    return (data ?? []).length > 0;
  } catch {
    return true;
  }
}

async function recordRunwayEvent(
  admin: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  surface: string,
  detail: string,
  traceId: string | null,
): Promise<void> {
  try {
    await admin.from("ai_events").insert({
      user_id: userId,
      trace_id: traceId,
      // The surface that was ABOUT TO RUN, not a coined "credits" surface.
      // `ai_events.surface` has no CHECK constraint, so a new value would be
      // accepted and would then appear as a phantom surface in every
      // group-by-surface read (surface budgets, per-surface spend, the trace
      // list). It also answers a better question: which surface was driving
      // when the pool ran down.
      surface,
      ...(workspaceId ? { workspace_id: workspaceId } : {}),
      provider: "credits",
      via: "gateway",
      model: "n/a",
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      est_cost_usd: 0,
      latency_ms: 0,
      // Nothing was refused. The call this rode along with is about to be
      // served, so 'ok' is the honest status and the code carries the meaning.
      status: "ok",
      error_code: GATE_CREDIT_LOW_RUNWAY,
      error_message: detail,
      input_preview: "",
      system_preview: "",
      output_preview: "",
    });
  } catch (e) {
    console.error("low-runway event insert failed:", e);
  }
}

export type RunwayNotice = {
  /** Null when no decision could be made (unreadable ledger, no account). */
  verdict: RunwayVerdict | null;
  warned: boolean;
  reason: string;
};

/**
 * Measure this account's burn and, if the pool has less than the lead time left,
 * warn once per cycle by mail and on the record.
 *
 * Called from the pre-call credit check, which has already read `balance`,
 * `monthlyGrant` and `cycle_anchor` — this adds one windowed ledger read, and
 * only for chargeable calls on accounts that are actually still spending.
 */
export async function noteLowRunway(args: {
  userId: string;
  accountId: string;
  workspaceId: string | null;
  /** The call surface this notice rides along with; stamped on the event row. */
  surface: string;
  traceId?: string | null;
  balance: number;
  projected: number;
  monthlyGrantCredits: number;
  cycleAnchorIso: string | null;
  /** Injected in tests; defaults to the service-role client. */
  admin?: SupabaseClient;
}): Promise<RunwayNotice> {
  const admin = args.admin ?? (supabaseAdmin as unknown as SupabaseClient);
  try {
    const burned = await creditsBurnedInWindow(admin, args.accountId, BURN_WINDOW_MINUTES);
    if (burned === null) return { verdict: null, warned: false, reason: "burn unreadable" };

    const verdict = shouldWarnRunway({
      balance: args.balance,
      projected: args.projected,
      ratePerMinute: burnPerMinute(burned, BURN_WINDOW_MINUTES),
      monthlyGrantCredits: args.monthlyGrantCredits,
    });
    if (!verdict.warn) return { verdict, warned: false, reason: "runway above threshold" };

    if (await alreadyWarnedThisCycle(admin, args.userId, args.cycleAnchorIso)) {
      return { verdict, warned: false, reason: "already warned this cycle" };
    }

    const after = args.balance - Math.max(0, args.projected);
    const detail = runwayMessage(verdict, after);

    // Order matters. The event row is written FIRST because it is the dedupe
    // key: a mail that sends and then fails to leave a record would be resent
    // on the next call, and a burst makes that a mailbox full of the same
    // sentence. Warning twice is a worse failure than warning once and losing
    // the mail, which the row itself still reports.
    await recordRunwayEvent(
      admin,
      args.userId,
      args.workspaceId,
      args.surface,
      detail,
      args.traceId ?? null,
    );

    // The mail gets its own catch. By this point the notice is ON THE RECORD and
    // the dedupe key exists, so a delivery failure must not unwind into
    // "warned: false" — that would report the warning as never having happened
    // while the row that silences the next attempt is already written, which is
    // the worst of both.
    let reason = "event only";
    try {
      // Dynamic import, the idiom this codebase already uses for observability
      // at the chokepoint, so the notification module (and its server-fn
      // registrations) never enters the AI runtime's import-time graph.
      const { dispatchInstantEmail } = await import("@/lib/notifications.functions");
      const sendResult = await dispatchInstantEmail(admin, args.userId, {
        kind: "budget",
        severity: "warning",
        title: "AI credits running low",
        detail,
      });
      reason = sendResult.sent ? "mailed" : `event only: ${sendResult.reason}`;
    } catch (e) {
      reason = `event only: ${e instanceof Error ? e.message : "dispatch failed"}`;
    }
    return { verdict, warned: true, reason };
  } catch (e) {
    console.error("low-runway notice failed:", e);
    return { verdict: null, warned: false, reason: "threw" };
  }
}
