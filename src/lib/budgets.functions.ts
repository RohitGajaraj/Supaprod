/**
 * Server functions for the Budgets UI (/budgets) and header BudgetBar:
 * - getBudgetOverview: global cap + usage, surface caps + usage, recent alerts
 * - updateGlobalBudget: caps + alert_at_pct
 * - upsertSurfaceBudget / deleteSurfaceBudget
 * - acknowledgeAlert
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Extracted logic for getBudgetOverview - testable without TanStack wrappers.
 */
export async function getBudgetOverviewImpl(supabase: SupabaseClient, userId: string) {
  const [g, s, a] = await Promise.all([
    supabase.from("ai_budgets").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("ai_surface_budgets").select("*").eq("user_id", userId).order("surface"),
    supabase
      .from("ai_budget_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  /**
   * The PER-RUN ceiling, read here because this is the "what bounds spend" call
   * and a caller that has to ask two places will eventually ask one.
   *
   * Added 2026-08-03: the Engine room said "no cap set", /runs said "Nothing
   * caps this yet", and /build displayed 10.00, while every workspace in the
   * database carried a 10 USD per-run ceiling. Two of the three were reporting
   * the absence of the ai_budgets meter as the absence of any control at all.
   *
   * RLS-scoped, so this returns the caller's own workspaces and nothing else. A
   * failed or empty read yields null, which the surfaces render as "nothing caps
   * this" rather than inventing a ceiling that may not hold.
   */
  // Guarded: this is an ADDITION to an existing overview, and a ceiling nobody
  // could read must not take the budget page down with it. On any failure the
  // answer is null, which the surfaces render as "nothing caps this" rather than
  // asserting a ceiling that may not hold. Understating a control is recoverable;
  // claiming one that is not there is not.
  let missionCapUsd: number | null = null;
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("default_mission_spend_cap_usd")
      .limit(1)
      .maybeSingle();
    const rawCap = (ws as { default_mission_spend_cap_usd?: number | string | null } | null)
      ?.default_mission_spend_cap_usd;
    missionCapUsd =
      rawCap === null || rawCap === undefined || Number.isNaN(Number(rawCap))
        ? null
        : Number(rawCap);
  } catch {
    missionCapUsd = null;
  }

  return {
    global: g.data ?? null,
    surfaces: s.data ?? [],
    alerts: a.data ?? [],
    missionCapUsd,
  };
}

export const getBudgetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return getBudgetOverviewImpl(supabase, userId);
  });

export const GlobalSchema = z.object({
  daily_usd_cap: z.number().min(0).nullable(),
  monthly_usd_cap: z.number().min(0).nullable(),
  daily_token_cap: z.number().int().min(0).nullable(),
  monthly_token_cap: z.number().int().min(0).nullable(),
  alert_at_pct: z.number().int().min(1).max(100),
});

/**
 * Extracted logic for updateGlobalBudget - testable without TanStack wrappers.
 */
export async function updateGlobalBudgetImpl(
  supabase: SupabaseClient,
  userId: string,
  data: z.infer<typeof GlobalSchema>,
) {
  const { data: existing } = await supabase
    .from("ai_budgets")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from("ai_budgets").update(data).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("ai_budgets").insert({ user_id: userId, ...data });
    if (error) throw new Error(error.message);
  }
  return { ok: true };
}

export const updateGlobalBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof GlobalSchema>) => GlobalSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return updateGlobalBudgetImpl(supabase, userId, data);
  });

export const SurfaceSchema = z.object({
  surface: z.string().min(1).max(40),
  daily_usd_cap: z.number().min(0).nullable(),
  monthly_usd_cap: z.number().min(0).nullable(),
  enabled: z.boolean(),
});

/**
 * Extracted logic for upsertSurfaceBudget - testable without TanStack wrappers.
 */
export async function upsertSurfaceBudgetImpl(
  supabase: SupabaseClient,
  userId: string,
  data: z.infer<typeof SurfaceSchema>,
) {
  const { error } = await supabase
    .from("ai_surface_budgets")
    .upsert({ user_id: userId, ...data }, { onConflict: "user_id,surface" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export const upsertSurfaceBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof SurfaceSchema>) => SurfaceSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return upsertSurfaceBudgetImpl(supabase, userId, data);
  });

/**
 * Extracted logic for deleteSurfaceBudget - testable without TanStack wrappers.
 */
export async function deleteSurfaceBudgetImpl(
  supabase: SupabaseClient,
  userId: string,
  surface: string,
) {
  const { error } = await supabase
    .from("ai_surface_budgets")
    .delete()
    .eq("user_id", userId)
    .eq("surface", surface);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export const deleteSurfaceBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { surface: string }) => z.object({ surface: z.string().min(1) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return deleteSurfaceBudgetImpl(supabase, userId, data.surface);
  });

/**
 * Extracted logic for acknowledgeAlert - testable without TanStack wrappers.
 */
export async function acknowledgeAlertImpl(
  supabase: SupabaseClient,
  userId: string,
  alertId: string,
) {
  const { error } = await supabase
    .from("ai_budget_alerts")
    .update({ acknowledged: true })
    .eq("id", alertId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export const acknowledgeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return acknowledgeAlertImpl(supabase, userId, data.id);
  });

/**
 * Extracted logic for getBudgetSummary - testable without TanStack wrappers.
 * Lightweight summary for header badge — just the global daily/monthly usage vs cap.
 */
export async function getBudgetSummaryImpl(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("ai_budgets")
    .select(
      "daily_usd_cap,monthly_usd_cap,daily_usd_used,monthly_usd_used,day_window,month_window,alert_at_pct",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export const getBudgetSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return getBudgetSummaryImpl(supabase, userId);
  });
