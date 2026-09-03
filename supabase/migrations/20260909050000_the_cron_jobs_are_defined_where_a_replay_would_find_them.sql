-- THE CRON JOBS ARE DEFINED WHERE A REPLAY WOULD FIND THEM (P-38, A-QUEUE.md).
--
-- Every tick's ORIGINAL migration (2026-06/07) schedules it against
-- `https://project--<id>.lovable.app`, the preview host, with no explicit
-- `timeout_milliseconds` -- so pg_net's 5-second default applies. The live
-- `cron.job` table has read `https://supaprod.ai/...` with an explicit
-- deadline since 20260806031833's rebuild, which works today ONLY because
-- it is a DYNAMIC migration: it reads whatever rows already exist in
-- `cron.job` at the moment it runs and rewrites them. On a full replay from
-- an empty database that is still correct by luck of ordering (every
-- per-job migration is dated before 08-06), but nothing after this point
-- DEFINES a job by name against the right host. A migration written today
-- that touches one tick job -- adds a column its handler reads, changes its
-- schedule -- has nowhere correct to copy the `cron.schedule(...)` call
-- from, and copying the nearest example (any of the July migrations) would
-- silently re-point that job at the stale preview host again.
--
-- So this is the one place every tick job is defined, by name, against the
-- real host and an explicit deadline, matching `cron.job` as read on
-- production 2026-09-03 exactly (jobid, schedule, timeout -- all confirmed
-- via the Lovable MCP `query_database` tool). Idempotent: `cron.unschedule`
-- then `cron.schedule` by name, the same two-step this repo's own migrations
-- already use (`20260702202247...`), rather than trusting a name-based
-- upsert this pg_cron version may not have.
--
-- `reap-stuck-job-runs` is not a tick: it calls a plain SQL function, no
-- `net.http_post`, so it carries no host or timeout to get wrong. Listed
-- here anyway because "one migration defines the cron jobs" means all of
-- them, not just the HTTP ones.

DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT * FROM (VALUES
      ('admin-expiry-tick',       '15 2 * * *',   'admin-expiry-tick',       30000),
      ('approvals-tick',         '* * * * *',     'approvals-tick',          30000),
      ('assumption-watch-tick',  '0 */4 * * *',   'assumption-watch-tick',   30000),
      ('cadence-drift-tick',     '0 4 * * *',     'drift-tick',              30000),
      ('cadence-eval-suite-tick','0 3 * * *',     'eval-suite-tick',         30000),
      ('cadence-eval-tick',      '*/30 * * * *',  'eval-tick',               30000),
      ('cadence-indexer-tick',   '7 * * * *',     'indexer-tick',           120000),
      ('calibrate-tick',         '0 */6 * * *',   'calibrate-tick',          30000),
      ('ci-poll-tick',           '*/2 * * * *',   'ci-poll-tick',            30000),
      ('cluster-tick',           '*/10 * * * *',  'cluster-tick',            30000),
      ('competitor-tick',        '0 8 * * 1',     'competitor-tick',         30000),
      ('credit-tick',            '20 2 * * *',    'credit-tick',             30000),
      ('delegate-poll-tick',     '*/5 * * * *',   'delegate-poll-tick',      30000),
      ('derive-tick',            '0 */2 * * *',   'derive-tick',             60000),
      ('digest-tick',            '0 * * * *',     'digest-tick',             30000),
      ('embed-tick',             '*/15 * * * *',  'embed-tick',             120000),
      ('event-reactor-tick',     '* * * * *',     'event-reactor-tick',      30000),
      ('fanout-reconcile-tick',  '*/2 * * * *',   'fanout-reconcile-tick',   30000),
      ('goal-tick',              '*/20 * * * *',  'goal-tick',              120000),
      ('house-rules-tick',       '0 10 * * 1',    'house-rules-tick',        30000),
      ('liveness-tick',          '20 6 * * *',    'liveness-tick',           30000),
      ('loop-tick',              '*/10 * * * *',  'loop-tick',               30000),
      ('memory-tick-daily',      '30 3 * * *',    'memory-tick',             30000),
      ('outcome-tick',           '0 * * * *',     'outcome-tick',            30000),
      ('prompt-optimize-tick',   '0 10 * * 2',    'prompt-optimize-tick',    30000),
      ('researcher-tick',        '0 7 * * *',     'researcher-tick',        120000),
      ('resume-runs',            '* * * * *',     'resume-runs',             30000),
      ('retention-tick',         '45 2 * * *',    'retention-tick',          30000),
      ('retro-tick',             '0 9 * * *',     'retro-tick',              30000),
      ('scout-tick',             '0 * * * *',     'scout-tick',              30000),
      ('self-improve-tick',      '0 7 * * *',     'self-improve-tick',       30000),
      ('sense-tick',             '*/5 * * * *',   'sense-tick',              60000),
      ('steward-tick',           '0 9 * * *',     'steward-tick',            30000),
      ('track-tick',             '*/10 * * * *',  'track-tick',             180000),
      ('trigger-tick',           '*/15 * * * *',  'trigger-tick',            30000),
      ('uptime-tick',            '*/5 * * * *',   'uptime-tick',             30000)
    ) AS t(jobname, schedule, hook, timeout_ms)
  LOOP
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = j.jobname;
    PERFORM cron.schedule(
      j.jobname,
      j.schedule,
      format(
        'SELECT net.http_post(url:=%L,headers:=jsonb_build_object(''Content-Type'',''application/json'',''x-cron-key'',public.get_cron_hook_secret()),body:=''{}''::jsonb,timeout_milliseconds:=%s) AS request_id;',
        'https://supaprod.ai/api/public/hooks/' || j.hook,
        j.timeout_ms
      )
    );
  END LOOP;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'reap-stuck-job-runs';
  PERFORM cron.schedule(
    'reap-stuck-job-runs',
    '*/15 * * * *',
    'SELECT public.reap_stuck_job_runs();'
  );
END $$;

-- SAME GUARD THE 08-06 REBUILD CARRIED, kept alongside its own successor: a
-- migration that silently leaves a job on the wrong host is worse than one
-- that fails loudly at apply time.
DO $$
DECLARE
  still_preview int;
  no_deadline int;
  wrong_host int;
BEGIN
  SELECT count(*) INTO still_preview FROM cron.job WHERE command LIKE '%lovable.app%';
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
END $$;
