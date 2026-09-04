/**
 * Billing READ state. Authoritative checkout lives in payments.functions.ts
 * (embedded Stripe checkout via the Lovable connector gateway). This module
 * only resolves the caller's current plan_tier + entitlements + ownership for
 * the Settings UI, falling back gracefully if the account migration isn't live.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  entitlementsFor,
  normalizePlanTier,
  type Entitlements,
  type PlanTier,
} from "@/lib/entitlements";

async function resolveWorkspaceId(
  supabase: SupabaseClient,
  explicit: string | null | undefined,
): Promise<string | null> {
  if (explicit) return explicit;
  const { data } = await supabase.rpc("current_user_default_workspace");
  return (data as string | null) ?? null;
}

/**
 * The workspace's own plan tier, resolved the same way `getBillingState`
 * always has (workspace shim, then the account's plan once WM-M2 lands, with
 * the same pre-migration tolerance) -- pulled out to its own function (P-94,
 * A-QUEUE.md) so a SECOND reader needing "is this workspace paid" does not
 * re-derive the resolution and risk disagreeing with the surface that already
 * shows it. `getBillingState` itself now calls this rather than carrying the
 * logic inline; behaviour is unchanged.
 */
export async function resolvePlanTier(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<{ planTier: PlanTier; isOwner: boolean; planTierUnknown: boolean }> {
  let planTier: PlanTier = "free";
  let planTierUnknown = false;
  let isOwner = false;
  let accountId: string | null = null;
  try {
    // Post-migration: account_id is present. error (not throw) on a missing column,
    // so re-throw to hit the known-columns fallback below.
    const { data: row, error } = await supabase
      .from("workspaces")
      .select("id,owner_id,plan_tier,account_id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (error) throw error;
    const r = (row ?? {}) as {
      owner_id?: string;
      plan_tier?: string | null;
      account_id?: string | null;
    };
    planTier = normalizePlanTier(r.plan_tier); // workspace shim
    isOwner = !!r.owner_id && r.owner_id === userId;
    accountId = r.account_id ?? null;
  } catch {
    // pre-migration (no account_id column): read the known columns so isOwner still works.
    try {
      const { data: row } = await supabase
        .from("workspaces")
        .select("id,owner_id,plan_tier")
        .eq("id", workspaceId)
        .maybeSingle();
      const r = (row ?? {}) as { owner_id?: string; plan_tier?: string | null };
      planTier = normalizePlanTier(r.plan_tier);
      isOwner = !!r.owner_id && r.owner_id === userId;
    } catch (e) {
      // Both reads failed: a real DB error, not the pre-migration shape.
      // Log it and mark the tier unknown instead of silently reporting free
      // (LOOM W4 silent-money-failure fix).
      console.error("resolvePlanTier: workspace tier read failed", e);
      planTierUnknown = true;
    }
  }

  // WM-M2: the account's plan wins over the workspace shim once the migration lands.
  // Pre-migration (no accounts table) or for a non-account-member, this is a no-op.
  if (accountId) {
    try {
      const { data: acct } = await supabase
        .from("accounts")
        .select("plan_tier")
        .eq("id", accountId)
        .maybeSingle();
      const a = (acct ?? {}) as { plan_tier?: string | null };
      if (a.plan_tier != null) planTier = normalizePlanTier(a.plan_tier);
    } catch (e) {
      // accounts not present yet: keep the workspace shim (logged so a real
      // read failure is visible instead of silent).
      console.warn("resolvePlanTier: account tier read failed, using workspace shim", e);
    }
  }

  return { planTier, isOwner, planTierUnknown };
}

export type BillingState = {
  workspaceId: string | null;
  planTier: PlanTier;
  entitlements: Entitlements;
  /** Is the caller the workspace owner (the only role that can change the plan)? */
  isOwner: boolean;
  /** Is the payment gateway configured for this build (sandbox or live token present)? */
  stripeConfigured: boolean;
  /**
   * LOOM W4: true when the tier read failed outright (a real DB error, not the
   * graceful pre-migration fallback). The 'free' returned alongside is a
   * fallback, not a fact — paid gates should treat it as unknown, not free.
   */
  planTierUnknown?: boolean;
};

export const getBillingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<BillingState> => {
    const { userId } = context;
    // Untyped cast: plan_tier is not in the generated types until the migration
    // applies (same precedent as outcome.functions.ts / decisions-share).
    const supabase = context.supabase as unknown as SupabaseClient;
    // Gateway-managed Stripe: sandbox key lands when payments are enabled,
    // live key after go-live. Either one means checkout will work.
    const stripeConfigured =
      !!process.env.STRIPE_SANDBOX_API_KEY || !!process.env.STRIPE_LIVE_API_KEY;

    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) {
      return {
        workspaceId: null,
        planTier: "free",
        entitlements: entitlementsFor("free"),
        isOwner: false,
        stripeConfigured,
      };
    }

    const { planTier, isOwner, planTierUnknown } = await resolvePlanTier(
      supabase,
      userId,
      workspaceId,
    );

    return {
      workspaceId,
      planTier,
      entitlements: entitlementsFor(planTier),
      isOwner,
      stripeConfigured,
      planTierUnknown,
    };
  });

