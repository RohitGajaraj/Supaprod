/**
 * PC-05 — the provider-agnostic grant core. Everything a verified billing
 * event is allowed to DO lives here, keyed by the two provider-neutral facts
 * every rail can supply: the Supaprod userId (from checkout metadata /
 * custom_data) and the catalog lookup_key (the shared price vocabulary,
 * billing-tier.ts). The Stripe and Paddle adapters translate their events
 * into these calls; neither owns a money path of its own.
 *
 * Moved out of routes/api/public/payments/webhook.ts so a second provider
 * could not fork the granting logic (the seam's whole point).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  creditsFromLookupKey,
  effectiveTierForStatus,
  subscriptionStatusGrantsCredits,
  tierFromLookupKey,
} from "@/lib/billing-tier";
import { readCreditRpcResult } from "./credit-rpc-envelope";

export type PaymentsEnv = "sandbox" | "live";
export type PaymentsProviderId = "stripe" | "paddle";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
export function getServiceClient() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

/**
 * Flip plan_tier on the user's account (and the workspaces shim for back-compat).
 * Service-role client, so RLS does not block. No-op if we cannot derive a tier
 * (e.g. top-up checkout, unrecognized lookup key) or the user has no account row.
 */
export async function applyTierForUser(
  userId: string,
  lookupKey: string | undefined,
  status: string,
) {
  if (!lookupKey) return;
  const tier = tierFromLookupKey(lookupKey);
  if (!tier) return;
  // Keep paid access through dunning (past_due); downgrade to free on real termination.
  // The rule is the tested `effectiveTierForStatus` so the subscription handlers can't drift.
  const effectiveTier = effectiveTierForStatus(tier, status);
  const sb = getServiceClient();
  // The three `as any` casts that used to sit on these table names turned off
  // the ONLY check on a money path: getServiceClient() is already
  // createClient<Database>, and `.from("x" as any)` discards that, which takes
  // the update payload down with it -- `{ plan_tier: effectiveTier }` was
  // accepted here whatever the column was called. Both accounts.plan_tier and
  // workspaces.plan_tier exist in the schema as `text` (checked 2026-09-01),
  // so the casts were buying nothing. With them gone, a rename of plan_tier in
  // a migration fails the build rather than quietly leaving paying customers
  // on the tier they had before the webhook fired.
  const { data: accounts } = await sb.from("accounts").select("id").eq("owner_id", userId);
  const accountIds = accounts?.map((a) => a.id) ?? [];
  if (accountIds.length) {
    await sb.from("accounts").update({ plan_tier: effectiveTier }).in("id", accountIds);
  }
  await sb.from("workspaces").update({ plan_tier: effectiveTier }).eq("owner_id", userId);
}

/**
 * Resolve the caller's account id (service-role; creates the default account if missing).
 *
 * CHECKED, AND NO LONGER SWALLOWED. This used to catch everything and answer
 * null, which every caller then read as "this user has no account" and turned
 * into a silent return with the webhook still answering 200. A refused lookup
 * and a genuinely absent account are different events: the first is retryable
 * and the second is not, and a charged customer whose grant was skipped depends
 * on that difference being visible. Returns null ONLY when the RPC ran and
 * answered nothing, which callers treat as the hard failure it is.
 */
export async function resolveAccountId(userId: string): Promise<string | null> {
  const admin = getServiceClient() as unknown as SupabaseClient;
  const { data, error } = await admin.rpc("ensure_user_default_account", { _user_id: userId });
  if (error) {
    throw new Error(`ensure_user_default_account failed for user ${userId}: ${error.message}`);
  }
  return (data as string | null) ?? null;
}

/**
 * Grant the bundle's monthly credit allowance on an active subscription.
 * Idempotent (the RPC no-ops when the allowance already matches) and UNGATED:
 * it only sets the included balance, harmless while metering is off.
 *
 * THROWS ON A REFUSED GRANT. The previous try/catch could never fire, because
 * supabase-js resolves a refused RPC rather than throwing, so a permission
 * error and a completed grant left this function looking identical. The
 * webhook route turns a throw into a non-2xx, which is the only thing that
 * makes the provider redeliver the event; swallowing it meant a subscriber who
 * had been billed silently kept a zero allowance.
 *
 * The four early returns above are NOT failures: an event with no user or no
 * recognizable price, a status that does not grant, or a bundle with no credit
 * volume all describe nothing to do, and a retry would find the same.
 */
export async function grantForSubscription(
  userId: string | undefined,
  lookupKey: string | undefined,
  status: string,
): Promise<void> {
  if (!userId || !lookupKey) return;
  if (!subscriptionStatusGrantsCredits(status)) return;
  const credits = creditsFromLookupKey(lookupKey);
  if (!credits || credits <= 0) return;
  const accountId = await resolveAccountId(userId);
  if (!accountId) {
    throw new Error(
      `grantForSubscription: no account for user ${userId}, so ${credits} subscription credits were not granted`,
    );
  }
  const admin = getServiceClient() as unknown as SupabaseClient;
  const { data, error } = await admin.rpc("grant_subscription_credits", {
    _account_id: accountId,
    _credits: credits,
  });
  const verdict = readCreditRpcResult({
    rpc: "grant_subscription_credits",
    successKey: "granted",
    // 'unchanged' is the RPC reporting the allowance already equals this
    // bundle's volume, which is the idempotent replay path, not a refusal.
    benignReasons: ["unchanged"],
    result: data,
    error,
  });
  if (!verdict.ok) throw new Error(verdict.failure);
}

