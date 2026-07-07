/**
 * AFD-12: Server functions powering the admin Observability surface.
 *
 * Admin-only — all RPCs gate at the database via `has_role('admin')`. Read-only
 * fns join the new job_runs ledger, mv_decision_velocity, mv_supersession_rate,
 * and mv_agent_cost_per_decision (see migration 20260626100000_afd_observability).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readObservabilityConfig } from "@/lib/observability/config";
import { EXPECTED_JOBS } from "@/lib/observability/jobs";

export type ObservabilityStatus = {
  gateEnabled: boolean;
  vendors: {
    posthog: boolean;
    sentry: boolean;
    betterStack: boolean;
  };
  recentJobRuns: Array<{
    id: number;
    job_name: string;
    status: string;
    started_at: string;
    duration_ms: number | null;
    error_kind: string | null;
    error_message: string | null;
  }>;
  failureBreakdown: Array<{ failure_kind: string; count: number }>;
  /** SW-6 cron watchdog: expected-vs-actual per job, stale first. */
  cronHealth: Array<{
    job: string;
    cadence: string;
    lastRunAt: string | null;
    ageMinutes: number | null;
    stale: boolean;
  }>;
};

// AFD-12: Moat metric types for the 3 materialized views ──────────────────────

export type DecisionVelocityRow = {
  workspace_id: string;
  week: string;
  decisions_made: number;
  decisions_shipped: number;
  decisions_superseded: number;
};

export type SupersessionRateRow = {
  workspace_id: string;
  agent_slug: string;
  decisions_total: number;
  decisions_superseded: number;
  supersession_rate_pct: number;
};

export type AgentCostRow = {
  workspace_id: string;
  agent_slug: string;
  decisions_30d: number;
  cost_usd_30d: number;
  tokens_30d: number;
  cost_per_decision_usd: number;
};

export type MoatMetrics = {
  decisionVelocity: DecisionVelocityRow[];
  supersessionRate: SupersessionRateRow[];
  agentCost: AgentCostRow[];
};

export const getObservabilityStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ObservabilityStatus | { error: string }> => {
    // Admin gate: user_roles RLS restricts rows to auth.uid(), so a hit means this user is admin.
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return { error: "Forbidden" };

    // The DB function is the source of truth for the gate.
    const { data: gate } = await context.supabase.rpc("observability_enabled");

    const [{ data: jobs }, { data: failures }] = await Promise.all([
      supabaseAdmin
        .from("job_runs")
        .select("id, job_name, status, started_at, duration_ms, error_kind, error_message")
        .order("started_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("agent_runs")
        .select("failure_kind")
        .not("failure_kind", "is", null)
        .gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString())
        .limit(5000),
    ]);

    const counts = new Map<string, number>();
    for (const r of (failures ?? []) as Array<{ failure_kind: string | null }>) {
      const k = r.failure_kind ?? "unknown";
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    // SW-6 cron watchdog: expected-vs-actual. One indexed 1-row read per
    // expected job (job_runs_job_started_idx), in parallel: a job with no
    // run at all, or a run older than its staleness budget, is STALE. This is
    // the "silent non-ticking must not recur" surface the mission demands.
    const nowMs = Date.now();
    const cronHealth = await Promise.all(
      EXPECTED_JOBS.map(async (exp) => {
        const { data: last } = await supabaseAdmin
          .from("job_runs")
          .select("started_at")
          .eq("job_name", exp.job)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastRunAt = (last as { started_at?: string } | null)?.started_at ?? null;
        const ageMs = lastRunAt ? nowMs - Date.parse(lastRunAt) : null;
        return {
          job: exp.job,
          cadence: exp.cadence,
          lastRunAt,
          ageMinutes: ageMs === null ? null : Math.round(ageMs / 60_000),
          stale: ageMs === null || ageMs > exp.staleAfterMs,
        };
      }),
    );
    cronHealth.sort((a, b) => Number(b.stale) - Number(a.stale));

    const cfg = readObservabilityConfig();
    return {
      gateEnabled: Boolean(gate),
      vendors: {
        posthog: cfg.posthog.enabled,
        sentry: cfg.sentry.enabled,
        betterStack: cfg.betterStack.enabled,
      },
      recentJobRuns: (jobs ?? []) as ObservabilityStatus["recentJobRuns"],
      failureBreakdown: Array.from(counts.entries())
        .map(([failure_kind, count]) => ({ failure_kind, count }))
        .sort((a, b) => b.count - a.count),
      cronHealth,
    };
  });

