/**
 * PC-05 — the go-live checklist, automated (the runbook's manual SQL steps
 * as one admin read). This IS the dry-run: it reports exactly what the flip
 * would do — who is unfunded, what the backfill would touch, whether the
 * guard would refuse — without changing anything. The actual switch stays
 * the guarded `admin_set_credits_enabled` RPC.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { creditsFromLookupKey, lookupKeyFor } from "@/lib/billing-tier";
import { normalizePlanTier } from "@/lib/entitlements";
import { activePaymentsProviderId, paymentsProvider } from "./provider.server";

export type GoLiveCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type GoLiveReadiness = {
  provider: "stripe" | "paddle";
  meterOn: boolean;
  readyToFlip: boolean;
  checks: GoLiveCheck[];
};

export const getBillingGoLiveReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoLiveReadiness | { error: string }> => {
    // Admin only — same membership check the admin surface itself uses.
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) return { error: "Admin only." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const checks: GoLiveCheck[] = [];

    // 1. The active provider's keys (booleans only, never values).
    const providerId = activePaymentsProviderId();
    const provider = await paymentsProvider(providerId);
    const sandboxReady = provider.configured("sandbox");
    const liveReady = provider.configured("live");
    checks.push({
      id: "provider_keys",
      label: `Merchant rail (${providerId})`,
      status: liveReady ? "pass" : sandboxReady ? "warn" : "fail",
      detail: liveReady
        ? "Live keys present."
        : sandboxReady
          ? providerId === "paddle"
            ? "Sandbox only. Live keys await the merchant-of-record account."
            : "Sandbox only. Live keys are not set yet."
          : providerId === "paddle"
            ? "Not configured. Awaiting the merchant-of-record account (PADDLE_API_KEY / PADDLE_WEBHOOK_SECRET)."
            : "No keys configured for this rail.",
    });

    // 2. Catalog sanity: the lookup key each active bundle/top-up would carry
    // in the provider catalog must round-trip to its own credit volume, or the
    // webhook cannot grant what a buyer paid for.
    const [bundles, topups] = await Promise.all([
      supabaseAdmin.from("pricing_bundles").select("tier, credits, active"),
      supabaseAdmin.from("pricing_topup_bundles").select("credits, active"),
    ]);
    const badKeys: string[] = [];
    for (const b of (bundles.data ?? []) as Array<{
      tier: string;
      credits: number;
      active: boolean;
    }>) {
      if (!b.active) continue;
      const key = lookupKeyFor(normalizePlanTier(b.tier), Number(b.credits), "monthly");
      if (!key || creditsFromLookupKey(key) !== Number(b.credits)) {
        badKeys.push(key ?? `${b.tier}/${b.credits}`);
      }
    }
    for (const t of (topups.data ?? []) as Array<{ credits: number; active: boolean }>) {
      if (!t.active) continue;
      const n = Number(t.credits);
      const key = `topup_${n >= 1000 && n % 1000 === 0 ? `${n / 1000}k` : n}`;
      if (creditsFromLookupKey(key) !== n) badKeys.push(key);
    }
    checks.push({
      id: "catalog_keys",
      label: "Catalog lookup keys grant credits",
      status: badKeys.length === 0 ? "pass" : "fail",
      detail:
        badKeys.length === 0
          ? "Every active bundle and top-up key round-trips to its credit volume."
          : `These keys would lose a buyer's purchase: ${badKeys.join(", ")}`,
    });

    // 3. The runbook's unfunded-account query (the guard's own condition).
    const { data: credits } = await supabaseAdmin
      .from("account_credits")
      .select("account_id, balance_credits, topup_credits, monthly_grant_credits");
    const { data: accounts } = await supabaseAdmin
      .from("accounts" as never)
      .select("id, plan_tier");
    const tierById = new Map(
      ((accounts ?? []) as Array<{ id: string; plan_tier: string | null }>).map((a) => [
        a.id,
        a.plan_tier ?? "free",
      ]),
    );
    const unfunded = (
      (credits ?? []) as Array<{
        account_id: string;
        balance_credits: number | null;
        topup_credits: number | null;
        monthly_grant_credits: number | null;
      }>
    ).filter(
      (c) =>
        tierById.get(c.account_id) !== "enterprise" &&
        Number(c.balance_credits ?? 0) +
          Number(c.topup_credits ?? 0) +
          Number(c.monthly_grant_credits ?? 0) ===
          0,
    ).length;
    checks.push({
      id: "unfunded_accounts",
      label: "Every account funded before metering",
      status: unfunded === 0 ? "pass" : "fail",
      detail:
        unfunded === 0
          ? "No non-enterprise account would hit a zero balance at the flip."
          : `${unfunded} account(s) would be blocked the moment metering turns on. Run backfill_account_credits() first.`,
    });

    // 4. Webhook liveness: when did each rail last write anything.
    const [lastSub, lastTopup] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("credit_topups")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const lastSeen = [lastSub.data?.updated_at, lastTopup.data?.created_at]
      .filter(Boolean)
      .sort()
      .pop() as string | undefined;
    checks.push({
      id: "webhook_activity",
      label: "Webhook has delivered before",
      status: lastSeen ? "pass" : "warn",
      detail: lastSeen
        ? `Last billing write ${lastSeen}.`
        : "No billing writes recorded yet. Run a sandbox checkout to prove the webhook path.",
    });

    // 5. The meter itself.
    const { data: flag } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "credits_enabled")
      .maybeSingle();
    const meterOn = !!(flag?.value === true || flag?.value === "true");
    checks.push({
      id: "meter",
      label: "Metering switch",
      status: "pass",
      detail: meterOn
        ? "ON. Debits are live."
        : "OFF (dormant). Flip via the guarded admin toggle when every check above passes.",
    });

    const readyToFlip = checks.every((c) => c.status !== "fail");
    return { provider: providerId, meterOn, readyToFlip, checks };
  });
