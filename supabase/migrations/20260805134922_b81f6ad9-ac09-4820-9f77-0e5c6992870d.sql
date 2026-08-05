-- Close a live unauthenticated read of the company brain.
REVOKE ALL ON FUNCTION public.recent_agent_reflections(uuid, text, integer, uuid, uuid)
  FROM anon;
REVOKE ALL ON FUNCTION public.recent_agent_reflections(uuid, text, integer, uuid, uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recent_agent_reflections(uuid, text, integer, uuid, uuid)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.recent_agent_reflections(
  for_user uuid, for_agent_slug text, match_count integer DEFAULT 5,
  for_workspace uuid DEFAULT NULL, for_account uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, importance integer, metadata jsonb, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  select m.id, m.content, m.importance, m.metadata, m.created_at
  from public.agent_memory m
  where
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