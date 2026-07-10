/**
 * Server functions for the Drift Detection UI (/drift):
 * - getDriftOverview: baseline cfg, snapshot trend, open/resolved incidents
 * - runDriftNow: trigger rollup + detection synchronously
 * - updateDriftBaseline: edit thresholds & windows (upsert)
 * - resolveDriftIncident / reopenDriftIncident
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runDriftForUser } from "./ai/drift.server";

/**
 * Extracted logic for getDriftOverview - testable without TanStack wrappers.
 */
export async function getDriftOverviewImpl(supabase: SupabaseClient, userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [baselineRes, snapsRes, openRes, recentRes] = await Promise.all([
    supabase.from("drift_baselines").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("drift_snapshots")
      .select("*")
      .eq("user_id", userId)
      .gte("bucket_date", thirtyDaysAgo)
      .order("bucket_date", { ascending: true }),
    supabase
      .from("drift_incidents")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("detected_at", { ascending: false }),
    supabase
      .from("drift_incidents")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "open")
      .order("detected_at", { ascending: false })
      .limit(50),
  ]);
  return {
    baseline: baselineRes.data ?? null,
    snapshots: snapsRes.data ?? [],
    openIncidents: openRes.data ?? [],
    recentIncidents: recentRes.data ?? [],
  };
}

export const getDriftOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return getDriftOverviewImpl(supabase, userId);
  });

export const runDriftNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return await runDriftForUser(supabase, userId);
  });

export const BaselineSchema = z.object({
  window_days: z.number().int().min(1).max(60),
  baseline_days: z.number().int().min(1).max(180),
  latency_pct_threshold: z.number().min(0).max(500),
  tokens_pct_threshold: z.number().min(0).max(500),
  cost_pct_threshold: z.number().min(0).max(500),
  score_pct_threshold: z.number().min(0).max(100),
  error_rate_pct_threshold: z.number().min(0).max(100),
  enabled: z.boolean(),
});

/**
 * Extracted logic for updateDriftBaseline - testable without TanStack wrappers.
 */
export async function updateDriftBaselineImpl(
  supabase: SupabaseClient,
  userId: string,
  data: z.infer<typeof BaselineSchema>,
) {
  const { error } = await supabase
    .from("drift_baselines")
    .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export const updateDriftBaseline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof BaselineSchema>) => BaselineSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return updateDriftBaselineImpl(supabase, userId, data);
  });

/**
 * Extracted logic for resolveDriftIncident - testable without TanStack wrappers.
 */
export async function resolveDriftIncidentImpl(
  supabase: SupabaseClient,
  userId: string,
  incidentId: string,
) {
  const { error } = await supabase
    .from("drift_incidents")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", incidentId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export const resolveDriftIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return resolveDriftIncidentImpl(supabase, userId, data.id);
  });

/**
 * Extracted logic for reopenDriftIncident - testable without TanStack wrappers.
 */
export async function reopenDriftIncidentImpl(
  supabase: SupabaseClient,
  userId: string,
  incidentId: string,
) {
  const { error } = await supabase
    .from("drift_incidents")
    .update({ status: "open", resolved_at: null })
    .eq("id", incidentId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export const reopenDriftIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return reopenDriftIncidentImpl(supabase, userId, data.id);
  });
