-- Signal embeddings: make `signals.embedding` real.
--
-- The column has existed since the first signals migration (20260521200813) and the
-- `match_signals` RPC has always read it, but nothing ever wrote it, so semantic
-- dedup and near-duplicate detection over signals returned nothing, always. Themes
-- got the full treatment in 20260630122000 (embedding + HNSW + match_themes) and
-- that migration's own comment claims it "mirrors signals.embedding"; it did not.
-- Signals never had the index, and never had a writer.
--
-- This migration closes both halves of that gap on the DB side:
--   (a) the ANN index, so match_signals stops sequential-scanning once populated;
--   (b) the sweeper's queue index, so finding un-embedded rows is cheap;
--   (c) the cron that runs the sweeper.
-- The writer itself is application code: `src/lib/sources/signal-embedding.server.ts`
-- (inline on the connector sink for freshness, plus the table-state-driven backfill
-- that this cron drives and that covers every other write path).

-- (a) ANN index for match_signals. Mirrors themes_embedding_hnsw exactly.
CREATE INDEX IF NOT EXISTS signals_embedding_hnsw
  ON public.signals USING hnsw (embedding vector_cosine_ops);

-- (b) The sweeper's queue. Partial, so it indexes only the backlog (normally near
--     empty once drained) rather than every signal ever written. Ordered by
--     created_at because the sweeper drains oldest-first.
CREATE INDEX IF NOT EXISTS signals_embedding_backfill_queue_idx
  ON public.signals (created_at)
  WHERE embedding IS NULL;

-- (c) Register the sweeper. Every 15 minutes: frequent enough that a signal captured
--     by hand is comparable within one coffee refill, cheap enough that a drained
--     backlog costs one indexed lookup returning zero rows.
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
