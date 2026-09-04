/**
 * WM-M11: per-tier credit grant + monthly cycle reset (the credit-engine grant side).
 * WM-M14: per-product / per-member attribution rollup + the pure cap math.
 *
 * `grantMonthlyAllowance` sets an account's INCLUDED balance to its tier's monthly
 * allowance (on signup / plan change); `resetCreditCycle` re-grants the included
 * balance each billing cycle while PRESERVING the purchased top-up balance. Both write
 * the service-role-only `credit_ledger` (reason 'grant' / 'reset') and are a strict
 * no-op while `credits_enabled()` is false, which it no longer is: the gate returns TRUE
 * in production since 2026-08-03 and these paths are live. The amounts come
 * from `entitlements.creditMonthlyBase` (founder-tunable placeholders, plan §7).
 *
 * WM-M14 adds the attribution side: `rollupAttribution` (pure, groups ledger debits by
 * product + member, reconciles to the total), `computeCreditAttribution` (the
 * RLS-scoped read for the Usage panel, consumed by WM-M16), and the pure cap math
 * (`capExceeded`, `creditWindowStartIso`, `sumDebitCredits`) that the runtime cap check
 * (runtime.server.ts assertCreditCaps) drives on the hot path.
 *
 * Server-only: writes the service-role credit tables via `supabaseAdmin`. Relative
 * imports keep the pure helpers unit-testable without pulling a path alias into the test
 * runner; the lazy `supabaseAdmin` Proxy is never constructed unless a DB-writing
 * function actually runs. The RLS-scoped read takes an injected client, so it stays here
 * (in the credits domain) without dragging createServerFn / auth-middleware imports into
 * the test graph; the authed HTTP boundary pairs with its consumer (WM-M16).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../integrations/supabase/client.server";
import { entitlementsFor, type PlanTier } from "./entitlements";
// Pure, dependency-free reader for the {applied|granted|reset, reason} envelope
// every credit RPC answers with. It lives under payments/ because that is where
// the webhook callers of the same RPCs are; the credit tick reads the identical
// envelope and must not grow a second interpretation of it.
import { readCreditRpcResult } from "./payments/credit-rpc-envelope";

/**
 * The monthly INCLUDED credit allowance for a tier. Returns 0 when the tier carries no
 * metered base (enterprise = a negotiated custom model). Pure + deterministic.
 */
export function monthlyGrantCredits(tier: PlanTier): number {
  const base = entitlementsFor(tier).creditMonthlyBase;
  return typeof base === "number" && base > 0 ? Math.floor(base) : 0;
}

/**
 * The signed ledger delta that moves an account's included balance from
 * `currentIncluded` to its `monthlyGrant` (positive = top back up, negative = a
 * leftover above the grant is reset down). Pure: `currentIncluded + resetDelta == grant`.
 *
 * This states the invariant; it no longer performs it. `resetCreditCycle` used
 * to compute the delta here from an unlocked read, which is the race documented
 * on that function. `reset_subscription_cycle` now computes the same delta
 * inside its `FOR UPDATE`, and this remains the executable statement of what
 * that SQL is supposed to be doing.
 */
export function resetDelta(currentIncluded: number, monthlyGrant: number): number {
  return Math.floor(monthlyGrant) - Math.floor(currentIncluded);
}

// --- G-PRICE PR-A1: refund the credits an ABANDONED run already drew --------
// A mission/run that is stopped, halted, or fails before delivering an artifact must
// never keep the credits its steps already debited (pricing-architecture §2 Rule 2:
// "stop it early and it is free"). This sums that run's own debit rows (scoped by
// ai_events.trace_id / agent_runs.id via the surface_ref-tagged ledger rows written
// during the run) and hands the total back via refund_account_credits, in one
// best-effort, never-throwing pass. A no-op only where credits_enabled() is off, which
// production is not.

/** A single credit_ledger row shaped for run-level refund summation. */
export type RunLedgerRow = { delta_credits: number; ai_event_id: string | null };

/**
 * Total credits debited under a specific ai_event id set (a run's own calls), as a
 * positive number. Mirrors sumDebitCredits but scoped to already-fetched rows for one
 * run rather than a window; pure.
 */
export function sumRunDebits(rows: RunLedgerRow[]): number {
  let total = 0;
  for (const r of rows) {
    const d = Number(r.delta_credits);
    if (Number.isFinite(d) && d < 0) total += -d;
  }
  return total;
}

