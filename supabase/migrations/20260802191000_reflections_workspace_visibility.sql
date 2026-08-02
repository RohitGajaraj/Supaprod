-- Completes 20260802190000. That migration made semantic recall workspace-aware and
-- MISSED the second recall path, which is a real gap rather than a tidy-up.
--
-- `recallMemoryRefs` (src/lib/ai/memory.server.ts) reads TWO functions, not one:
-- match_agent_memory for semantic recall and recent_agent_reflections for an agent's
-- recent notes. Only the first was corrected, so after 20260802190000 a teammate's
-- outcomes were recallable by meaning while their reflections stayed invisible.
-- Half a memory layer is arguably worse than none, because the gap is silent: recall
-- returns something, so nothing looks broken.
--
-- Same shared branch, verbatim, including the service-role membership check. The old
-- body carried the identical `auth.uid() is null OR ...` tenancy guard, which skips
-- membership entirely when auth.uid() is null, so relaxing the user filter here
-- without user_in_workspace would have reopened exactly the cross-tenant hole
-- 20260802190000 was careful to avoid.
--
-- Reflections are shared for the same reason outcomes are: how a build actually went
-- is operational learning the next person needs, and it is subject to the same
-- `visibility` column, so anything genuinely personal can still be marked private.
CREATE OR REPLACE FUNCTION public.recent_agent_reflections(
  for_user uuid, for_agent_slug text, match_count integer DEFAULT 5,
  for_workspace uuid DEFAULT NULL, for_account uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, importance integer, metadata jsonb, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  select m.id, m.content, m.importance, m.metadata, m.created_at
  from public.agent_memory m
  where (
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
