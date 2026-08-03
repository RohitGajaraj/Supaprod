-- Semantic search over the four judgment tables, scoped to the WORKSPACE rather
-- than to the individual who happened to type the row.
--
-- WHAT WAS ALREADY LIVE, AND WHY IT WAS WRONG. match_decisions, match_opportunities,
-- match_prds and match_learnings exist in production today (applied 2026-08-03 as part
-- of 20260803000100, since quarantined). Verified live, all four share this shape:
--
--   match_decisions(query_embedding vector, match_count integer,
--                   for_user uuid, embedding_model text)   prosecdef = false
--   acl: =X/postgres | anon=X | authenticated=X | service_role=X | sandbox_exec=X
--
-- Two defects, one of them a direct contradiction of the product's central claim.
--
--   1. THE user_id FILTER NARROWS THE WORKSPACE RECORD BACK TO ONE PERSON. The RLS
--      SELECT policy on public.decisions is `is_workspace_member(workspace_id)`, i.e.
--      every member may read every decision in the workspace. That policy is correct
--      and it is what makes "when a product manager leaves, the next person inherits
--      the record" true. The RPC then re-filtered with `d.user_id = for_user`, so a
--      semantic search over the shared record would have returned only the caller's
--      OWN rows. A successor searching for prior judgment would have found none of
--      their predecessor's, while the table itself held all of it. The read path
--      contradicted the policy underneath it.
--
--   2. EXECUTE granted to PUBLIC and to anon. This is NOT a live data leak and should
--      not be reported as one: the functions are SECURITY INVOKER and RLS is enabled
--      on all four tables, so an anonymous caller sees only rows an anonymous caller
--      may already see (on decisions, the `is_public = true` policy). It is still the
--      wrong posture, and it is looser than every neighbouring RPC: match_signals,
--      match_themes and match_agent_memory each grant EXECUTE to authenticated and
--      service_role only. No anon surface calls these. The grant is removed.
--
-- NOTHING CALLED THEM. `grep -rn "match_decisions|match_opportunities|match_prds|
-- match_learnings" src --include=*.ts` returns only the generated types file. So this
-- is the repo's dominant failure mode again, capability built and door missing, and
-- dropping the four to rebuild them carries no call-site risk. The door is opened in
-- the same change: src/lib/brain/judgment-search.server.ts, wired into the Critic.
--
-- WHY DROP AND NOT CREATE OR REPLACE. Postgres identifies a function by argument
-- TYPES, and CREATE OR REPLACE cannot rename an input parameter ("cannot change name
-- of input parameter"). Replacing `for_user` with `for_workspace` therefore either
-- errors or, if the type list also shifts, silently FORKS a second overload and leaves
-- both live. That is exactly how match_signals, match_themes and match_agent_memory
-- became unresolvable earlier today (PGRST203, "could not choose a best candidate
-- function"), which killed retrieval and memory recall in production while every
-- caller swallowed the error. DROP first, create once, then assert the count.
--
-- WHY SECURITY INVOKER IS KEPT, DELIBERATELY, AGAINST THE NEIGHBOURING CONVENTION.
-- The three older match_* functions are SECURITY DEFINER and re-implement their own
-- tenancy predicate by hand. That is a second copy of an access rule which can drift
-- from the policy it is supposed to mirror. These four do not need it: the RLS SELECT
-- policy on each table is already precisely the scope we want, it has been audited,
-- and INVOKER means the function inherits it rather than restating it. One rule, one
-- place.
--
-- The mandatory `for_workspace` argument is the SECOND, independent bound, and it is
-- what makes this safe for a service_role caller (a cron or backfill), which bypasses
-- RLS entirely. There is deliberately NO `for_workspace IS NULL` escape hatch: passing
-- null returns nothing rather than everything. A caller with no workspace is not
-- entitled to a workspace-wide semantic search, and fail-closed is the only acceptable
-- default when the alternative is a cross-tenant read.
--
-- SAFE ON REAL DATA, verified before writing this: decisions 173/173 embedded,
-- opportunities 260/260, prds 81/81, learnings 119/119; ZERO rows in any of the four
-- have a null workspace_id; and all four carry exactly one embedding_model
-- ('cohere/embed-v4.0'). So the strict workspace predicate hides nothing that exists,
-- and there is no mixed vector space for `for_model` to have to defend against yet.

-- ── 1. Remove the user-scoped originals ────────────────────────────────────────
DROP FUNCTION IF EXISTS public.match_decisions(vector, integer, uuid, text);
DROP FUNCTION IF EXISTS public.match_opportunities(vector, integer, uuid, text);
DROP FUNCTION IF EXISTS public.match_prds(vector, integer, uuid, text);
DROP FUNCTION IF EXISTS public.match_learnings(vector, integer, uuid, text);

-- ...and the NEW signatures too, so this file is safe to apply TWICE.
--
-- This is not hypothetical tidiness. This migration was applied by hand through the
-- Lovable SQL path, which does NOT write a supabase_migrations.schema_migrations row,
-- so a migration runner reading that ledger still sees this file as pending. Without
-- these four lines the re-apply would reach a bare CREATE FUNCTION against a function
-- that already exists and fail with 42723, and a failed migration mid-run is how a
-- deploy ends up half-applied. Every other migration shipped today is already
-- re-runnable (DROP IF EXISTS, CREATE OR REPLACE, cron.schedule upsert, a delta-guarded
-- credit loop); this one was the single exception.
DROP FUNCTION IF EXISTS public.match_decisions(vector, uuid, int, uuid, text);
DROP FUNCTION IF EXISTS public.match_opportunities(vector, uuid, int, uuid, text);
DROP FUNCTION IF EXISTS public.match_prds(vector, uuid, int, uuid, text);
DROP FUNCTION IF EXISTS public.match_learnings(vector, uuid, int, uuid, text);

-- ── 2. Recreate, workspace-scoped ──────────────────────────────────────────────
--
-- `for_model` is named for the parameter's job rather than after the column it
-- filters. The original called it `embedding_model`, which shadows
-- decisions.embedding_model inside the function body and only resolves because every
-- column reference happens to be alias-qualified. That is a trap for the next editor,
-- not a convention worth preserving.
--
-- `exclude_id` follows match_themes, so a row never returns itself as its own nearest
-- neighbour when the query text was derived from it.

CREATE FUNCTION public.match_decisions(
  query_embedding vector(1536),
  for_workspace uuid,
  match_count int DEFAULT 8,
  exclude_id uuid DEFAULT NULL,
  for_model text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  title text,
  rationale text,
  status text,
  decided_by_agent_slug text,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT d.id, d.title, d.rationale, d.status, d.decided_by_agent_slug, d.created_at,
         1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.decisions d
  WHERE d.embedding IS NOT NULL
    AND d.workspace_id = for_workspace
    AND (exclude_id IS NULL OR d.id <> exclude_id)
    AND (for_model IS NULL OR d.embedding_model = for_model)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE FUNCTION public.match_opportunities(
  query_embedding vector(1536),
  for_workspace uuid,
  match_count int DEFAULT 8,
  exclude_id uuid DEFAULT NULL,
  for_model text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  title text,
  problem text,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT o.id, o.title, o.problem, o.created_at,
         1 - (o.embedding <=> query_embedding) AS similarity
  FROM public.opportunities o
  WHERE o.embedding IS NOT NULL
    AND o.workspace_id = for_workspace
    AND (exclude_id IS NULL OR o.id <> exclude_id)
    AND (for_model IS NULL OR o.embedding_model = for_model)
  ORDER BY o.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE FUNCTION public.match_prds(
  query_embedding vector(1536),
  for_workspace uuid,
  match_count int DEFAULT 8,
  exclude_id uuid DEFAULT NULL,
  for_model text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  title text,
  body_md text,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT p.id, p.title, p.body_md, p.created_at,
         1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.prds p
  WHERE p.embedding IS NOT NULL
    AND p.workspace_id = for_workspace
    AND (exclude_id IS NULL OR p.id <> exclude_id)
    AND (for_model IS NULL OR p.embedding_model = for_model)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- learnings is the OUTCOME table: verdict + the ICE move an outcome caused. It is the
-- workspace-scoped original of the per-user copy that outcome-memory.ts distils into
-- agent_memory, which is why searching it directly is the point of this migration.
CREATE FUNCTION public.match_learnings(
  query_embedding vector(1536),
  for_workspace uuid,
  match_count int DEFAULT 8,
  exclude_id uuid DEFAULT NULL,
  for_model text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  summary text,
  verdict text,
  metric_label text,
  metric_value text,
  prior_ice numeric,
  new_ice numeric,
  prd_id uuid,
  opportunity_id uuid,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT l.id, l.summary, l.verdict, l.metric_label, l.metric_value,
         l.prior_ice, l.new_ice, l.prd_id, l.opportunity_id, l.created_at,
         1 - (l.embedding <=> query_embedding) AS similarity
  FROM public.learnings l
  WHERE l.embedding IS NOT NULL
    AND l.workspace_id = for_workspace
    AND (exclude_id IS NULL OR l.id <> exclude_id)
    AND (for_model IS NULL OR l.embedding_model = for_model)
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── 3. Grants: match the neighbouring match_* posture, no PUBLIC, no anon ───────
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.match_decisions(vector, uuid, int, uuid, text)',
    'public.match_opportunities(vector, uuid, int, uuid, text)',
    'public.match_prds(vector, uuid, int, uuid, text)',
    'public.match_learnings(vector, uuid, int, uuid, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END $$;

-- ── 4. Guards ──────────────────────────────────────────────────────────────────
-- Exactly one overload each. Without this a future CREATE OR REPLACE with a shifted
-- argument list forks a second candidate and every caller starts failing PGRST203
-- silently, which is precisely the outage this repo hit earlier today.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, count(*) AS n
      FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
     WHERE ns.nspname = 'public'
       AND p.proname IN ('match_decisions','match_opportunities','match_prds','match_learnings')
     GROUP BY p.proname
  LOOP
    IF r.n <> 1 THEN
      RAISE EXCEPTION '% has % overloads, expected exactly 1', r.proname, r.n;
    END IF;
  END LOOP;
END $$;

-- No anonymous or public EXECUTE survived. Asserted rather than assumed, because the
-- REVOKE above is the entire security delta of this migration.
DO $$
DECLARE leaked text;
BEGIN
  SELECT string_agg(p.proname, ', ') INTO leaked
    FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
   WHERE ns.nspname = 'public'
     AND p.proname IN ('match_decisions','match_opportunities','match_prds','match_learnings')
     AND (has_function_privilege('anon', p.oid, 'EXECUTE')
          OR has_function_privilege('public', p.oid, 'EXECUTE'));
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'anon/PUBLIC still holds EXECUTE on: %', leaked;
  END IF;
END $$;