/**
 * Refund every credit a run's own AI calls debited, once, and mark the run so it is
 * never refunded twice. No-op where credits_enabled() is off (not production), while the run has
 * already been refunded, or when there is nothing to refund. Never throws (a metering
 * failure must not fail the caller's abandon/halt handling).
 *
 * CLAIM BEFORE PAY, NOT PAY THEN STAMP.
 *
 * THE DEFECT THIS PREVENTS, confirmed 2026-08-14. The order used to be: READ
 * `credits_refunded`, sum the run's debits, call `refund_account_credits`, then
 * `.update({credits_refunded:true}).eq("id", runId)` with no precondition and
 * no `.select()`. `20260713010000_g_price_a1_refund_rpc.sql` states in its own
 * header that the RPC is idempotent per call and the CALLER must not
 * double-refund. The caller did not hold that. `loop.server.ts` reaches this
 * from two call sites on one terminal run, and two callers that both read
 * `false` both refunded the full amount, so the balance rose above what was
 * ever debited. Credits minted from nothing.
 *
 * The flag is now the CLAIM, taken in a single conditional update whose matched
 * rows say who won. The refund runs only for the winner. A guarded update is
 * the only construct available here that reads and writes in one statement,
 * which is what makes it a lock rather than another read.
 *
 * WHY THE CLAIM IS RETURNED ON SOME FAILURES AND NOT OTHERS. Anything that
 * fails BEFORE the RPC call means no credits moved, so putting the flag back
 * restores the exact prior state and a later pass can still refund. A failure
 * of the RPC ITSELF is ambiguous, because a timeout cannot say whether the
 * refund landed, and there the claim is kept: a refund lost is recoverable by
 * hand, a refund doubled is money invented.
 */
export async function refundAbandonedRunCredits(
  accountId: string,
  userId: string,
  runId: string,
  surface: string,
): Promise<void> {
  const admin = supabaseAdmin as unknown as SupabaseClient;
  if (!(await creditsEngineEnabled(admin))) return;

  /** Hand the claim back, so a failure before any money moved is not final. */
  const releaseClaim = async (why: string): Promise<void> => {
    const { error } = await admin
      .from("agent_runs")
      .update({ credits_refunded: false })
      .eq("id", runId)
      .eq("credits_refunded", true)
      .select("id");
    if (error) {
      console.error(
        `refundAbandonedRunCredits: could not release the claim on run ${runId} after ${why}, so its credits will never be handed back:`,
        error.message,
      );
    }
  };

  try {
    const { data: claimed, error: claimError } = await admin
      .from("agent_runs")
      .update({ credits_refunded: true })
      .eq("id", runId)
      .eq("credits_refunded", false)
      .select("id");
    if (claimError) {
      console.error("refundAbandonedRunCredits: claim refused:", claimError.message);
      return;
    }
    // Zero rows is the answer to two different questions and the same action
    // suits both: another caller holds the claim, or the run does not exist.
    if (!((claimed ?? []) as unknown[]).length) return;

    const { data: aiEvents, error: eventsError } = await admin
      .from("ai_events")
      .select("id")
      .eq("surface_ref", runId);
    if (eventsError) {
      await releaseClaim("the run's event lookup failed");
      console.error("refundAbandonedRunCredits: event lookup failed:", eventsError.message);
      return;
    }
    const eventIds = ((aiEvents ?? []) as { id: string }[]).map((e) => e.id);
    // A run that never called a model debited nothing. The claim already marks
    // it settled, which is what stops a later pass from re-examining it.
    if (eventIds.length === 0) return;

    const { data: ledgerRows, error: ledgerError } = await admin
      .from("credit_ledger")
      .select("delta_credits, ai_event_id")
      .eq("account_id", accountId)
      .eq("reason", "debit")
      .in("ai_event_id", eventIds);
    if (ledgerError) {
      // Was unchecked, so a refused read summed to zero and the run was stamped
      // refunded having been handed back nothing.
      await releaseClaim("the debit ledger read failed");
      console.error("refundAbandonedRunCredits: ledger read failed:", ledgerError.message);
      return;
    }
    const total = sumRunDebits((ledgerRows ?? []) as RunLedgerRow[]);
    if (total <= 0) return;

    const { error: refundError } = await admin.rpc("refund_account_credits", {
      _account_id: accountId,
      _credits: total,
      _user_id: userId,
      _surface: surface,
      _ai_event_id: null,
      _product_id: null,
    });
    if (refundError) {
      // The claim is NOT released here on purpose: see the ambiguity note above.
      console.error(
        `refundAbandonedRunCredits: refund_account_credits failed for run ${runId}, ${total} credits need handing back by hand:`,
        refundError.message,
      );
    }
  } catch (e) {
    console.error("refundAbandonedRunCredits failed:", e);
  }
}