/**
 * Apply a completed top-up purchase: records it, credits the spendable
 * balance, writes the ledger row — atomically + idempotently (exactly once
 * per provider session/transaction id).
 */
export async function applyTopupPurchase(args: {
  userId: string;
  sessionId: string;
  paymentIntentId: string | null;
  credits: number;
  amountCents: number;
  currency: string;
  lookupKey: string | null;
  env: PaymentsEnv;
}): Promise<void> {
  const accountId = await resolveAccountId(args.userId);
  if (!accountId) {
    // Was a console.error and a return, which the route rendered as 200. The
    // customer's card had already been charged at this point, so the only
    // honest answer is one the provider will redeliver.
    throw new Error(
      `applyTopupPurchase: no account for user ${args.userId}, so a paid top-up of ${args.credits} credits granted nothing (session ${args.sessionId})`,
    );
  }
  const admin = getServiceClient() as unknown as SupabaseClient;
  const { data, error } = await admin.rpc("apply_topup_credits", {
    _user_id: args.userId,
    _account_id: accountId,
    _session_id: args.sessionId,
    _payment_intent_id: args.paymentIntentId,
    _credits: args.credits,
    _amount_cents: args.amountCents,
    _currency: args.currency,
    _lookup_key: args.lookupKey,
    _env: args.env,
  });
  const verdict = readCreditRpcResult({
    rpc: "apply_topup_credits",
    successKey: "applied",
    // 'duplicate' is the unique(stripe_session_id) guard recognizing a redelivery
    // of a purchase already granted. Every other refusal, cap_exceeded above
    // all, means a paid customer was not credited and a human has to act: the
    // RPC leaves the purchase row at status 'capped' for exactly that reason,
    // and a non-2xx here is what puts the incident in front of someone.
    benignReasons: ["duplicate"],
    result: data,
    error,
  });
  if (!verdict.ok) throw new Error(`${verdict.failure} (session ${args.sessionId})`);
}

/**
 * PC-05 refund path: a provider refund claws the purchased credits back,
 * floored at zero (never negative-locks a workspace), with a ledger note.
 * Idempotent per refundRef. When the refunded purchase is a known top-up
 * session, that row is also marked 'refunded'.
 */
export async function applyRefundClawback(args: {
  accountId: string;
  userId: string | null;
  refundRef: string;
  credits: number;
  provider: PaymentsProviderId;
  note: string;
  topupSessionId?: string | null;
}): Promise<void> {
  const admin = getServiceClient() as unknown as SupabaseClient;
  const { data, error } = await admin.rpc("apply_refund_clawback", {
    _account_id: args.accountId,
    _user_id: args.userId,
    _refund_ref: args.refundRef,
    _credits: args.credits,
    _provider: args.provider,
    _note: args.note,
    _topup_session: args.topupSessionId ?? null,
  });
  const verdict = readCreditRpcResult({
    rpc: "apply_refund_clawback",
    successKey: "applied",
    // 'duplicate' is credit_refunds.refund_ref recognizing a redelivered refund.
    benignReasons: ["duplicate"],
    result: data,
    error,
  });
  // A swallowed clawback leaves refunded credits spendable, which is the mirror
  // image of a swallowed grant and just as expensive. Throw so the provider
  // redelivers; the refund_ref key makes the redelivery a no-op once it lands.
  if (!verdict.ok) throw new Error(`${verdict.failure} (refund ${args.refundRef})`);
}

/**
 * Find the top-up purchase a refund points at, by the provider references we
 * stored at purchase time. Returns what the clawback needs.
 */
export async function findTopupForRefund(ref: {
  paymentIntentId?: string | null;
  sessionId?: string | null;
}): Promise<{
  accountId: string;
  userId: string | null;
  credits: number;
  sessionId: string;
} | null> {
  const admin = getServiceClient() as unknown as SupabaseClient;
  let q = admin
    .from("credit_topups")
    .select("account_id, user_id, credits_added, stripe_session_id, status")
    .eq("status", "completed")
    .limit(1);
  if (ref.paymentIntentId) q = q.eq("stripe_payment_intent_id", ref.paymentIntentId);
  else if (ref.sessionId) q = q.eq("stripe_session_id", ref.sessionId);
  else return null;
  const { data } = await q.maybeSingle();
  if (!data) return null;
  const row = data as {
    account_id: string;
    user_id: string | null;
    credits_added: number;
    stripe_session_id: string;
  };
  return {
    accountId: row.account_id,
    userId: row.user_id,
    credits: Number(row.credits_added ?? 0),
    sessionId: row.stripe_session_id,
  };
}
