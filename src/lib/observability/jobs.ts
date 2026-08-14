/**
 * AFD-07: withJobRun() wraps any cron/background-job handler so every invocation
 * appears in the `job_runs` ledger. Also pings the matching Better Stack heartbeat.
 *
 * Usage in a cron route handler:
 *
 *   return withJobRunHttp("ambient.sense-tick", async () => { ... real work ... });
 *
 * THE LIE THIS FILE TOLD UNTIL 2026-08-14, and it is the reason every other
 * background-job failure was invisible: withJobRun wrote status='ok' whenever its
 * callback RESOLVED and status='error' only when it THREW. At least twelve tick
 * handlers answer a failure with `return json({...}, 500)` from inside that
 * callback, and returning a Response is resolving. So a tick that failed on every
 * single invocation wrote an unbroken run of 'ok' rows into `job_runs` on
 * schedule, and the external Better Stack heartbeat was pinged 'ok' on the same
 * branch. EXPECTED_JOBS below only checks RECENCY, and the rows were arriving on
 * time, so the watchdog was satisfied by a job that had never once done its work.
 *
 * Two fixes, and the second is the durable one:
 *   1. Every tick now THROWS on failure, so the intent is legible at the throw
 *      site. `withJobRunHttp` converts that throw back into the JSON 500 the
 *      handler used to return, OUTSIDE the ledger wrapper, so pg_cron still gets
 *      a non-2xx answer with a readable body.
 *   2. withJobRun no longer takes a resolved value at face value. A returned
 *      Response with a non-2xx status IS a failure and is recorded as one. That
 *      half needs no cooperation from the tick author, so the next tick someone
 *      writes cannot reintroduce the lie by forgetting rule 1.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { heartbeat } from "./uptime";
import { captureError, recordErrorEvent } from "./errors";

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
 *   fanout-reconcile-tick  WAS the exception and is no longer. It was registered
 *                        in pg_cron every 2 minutes and not wrapped in
 *                        withJobRun, so it wrote no job_runs row and this
 *                        watchdog structurally could not see it. Wrapped on
 *                        2026-08-02 and listed below, so the manifest now covers
 *                        every scheduled job that reports.
 */