// --- P-136: one currency on the run screen -----------------------------------
// The run screen showed two dollar figures that could disagree (the bottom bar
// and the artifact pane, both nominally reading the same `spend_used_usd`
// column) while the account itself is billed and shown in credits everywhere
// else -- Team > Spend and limits, the balance on Start. This reads what a
// run's OWN calls actually debited from `credit_ledger`, keyed by the run, so
// the screen can lead with the account's own currency instead.

/** One credit_ledger debit row, already resolved to the run's own trace id. */
export type TraceLedgerRow = { delta_credits: number; trace_id: string | null };

/**
 * Credits debited under a set of trace ids, summed per trace, as positive
 * numbers -- the run-level guard: a run with three ledger rows shows their sum
 * in credits. Mirrors `sumRunDebits`, grouped rather than flat; pure.
 */
export function sumCreditsByTrace(rows: TraceLedgerRow[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const r of rows) {
    if (!r.trace_id) continue;
    const d = Number(r.delta_credits);
    if (!Number.isFinite(d) || d >= 0) continue;
    totals[r.trace_id] = (totals[r.trace_id] ?? 0) + -d;
  }
  return totals;
}

/**
 * Each run's own credit spend, keyed by `agent_runs.trace_id`.
 *
 * WHY THIS DOES NOT JOIN THROUGH `ai_events` UNDER THE CALLER'S OWN CLIENT.
 * `credit_ledger` carries no run or track column of its own; the only path
 * from a ledger row back to a run is `ai_events.trace_id`, joined through
 * `ai_event_id` (confirmed live, 2026-09-04: `ai_events.surface_ref` on the
 * agentic-loop's own call is the agent's slug, not a run id -- the refund
 * code's `surface_ref = runId` join is scoped to a different call path and is
 * NOT this one). `ai_events` RLS is `auth.uid() = user_id`, per-user rather
 * than per-account, so reading it under the caller's own client would silently
 * drop a teammate's runs on a shared track -- exactly the class of leak
 * [[P-33]] and [[P-32]] already found on this surface, just inverted (under-
 * counting instead of over-showing). This reads through the service-role
 * client instead, scoped strictly to the trace ids the caller already fetched
 * under RLS on `agent_runs`: nothing untrusted reaches this query, and nothing
 * the caller was not already authorized to see does either.
 *
 * Never throws; an empty map means the screen shows no credits figure for
 * those runs, same as a missing `spend_used_usd`.
 */
export async function creditsSpentByTrace(traceIds: string[]): Promise<Record<string, number>> {
  if (traceIds.length === 0) return {};
  const admin = supabaseAdmin as unknown as SupabaseClient;
  try {
    const { data: events, error: eventsError } = await admin
      .from("ai_events")
      .select("id, trace_id")
      .in("trace_id", traceIds);
    if (eventsError || !events?.length) return {};
    const traceOfEvent = new Map<string, string>();
    for (const e of events as { id: string; trace_id: string | null }[]) {
      if (e.trace_id) traceOfEvent.set(e.id, e.trace_id);
    }
    const eventIds = [...traceOfEvent.keys()];
    if (eventIds.length === 0) return {};

    const { data: ledger, error: ledgerError } = await admin
      .from("credit_ledger")
      .select("delta_credits, ai_event_id")
      .eq("surface", "agent")
      .eq("reason", "debit")
      .in("ai_event_id", eventIds);
    if (ledgerError || !ledger) return {};

    const rows: TraceLedgerRow[] = (
      ledger as { delta_credits: number; ai_event_id: string | null }[]
    ).map((r) => ({
      delta_credits: r.delta_credits,
      trace_id: r.ai_event_id ? (traceOfEvent.get(r.ai_event_id) ?? null) : null,
    }));
    return sumCreditsByTrace(rows);
  } catch (e) {
    console.error("creditsSpentByTrace failed:", e);
    return {};
  }
}

async function creditsEngineEnabled(admin: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc("credits_enabled");
    return !error && data === true;
  } catch {
    return false;
  }
}

