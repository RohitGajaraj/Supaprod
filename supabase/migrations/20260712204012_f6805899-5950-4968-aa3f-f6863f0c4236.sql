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