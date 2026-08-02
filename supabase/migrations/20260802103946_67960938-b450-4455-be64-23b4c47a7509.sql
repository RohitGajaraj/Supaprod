CREATE INDEX IF NOT EXISTS signals_embedding_hnsw
  ON public.signals USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS signals_embedding_backfill_queue_idx
  ON public.signals (created_at)
  WHERE embedding IS NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'embed-tick';
  PERFORM cron.schedule(
    'embed-tick',
    '*/15 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/embed-tick')
  );
END $$;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260802160000', 'signal_embedding_sweeper')
ON CONFLICT (version) DO NOTHING;