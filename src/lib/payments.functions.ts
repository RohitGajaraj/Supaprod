import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { computeCreditAttribution } from "@/lib/credits.functions";
import { topUpCycleCap } from "@/lib/billing-tier";
import { activePaymentsProviderId, paymentsProvider } from "@/lib/payments/provider.server";

/** PC-05: embedded (Stripe secret) or hosted (Paddle URL) — the UI handles both. */
type CheckoutResult = { clientSecret: string } | { checkoutUrl: string } | { error: string };
type PortalResult = { url: string } | { error: string };
type MySubscription = {
  hasSubscription: boolean;
  stripeSubscriptionId?: string;
  status?: string;
  priceId?: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
};
type MutateResult = { ok: true; cancelAtPeriodEnd: boolean } | { error: string };

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { priceId: string; returnUrl: string; environment: StripeEnv; quantity?: number }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { userId, claims } = context;
      const email = (claims as { email?: string })?.email;

      // Credit top-ups MUST go through createTopUpCheckout, which enforces the
      // per-cycle ceiling. Refusing a top-up price here closes the bypass where a
      // caller hits the generic checkout directly with a topup_* key (no cap).
      if (data.priceId.startsWith("topup_")) {
        return { error: "Credit top-ups must use the top-up flow." };
      }

      // PC-05: the PaymentsProvider seam. Stripe today; Paddle activates by
      // env flip once the merchant-of-record account exists [awaiting MoR account].
      const providerId = activePaymentsProviderId();
      const provider = await paymentsProvider(providerId);
      if (!provider.configured(data.environment)) {
        return { error: "Payments are not configured for this environment yet." };
      }
      const session = await provider.createCheckout({
        userId,
        email,
        lookupKey: data.priceId,
        quantity: data.quantity,
        returnUrl: data.returnUrl,
        env: data.environment,
        kind: "subscription",
      });
      return session.mode === "embedded_secret"
        ? { clientSecret: session.clientSecret }
        : { checkoutUrl: session.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalResult> => {
    const { userId } = context;
    // stripe_customer_id is service-role-only (revoked from authenticated);
    // user is already verified by requireSupabaseAuth and we scope by user_id.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return { error: "No subscription found" };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * In-app subscription read for the Plan page. Returns the latest row from
 * the subscriptions table for the calling user in the current environment.
 */
export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<MySubscription> => {
    const { userId } = context;
    // stripe_subscription_id is service-role-only; scope by user_id (authed).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id, status, price_id, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub) return { hasSubscription: false };
    const s = sub as {
      stripe_subscription_id: string;
      status: string;
      price_id: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean | null;
    };
    return {
      hasSubscription: true,
      stripeSubscriptionId: s.stripe_subscription_id,
      status: s.status,
      priceId: s.price_id,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: !!s.cancel_at_period_end,
    };
  });

async function mutateCancelFlag(
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
  environment: StripeEnv,
  cancelAtPeriodEnd: boolean,
): Promise<MutateResult> {
  const { userId } = context;
  // stripe_subscription_id is service-role-only; scope by user_id (authed).
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("user_id", userId)
    .eq("environment", environment)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const s = sub as { stripe_subscription_id?: string; status?: string } | null;
  if (!s?.stripe_subscription_id) return { error: "No active subscription found." };
  try {
    const stripe = createStripeClient(environment);
    const updated = await stripe.subscriptions.update(s.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });
    // Mirror immediately so the UI flips without waiting for the webhook.
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: cancelAtPeriodEnd, updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", s.stripe_subscription_id);
    return { ok: true, cancelAtPeriodEnd: !!updated.cancel_at_period_end };
  } catch (error) {
    return { error: getStripeErrorMessage(error) };
  }
}

export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(({ data, context }): Promise<MutateResult> =>
    mutateCancelFlag(context as never, data.environment, true),
  );

export const resumeMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(({ data, context }): Promise<MutateResult> =>
    mutateCancelFlag(context as never, data.environment, false),
  );

