-- JNY-01: the strategy head — weekly competitor + tech-shift briefs.
-- Schedules competitor-tick (Monday 08:00 UTC): synthesizes the week's
-- scout_competitor / scout_platform signals into one brief per kind and
-- links every contributing signal into artifact_lineage. No new tables or
-- columns; reads what scout-tick already writes.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'competitor-tick';
  PERFORM cron.schedule(
    'competitor-tick',
    '0 8 * * 1',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/competitor-tick')
  );
END $$;
