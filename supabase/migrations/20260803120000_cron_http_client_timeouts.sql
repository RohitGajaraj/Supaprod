-- Stop the cron fleet from being killed mid-run: give pg_net a client deadline that
-- outlasts the work it is waiting for.
--
-- THE CAUSE. `net.http_post(url text, body jsonb, params jsonb, headers jsonb,
-- timeout_milliseconds integer DEFAULT 5000)`. Not one of the 36 cron registrations in
-- this repo has ever passed `timeout_milliseconds` (grep across all 412 migrations
-- returns nothing), so every job runs on the 5 second default. Any job that takes
-- longer than 5s has its connection closed by pg_net while the Worker is still running.
-- Cloudflare then tears down the request context of a client that is no longer there,
-- at a non-deterministic point after the disconnect. When the teardown wins the race,
-- execution simply stops: `withJobRun`'s `await fn()` neither returns nor throws, so
-- neither the status='ok' write (observability/jobs.ts:121-125) nor the status='error'
-- write (:132-141) ever runs, and the row stays 'running' forever. A `finally` would not
-- help; a torn-down IoContext runs no JavaScript at all.
--
-- THE EVIDENCE IS A DOSE-RESPONSE CURVE, which is why this is the cause and not a
-- coincidence. Stuck rate over 24h against average duration, live from job_runs:
--
--     track-tick     34,029ms   57.3% stuck
--     goal-tick       7,073ms   43.5%
--     embed-tick      8,179ms   28.2%
--     sense-tick      5,268ms   18.6%
--     derive-tick     4,442ms   18.2%
--     indexer-tick    7,347ms   10.0%
--     resume-runs     2,830ms    0.8%
--     all 25 remaining jobs, every one under 2,930ms:  0.0%
--
-- Monotone in duration, with the break exactly where the 5,000ms line predicts, and not
-- a single stuck run among the two dozen jobs that finish inside it. Corroborating:
-- `net._http_response` has never held an embed-tick response body despite 18 status='ok'
-- runs inside its retention window, so the client is always gone before the reply.
--
-- IT IS NOT A SUBREQUEST OR CPU LIMIT. The single heaviest embed-tick run in history
-- (16,382ms, 374+ subrequests) returned 'ok', while a run doing far less work died at
-- roughly +5s. Work volume is not the discriminator; elapsed time past the disconnect is.
--
-- SCALE. job_runs holds ok 181,914 and running 6,467, with zero 'error' and zero
-- 'timeout' rows in all of history. Those 6,467 are the entire failure record of the
-- cron fleet, and they are silent: `observability.functions.ts:146-152` computes
-- staleness from `started_at` with no status filter, so a job whose every run has been
-- killed for a day still reports healthy. Making runs finish is what makes that honest.
--
-- WHY REBUILT RATHER THAN STRING-PATCHED. Every one of these commands is the same
-- template, so the URL is extracted from the live command and the command is rebuilt
-- from that template with the timeout added. No blind `replace()` on SQL text, and the
-- schedule is carried across untouched.
--
-- TIMEOUTS are set comfortably above each job's observed worst case, not just its
-- average. resume-runs gets a smaller one because it fires every minute and there is no
-- reason to hold a request slot for longer than it could ever need.
--
-- NOT FIXED HERE, and tracked: a run killed by any other cause still leaves a 'running'
-- row rather than the 'timeout' the CHECK constraint has always permitted
-- (`job_runs_status_check` allows running/ok/error/timeout; nothing has ever written the
-- last two). A reaper that ages stuck rows into 'timeout', plus a status filter in the
-- admin staleness read, are the remaining half of this and belong in their own change.

DO $$
DECLARE
  j record;
  target record;
  new_url text;
  updated int := 0;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('track-tick',      180000),  -- 34s average, the slowest job in the fleet
      ('goal-tick',       120000),
      ('embed-tick',      120000),
      ('cadence-indexer-tick', 120000),
      ('researcher-tick', 120000),  -- 100% stuck, no duration ever recorded
      ('sense-tick',       60000),
      ('derive-tick',      60000),
      ('resume-runs',      30000)   -- fires every minute; 2.8s average
    ) AS t(jobname, timeout_ms)
  LOOP
    SELECT jobname, schedule, command INTO j
      FROM cron.job
      WHERE jobname = target.jobname AND command LIKE '%net.http_post%';

    IF j.jobname IS NULL THEN
      RAISE NOTICE 'cron job % not found, skipping', target.jobname;
      CONTINUE;
    END IF;

    new_url := (regexp_match(j.command, 'url\s*:=\s*''([^'']+)'''))[1];
    IF new_url IS NULL THEN
      RAISE EXCEPTION 'could not extract url from cron job %', target.jobname;
    END IF;

    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = target.jobname;
    PERFORM cron.schedule(
      target.jobname,
      j.schedule,
      format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := %s
      ) AS request_id;
    $job$, new_url, target.timeout_ms)
    );
    updated := updated + 1;
  END LOOP;

  RAISE NOTICE 'cron http timeouts applied to % jobs', updated;
END $$;

-- Guard: every job that was meant to get a deadline must now carry one, so a partial
-- apply cannot pass for a successful one.
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(jobname, ', ') INTO missing
    FROM cron.job
    WHERE jobname IN ('track-tick','goal-tick','embed-tick','cadence-indexer-tick',
                      'researcher-tick','sense-tick','derive-tick','resume-runs')
      AND command NOT LIKE '%timeout_milliseconds%';
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'these cron jobs still have no client timeout: %', missing;
  END IF;
END $$;
