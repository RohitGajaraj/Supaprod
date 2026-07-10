-- PC-12: schedule fanout-reconcile-tick every 2 minutes.
-- Without this, fanout_batches rows never leave 'pending' -- the
-- reconciler endpoint exists (fanout-reconcile-tick.ts) but nothing calls
-- it. Cadence matches ci-poll-tick (*/2), the fastest of the sibling
-- polling ticks, since a user waiting on "explore this from all sides"
-- is watching for the composite review card to go ready.
--
-- Idempotent: unschedules 'fanout-reconcile-tick' before scheduling so this
-- migration can be re-applied safely.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'fanout-reconcile-tick';

  PERFORM cron.schedule(
    'fanout-reconcile-tick',
    '*/2 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/fanout-reconcile-tick')
  );
END $$;
