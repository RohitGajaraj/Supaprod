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