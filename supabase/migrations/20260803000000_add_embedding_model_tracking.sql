-- Track which embedding model produced each vector.
--
-- WHY. Cohere embed-v4 and OpenAI's text-embedding-3-small are not compatible in
-- vector space — their cosine distances have no meaningful interpretation across
-- models. When a provider walls off (trial quota, outage, price shock), fallback
-- code must never mix old and new vectors. The fix: tag each vector with the model
-- that produced it, and filter match_* RPCs to compare only vectors from the same model.
--
-- IMPLEMENTATION. Add embedding_model text column (nullable, default null for
-- existing rows) to all 8 vector tables. Existing vectors have no model tag and
-- must not be queried across models until explicitly re-tagged or re-embedded.
-- New vectors are tagged at insert time by the chokepoint (resolveEmbedRoute
-- returns logModel, which is stored here).
--
-- RPC changes: every match_* RPC gains a WHERE embedding_model = ? filter so it
-- queries only vectors from the requested model. Queries without a model parameter
-- get a new optional param (default to current model, null if provider fallback
-- possible). Semantic search is now model-scoped.

ALTER TABLE public.signals        ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.themes         ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.agent_memory   ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.decisions      ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.opportunities  ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.prds           ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.learnings      ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.rag_chunks     ADD COLUMN IF NOT EXISTS embedding_model text;

-- Index for filtering by model (query planner will use this when filtering
-- on embedding_model in match_* RPCs). Composite (model, created_at) covers
-- both model scoping and backfill-queue ordering.
CREATE INDEX IF NOT EXISTS signals_embedding_model_idx
  ON public.signals (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS themes_embedding_model_idx
  ON public.themes (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_memory_embedding_model_idx
  ON public.agent_memory (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS decisions_embedding_model_idx
  ON public.decisions (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS opportunities_embedding_model_idx
  ON public.opportunities (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS prds_embedding_model_idx
  ON public.prds (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS learnings_embedding_model_idx
  ON public.learnings (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_model_idx
  ON public.rag_chunks (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
