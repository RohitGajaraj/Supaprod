-- Register the feature-liveness sweep.
--
-- WHY THIS EXISTS AT ALL. In one session, five separately shipped features were
-- found to be doing nothing in production, and every one of them passed
-- typecheck, passed tests, and carried a plausible commit message: signals had
-- no embeddings so semantic search always returned zero; theme growth could not
-- attach a signal because no theme had a vector; the knowledge graph could not
-- name or focus a `learning`; human-curated memories were 100 percent
-- unembedded and therefore unreachable by recall; and the in-product pulse
-- widget had recorded nothing at all. Nothing in the product could tell anyone
-- that any of it was dead.
--
-- The sweep answers one question per capability, daily: has this executed in
-- production, when last, and is that abnormal for its own cadence. It also runs
-- two checks aimed at the exact shapes that bit us: a column that is READ and
-- never WRITTEN, and a value the database holds that no code vocabulary
-- declares.
--
-- 06:20 UTC, deliberately off the hour. The hourly and quarter-hourly ticks
-- cluster at :00 and :07 and :15, and a report that competes with the work it is
-- measuring is a report that measures a busy database.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'liveness-tick';
  PERFORM cron.schedule(
    'liveness-tick',
    '20 6 * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/liveness-tick')
  );
END $$;
