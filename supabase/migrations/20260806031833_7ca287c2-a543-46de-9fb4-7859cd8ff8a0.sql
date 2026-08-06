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