// ---------------------------------------------------------------------------
// Phase 7: Credits surface (balance, ledger, top-ups).
// Reads the live account_credits / credit_ledger / credit_topups rows via the
// caller's authed (RLS-scoped) client. Top-ups still flow through the same
// Stripe Embedded Checkout — createTopUpCheckout is a thin guard that enforces
// the per-cycle cap before delegating to createCheckoutSession.
// ---------------------------------------------------------------------------

export type CreditsLedgerRow = {
  id: string;
  delta_credits: number;
  reason: string;
  surface: string | null;
  product_id: string | null;
  created_at: string;
};

export type CreditsTopupRow = {
  id: string;
  price_lookup_key: string;
  credits_added: number;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

export type CreditsView = {
  accountId: string | null;
  enabled: boolean;
  balanceCredits: number;
  monthlyGrantCredits: number;
  topupCredits: number;
  cycleAnchor: string | null;
  cycleTopupCredits: number;
  cycleTopupCapCredits: number;
  ledger: CreditsLedgerRow[];
  topups: CreditsTopupRow[];
};

export const getMyCreditsView = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<CreditsView> => {
    const { supabase, userId } = context;
    const empty: CreditsView = {
      accountId: null,
      enabled: false,
      balanceCredits: 0,
      monthlyGrantCredits: 0,
      topupCredits: 0,
      cycleAnchor: null,
      cycleTopupCredits: 0,
      cycleTopupCapCredits: topUpCycleCap(0),
      ledger: [],
      topups: [],
    };

    // Resolve the user's default account id (idempotent provisioning).
    let accountId: string | null = null;
    try {
      const { data: acc } = await supabase.rpc(
        "ensure_user_default_account" as never,
        { _user_id: userId } as never,
      );
      accountId = (acc as string | null) ?? null;
    } catch {
      /* RPC missing pre-publish; degrade gracefully */
    }
    if (!accountId) return empty;

    // Is the credits engine flipped on? Reads a public SQL fn that returns
    // bool; defaults to false. We surface this so the UI can label balances
    // as "metering on" vs "metering off" without lying about a 0 balance.
    let enabled = false;
    try {
      const { data: en } = await supabase.rpc("credits_enabled" as never);
      enabled = en === true;
    } catch {
      /* fn missing — treat as off */
    }

    const [credRes, ledRes, topRes] = await Promise.all([
      supabase
        .from("account_credits")
        .select("balance_credits, monthly_grant_credits, topup_credits, cycle_anchor")
        .eq("account_id", accountId)
        .maybeSingle(),
      supabase
        .from("credit_ledger")
        .select("id, delta_credits, reason, surface, product_id, created_at")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("credit_topups")
        .select(
          "id, price_lookup_key, credits_added, amount_cents, currency, status, created_at, environment",
        )
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const cred = (credRes.data ?? {}) as {
      balance_credits?: number;
      monthly_grant_credits?: number;
      topup_credits?: number;
      cycle_anchor?: string | null;
    };
    const monthlyGrant = Number(cred.monthly_grant_credits ?? 0);
    const cycleAnchor = (cred.cycle_anchor as string | null) ?? null;
    const topups = (topRes.data ?? []) as CreditsTopupRow[];

    const sinceMs = cycleAnchor ? new Date(cycleAnchor).getTime() : Date.now() - 30 * 86_400_000;
    const cycleTopups = topups
      .filter((t) => t.status === "completed" && new Date(t.created_at).getTime() >= sinceMs)
      .reduce((s, t) => s + Number(t.credits_added || 0), 0);
    const cap = topUpCycleCap(monthlyGrant);

    return {
      accountId,
      enabled,
      balanceCredits: Number(cred.balance_credits ?? 0),
      monthlyGrantCredits: monthlyGrant,
      topupCredits: Number(cred.topup_credits ?? 0),
      cycleAnchor,
      cycleTopupCredits: cycleTopups,
      cycleTopupCapCredits: cap,
      ledger: (ledRes.data ?? []) as CreditsLedgerRow[],
      topups,
    };
  });

const TOPUP_BUNDLES: Record<string, { credits: number; label: string }> = {
  topup_250: { credits: 250, label: "250 credits" },
  topup_1k: { credits: 1000, label: "1,000 credits" },
  topup_2_5k: { credits: 2500, label: "2,500 credits" },
};

/**
 * Cap-guarded top-up: rejects if this purchase would push the cycle's total
 * top-up credits past the per-cycle cap, otherwise delegates to the standard
 * embedded-checkout session. Same return shape as createCheckoutSession.
 */
export const createTopUpCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^topup_[a-zA-Z0-9_]+$/.test(data.priceId)) throw new Error("Invalid top-up priceId");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { supabase, userId, claims } = context;

    // Resolve bundle: prefer admin-managed catalog (pricing_topup_bundles),
    // fall back to the static map so legacy lookup keys keep working.
    let bundle: { credits: number; label: string } | null = TOPUP_BUNDLES[data.priceId] ?? null;
    if (!bundle) {
      const m = data.priceId.match(/^topup_(\d+)(k?)$/);
      if (m) {
        const n = parseInt(m[1], 10) * (m[2] === "k" ? 1000 : 1);
        const { data: row } = await supabase
          .from("pricing_topup_bundles")
          .select("credits")
          .eq("credits", n)
          .eq("active", true)
          .maybeSingle();
        if (row) bundle = { credits: Number(row.credits), label: `${n.toLocaleString()} credits` };
      }
    }
    if (!bundle) return { error: "Unknown top-up bundle." };

    // Inline a tiny version of getMyCreditsView's cap math so we don't have
    // to expose the function-as-RPC machinery internally.
    try {
      const { data: accId } = await supabase.rpc(
        "ensure_user_default_account" as never,
        { _user_id: userId } as never,
      );
      if (accId) {
        const { data: cred } = await supabase
          .from("account_credits")
          .select("monthly_grant_credits, cycle_anchor")
          .eq("account_id", accId as string)
          .maybeSingle();
        const monthlyGrant = Number(
          (cred as { monthly_grant_credits?: number } | null)?.monthly_grant_credits ?? 0,
        );
        const cycleAnchor = (cred as { cycle_anchor?: string | null } | null)?.cycle_anchor ?? null;
        const sinceMs = cycleAnchor
          ? new Date(cycleAnchor).getTime()
          : Date.now() - 30 * 86_400_000;
        const { data: tops } = await supabase
          .from("credit_topups")
          .select("credits_added, status, created_at")
          .eq("user_id", userId)
          .eq("environment", data.environment);
        const cycleSpend = (
          (tops ?? []) as Array<{ credits_added: number; status: string; created_at: string }>
        )
          .filter((t) => t.status === "completed" && new Date(t.created_at).getTime() >= sinceMs)
          .reduce((s, t) => s + Number(t.credits_added || 0), 0);
        const cap = topUpCycleCap(monthlyGrant);
        if (cycleSpend + bundle.credits > cap) {
          return {
            error: `Top-up limit reached for this cycle (${cap.toLocaleString()} credits). Try a smaller bundle, or wait for the next cycle.`,
          };
        }
      }
    } catch (e) {
      // LOOM W4: a failed cap check must BLOCK, not fall through to checkout.
      // Falling through let a buyer pass the cycle cap whenever this read
      // errored, which is a silent money failure.
      console.error("createTopUpCheckout: top-up cap check failed", e);
      return {
        error: "We could not verify your top-up limit just now. Please try again in a moment.",
      };
    }

    // Delegate to the provider seam's canonical session creator (resolves
    // customer, sets metadata.kind='topup'). Re-implementing here would drift.
    try {
      const email = (claims as { email?: string })?.email;
      const providerId = activePaymentsProviderId();
      const provider = await paymentsProvider(providerId);
      if (!provider.configured(data.environment)) {
        return { error: "Payments are not configured for this environment yet." };
      }
      const session = await provider.createCheckout({
        userId,
        email,
        lookupKey: data.priceId,
        quantity: 1,
        returnUrl: data.returnUrl,
        env: data.environment,
        kind: "topup",
      });
      return session.mode === "embedded_secret"
        ? { clientSecret: session.clientSecret }
        : { checkoutUrl: session.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// ---------------------------------------------------------------------------
// WM-M16: credit usage attribution (the "where did my credits go" view).
// Reads the account's debit ledger via the caller's RLS-scoped client, rolls it
// up per product + per member (pure, in credits.functions.ts), and enriches
// product ids with their names. Empty until the engine has debits (metering on).
// ---------------------------------------------------------------------------

export type CreditAttributionView = {
  byProduct: { id: string | null; name: string; credits: number }[];
  byMember: { id: string | null; credits: number }[];
  totalDebited: number;
};

export const getCreditAttribution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sinceIso?: string | null }) => data ?? {})
  .handler(async ({ data, context }): Promise<CreditAttributionView> => {
    const { supabase, userId } = context;
    const empty: CreditAttributionView = { byProduct: [], byMember: [], totalDebited: 0 };

    let accountId: string | null = null;
    try {
      const { data: acc } = await supabase.rpc(
        "ensure_user_default_account" as never,
        { _user_id: userId } as never,
      );
      accountId = (acc as string | null) ?? null;
    } catch {
      /* RPC missing pre-publish; degrade gracefully */
    }
    if (!accountId) return empty;

    const attr = await computeCreditAttribution(supabase, accountId, {
      sinceIso: data?.sinceIso ?? null,
    });

    // Enrich product ids -> names (best-effort; RLS-scoped, falls back to a label).
    const names = new Map<string, string>();
    const pids = attr.byProduct.map((b) => b.id).filter((x): x is string => !!x);
    if (pids.length) {
      try {
        const { data: rows } = await supabase.from("projects").select("id, name").in("id", pids);
        for (const r of (rows ?? []) as Array<{ id: string; name: string }>) {
          names.set(r.id, r.name);
        }
      } catch {
        /* names are best-effort */
      }
    }

    return {
      byProduct: attr.byProduct.map((b) => ({
        id: b.id,
        name: b.id ? (names.get(b.id) ?? "Untitled product") : "Unattributed",
        credits: b.credits,
      })),
      byMember: attr.byMember,
      totalDebited: attr.totalDebited,
    };
  });

