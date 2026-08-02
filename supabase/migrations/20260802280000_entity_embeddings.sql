-- Entity embeddings: give the tables that hold the JUDGMENT a vector.
--
-- signals, themes and agent_memory all have an embedding column and a sweeper that
-- fills it. decisions, opportunities, prds and learnings had none, so the record a
-- product team compounds was the one part of the brain that could not be found by
-- meaning. This adds the column, the ANN index that makes matching cheap once it is
-- populated, and the partial index the backfill sweeper drains through.
--
-- The writer is application code: src/lib/brain/entity-embedding.server.ts, one
-- table-driven sweeper expressing all four entities as specs, swept from
-- src/routes/api/public/hooks/embed-tick.ts (the existing every-15-minutes
-- embed-tick cron, registered in 20260802160000; no new cron needed).
--
-- Every column is nullable on purpose: the vector arrives after the row. A NOT NULL
-- column would make creating a decision depend on a working embedder.

CREATE EXTENSION IF NOT EXISTS vector;

-- (1) The columns. vector(1536) matches EMB_DIMS in src/lib/rag/embed.server.ts and
--     the existing signals.embedding / themes.embedding columns, so one query
--     embedding can be compared against any of them.
ALTER TABLE public.decisions     ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.prds          ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.learnings     ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- (2) The ANN indexes. Mirror themes_embedding_hnsw and signals_embedding_hnsw
--     exactly: hnsw + vector_cosine_ops, because every match_* RPC in this schema
--     scores with the cosine operator (1 - (a <=> b)).
CREATE INDEX IF NOT EXISTS decisions_embedding_hnsw
  ON public.decisions USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS opportunities_embedding_hnsw
  ON public.opportunities USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS prds_embedding_hnsw
  ON public.prds USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS learnings_embedding_hnsw
  ON public.learnings USING hnsw (embedding vector_cosine_ops);

-- (3) The backfill queues. Partial, so each one indexes only the backlog (normally
--     near empty once drained) rather than every row ever written. Keyed on
--     created_at because the sweeper orders by it; it drains newest first, which the
--     index serves in either direction.
CREATE INDEX IF NOT EXISTS decisions_embedding_backfill_queue_idx
  ON public.decisions (created_at)
  WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS opportunities_embedding_backfill_queue_idx
  ON public.opportunities (created_at)
  WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS prds_embedding_backfill_queue_idx
  ON public.prds (created_at)
  WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS learnings_embedding_backfill_queue_idx
  ON public.learnings (created_at)
  WHERE embedding IS NULL;
