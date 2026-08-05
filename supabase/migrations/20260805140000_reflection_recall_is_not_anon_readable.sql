-- Close a live unauthenticated read of the company brain: `recent_agent_reflections`
-- is SECURITY DEFINER and is granted EXECUTE to `anon`.
--
-- WHY THIS IS THE MOAT FILE AND NOT A HOUSEKEEPING FILE. A decision record that does
-- not survive a teammate is a diary, not a moat: that is why agent_memory recall was
-- moved off `user_id` and onto the workspace (20260802190000 for semantic recall,
-- 20260802191000 for reflections). Both are applied and verified live. But the same
-- change that makes a memory reachable by a TEAMMATE is what makes it reachable by a
-- STRANGER if the caller's identity is never checked. Workspace scoping and tenant
-- isolation are the same mechanism viewed from two sides, and only one side was
-- finished. A brain a competitor can read is not a moat either.
--
-- THE DEFECT, reproduced against production before this file was written. Both recall
-- functions resolve the asking user as `coalesce(auth.uid(), for_user)`, because the
-- agent loop runs service-side where `auth.uid()` is null and the user must be named
-- explicitly. That is correct for a trusted caller and catastrophic for an untrusted
-- one: when `auth.uid()` is null, `for_user` is simply believed. Every downstream
-- guard then folds, because each is written to skip itself on the service path:
--
--     and (for_account is null or auth.uid() is null or public.is_account_member(...))
--     and (auth.uid() is null  or m.workspace_id is null or public.is_workspace_member(...))
--
-- So an `anon` caller supplying any user's uuid reads that user's reflections AND every
-- workspace-shared reflection in every workspace that user belongs to. Executed live as
-- role `anon`, passing a real uuid taken from the table:
--
--     SET LOCAL ROLE anon;
--     SELECT count(*) FROM public.recent_agent_reflections(
--       for_user => '1339eea2-...'::uuid, for_agent_slug => NULL, match_count => 20);
--     -- running_as = anon, rows_returned = 20
--
-- Twenty rows of another account's private engineering judgment, returned to an
-- unauthenticated caller. `anon` is not a theoretical role here: it is the role the
-- Supabase anon key maps to, that key is `VITE_`-prefixed and therefore shipped in the
-- browser bundle, and PostgREST exposes every public-schema function as an RPC. The
-- reachable surface is `POST /rest/v1/rpc/recent_agent_reflections` with a key any
-- visitor already has. Live blast radius at time of writing: 853 reflection rows, 12
-- distinct authors, 16 workspaces.
--
-- WHY THE GRANT EXISTS, because the cause will otherwise recur. Nobody wrote it. This
-- database carries `ALTER DEFAULT PRIVILEGES ... GRANT EXECUTE ON FUNCTIONS TO anon,
-- authenticated, service_role` (four such entries in pg_default_acl), so every newly
-- created function is born anon-executable. Every migration in this function's history
-- (20260606143223, 20260619212731, 20260619240000) ends with `REVOKE ... FROM public`
-- then `GRANT ... TO authenticated, service_role` and believed that was enough. It is
-- not: revoking from PUBLIC does not touch an explicit grant to `anon`. The sibling
-- migration 20260803150000 is the only one in the repo that got this right, and it got
-- it right by revoking `anon` BY NAME. The reason `match_agent_memory` is clean today
-- is luck rather than rigour: its anon-granted overload happened to be the duplicate
-- dropped by 20260803110000 for being ambiguous.
--
-- WHY BOTH A REVOKE AND A BODY GUARD. The REVOKE is the fix. The body guard is there
-- because the REVOKE survives CREATE OR REPLACE but NOT a future DROP + CREATE, which
-- re-arms the default privilege silently. Given this schema has already been rewritten
-- by a bot migration once (20260803095053 recreated this very function), a fix that
-- depends on nobody ever dropping the function again is not a fix. Defence in depth.
--
-- NOTHING LEGITIMATE LOSES ACCESS. Callers are src/lib/ai/memory.server.ts:135 and
-- src/lib/agents.functions.ts:282, both server-side, both `authenticated` or
-- `service_role`. No anon surface calls this. Verified by grep across src/.

-- ── 1. Remove the grant nobody intended to make ────────────────────────────────
-- By NAME. `FROM PUBLIC` is what every previous migration tried and it does not strip
-- an explicit role grant, which is the entire reason this hole survived four rewrites.
REVOKE ALL ON FUNCTION public.recent_agent_reflections(uuid, text, integer, uuid, uuid)
  FROM anon;