// ---------------------------------------------------------------------------
// WM-M14: owner-set per-product spend caps. The owner caps how many credits a
// product can draw per window; assertCreditCaps enforces it on the hot path when
// metering is on. Reads/writes via the caller's RLS-scoped client (owner-write
// policy added in migration 20260621140000); inert until credits_enabled().
// ---------------------------------------------------------------------------

export type CreditCapRow = {
  id: string;
  scope: "product" | "member";
  targetId: string | null;
  targetName: string;
  capCredits: number;
  windowKind: "cycle" | "day" | "month";
  enabled: boolean;
};
export type CreditCapsView = {
  isOwner: boolean;
  caps: CreditCapRow[];
  products: { id: string; name: string }[];
  /** Account members visible to the owner — used by the per-user allocation surface (WM-M19). */
  members: { userId: string; label: string }[];
};

async function resolveAccount(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
): Promise<string | null> {
  try {
    const { data } = await supabase.rpc(
      "ensure_user_default_account" as never,
      { _user_id: userId } as never,
    );
    return (data as string | null) ?? null;
  } catch {
    return null;
  }
}

export const getCreditCaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditCapsView> => {
    // requireSupabaseAuth's context is inferred `any` by TanStack (measured
    // 2026-09-01: a `.from("table_that_does_not_exist")` inside such a handler
    // compiles), so nothing in this handler was checked against the schema --
    // which is how `.from("account_members" as any)` below survived: the cast
    // was redundant on an already-untyped client and read as if the table were
    // missing from the generated types. It is not. Re-attaching Database here
    // makes the three selects in the Promise.all check their column lists.
    const { supabase, userId } = context as {
      supabase: SupabaseClient<Database>;
      userId: string;
    };
    const empty: CreditCapsView = { isOwner: false, caps: [], products: [], members: [] };
    const accountId = await resolveAccount(supabase, userId);
    if (!accountId) return empty;

    let isOwner = false;
    try {
      const { data: a } = await supabase
        .from("accounts")
        .select("owner_id")
        .eq("id", accountId)
        .maybeSingle();
      isOwner = (a as { owner_id?: string } | null)?.owner_id === userId;
    } catch {
      /* default false */
    }

    const [capsRes, prodRes, membersRes] = await Promise.all([
      supabase
        .from("credit_caps")
        .select("id, scope, target_id, cap_credits, window_kind, enabled")
        .eq("account_id", accountId),
      supabase.from("projects").select("id, name"),
      // Fetch account members so the UI can show a dropdown for member-scope caps (WM-M19).
      supabase.from("account_members").select("user_id, role").eq("account_id", accountId),
    ]);

    const products = ((prodRes.data ?? []) as Array<{ id: string; name: string }>).map((p) => ({
      id: p.id,
      name: p.name,
    }));
    const nameOf = new Map(products.map((p) => [p.id, p.name]));
    const caps: CreditCapRow[] = (
      (capsRes.data ?? []) as Array<{
        id: string;
        scope: "product" | "member";
        target_id: string | null;
        cap_credits: number;
        window_kind: "cycle" | "day" | "month";
        enabled: boolean;
      }>
    ).map((r) => ({
      id: r.id,
      scope: r.scope,
      targetId: r.target_id,
      targetName:
        r.scope === "product"
          ? r.target_id
            ? (nameOf.get(r.target_id) ?? "Untitled product")
            : "Any product"
          : "Member",
      capCredits: Number(r.cap_credits),
      windowKind: r.window_kind,
      enabled: !!r.enabled,
    }));

    const members: { userId: string; label: string }[] = (
      (membersRes.data ?? []) as Array<{ user_id: string; role: string }>
    ).map((r) => ({ userId: r.user_id, label: `${r.role} · ${r.user_id.slice(0, 8)}` }));

    return { isOwner, caps, products, members };
  });

