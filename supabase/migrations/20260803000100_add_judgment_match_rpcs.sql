-- Add missing RPC functions for semantic search over judgment tables.
--
-- The four judgment tables (decisions, opportunities, prds, learnings) now have
-- embedding columns (added in 20260802280000_entity_embeddings.sql) but had no
-- match_* RPC functions to query them. These are the semantic search endpoints
-- that allow the brain to find related decisions, opportunities, etc., by meaning.
--
-- Pattern: same shape as match_signals and match_themes, with an optional
-- embedding_model parameter to filter on model (safety against vector-space mixing).

CREATE OR REPLACE FUNCTION public.match_decisions(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, title text, rationale text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT d.id, d.title, d.rationale, 1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.decisions d
  WHERE d.embedding IS NOT NULL
    AND (for_user IS NULL OR d.user_id = for_user)
    AND (embedding_model IS NULL OR d.embedding_model = embedding_model)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_opportunities(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, title text, problem text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT o.id, o.title, o.problem, 1 - (o.embedding <=> query_embedding) AS similarity
  FROM public.opportunities o
  WHERE o.embedding IS NOT NULL
    AND (for_user IS NULL OR o.user_id = for_user)
    AND (embedding_model IS NULL OR o.embedding_model = embedding_model)
  ORDER BY o.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_prds(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, title text, body_md text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT p.id, p.title, p.body_md, 1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.prds p
  WHERE p.embedding IS NOT NULL
    AND (for_user IS NULL OR p.user_id = for_user)
    AND (embedding_model IS NULL OR p.embedding_model = embedding_model)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_learnings(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, summary text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT l.id, l.summary, 1 - (l.embedding <=> query_embedding) AS similarity
  FROM public.learnings l
  WHERE l.embedding IS NOT NULL
    AND (for_user IS NULL OR l.user_id = for_user)
    AND (embedding_model IS NULL OR l.embedding_model = embedding_model)
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Update existing match_signals and match_themes to also filter by embedding_model
-- so they're future-safe when we add model tracking. Existing rows have NULL model,
-- so the default (embedding_model IS NULL) matches the current schema state.
CREATE OR REPLACE FUNCTION public.match_signals(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, content text, title text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT s.id, s.content, s.title, 1 - (s.embedding <=> query_embedding) AS similarity
  FROM public.signals s
  WHERE s.embedding IS NOT NULL
    AND (for_user IS NULL OR s.user_id = for_user)
    AND (embedding_model IS NULL OR s.embedding_model = embedding_model)
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_themes(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, title text, summary text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT t.id, t.title, t.summary, 1 - (t.embedding <=> query_embedding) AS similarity
  FROM public.themes t
  WHERE t.embedding IS NOT NULL
    AND (for_user IS NULL OR t.user_id = for_user)
    AND (embedding_model IS NULL OR t.embedding_model = embedding_model)
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_agent_memory(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, content text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT m.id, m.content, 1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.agent_memory m
  WHERE m.embedding IS NOT NULL
    AND (for_user IS NULL OR m.user_id = for_user)
    AND (embedding_model IS NULL OR m.embedding_model = embedding_model)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;