REVOKE ALL ON FUNCTION public.recent_agent_reflections(uuid, text, integer, uuid, uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recent_agent_reflections(uuid, text, integer, uuid, uuid)
  TO authenticated, service_role;

-- ── 2. Fail closed in the body as well ─────────────────────────────────────────
--
-- SIGNATURE IS BYTE-IDENTICAL TO THE LIVE ONE, DELIBERATELY. Verified first against
-- pg_get_function_arguments(oid 24490):
--
--   for_user uuid, for_agent_slug text, match_count integer DEFAULT 5,
--   for_workspace uuid DEFAULT NULL::uuid, for_account uuid DEFAULT NULL::uuid
--
-- Note `for_agent_slug` carries NO default and does not gain one here. Postgres
-- identifies a function by its argument TYPES, so CREATE OR REPLACE with even a
-- slightly different list does not replace anything, it FORKS a second overload and
-- leaves both live. That is precisely how match_signals, match_themes and
-- match_agent_memory became unresolvable (PGRST203, "could not choose a best candidate
-- function") and killed retrieval in production while every caller swallowed the error.
-- Same return type for the same reason: changing it would make this statement error
-- rather than replace. The ONLY change below is the added `auth.role()` predicate.
--
-- WHY auth.role() AND NOT current_user. Inside a SECURITY DEFINER function current_user
-- is the definer (postgres), so it cannot see who called. auth.role() reads the request
-- JWT claim. Its body is `current_setting('request.jwt.claim.role', true)` with
-- missing_ok = true, so OUTSIDE a request context (cron, psql, a direct service
-- connection) it returns NULL, not an error. Confirmed live: `select auth.role()`
-- returns null on a bare connection.
--
-- Hence `IS DISTINCT FROM 'anon'`, chosen over `= 'authenticated'`: it admits NULL
-- (internal/cron), 'authenticated' and 'service_role', and denies exactly one role, the
-- untrusted one. IS DISTINCT FROM rather than <> because `NULL <> 'anon'` is NULL,
-- which would fail closed against the cron fleet and take real recall down with it.
CREATE OR REPLACE FUNCTION public.recent_agent_reflections(
  for_user uuid, for_agent_slug text, match_count integer DEFAULT 5,
  for_workspace uuid DEFAULT NULL, for_account uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, importance integer, metadata jsonb, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  select m.id, m.content, m.importance, m.metadata, m.created_at
  from public.agent_memory m
  where
    -- An anonymous caller may not name a user and be believed. This is the only
    -- addition in this body; everything below is unchanged from 20260802191000.
    auth.role() is distinct from 'anon'
    and (
      m.user_id = coalesce(auth.uid(), for_user)
      or (m.visibility = 'workspace' and m.workspace_id is not null and (
            (auth.uid() is not null and public.is_workspace_member(m.workspace_id))
            or (auth.uid() is null and for_user is not null
                and public.user_in_workspace(m.workspace_id, for_user))))
    )
    and m.kind = 'reflection'
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
  order by m.importance desc, m.created_at desc
  limit greatest(1, least(match_count, 20));
$function$;

-- ── 3. Guards ──────────────────────────────────────────────────────────────────
-- Exactly one overload. Asserted rather than assumed: if the CREATE OR REPLACE above
-- ever forks instead of replacing, recall dies with PGRST203 and every caller swallows
-- it, so the failure must be loud HERE or it will not be noticed at all.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
   WHERE ns.nspname = 'public' AND p.proname = 'recent_agent_reflections';
  IF n <> 1 THEN
    RAISE EXCEPTION 'recent_agent_reflections has % overloads, expected exactly 1', n;
  END IF;
END $$;

-- No anon or PUBLIC EXECUTE survived. This is the entire security delta of the file,
-- so it is verified rather than trusted.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
     WHERE ns.nspname = 'public' AND p.proname = 'recent_agent_reflections'
       AND (has_function_privilege('anon', p.oid, 'EXECUTE')
            OR has_function_privilege('public', p.oid, 'EXECUTE'))
  ) THEN
    RAISE EXCEPTION 'anon/PUBLIC still holds EXECUTE on recent_agent_reflections';
  END IF;
END $$;

-- The legitimate callers must NOT have been collateral damage. authenticated and
-- service_role are the two roles src/lib/ai/memory.server.ts and
-- src/lib/agents.functions.ts actually connect as.
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(r, ', ') INTO missing
    FROM unnest(ARRAY['authenticated','service_role']) AS r
   WHERE NOT EXISTS (
     SELECT 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
      WHERE ns.nspname = 'public' AND p.proname = 'recent_agent_reflections'
        AND has_function_privilege(r, p.oid, 'EXECUTE')
   );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'recall broken: % lost EXECUTE on recent_agent_reflections', missing;
  END IF;
END $$;
