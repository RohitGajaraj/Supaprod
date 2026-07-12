-- RPT-39: schedule the nightly retro pass.
--
-- The retro-tick endpoint reads each workspace's trailing-week agent execution
-- traces and drafts 'pending' house-rule proposals from recurring operational
-- patterns (review-gated; nothing auto-applies). Scheduling it makes the
-- "nightly" property real so the reviewable proposals refresh without a manual
-- visit, while a human's approve/reject decision is preserved across passes.
--
-- 09:00 UTC daily: an off-peak, once-a-day slot deliberately distinct from the
-- sibling steward ticks (self-improve 07:00, house-rules Monday 10:00, prompt-
-- optimize Tuesday 10:00) so they never contend. Idempotent: unschedules the
-- job before scheduling so this migration can be re-applied safely. The route's
-- own per-day guard makes a same-day double-fire a no-op regardless.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'retro-tick';

  perform cron.schedule(
    'retro-tick',
    '0 9 * * *',
    format($job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) as request_id;
    $job$, base_url || '/api/public/hooks/retro-tick')
  );
end $$;
