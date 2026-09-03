-- P-58 (A-QUEUE.md). Hosting finding, measured 2026-09-04: the root answered
-- in 2.3s and a missing route in 3.9s after ten minutes idle; warm, the same
-- reads are under 400ms. The Worker's isolate cools between visitors and the
-- first person after a gap pays for spinning it back up.
--
-- `/health` (src/routes/health.ts) is the keep-warm target, and it is
-- DELIBERATELY NOT `/api/public/hooks/*`: every job in 20260909050000 calls a
-- tick that does real work and is authenticated with the cron key, because a
-- stranger triggering `net.http_post` against it would spend a model call or
-- write a row. This route does neither -- it imports nothing that reaches a
-- database -- so it carries no secret and needs none, matching the same
-- public+unauthenticated stance `/api/public/health` already takes ("monitors
-- do not auth", that route's own header). `net.http_get`, not `http_post`,
-- because the route only defines a GET handler and a health ping is a read.
--
-- Reserves the route's own first URL segment in the same migration, which
-- reserved-workspace-slugs.test.ts requires in the commit that adds any new
-- top-level route (20260902020000 is the same shape for /arriving,
-- /outcomes).

insert into public.reserved_workspace_slugs (slug, reason)
values
  ('health', 'route')
on conflict (slug) do nothing;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'health-warm-tick';
  PERFORM cron.schedule(
    'health-warm-tick',
    '*/4 * * * *',
    $sql$
      SELECT net.http_get(
        url := 'https://supaprod.ai/health',
        timeout_milliseconds := 10000
      ) AS request_id;
    $sql$
  );
END $$;

-- SAME GUARD SHAPE 20260909050000 CARRIES: a migration that silently leaves
-- the job on the wrong host, with no deadline, or missing entirely is worse
-- than one that fails loudly at apply time.
DO $$
DECLARE
  missing int;
  wrong_host int;
  no_deadline int;
BEGIN
  SELECT count(*) INTO missing FROM cron.job WHERE jobname = 'health-warm-tick';
  IF missing = 0 THEN
    RAISE EXCEPTION 'health-warm-tick did not schedule';
  END IF;

  SELECT count(*) INTO wrong_host
    FROM cron.job
   WHERE jobname = 'health-warm-tick'
     AND command NOT LIKE '%https://supaprod.ai/health%';
  IF wrong_host > 0 THEN
    RAISE EXCEPTION 'health-warm-tick does not target the production /health route';
  END IF;

  SELECT count(*) INTO no_deadline
    FROM cron.job
   WHERE jobname = 'health-warm-tick'
     AND command NOT LIKE '%timeout_milliseconds%';
  IF no_deadline > 0 THEN
    RAISE EXCEPTION 'health-warm-tick has no explicit timeout, so pg_net''s 5s default applies';
  END IF;
END $$;
