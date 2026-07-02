-- RF-08 (v12 audit §2.4, defect 1): drift-tick, eval-suite-tick, and
-- indexer-tick were registered (20260522004734) against the OLD project URL
-- with an `apikey` header. requireHookCaller (-_auth.server.ts) only accepts
-- `x-cron-key` or a Bearer token matched against get_cron_hook_secret(), so
-- every invocation of these three jobs has 401'd since the URL/auth style
-- changed — scheduled drift detection, scheduled eval suites, and hourly RAG
-- indexing are presumptively dead in prod. Re-registers all three against the
-- current project URL and the x-cron-key/get_cron_hook_secret() pattern
-- (20260626061818's resume-runs/steward-tick/researcher-tick precedent),
-- keeping each job's original name, route, and schedule.
--
-- Also schedules `eval-tick` (defect 5): implemented in
-- src/routes/api/public/hooks/eval-tick.ts (a per-event LLM judge over
-- recent ai_events) but never registered in any cron migration, so it has
-- never run. Distinct from eval-suite-tick (a once-daily full eval-suite
-- run); eval-tick judges individual events continuously, so it gets its own
-- more frequent schedule rather than folding into eval-suite-tick's daily run.
DO $$
DECLARE base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cadence-indexer-tick';
  PERFORM cron.schedule('cadence-indexer-tick', '7 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/indexer-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cadence-eval-suite-tick';
  PERFORM cron.schedule('cadence-eval-suite-tick', '0 3 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/eval-suite-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cadence-drift-tick';
  PERFORM cron.schedule('cadence-drift-tick', '0 4 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/drift-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cadence-eval-tick';
  PERFORM cron.schedule('cadence-eval-tick', '*/30 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/eval-tick'));
END $$;
