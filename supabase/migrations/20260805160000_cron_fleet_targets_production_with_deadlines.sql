-- Point the whole cron fleet at the production host, and give every job back the client
-- deadline that a hand-applied repoint stripped from it.
--
-- TWO DEFECTS, ONE CAUSE. Both come from editing 37 registrations by hand over time.
--
-- 1. THE FLEET WAS CALLING THE PREVIEW HOST. Every job posted to
--    `project--<id>.lovable.app`. That host serves whatever the Lovable editor last
--    built, which is not what `deploy_project` publishes. So a backend fix could be
--    committed, deployed and verified green, and the cron fleet would still be running
--    the old code. 22 jobs were repointed to supaprod.ai by hand earlier; 14 were not.
--
-- 2. THE HAND REPOINT SILENTLY REVERTED 20260803120000. That migration gave 8 named jobs
--    a `timeout_milliseconds` above their observed worst case, because pg_net's 5s
--    default was closing the connection mid-run and leaving 6,467 rows stuck in
--    'running' forever. The repoint rewrote those commands with a compact template that
--    has no timeout argument, so 6 of the 8 went back to the 5s default:
--
--        track-tick    180000 -> NONE   (34.0s average, was 57.3% stuck)
--        goal-tick     120000 -> NONE   ( 7.1s average, was 43.5% stuck)
--        embed-tick    120000 -> NONE   ( 8.2s average, was 28.2% stuck)
--        sense-tick     60000 -> NONE   ( 5.3s average, was 18.6% stuck)
--        derive-tick    60000 -> NONE   ( 4.4s average, was 18.2% stuck)
--        resume-runs    30000 -> NONE   ( 2.8s average)
--
--    The two that kept their timeout, cadence-indexer-tick and researcher-tick, are
--    exactly the two the repoint had not reached yet. That is the tell: the loss tracks
--    the repoint, not the schedule or the workload.
--
-- WHY REBUILD RATHER THAN PATCH THE TEXT. The 36 http_post registrations had drifted
-- into five different formats: compact one-liners, spaced one-liners, and three
-- multi-line variants differing in indentation and in `SELECT` versus `select`. A
-- chained `replace()` matched only 9 of the 14 stragglers, which is how the drift was
-- found. Every job is the same call shape, so the hook name is extracted from the live
-- command and the command is regenerated from a single template. That repoints the 14,
-- restores the timeouts, and collapses five formats into one.
--
-- DEADLINES. The 8 tuned values from 20260803120000 are carried over verbatim. Every
-- other job gets a 30s floor rather than staying on the 5s default: all of them measured
-- under 2,930ms with a 0% stuck rate, so 30s is far above their worst case, and a
-- timeout only bounds how long pg_net waits. It never extends or shortens the work
-- itself, so a generous floor cannot slow anything down. It only removes the silent
-- kill.
--
-- NOT TOUCHED. `reap-stuck-job-runs` (jobid 77) is `SELECT public.reap_stuck_job_runs()`,
-- a plain SQL call with no http_post, and is excluded by the WHERE clause. Schedules are
-- carried across unchanged. Job names are unchanged, so nothing that reads cron.job by
-- name is affected.
--
-- MEASURED BEFORE WRITING, live: 37 jobs, 36 http_post + 1 reaper, 36 distinct hook
-- names across 36 jobs (so no hook is registered twice), 36 of 36 using
-- get_cron_hook_secret(), 36 of 36 posting an empty '{}' body.

DO $$
DECLARE
  j record;
  hook text;
  timeout_ms int;
  rebuilt int := 0;
BEGIN
  FOR j IN
    SELECT jobid, jobname, schedule, command
      FROM cron.job
     WHERE command ~ '/api/public/hooks/[a-z0-9-]+'
     ORDER BY jobid
  LOOP
    hook := (regexp_match(j.command, '/api/public/hooks/([a-z0-9-]+)'))[1];

    IF hook IS NULL THEN
      RAISE EXCEPTION 'could not extract hook name from cron job % (jobid %)', j.jobname, j.jobid;
    END IF;

    -- The 8 tuned deadlines from 20260803120000, keyed on job name, else a 30s floor.
    timeout_ms := CASE j.jobname
      WHEN 'track-tick'           THEN 180000
      WHEN 'goal-tick'            THEN 120000
      WHEN 'embed-tick'           THEN 120000
      WHEN 'cadence-indexer-tick' THEN 120000
      WHEN 'researcher-tick'      THEN 120000
      WHEN 'sense-tick'           THEN  60000
      WHEN 'derive-tick'          THEN  60000
      WHEN 'resume-runs'          THEN  30000
      ELSE                              30000
    END;

    PERFORM cron.alter_job(
      job_id  := j.jobid,
      command := format(
        'SELECT net.http_post(url:=%L,headers:=jsonb_build_object(''Content-Type'',''application/json'',''x-cron-key'',public.get_cron_hook_secret()),body:=''{}''::jsonb,timeout_milliseconds:=%s) AS request_id;',
        'https://supaprod.ai/api/public/hooks/' || hook,
        timeout_ms
      )
    );

    rebuilt := rebuilt + 1;
  END LOOP;

  RAISE NOTICE 'rebuilt % cron registrations onto supaprod.ai with explicit deadlines', rebuilt;
END $$;

-- Fail the migration rather than leave the fleet half converted. Each of these is a
-- property the rebuild above must hold, checked against live rows.
DO $$
DECLARE
  still_preview int;
  no_deadline int;
  wrong_host int;
BEGIN
  SELECT count(*) INTO still_preview
    FROM cron.job WHERE command LIKE '%lovable.app%';
  IF still_preview > 0 THEN
    RAISE EXCEPTION 'cron repoint incomplete: % job(s) still call the preview host', still_preview;
  END IF;

  SELECT count(*) INTO no_deadline
    FROM cron.job
   WHERE command ~ 'net\.http_post'
     AND command NOT LIKE '%timeout_milliseconds%';
  IF no_deadline > 0 THEN
    RAISE EXCEPTION 'cron deadlines incomplete: % http job(s) still on the pg_net 5s default', no_deadline;
  END IF;

  SELECT count(*) INTO wrong_host
    FROM cron.job
   WHERE command ~ 'net\.http_post'
     AND command NOT LIKE '%https://supaprod.ai/api/public/hooks/%';
  IF wrong_host > 0 THEN
    RAISE EXCEPTION 'cron repoint incorrect: % http job(s) do not target the production hook path', wrong_host;
  END IF;

  RAISE NOTICE 'verified: every http cron job targets supaprod.ai and carries an explicit deadline';
END $$;
