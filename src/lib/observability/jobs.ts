/**
 * AFD-07: withJobRun() — wrap any cron/background-job handler so every invocation
 * appears in the `job_runs` ledger. Also pings the matching Better Stack heartbeat.
 *
 * Usage in a cron route handler:
 *
 *   return withJobRun("ambient.sense-tick", async () => { ... real work ... });
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { heartbeat } from "./uptime";
import { captureError } from "./errors";

/**
 * SW-6 (mission 3.12): the expected-jobs manifest, the missing half of the
 * delegate-poll-tick incident fix. job_runs records what DID run; nothing knew
 * what SHOULD run, so a job that 401s or was never registered produced
 * silence. getObservabilityStatus diffs this list against job_runs recency.
 *
 * staleAfterMs is deliberately loose (2-4x cadence) to absorb scheduler
 * jitter; a stale entry here is a real incident, not noise. Keep in sync with
 * the pg_cron registrations in supabase/migrations (grep cron.schedule).
 */
export type ExpectedJob = { job: string; cadence: string; staleAfterMs: number };

const HOUR = 3_600_000;
export const EXPECTED_JOBS: ExpectedJob[] = [
  { job: "cron.resume-runs", cadence: "every minute", staleAfterMs: 10 * 60_000 },
  { job: "cron.delegate-poll-tick", cadence: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "cron.approvals-tick", cadence: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "cron.event-reactor-tick", cadence: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "ambient.sense-tick", cadence: "every 5 min", staleAfterMs: 20 * 60_000 },
  { job: "cron.uptime-tick", cadence: "every 5 min", staleAfterMs: 20 * 60_000 },
  { job: "cron.cluster-tick", cadence: "every 10 min", staleAfterMs: 40 * 60_000 },
  { job: "cron.trigger-tick", cadence: "every 15 min", staleAfterMs: 1 * HOUR },
  { job: "cron.eval-tick", cadence: "every 30 min", staleAfterMs: 2 * HOUR },
  { job: "cron.outcome-tick", cadence: "hourly", staleAfterMs: 3 * HOUR },
  { job: "cron.indexer-tick", cadence: "hourly", staleAfterMs: 3 * HOUR },
  { job: "notifications.digest-tick", cadence: "hourly", staleAfterMs: 4 * HOUR },
  { job: "ambient.scout-tick", cadence: "hourly", staleAfterMs: 4 * HOUR },
  { job: "brain.assumption-watch-tick", cadence: "hourly", staleAfterMs: 4 * HOUR },
  { job: "brain.derive-tick", cadence: "hourly", staleAfterMs: 4 * HOUR },
  { job: "cron.eval-suite-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.drift-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.memory-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "brain.calibrate-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "ambient.steward-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "ambient.researcher-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "ambient.prompt-optimize-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.admin-expiry-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.retention-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.credit-tick", cadence: "daily", staleAfterMs: 26 * HOUR },
];

export async function withJobRun<T>(
  jobName: string,
  fn: () => Promise<T>,
  opts: { workspace_id?: string | null } = {},
): Promise<T> {
  const startedAt = Date.now();
  let runId: number | null = null;

  try {
    const { data } = await supabaseAdmin
      .from("job_runs")
      .insert({
        job_name: jobName,
        workspace_id: opts.workspace_id ?? null,
        status: "running",
      })
      .select("id")
      .single();
    runId = (data as { id: number } | null)?.id ?? null;
  } catch {
    // Ledger failure must not block the job itself.
  }

  // Fire start heartbeat (no-op if disabled).
  void heartbeat(jobName, "start");

  try {
    const result = await fn();
    const duration = Date.now() - startedAt;
    if (runId !== null) {
      await supabaseAdmin
        .from("job_runs")
        .update({ status: "ok", finished_at: new Date().toISOString(), duration_ms: duration })
        .eq("id", runId);
    }
    void heartbeat(jobName, "ok");
    return result;
  } catch (err) {
    const duration = Date.now() - startedAt;
    const errObj = err instanceof Error ? err : new Error(String(err));
    if (runId !== null) {
      await supabaseAdmin
        .from("job_runs")
        .update({
          status: "error",
          finished_at: new Date().toISOString(),
          duration_ms: duration,
          error_kind: errObj.name,
          error_message: errObj.message.slice(0, 2000),
        })
        .eq("id", runId);
    }
    void heartbeat(jobName, "fail");
    void captureError(errObj, { surface: `cron:${jobName}`, failure_kind: "tool_error" });
    throw err;
  }
}
