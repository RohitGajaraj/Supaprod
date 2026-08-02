/**
 * AFD-07: withJobRun() wraps any cron/background-job handler so every invocation
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
 * staleAfterMs is deliberately loose (2-4x supaprod) to absorb scheduler
 * jitter; a stale entry here is a real incident, not noise. Keep in sync with
 * the pg_cron registrations in supabase/migrations (grep cron.schedule).
 */
export type ExpectedJob = { job: string; supaprod: string; staleAfterMs: number };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * EIGHT JOBS WERE MISSING FROM THIS LIST UNTIL 2026-08-02, and that is the same
 * class of bug as the five dead features found the same day. Each one was
 * registered in pg_cron, wrapped in withJobRun, and writing to job_runs, and the
 * watchdog was not looking at any of them, so any of them could have stopped in
 * silence. A manifest that is incomplete is a manifest that lies by omission,
 * which is worse than no manifest, because the page says "every scheduled job is
 * running" and means "every job I happen to know about".
 *
 * The ones added: cron.embed-tick, goals.goal-tick, self-improve.tick,
 * spine.track-tick, loops.loop-tick, cron.ci-poll-tick,
 * ambient.house-rules-tick, ambient.competitor-tick.
 *
 * TWO ARE DELIBERATELY STILL ABSENT, and neither is an oversight:
 *   funnel.week2-return  wrapped in withJobRun and never registered in pg_cron.
 *                        Listing it would show it permanently late, which is
 *                        true and useless. It is a feature that has never run;
 *                        the liveness registry is the right place for that.
 *   fanout-reconcile-tick  registered in pg_cron every 2 minutes and NOT wrapped
 *                        in withJobRun, so it writes no job_runs row and this
 *                        watchdog structurally cannot see it. Wrapping it is a
 *                        one-line change in a route this lane must not touch.
 */
export const EXPECTED_JOBS: ExpectedJob[] = [
  { job: "cron.resume-runs", supaprod: "every minute", staleAfterMs: 10 * 60_000 },
  { job: "cron.delegate-poll-tick", supaprod: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "cron.approvals-tick", supaprod: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "cron.event-reactor-tick", supaprod: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "cron.ci-poll-tick", supaprod: "every 2 min", staleAfterMs: 15 * 60_000 },
  { job: "ambient.sense-tick", supaprod: "every 5 min", staleAfterMs: 20 * 60_000 },
  { job: "cron.uptime-tick", supaprod: "every 5 min", staleAfterMs: 20 * 60_000 },
  { job: "cron.cluster-tick", supaprod: "every 10 min", staleAfterMs: 40 * 60_000 },
  { job: "loops.loop-tick", supaprod: "every 10 min", staleAfterMs: 40 * 60_000 },
  { job: "spine.track-tick", supaprod: "every 10 min", staleAfterMs: 40 * 60_000 },
  { job: "cron.embed-tick", supaprod: "every 15 min", staleAfterMs: 1 * HOUR },
  { job: "goals.goal-tick", supaprod: "every 20 min", staleAfterMs: 90 * 60_000 },
  { job: "cron.trigger-tick", supaprod: "every 15 min", staleAfterMs: 1 * HOUR },
  { job: "cron.eval-tick", supaprod: "every 30 min", staleAfterMs: 2 * HOUR },
  { job: "cron.outcome-tick", supaprod: "hourly", staleAfterMs: 3 * HOUR },
  { job: "cron.indexer-tick", supaprod: "hourly", staleAfterMs: 3 * HOUR },
  { job: "notifications.digest-tick", supaprod: "hourly", staleAfterMs: 4 * HOUR },
  { job: "ambient.scout-tick", supaprod: "hourly", staleAfterMs: 4 * HOUR },
  { job: "brain.assumption-watch-tick", supaprod: "hourly", staleAfterMs: 4 * HOUR },
  { job: "brain.derive-tick", supaprod: "hourly", staleAfterMs: 4 * HOUR },
  { job: "cron.eval-suite-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.drift-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.memory-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "brain.calibrate-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "ambient.steward-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "ambient.researcher-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "ambient.prompt-optimize-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "ambient.retro-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.admin-expiry-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.retention-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "cron.credit-tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "self-improve.tick", supaprod: "daily", staleAfterMs: 26 * HOUR },
  { job: "ambient.house-rules-tick", supaprod: "weekly, Monday", staleAfterMs: 8 * DAY },
  { job: "ambient.competitor-tick", supaprod: "weekly, Monday", staleAfterMs: 8 * DAY },
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