export const EXPECTED_JOBS: ExpectedJob[] = [
  { job: "cron.resume-runs", supaprod: "every minute", staleAfterMs: 10 * 60_000 },
  { job: "cron.delegate-poll-tick", supaprod: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "cron.approvals-tick", supaprod: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "cron.event-reactor-tick", supaprod: "every minute", staleAfterMs: 15 * 60_000 },
  { job: "cron.ci-poll-tick", supaprod: "every 2 min", staleAfterMs: 15 * 60_000 },
  { job: "fanout.reconcile-tick", supaprod: "every 2 min", staleAfterMs: 15 * 60_000 },
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

/**
 * The narrow structural surface withJobRun uses of the admin client, so a test
 * can drive the ledger without env vars or a network. Same reason and shape as
 * `ErrorEventsClient` in errors.ts (which cites the recordStageEvent precedent).
 */
interface JobRunsClient {
  from(table: string): {
    insert(values: Record<string, unknown>): {
      select(columns: string): {
        single(): PromiseLike<{
          data: { id: number } | null;
          error: { message: string } | null;
        }>;
      };
    };
    update(values: Record<string, unknown>): {
      eq(column: string, value: unknown): PromiseLike<{ error: { message: string } | null }>;
    };
  };
}

export type JobRunOptions = {
  workspace_id?: string | null;
  /** Test-injectable ledger client. Production passes nothing. */
  client?: unknown;
};

/** `job_runs.error_message` is capped at 2000 chars, so a failing body gets 500
 *  of them: enough to name the failure, with room left for the prefix. */
const RESPONSE_BODY_CAP = 500;
const ERROR_MESSAGE_CAP = 2_000;

/**
 * Classify a value the callback RESOLVED with. Returns an Error when that value
 * is really a failure, null when it is really a success.
 *
 * A Response carrying a non-2xx status is a failure no matter how it was
 * produced. This is the check that makes the fix survive the next tick author:
 * they can forget to throw, and the ledger will still say 'error'.
 */
async function failureFromResult(jobName: string, result: unknown): Promise<Error | null> {
  if (!(result instanceof Response) || result.ok) return null;
  // clone() first. Reading a body consumes the stream, and the caller still has
  // to hand this exact Response back to pg_cron.
  let body = "";
  try {
    body = (await result.clone().text()).slice(0, RESPONSE_BODY_CAP);
  } catch {
    // A body that cannot be re-read costs nothing here: the status alone already
    // proves the failure, and the status is what the ledger verdict turns on.
  }
  const err = new Error(`${jobName} answered HTTP ${result.status}${body ? `: ${body}` : ""}`);
  err.name = "JobHttpFailure";
  return err;
}

/**
 * Persist a job failure to the always-on error floor.
 *
 * When a client was injected it drives this write too: `error_events` lives in
 * the same database as `job_runs`, so one injected client covers both and a test
 * never reaches for the real admin client. Production injects nothing and gets
 * captureError, which is the floor plus the (key-gated) vendor envelope.
 */
function noteJobFailure(err: unknown, jobName: string, failureKind: string, client: unknown): void {
  const ctx = { surface: `cron:${jobName}`, failure_kind: failureKind };
  if (client) void recordErrorEvent(err, ctx, { client });
  else void captureError(err, ctx);
}

export async function withJobRun<T>(
  jobName: string,
  fn: () => Promise<T>,
  opts: JobRunOptions = {},
): Promise<T> {
  const db = (opts.client ?? supabaseAdmin) as unknown as JobRunsClient;
  const startedAt = Date.now();
  let runId: number | null = null;

  try {
    const { data, error } = await db
      .from("job_runs")
      .insert({
        job_name: jobName,
        workspace_id: opts.workspace_id ?? null,
        status: "running",
      })
      .select("id")
      .single();
    // supabase-js RESOLVES a refused write as { data: null, error } rather than
    // throwing, so the try/catch that used to guard this line never once saw an
    // RLS denial, a revoked grant, or a missing table. The error object has to
    // be inspected by hand.
    if (error) throw new Error(`job_runs insert failed: ${error.message}`);
    runId = data?.id ?? null;
    if (runId === null) throw new Error("job_runs insert returned no id");
  } catch (e) {
    // This used to be an empty catch, and it erased the whole invocation: runId
    // stayed null, so neither branch below could write anything, and the
    // watchdog read the resulting silence as "this job has not run yet" rather
    // than "this job cannot write to its own ledger". A ledger failure still
    // must not block the work, so the job goes ahead -- but it goes ahead on the
    // record instead of off it.
    noteJobFailure(e, jobName, "db_error", opts.client);
  }

  // Fire start heartbeat (no-op if disabled).
  void heartbeat(jobName, "start");

  const finish = async (patch: Record<string, unknown>): Promise<void> => {
    if (runId === null) return;
    const { error } = await db
      .from("job_runs")
      .update({
        ...patch,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
      })
      .eq("id", runId);
    // A dropped terminal update leaves the row stuck at 'running' forever, which
    // reads on the health page as a job still in flight rather than one whose
    // verdict was lost. Same class of silence as the insert above.
    if (error) {
      noteJobFailure(
        new Error(`job_runs update failed: ${error.message}`),
        jobName,
        "db_error",
        opts.client,
      );
    }
  };

  const recordFailure = async (errObj: Error, failureKind: string): Promise<void> => {
    await finish({
      status: "error",
      error_kind: errObj.name,
      error_message: errObj.message.slice(0, ERROR_MESSAGE_CAP),
    });
    void heartbeat(jobName, "fail");
    noteJobFailure(errObj, jobName, failureKind, opts.client);
  };

  try {
    const result = await fn();
    const httpFailure = await failureFromResult(jobName, result);
    if (httpFailure) {
      await recordFailure(httpFailure, "tool_error");
      // Returned, NOT rethrown. The handler built this Response deliberately and
      // pg_cron must still receive it unchanged, status and body alike. The only
      // thing this branch changes is the ledger's verdict, and it changes it
      // from a lie to the truth.
      return result;
    }
    await finish({ status: "ok" });
    void heartbeat(jobName, "ok");
    return result;
  } catch (err) {
    const errObj = err instanceof Error ? err : new Error(String(err));
    await recordFailure(errObj, "tool_error");
    throw err;
  }
}

/**
 * Route-handler form of withJobRun, and the shape every tick in
 * src/routes/api/public/hooks should use.
 *
 * The callback THROWS on failure, so withJobRun records status='error' and fires
 * the 'fail' heartbeat. The throw is then converted here, OUTSIDE the ledger
 * wrapper, into the same JSON 500 the handler used to return from inside it.
 * Both properties the caller depends on stay true at once: `job_runs` says
 * 'error', AND the HTTP answer pg_cron receives is non-2xx with a readable body.
 *
 * Returning `json({ ok: false }, 500)` from inside the callback still works and
 * is still recorded correctly (withJobRun inspects the Response), but throwing
 * is the form to write: it carries a stack into `error_events`, and it cannot be
 * mistaken for a success by anything reading the code.
 */
export async function withJobRunHttp(
  jobName: string,
  fn: () => Promise<Response>,
  opts: JobRunOptions = {},
): Promise<Response> {
  try {
    return await withJobRun(jobName, fn, opts);
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