/**
 * A BALANCE READ IN ONE STATEMENT AND SET IN THE NEXT ERASES WHATEVER LANDED
 * BETWEEN THEM.
 *
 * Both functions below used to SELECT `account_credits.balance_credits`, then
 * blind-SET it, then write a ledger row for the difference. Three statements,
 * no lock. A debit arriving between the read and the write was overwritten, and
 * the ledger row described a movement that had not happened, so the ledger and
 * the balance disagreed from that moment on. `grantMonthlyAllowance` was worse
 * still: its delta came from an UNCHECKED read, so a refused SELECT read as a
 * zero balance and it recorded a grant of the full allowance that nothing
 * matched.
 *
 * The correct implementation already existed in SQL. `grant_subscription_credits`
 * and `reset_subscription_cycle` do exactly this job with the row held under
 * `FOR UPDATE`, write the ledger row from the delta they computed inside that
 * lock, and are idempotent. Re-implementing them in JavaScript without the lock
 * was the whole defect, so these now delegate instead.
 *
 * WHY THEY LOG RATHER THAN THROW. The one caller is the credit-tick cron, which
 * sweeps up to a thousand accounts in a loop inside a single try/catch. A throw
 * would abandon every account after the first failure, so a real refusal is
 * reported with its cause and the sweep continues. That is a deliberate
 * difference from the payments webhook, where a throw is what earns a retry.
 */

/**
 * Grant a tier's monthly INCLUDED allowance to an account (signup / plan change). Sets
 * the included balance to the tier amount, records the cycle anchor, and writes a
 * 'grant' ledger row; the purchased top-up balance is untouched. No-op where the gate is off.
 */
export async function grantMonthlyAllowance(accountId: string, tier: PlanTier): Promise<void> {
  const admin = supabaseAdmin as unknown as SupabaseClient;
  if (!(await creditsEngineEnabled(admin))) return;
  const amount = monthlyGrantCredits(tier);
  if (amount <= 0) return;
  try {
    const { data, error } = await admin.rpc("grant_subscription_credits", {
      _account_id: accountId,
      _credits: amount,
    });
    const verdict = readCreditRpcResult({
      rpc: "grant_subscription_credits",
      successKey: "granted",
      // 'unchanged' means this account's allowance already equals the tier
      // amount, which is the whole point of an idempotent sweep.
      benignReasons: ["unchanged"],
      result: data,
      error,
    });
    if (!verdict.ok)
      console.error(`grantMonthlyAllowance (account ${accountId}):`, verdict.failure);
  } catch (e) {
    console.error("grantMonthlyAllowance failed:", e);
  }
}

/**
 * Re-grant the account's INCLUDED allowance for a new billing cycle: reset the included
 * balance to its stored monthly grant, anchor the new cycle, and PRESERVE the purchased
 * top-up balance. Writes a 'reset' ledger row for the net movement. No-op where the gate is off.
 * Never-granted accounts (monthly grant 0) are left for `grantMonthlyAllowance`.
 */
export async function resetCreditCycle(accountId: string): Promise<void> {
  const admin = supabaseAdmin as unknown as SupabaseClient;
  if (!(await creditsEngineEnabled(admin))) return;
  try {
    const { data, error } = await admin.rpc("reset_subscription_cycle", {
      _account_id: accountId,
    });
    const verdict = readCreditRpcResult({
      rpc: "reset_subscription_cycle",
      successKey: "reset",
      // 'no_grant' is an account that has never been granted anything, which is
      // grantMonthlyAllowance's half of the tick, not a failure of this half.
      benignReasons: ["no_grant"],
      result: data,
      error,
    });
    if (!verdict.ok) console.error(`resetCreditCycle (account ${accountId}):`, verdict.failure);
  } catch (e) {
    console.error("resetCreditCycle failed:", e);
  }
}

// --- WM-M14: per-product / per-member attribution + the pure cap math ---------
// The pool is account-level; owners need to SEE where credits went (attribution) and may
// optionally CAP a single product or member. The attribution rollup + cap math are pure
// (unit-tested); the RLS-scoped read takes an injected client; the runtime drives the cap
// math on the hot path (runtime.server.ts assertCreditCaps). All inert until the founder
// flips credits_enabled() and an owner sets a cap.

/** A single credit_ledger debit row, projected to just what attribution needs. */
export type LedgerDebitRow = {
  delta_credits: number;
  product_id: string | null;
  user_id: string | null;
};

/** One attribution bucket: a product id / member id (null = unattributed) and its spend. */
export type AttributionBucket = { id: string | null; credits: number };