export const adminSetObservabilityEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean }) => d)
  .handler(async ({ context, data }): Promise<{ enabled: boolean } | { error: string }> => {
    const { data: v, error } = await context.supabase.rpc("admin_set_observability_enabled", {
      _enabled: data.enabled,
    });
    if (error) return { error: error.message };
    return { enabled: Boolean(v) };
  });

// ─── AFD-12: /admin/ai-costs — moat metric server function ───────────────────

/**
 * Returns the 3 moat metric materialized views for the /admin/ai-costs surface.
 * Views are admin-only (service_role SELECT grant only; authenticated has no direct access).
 * Admin gate mirrors getObservabilityStatus — user_roles RLS check.
 */
export const getMoatMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MoatMetrics | { error: string }> => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return { error: "Forbidden" };

    const [velocity, supersession, cost] = await Promise.all([
      supabaseAdmin
        .from("mv_decision_velocity" as never)
        .select("workspace_id, week, decisions_made, decisions_shipped, decisions_superseded")
        .order("week", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("mv_supersession_rate" as never)
        .select(
          "workspace_id, agent_slug, decisions_total, decisions_superseded, supersession_rate_pct",
        )
        .order("supersession_rate_pct", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("mv_agent_cost_per_decision" as never)
        .select(
          "workspace_id, agent_slug, decisions_30d, cost_usd_30d, tokens_30d, cost_per_decision_usd",
        )
        .order("cost_per_decision_usd", { ascending: false })
        .limit(100),
    ]);

    return {
      decisionVelocity: (velocity.data ?? []) as DecisionVelocityRow[],
      supersessionRate: (supersession.data ?? []) as SupersessionRateRow[],
      agentCost: (cost.data ?? []) as AgentCostRow[],
    };
  });

// ─── SW-6: failure-detection floor, the founder's error read path ────────────

export type ErrorEventRow = {
  id: number;
  occurred_at: string;
  surface: string;
  error_kind: string | null;
  error_message: string | null;
  stack: string | null;
  request_path: string | null;
  request_method: string | null;
  user_id: string | null;
  workspace_id: string | null;
  deployment_id: string | null;
};

/**
 * SW-6 (mission 3.12): list captured server errors from the in-house
 * error_events store, newest first. This is the "store the founder can read"
 * half of the failure floor; writes happen in src/lib/observability/errors.ts.
 * Admin gate mirrors getObservabilityStatus (user_roles RLS check); the table
 * itself is also RLS-guarded to has_role('admin') for direct reads.
 */
export const listErrorEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number; surface?: string } | undefined) => d ?? {})
  .handler(
    async ({ context, data }): Promise<{ events: ErrorEventRow[] } | { error: string }> => {
      const { data: adminRole } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("role", "admin")
        .maybeSingle();
      if (!adminRole) return { error: "Forbidden" };

      const limit = Math.min(Math.max(data.limit ?? 100, 1), 500);
      let query = supabaseAdmin
        .from("error_events" as never)
        .select(
          "id, occurred_at, surface, error_kind, error_message, stack, request_path, request_method, user_id, workspace_id, deployment_id",
        )
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (data.surface) query = query.eq("surface", data.surface);

      const { data: rows, error } = await query;
      if (error) return { error: error.message };
      return { events: (rows ?? []) as unknown as ErrorEventRow[] };
    },
  );
