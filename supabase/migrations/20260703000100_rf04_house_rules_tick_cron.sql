-- RF-04: schedules house-rules-tick (Monday 10:00 UTC, distinct from
-- competitor-tick 08:00 and steward-tick's daily 09:00), the weekly steward
-- pass that clusters validated learnings into draft house rules.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'house-rules-tick';
  PERFORM cron.schedule(
    'house-rules-tick',
    '0 10 * * 1',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/house-rules-tick')
  );
END $$;
