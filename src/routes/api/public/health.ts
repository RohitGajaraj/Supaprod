import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  assembleHealth,
  evaluateCronPulse,
  CRON_PULSE_JOB,
  type CheckState,
} from "@/lib/app-health";

/**
 * APP-HEALTH - public app-level health/readiness endpoint (considerations.md SRE lens P0).
 *
 * GET /api/public/health -> 200 { status:"ok", ... } when healthy, 503 { status:"degraded", ... }
 * when a dependency is down, so an uptime monitor / load balancer reacts on the status code.
 * Public + unauthenticated (monitors do not auth), so it: (1) leaks NOTHING beyond ok/error check
 * states (no error messages); (2) keeps the DB probe trivially cheap (one indexed-id read, capped
 * at 1 row); (3) bounds the probe with a short timeout so a slow/over-loaded DB can't pile up
 * requests into a DoS amplifier. The pure status assembly is in `@/lib/app-health` (unit-tested).
 */
const DB_PROBE_TIMEOUT_MS = 2000;

/** A cheap reachability probe: any answer (even a row count of 0) means the DB is reachable. */
async function probeDatabase(): Promise<CheckState> {
  try {
    const probe = (supabaseAdmin as unknown as SupabaseClient)
      .from("profiles")
      .select("id", { head: true })
      .limit(1);
    const timeout = new Promise<{ error: unknown }>((resolve) =>
      setTimeout(() => resolve({ error: new Error("timeout") }), DB_PROBE_TIMEOUT_MS),
    );
    const result = (await Promise.race([probe, timeout])) as { error: unknown };
    return result.error ? "error" : "ok";
  } catch {
    return "error";
  }
}

/**
 * SW-6 failure floor: is the cron scheduler alive? Reads the latest run of the
 * minutely pulse job from the job_runs ledger (indexed job_name+started_at
 * read, 1 row) and applies the pure staleness policy. Timeout-bounded like the
 * DB probe; leaks nothing beyond ok/error.
 */
async function probeCronPulse(): Promise<CheckState> {
  try {
    const probe = (supabaseAdmin as unknown as SupabaseClient)
      .from("job_runs")
      .select("started_at")
      .eq("job_name", CRON_PULSE_JOB)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const timeout = new Promise<{ error: unknown }>((resolve) =>
      setTimeout(() => resolve({ error: new Error("timeout") }), DB_PROBE_TIMEOUT_MS),
    );
    const result = (await Promise.race([probe, timeout])) as {
      error: unknown;
      data?: { started_at?: string | null } | null;
    };
    if (result.error) return "error";
    return evaluateCronPulse(result.data?.started_at ?? null, Date.now());
  } catch {
    return "error";
  }
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const [database, crons] = await Promise.all([probeDatabase(), probeCronPulse()]);
        const release = process.env.CF_VERSION_METADATA_ID?.trim() || null;
        const { body, httpStatus } = assembleHealth(
          { database, crons },
          new Date().toISOString(),
          release,
        );
        return new Response(JSON.stringify(body), {
          status: httpStatus,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
