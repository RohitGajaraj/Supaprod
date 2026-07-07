-- SW-6 (mission 3.12, production config truth): every cron the code expects is
-- registered by migration, idempotently. This closes the delegate-poll-tick
-- incident class findings from the SW-6 audit:
--
--   1. event-reactor-tick + approvals-tick + memory-tick-daily were scheduled
--      by 20260620150512, then unscheduled by BOTH 20260625000000 and
--      20260625094923 (which re-added only sense-tick + trigger-tick), and
--      never restored. Without event-reactor-tick nothing drains event_queue,
--      so the seeded signal.created -> discovery-scout auto pipeline is dead
--      for every fresh workspace (cold-start blocker).
--   2. cluster-tick was NEVER registered by any migration (only a commented
--      placeholder in 20260618140000) while auto_cluster_enabled now defaults
--      ON (20260707021900): the "first clustered signal set" has no driver.
--   3. outcome-tick's only registration (20260611161500) sends the dead
--      'apikey' header style; requireHookCaller accepts only x-cron-key or
--      Bearer, so every invocation has 401'd since. Same class RF-08
--      (20260702235000) fixed for indexer/eval-suite/drift/eval, but
--      outcome-tick was missed.
--   4. admin-expiry-tick (docs claim nightly), retention-tick and credit-tick
--      have hooks but no scheduler; their in-hook flag gates make scheduling
--      safe (they no-op until their flags are on).
--
-- Ordering note: 20260707195000_sw6_fresh_workspace_guards.sql binds default
-- spend caps BEFORE this file arms the automatic pipeline. Keep it that way.

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN (
    'approvals-tick', 'event-reactor-tick', 'memory-tick-daily',
    'cluster-tick', 'outcome-tick', 'admin-expiry-tick',
    'retention-tick', 'credit-tick'
  );

  -- Restored originals (cadences from 20260620150512)
  PERFORM cron.schedule('approvals-tick', '* * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{"source":"pg_cron"}'::jsonb) AS request_id;$job$,
      base_url || '/api/public/hooks/approvals-tick'));

  PERFORM cron.schedule('event-reactor-tick', '* * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$,
      base_url || '/api/public/hooks/event-reactor-tick'));

  PERFORM cron.schedule('memory-tick-daily', '30 3 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$,
      base_url || '/api/public/hooks/memory-tick'));

  -- First-time registrations
  PERFORM cron.schedule('cluster-tick', '*/10 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$,
      base_url || '/api/public/hooks/cluster-tick'));

  PERFORM cron.schedule('admin-expiry-tick', '15 2 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$,
      base_url || '/api/public/hooks/admin-expiry-tick'));

  PERFORM cron.schedule('retention-tick', '45 2 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$,
      base_url || '/api/public/hooks/retention-tick'));

  PERFORM cron.schedule('credit-tick', '20 2 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$,
      base_url || '/api/public/hooks/credit-tick'));

  -- Re-registration with live auth (kills the 401-forever apikey style)
  PERFORM cron.schedule('outcome-tick', '0 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$,
      base_url || '/api/public/hooks/outcome-tick'));
END $$;
