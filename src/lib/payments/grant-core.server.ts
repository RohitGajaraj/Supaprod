/**
 * PC-05 — the provider-agnostic grant core. Everything a verified billing
 * event is allowed to DO lives here, keyed by the two provider-neutral facts
 * every rail can supply: the Cadence userId (from checkout metadata /
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
  const { data: accounts } = await sb
    .from("accounts" as any)
    .select("id")
    .eq("owner_id", userId);
  const accountIds = (accounts as Array<{ id: string }> | null)?.map((a) => a.id) ?? [];
  if (accountIds.length) {
    await sb
      .from("accounts" as any)
      .update({ plan_tier: effectiveTier })
      .in("id", accountIds);
  }
  await sb
    .from("workspaces" as any)
    .update({ plan_tier: effectiveTier })
    .eq("owner_id", userId);
}

/** Resolve the caller's account id (service-role; creates the default account if missing). */
export async function resolveAccountId(userId: string): Promise<string | null> {
  try {
    const admin = getServiceClient() as unknown as SupabaseClient;
    const { data } = await admin.rpc("ensure_user_default_account", { _user_id: userId });
    return (data as string | null) ?? null;
  } catch (e) {
    console.error("resolveAccountId failed:", e);
    return null;
  }
}

/**
 * Grant the bundle's monthly credit allowance on an active subscription.
 * Idempotent (the RPC no-ops when the allowance already matches) and UNGATED:
 * it only sets the included balance, harmless while metering is off.
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
  if (!accountId) return;
  try {
    const admin = getServiceClient() as unknown as SupabaseClient;
    await admin.rpc("grant_subscription_credits", { _account_id: accountId, _credits: credits });
  } catch (e) {
    console.error("grantForSubscription failed:", e);
  }
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
    console.error("applyTopupPurchase: no account for user", args.userId);
    return;
  }
  const admin = getServiceClient() as unknown as SupabaseClient;
  await admin.rpc("apply_topup_credits", {
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
  try {
    const admin = getServiceClient() as unknown as SupabaseClient;
    await admin.rpc("apply_refund_clawback", {
      _account_id: args.accountId,
      _user_id: args.userId,
      _refund_ref: args.refundRef,
      _credits: args.credits,
      _provider: args.provider,
      _note: args.note,
      _topup_session: args.topupSessionId ?? null,
    });
  } catch (e) {
    console.error("applyRefundClawback failed:", e);
  }
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
