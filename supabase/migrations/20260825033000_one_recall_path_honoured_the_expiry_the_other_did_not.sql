-- `agent_memory.expires_at` exists so a lesson can stop being true.
--
-- Both recall paths read the same table and only one of them looked at that
-- column. `match_agent_memory` carries `expires_at is null or expires_at >
-- now()`. `recent_agent_reflections` carried nothing, and it is the path that
-- selects `kind = 'reflection'` -- the rows an agent writes ABOUT ITSELF after
-- a run. So the memories with the shortest shelf life were the only ones
-- exempt from shelf life.
--
-- WHAT THAT COST, measured in workspace 0b792d52 on 2026-08-25 03:1x UTC:
--
--   SELECT count(*), count(*) FILTER (WHERE content ILIKE 'you must not%'
--                                        OR content ILIKE 'you must decline%')
--     FROM agent_memory WHERE workspace_id = '0b792d52-...';
--   -- 308 | 53
--
-- 53 standing prohibitions, every one of them recallable forever. They are not
-- abstract: at 03:10:01 the `strategist` recalled four memories before it ran,
-- three of which ordered it to decline, and then it declined and wrote a
-- fifth. `memory_recall_log` has the join. The workspace had reached a state
-- where its own accumulated lessons refused every piece of work put to it.
--
-- The guard below is one line and is copied verbatim from the function beside
-- it, because the two paths reading one table must agree about what is live.
CREATE OR REPLACE FUNCTION public.recent_agent_reflections(for_user uuid, for_agent_slug text, match_count integer DEFAULT 5, for_workspace uuid DEFAULT NULL::uuid, for_account uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, content text, importance integer, metadata jsonb, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  order by m.importance desc, m.created_at desc
  limit greatest(1, least(match_count, 20));
$function$;
