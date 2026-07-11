-- RPT-50: schedule the deterministic self-improvement tick nightly.
--
-- The self-improve-tick endpoint recomputes each workspace's quality proposals
-- (failing eval suites, over-corrected agents, losing playbooks) deterministically
-- and upserts them into self_improve_proposals. No AI, so no recurring spend.
-- Scheduling it makes the "nightly" property real for the deterministic rung, so
-- the Engine Room "What to fix" proposals refresh without a manual visit while a
-- human's acknowledged/dismissed status is preserved across recomputes.
--
-- 07:00 UTC daily (an off-peak, once-a-day cadence, matching the sibling
-- calibrate/derive daily ticks). Idempotent: unschedules the job before
-- scheduling so this migration can be re-applied safely.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'self-improve-tick';

  perform cron.schedule(
    'self-improve-tick',
    '0 7 * * *',
    format($job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) as request_id;
    $job$, base_url || '/api/public/hooks/self-improve-tick')
  );
end $$;
