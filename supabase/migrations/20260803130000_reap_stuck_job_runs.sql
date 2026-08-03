-- Make a killed cron run visible, instead of leaving it looking like a healthy one.
--
-- THE PROBLEM. `job_runs` holds, across all history, exactly two statuses: ok 181,914
-- and running 6,467. Zero 'error'. Zero 'timeout'. Those 6,467 are the ENTIRE failure
-- record of the cron fleet, and none of them says it failed. A run killed mid-flight
-- (see 20260803120000_cron_http_client_timeouts.sql for the cause) leaves `withJobRun`
-- unable to write any terminal status, because a torn-down Cloudflare IoContext runs no
-- JavaScript, so the row simply stays 'running' forever.
--
-- The consequence is worse than a missing metric: a stuck row reads as FRESH. The admin
-- watchdog in `observability.functions.ts` takes the most recent `started_at` for a job
-- with no status filter, so a job whose every run has been killed for a day reports
-- stale=false. That is why embed-tick could die for 21 hours with nothing complaining.
-- `liveness/probe.ts` already gets this right by filtering status='ok', so the two health
-- surfaces have been disagreeing.
--
-- WHY THIS RUNS IN SQL ON pg_cron, AND NOT AS ANOTHER TICK. This is the load-bearing
-- design choice. Every other tick is an HTTP call into a Cloudflare Worker, which is
-- precisely the mechanism that produces the stuck rows in the first place. A watchdog
-- implemented that way could be killed by the exact failure it exists to detect, and
-- would then leave a stuck row of its own. This runs entirely inside Postgres: no
-- net.http_post, no Worker, no request context to tear down. The detector cannot die of
-- the disease.
--
-- WHY 30 MINUTES. It must never mislabel a genuinely long run. The slowest job in the
-- fleet averages 34 seconds and now carries a 180 second client timeout, so nothing
-- legitimate survives past three minutes. Thirty is an order of magnitude of headroom,
-- chosen so that a false 'timeout' is effectively impossible and the only cost of the
-- generosity is that a dead run takes up to half an hour to be named.
--
-- duration_ms IS DELIBERATELY LEFT NULL on a reaped row. We do not know when the run
-- actually died, only when we noticed. Writing the elapsed wall time would assert the
-- job ran for thirty minutes, which is false and would poison the duration averages that
-- diagnosed the timeout bug in the first place. An honest null beats a plausible number.

CREATE OR REPLACE FUNCTION public.reap_stuck_job_runs(older_than interval DEFAULT '30 minutes')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reaped integer;
BEGIN
  UPDATE public.job_runs
     SET status = 'timeout',
         finished_at = now(),
         error_kind = 'RunNeverFinished',
         error_message = 'No terminal status was ever written. The run was killed before '
                      || 'it could report, so the elapsed time is unknown and duration_ms '
                      || 'is deliberately left null. Reaped by reap_stuck_job_runs after '
                      || older_than::text || '.'
   WHERE status = 'running'
     AND started_at < now() - older_than;
  GET DIAGNOSTICS reaped = ROW_COUNT;
  RETURN reaped;
END $$;

REVOKE EXECUTE ON FUNCTION public.reap_stuck_job_runs(interval) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reap_stuck_job_runs(interval) TO service_role;

-- Every 15 minutes, in-database. No HTTP, so nothing to disconnect.
DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'reap-stuck-job-runs';
  PERFORM cron.schedule(
    'reap-stuck-job-runs',
    '*/15 * * * *',
    $job$ SELECT public.reap_stuck_job_runs(); $job$
  );
END $$;

-- Name the existing backlog once, so the fleet's failure history stops reading as
-- 181,914 successes and nothing else.
SELECT public.reap_stuck_job_runs('30 minutes');

-- Guard: no run older than an hour may still claim to be running.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.job_runs
   WHERE status = 'running' AND started_at < now() - interval '1 hour';
  IF n > 0 THEN
    RAISE EXCEPTION 'reap left % job_runs rows still stuck at running', n;
  END IF;
END $$;