/** The per-product + per-member rollup of an account's debits over a window. */
export type CreditAttribution = {
  byProduct: AttributionBucket[];
  byMember: AttributionBucket[];
  totalDebited: number;
};

/**
 * Total credits debited across ledger debit rows, as a POSITIVE number (debits are stored
 * negative). Non-finite / positive deltas are ignored defensively. Pure.
 */
export function sumDebitCredits(rows: LedgerDebitRow[]): number {
  let total = 0;
  for (const r of rows) {
    const d = Number(r.delta_credits);
    if (Number.isFinite(d) && d < 0) total += -d;
  }
  return total;
}

/**
 * Group ledger debit rows into per-product and per-member spend (positive credits), sorted
 * high to low, with a null bucket for unattributed rows. The reconciliation invariant the
 * spec requires holds by construction: sum(byProduct) === sum(byMember) === totalDebited.
 * Pure + deterministic.
 */
export function rollupAttribution(rows: LedgerDebitRow[]): CreditAttribution {
  const products = new Map<string | null, number>();
  const members = new Map<string | null, number>();
  for (const r of rows) {
    const d = Number(r.delta_credits);
    if (!Number.isFinite(d) || d >= 0) continue; // only real debits attribute
    const credits = -d;
    const pid = r.product_id ?? null;
    const uid = r.user_id ?? null;
    products.set(pid, (products.get(pid) ?? 0) + credits);
    members.set(uid, (members.get(uid) ?? 0) + credits);
  }
  const toBuckets = (m: Map<string | null, number>): AttributionBucket[] =>
    [...m.entries()]
      .map(([id, credits]) => ({ id, credits }))
      .sort((a, b) => b.credits - a.credits);
  return {
    byProduct: toBuckets(products),
    byMember: toBuckets(members),
    totalDebited: sumDebitCredits(rows),
  };
}

/**
 * Would drawing `projected` more credits push `spent` over `cap`? A cap of 0 blocks any
 * billable draw; a non-finite cap means "no cap" (never exceeded). Pure.
 */
export function capExceeded(spent: number, projected: number, cap: number): boolean {
  if (!Number.isFinite(cap)) return false;
  return Math.max(0, spent) + Math.max(0, projected) > cap;
}

/**
 * The ISO start of a cap's spend window. 'day' / 'month' are calendar windows (mirroring
 * the ai_budgets day/month windows); 'cycle' uses the account's billing cycle_anchor when
 * present, else falls back to the month start. `nowIso` is injected so the math is pure.
 */
export function creditWindowStartIso(
  windowKind: "cycle" | "day" | "month",
  cycleAnchorIso: string | null | undefined,
  nowIso: string,
): string {
  if (windowKind === "day") return nowIso.slice(0, 10) + "T00:00:00.000Z";
  const monthStart = nowIso.slice(0, 7) + "-01T00:00:00.000Z";
  if (windowKind === "month") return monthStart;
  // cycle: prefer the account's billing anchor, else the month start.
  return cycleAnchorIso && cycleAnchorIso.length >= 10 ? cycleAnchorIso : monthStart;
}

/**
 * Read an account's credit attribution over an optional window, RLS-scoped to account
 * membership. Returns the per-product + per-member rollup; renders an empty rollup
 * gracefully before the engine has any debits. Never throws. Consumed by the WM-M16
 * Usage panel.
 *
 * SECURITY: `supabase` MUST be the caller's AUTHED, RLS-scoped client (the credit_ledger
 * member-read policy is what filters foreign accounts). Never pass the service-role
 * `supabaseAdmin` here, or every account's spend leaks to anyone who can name an accountId.
 * The WM-M16 server-fn wrapper (createServerFn + requireSupabaseAuth) supplies that client.
 */
export async function computeCreditAttribution(
  supabase: SupabaseClient,
  accountId: string,
  opts: { sinceIso?: string | null } = {},
): Promise<CreditAttribution> {
  const empty: CreditAttribution = { byProduct: [], byMember: [], totalDebited: 0 };
  try {
    let q = supabase
      .from("credit_ledger")
      .select("delta_credits, product_id, user_id")
      .eq("account_id", accountId)
      .eq("reason", "debit");
    if (opts.sinceIso) q = q.gte("created_at", opts.sinceIso);
    const { data, error } = await q;
    if (error || !data) return empty;
    return rollupAttribution(data as LedgerDebitRow[]);
  } catch {
    return empty;
  }
}
