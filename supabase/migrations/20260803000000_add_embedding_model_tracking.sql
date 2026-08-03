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
--
-- ─────────────────────────────────────────────────────────────────────────────
-- APPLIED BY HAND, 2026-08-03, and TWO CORRECTIONS to the plan above.
--
-- 1. THE COLUMNS AND INDEXES BELOW WERE APPLIED DIRECTLY to the live database on
--    2026-08-03 (verified: 8 columns present, 8 partial indexes present). They are
--    idempotent, so re-running this file is safe and is what a fresh environment
--    needs. Note that `supabase_migrations.schema_migrations` is NOT a reliable
--    ledger in this project: its newest row is 20260802160000, yet several later
--    migrations are demonstrably live (the `liveness-tick` pg_cron job among them).
--    Verify by object existence (information_schema / to_regclass), never by that table.
--
-- 2. THE BACKFILL AT THE BOTTOM OF THIS FILE IS NOT OPTIONAL, and the header above
--    was wrong to imply otherwise. It said existing vectors "must not be queried
--    across models until explicitly re-tagged", leaving them NULL. Leaving them NULL
--    is the DANGEROUS choice, not the safe one: in SQL, `NULL = 'cohere/embed-v4.0'`
--    is NULL rather than true, so the moment any match_* RPC filters on the model,
--    every legacy row is silently excluded. That would have erased the entire
--    existing corpus from recall (308 signals, 181 themes, 278 agent memories) with
--    no error, no log, and no visible symptom beyond retrieval quietly returning less.
--    That is the exact failure shape this repo keeps producing, so the backfill runs
--    in the same migration that adds the column, never in a follow-up nobody runs.
--
-- 3. THE SIBLING MIGRATION IS QUARANTINED. `20260803000100_add_judgment_match_rpcs.sql`
--    is renamed to `.sql.BLOCKED` and MUST NOT be applied. It redefined live RPCs with
--    different argument lists, which in Postgres adds an overload instead of replacing
--    anything, and its match_signals(vector, int, uuid, text) collides with the live
--    match_signals(vector, integer, uuid, uuid) on arity with only the 4th type
--    differing, risking "could not choose the best candidate function". It also dropped
--    tenant and agent scoping (for_workspace, for_account, for_agent_slug, for_product,
--    exclude_id) and return columns that live callers read. A corrected replacement is
--    tracked separately; do not un-rename that file.
-- ─────────────────────────────────────────────────────────────────────────────

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

-- Tag every EXISTING vector with the model that produced it. See correction 2 in the
-- header: leaving these NULL is what makes a model filter silently erase the corpus.
--
-- WHY 'cohere/embed-v4.0' IS THE HONEST VALUE HERE, and what its limit is. Every embed
-- event ever logged to `ai_events` is cohere/embed-v4.0 (1,630 of them, the earliest
-- 2026-07-02), and there is no embed event of any other model at any date. So the
-- best available evidence is that the whole corpus is single-model.
--
-- The limit, stated rather than hidden: this is INFERENCE, not a record. `logEmbedEvent`
-- in src/lib/rag/embed.server.ts returns early when there is no userId, so unattributed
-- embed calls were never logged at all, and absence of an event is therefore not proof
-- of absence of a call. If a pre-2026-07-02 gateway call (OpenAI text-embedding-3-small)
-- ever wrote a vector, this statement mislabels it.
--
-- That residual risk is accepted deliberately, because the alternatives are worse: NULL
-- means silent exclusion, and nulling the vectors to force a re-embed would degrade
-- recall until the sweeper caught up, which today it does not reliably do. Should
-- certainty ever be needed, re-embedding the whole corpus costs cents at the measured
-- rate (211,358 tokens for a full month of live traffic), so it is affordable to simply
-- redo rather than reason about.
UPDATE public.signals       SET embedding_model = 'cohere/embed-v4.0' WHERE embedding IS NOT NULL AND embedding_model IS NULL;
UPDATE public.themes        SET embedding_model = 'cohere/embed-v4.0' WHERE embedding IS NOT NULL AND embedding_model IS NULL;
UPDATE public.agent_memory  SET embedding_model = 'cohere/embed-v4.0' WHERE embedding IS NOT NULL AND embedding_model IS NULL;
UPDATE public.decisions     SET embedding_model = 'cohere/embed-v4.0' WHERE embedding IS NOT NULL AND embedding_model IS NULL;
UPDATE public.opportunities SET embedding_model = 'cohere/embed-v4.0' WHERE embedding IS NOT NULL AND embedding_model IS NULL;
UPDATE public.prds          SET embedding_model = 'cohere/embed-v4.0' WHERE embedding IS NOT NULL AND embedding_model IS NULL;
UPDATE public.learnings     SET embedding_model = 'cohere/embed-v4.0' WHERE embedding IS NOT NULL AND embedding_model IS NULL;
UPDATE public.rag_chunks    SET embedding_model = 'cohere/embed-v4.0' WHERE embedding IS NOT NULL AND embedding_model IS NULL;
