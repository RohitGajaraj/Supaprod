-- RF-02: outcome-weighted retrieval (the v12 audit's keystone finding).
--
-- Every retrieval today is pure cosine similarity: `match_agent_memory` orders
-- strictly by `m.embedding <=> query_embedding`, so a memory tagged 'missed' in
-- rememberOutcome's metadata->>'verdict' (src/lib/ai/memory.server.ts) ranks
-- identically to an equally-similar memory tagged 'validated'. Memory gets
-- bigger, not smarter. This adds a small reranking term on top of the same
-- similarity ordering, built ONLY from fields already on the row (importance,
-- last_used_at, metadata->>'verdict') — no new columns, no signature change,
-- so every existing caller (loop.server.ts, Ambient Precedent, the Critic,
-- decision-precedent.server.ts, brain/novelty.server.ts) is upgraded by this
-- one migration with zero code changes.
--
-- The adjustment is deliberately SMALL (max downward swing +0.09, max upward
-- swing -0.07) relative to typical cosine-distance range: it reranks among
-- candidates the vector search already considers similar, it does not
-- override genuine semantic relevance. Decay uses the same exp(-ageHours/72)
-- half-life brain/score.ts's recency term uses, so "how stale" reads
-- consistently across the codebase.
--
-- TWO-STAGE query (candidates CTE, then rerank): a bare `order by <expression
-- involving embedding <=>> + arithmetic> limit N` would stop Postgres pushing
-- the ORDER BY/LIMIT down through the HNSW index (`agent_memory_embedding_hnsw`,
-- 20260522004926), forcing a full-condition scan before sorting. Stage 1 keeps
-- the EXACT prior "order by m.embedding <=> query_embedding limit N" shape (so
-- the planner can still use the index for an ANN top-K), just widened to a
-- candidate pool (4x match_count, floor 20); stage 2 reranks only that small,
-- already-fetched pool by the new expression. Reviewed and confirmed by a
-- database-specialist pass (2026-07-03).
--
-- Same signature/return shape as the current definition (20260619240000), so
-- CREATE OR REPLACE is sufficient — no DROP, no re-GRANT needed (both are tied
-- to the function's identity, which is unchanged).

create or replace function public.match_agent_memory(
  query_embedding vector(1536),
  for_user uuid,
  for_agent_slug text default null,
  match_count integer default 6,
  for_workspace uuid default null,
  for_account uuid default null
) returns table (
  id uuid, content text, kind text, importance integer,
  agent_slug text, similarity double precision
) language sql stable security definer set search_path to 'public' as $$
  with candidates as (
    select m.id, m.content, m.kind, m.importance, m.agent_slug, m.metadata,
           m.last_used_at, m.created_at,
           (m.embedding <=> query_embedding) as distance
    from public.agent_memory m
    where m.user_id = coalesce(auth.uid(), for_user)
      and m.embedding is not null
      and (m.expires_at is null or m.expires_at > now())
      and (
        (for_account is not null
          and (m.workspace_id is null
               or m.workspace_id in (select w.id from public.workspaces w where w.account_id = for_account)))
        or (for_account is null
          and (for_workspace is null or m.workspace_id = for_workspace or m.workspace_id is null))
      )
      and (for_account is null or auth.uid() is null or public.is_account_member(for_account))
      and (auth.uid() is null or m.workspace_id is null or public.is_workspace_member(m.workspace_id))
      and (for_agent_slug is null or m.agent_slug = for_agent_slug or m.scope = 'global')
    order by m.embedding <=> query_embedding
    limit greatest(match_count * 4, 20)
  )
  select c.id, c.content, c.kind, c.importance, c.agent_slug,
         1 - c.distance as similarity
  from candidates c
  order by
    c.distance
    -- Outcome term: a validated precedent outranks a similar-but-refuted one;
    -- 'mixed' or no verdict yet (most memory) is neutral.
    + case c.metadata->>'verdict'
        when 'validated' then -0.05
        when 'missed' then 0.05
        else 0
      end
    -- Importance term: importance is 1-5, centered at 3, each point +/-0.01.
    - (coalesce(c.importance, 3) - 3) * 0.01
    -- Decay term: recency = exp(-ageHours/72) (same half-life as
    -- brain/score.ts), so an untouched memory's rank slowly fades toward a
    -- +0.02 penalty while a recently-used one pays close to nothing.
    + (1 - exp(-extract(epoch from (now() - coalesce(c.last_used_at, c.created_at))) / 3600.0 / 72.0)) * 0.02
  limit match_count;
$$;
