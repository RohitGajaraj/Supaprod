-- RF-07: schedules prompt-optimize-tick (Tuesday 10:00 UTC, a day after
-- house-rules-tick's Monday slot), the weekly steward pass that mines graded
-- eval-suite failures into draft prompt-version revisions
-- (prompt-optimization.functions.ts). No new table: it writes into the
-- existing prompt_versions table (status='draft'), reviewed via the existing
-- Prompt Studio UI (Settings > Prompts). Idempotent unschedule-then-schedule,
-- same pattern as the RF-04 cron registration.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'prompt-optimize-tick';
  PERFORM cron.schedule(
    'prompt-optimize-tick',
    '0 10 * * 2',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/prompt-optimize-tick')
  );
END $$;
