-- Agent memory: shared across the workspace by default, private by exception.
--
-- WHY. The product's institutional-memory claim is that when a product manager
-- leaves, the next person inherits the judgment rather than starting cold. The
-- structured record already did travel: signals, themes, opportunities, prds,
-- decisions, learnings and artifact_lineage are all membership scoped. The memory
-- layer did not. `agent_memory` carried a dual-key RLS, `auth.uid() = user_id AND
-- is_workspace_member(workspace_id)`, and match_agent_memory filtered on
-- `m.user_id = coalesce(auth.uid(), for_user)`, so a successor inherited the
-- record and NOT the compounded recall. Live count when this was written: 423
-- memories across 16 workspaces and 12 distinct authors, already fragmenting.
--
-- The owner-only half was VESTIGIAL, not a privacy decision. Migration
-- 20260619220000_wm_f1b's own header states the table RLS was still the
-- PRE-TENANCY owner-only `auth.uid() = user_id` and that it ADDED the workspace
-- check on top to close a tenancy hole. Nobody chose "teammates must not share
-- memory"; it was inherited. Cross-workspace isolation and intra-workspace
-- visibility are separable concerns, and this migration changes only the second.
--
-- NOT A BLANKET FLIP. Some memories genuinely are personal: an agent's reflection
-- on how one person likes to work is not their colleague's business. So the unit
-- of the decision is a column, defaulting to shared, with private available.

-- 1. The column. Default 'workspace' because the compounding is the point; a
--    memory nobody else can reach cannot make the team sharper. Existing rows
--    take the default: they are outcomes, reflections and reviewed notes, which
--    is work product, not correspondence.
ALTER TABLE public.agent_memory
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'workspace';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_memory_visibility_check'
  ) THEN
    ALTER TABLE public.agent_memory
      ADD CONSTRAINT agent_memory_visibility_check
      CHECK (visibility IN ('workspace', 'private'));
  END IF;
END $$;

-- 2. Membership for a NAMED user, not for auth.uid().
--    is_workspace_member(ws) resolves the caller through auth.uid(), which is null
--    on the service-role path the crons and the agent loop use. That path needs to
--    ask "is THIS user in that workspace", which nothing could express before.
CREATE OR REPLACE FUNCTION public.user_in_workspace(ws uuid, uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = ws AND m.user_id = uid
  );
$$;
REVOKE EXECUTE ON FUNCTION public.user_in_workspace(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.user_in_workspace(uuid, uuid) TO authenticated, service_role;

-- 3. RLS. The single FOR ALL policy is split, because reading and writing now have
--    genuinely different rules: you may READ a teammate's shared memory, and you
--    may still only WRITE, EDIT or DELETE your own. A shared memory is not a
--    communal document, it is one person's recorded judgment that others can learn
--    from, so authorship stays immutable and attributable.
DROP POLICY IF EXISTS "own agent_memory in member workspace" ON public.agent_memory;

CREATE POLICY "read own or workspace-shared agent_memory"
  ON public.agent_memory FOR SELECT
  USING (
    public.is_workspace_member(workspace_id)
    AND (auth.uid() = user_id OR visibility = 'workspace')
  );

CREATE POLICY "write own agent_memory in member workspace"
  ON public.agent_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

CREATE POLICY "update own agent_memory in member workspace"
  ON public.agent_memory FOR UPDATE
  USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id))
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

CREATE POLICY "delete own agent_memory in member workspace"
  ON public.agent_memory FOR DELETE
  USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

-- 4. Recall. Both overloads carry the identical body, so both are corrected.
--
--    THE TRAP THIS AVOIDS, stated plainly because it would have been a
--    cross-tenant leak: the old body's tenancy guard reads
--    `auth.uid() is null OR m.workspace_id is null OR is_workspace_member(...)`,
--    which SKIPS the membership check entirely whenever auth.uid() is null. On
--    that service-role path the ONLY thing standing between one workspace and
--    another was `m.user_id = for_user`. Relaxing that filter to allow shared
--    memories, without adding a check that works when auth.uid() is null, would
--    have let a service-role call read every workspace's shared memory in the
--    database. Hence user_in_workspace above, and hence the shared branch below
--    verifies membership on BOTH paths rather than inheriting a guard that has a
--    hole in exactly the path the agent loop runs on.
--
--    Signature deliberately unchanged so this is CREATE OR REPLACE and never a
--    drop: the author is already on the row as user_id, so attribution needs no
--    new return column and recall is never left missing between two statements.
CREATE OR REPLACE FUNCTION public.match_agent_memory(
  query_embedding vector, match_count integer DEFAULT 5, for_user uuid DEFAULT NULL,
  for_agent_slug text DEFAULT NULL, for_workspace uuid DEFAULT NULL, for_account uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, kind text, importance integer, agent_slug text, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  with candidates as (
    select m.id, m.content, m.kind, m.importance, m.agent_slug, m.metadata,
           m.last_used_at, m.created_at,
           (m.embedding <=> query_embedding) as distance
    from public.agent_memory m
    where (
        m.user_id = coalesce(auth.uid(), for_user)
        or (
          m.visibility = 'workspace'
          and m.workspace_id is not null
          and (
            (auth.uid() is not null and public.is_workspace_member(m.workspace_id))
            or (auth.uid() is null and for_user is not null
                and public.user_in_workspace(m.workspace_id, for_user))
          )
        )
      )
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
    + case c.metadata->>'verdict' when 'validated' then -0.05 when 'missed' then 0.05 else 0 end
    - (coalesce(c.importance, 3) - 3) * 0.01
    + (1 - exp(-extract(epoch from (now() - coalesce(c.last_used_at, c.created_at))) / 3600.0 / 72.0)) * 0.02
  limit match_count;
$function$;

CREATE OR REPLACE FUNCTION public.match_agent_memory(
  query_embedding vector, for_user uuid, for_agent_slug text DEFAULT NULL,
  match_count integer DEFAULT 6, for_workspace uuid DEFAULT NULL, for_account uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, kind text, importance integer, agent_slug text, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  with candidates as (
    select m.id, m.content, m.kind, m.importance, m.agent_slug, m.metadata,
           m.last_used_at, m.created_at,
           (m.embedding <=> query_embedding) as distance
    from public.agent_memory m
    where (
        m.user_id = coalesce(auth.uid(), for_user)
        or (
          m.visibility = 'workspace'
          and m.workspace_id is not null
          and (
            (auth.uid() is not null and public.is_workspace_member(m.workspace_id))
            or (auth.uid() is null and for_user is not null
                and public.user_in_workspace(m.workspace_id, for_user))
          )
        )
      )
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
    + case c.metadata->>'verdict' when 'validated' then -0.05 when 'missed' then 0.05 else 0 end
    - (coalesce(c.importance, 3) - 3) * 0.01
    + (1 - exp(-extract(epoch from (now() - coalesce(c.last_used_at, c.created_at))) / 3600.0 / 72.0)) * 0.02
  limit match_count;
$function$;

-- 5. The shared branch filters by (workspace_id, visibility) before the vector
--    ordering, so it gets an index rather than a scan per recall.
CREATE INDEX IF NOT EXISTS agent_memory_workspace_shared_idx
  ON public.agent_memory (workspace_id)
  WHERE visibility = 'workspace' AND embedding IS NOT NULL;