/**
 * How much runway is left, denominated in RUNS.
 *
 * BUILD-QUEUE item 29 asked for a low-credit warning that a person can actually
 * see, and LANE 0 asked for the figure. **The unit is runs, and the reason is
 * measured rather than argued.** At one instant on 2026-08-25 06:46:19 UTC one
 * account read 0.000 credits/min over 15 minutes, 0.100 over an hour, 2.085 over
 * a day and 1.299 over a week, while a second account read 6.133 / 11.350 /
 * 0.547 / 0.510 — **a 22x spread on one account at one moment** — and
 * `runwayMinutes()` returns Infinity whenever the last debit is an hour old.
 *
 * A run, by contrast, is a near-uniform unit of cost: over 360 runs in seven
 * days, mean `0.006662` against a median of `0.006022`, a ratio of **1.11**.
 *
 * WHY THIS GOES THROUGH AN RPC. The three tables disagree about scope —
 * `credit_ledger` and `account_credits` are `is_account_member(account_id)`,
 * while `agent_runs` is `(auth.uid() = user_id) AND is_workspace_member(...)`.
 * A caller joining them client-side sees only its OWN runs against the WHOLE
 * account's spend, which **understates runway** and warns early. It is also
 * 1,827 debit rows in seven days on one account, which is not a payload for a
 * browser. `credit_runway` is SECURITY DEFINER and re-checks `is_account_member`
 * itself, so tenancy is unchanged.
 *
 * NULL IS THE HONEST ANSWER AND MUST BE RENDERED AS ONE. No runs in the window
 * means no rate, so `runsLeft` comes back null rather than Infinity or an
 * invented number. A surface shows "not known yet" — never a zero, which reads
 * as "you are out".
 */
export type CreditRunway = {
  spendableCredits: number;
  creditsSpentInWindow: number;
  runsInWindow: number;
  /** Null when the window holds no runs — no rate can be derived. */
  creditsPerRun: number | null;
  /** Null when there is no rate or no spend. Never Infinity, never a fake 0. */
  runsLeft: number | null;
  windowDays: number;
};

export const getCreditRunway = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; windowDays?: number } | undefined) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        windowDays: z.number().int().min(1).max(90).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<CreditRunway | null> => {
    const supabase = context.supabase as SupabaseClient;
    const windowDays = data.windowDays ?? 7;
    try {
      // The workspace read runs on the CALLER's client on purpose: it is what
      // proves they may see this account at all, before the definer function is
      // asked anything. `credit_runway` re-checks membership too, so this is a
      // belt-and-braces rather than the only gate.
      const { data: ws, error: wsErr } = await supabase
        .from("workspaces")
        .select("account_id")
        .eq("id", data.workspaceId)
        .maybeSingle();
      const accountId = (ws as { account_id?: string | null } | null)?.account_id ?? null;
      // A read that failed proves nothing, so it claims nothing — the same rule
      // `getTrackArtifacts` follows for `missing`.
      if (wsErr || !accountId) return null;

      const { data: rows, error } = await supabase.rpc("credit_runway", {
        for_account: accountId,
        window_days: windowDays,
      });
      if (error) return null;
      const r = (Array.isArray(rows) ? rows[0] : rows) as
        | {
            spendable_credits?: number | string | null;
            credits_spent_in_window?: number | string | null;
            runs_in_window?: number | null;
            credits_per_run?: number | string | null;
            runs_left?: number | null;
          }
        | undefined;
      // No row means the definer refused, which is a permissions answer and not
      // a runway of zero. Zero would read as "you are out" and be a lie.
      if (!r) return null;

      const num = (v: number | string | null | undefined): number | null =>
        v === null || v === undefined ? null : Number(v);

      return {
        spendableCredits: num(r.spendable_credits) ?? 0,
        creditsSpentInWindow: num(r.credits_spent_in_window) ?? 0,
        runsInWindow: r.runs_in_window ?? 0,
        creditsPerRun: num(r.credits_per_run),
        runsLeft: r.runs_left ?? null,
        windowDays,
      };
    } catch {
      return null;
    }
  });