export const setCreditCap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      scope: "product" | "member";
      targetId: string;
      capCredits: number;
      windowKind: "cycle" | "day" | "month";
      enabled?: boolean;
    }) => {
      if (d.scope !== "product" && d.scope !== "member") throw new Error("Invalid scope");
      if (!d.targetId) throw new Error("A target is required");
      if (!Number.isFinite(d.capCredits) || d.capCredits < 0) throw new Error("Cap must be >= 0");
      if (!["cycle", "day", "month"].includes(d.windowKind)) throw new Error("Invalid window");
      return d;
    },
  )
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { supabase, userId } = context;
    const accountId = await resolveAccount(supabase, userId);
    if (!accountId) return { error: "No account found." };
    const enabled = data.enabled ?? true;
    // Find an existing cap for this (account, scope, target) and update it, else insert.
    // RLS (owner-write) is what authorizes the write; a non-owner's write is rejected.
    const { data: existing } = await supabase
      .from("credit_caps")
      .select("id")
      .eq("account_id", accountId)
      .eq("scope", data.scope)
      .eq("target_id", data.targetId)
      .maybeSingle();
    if (existing && (existing as { id: string }).id) {
      const { error } = await supabase
        .from("credit_caps")
        .update({
          cap_credits: data.capCredits,
          window_kind: data.windowKind,
          enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (existing as { id: string }).id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("credit_caps").insert({
        account_id: accountId,
        scope: data.scope,
        target_id: data.targetId,
        cap_credits: data.capCredits,
        window_kind: data.windowKind,
        enabled,
      });
      if (error) return { error: error.message };
    }
    return { ok: true };
  });

export const removeCreditCap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d.id) throw new Error("id required");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { supabase } = context;
    const { error } = await supabase.from("credit_caps").delete().eq("id", data.id);
    if (error) return { error: error.message };
    return { ok: true };
  });
