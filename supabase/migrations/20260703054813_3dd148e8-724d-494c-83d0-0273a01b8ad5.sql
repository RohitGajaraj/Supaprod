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
    + case c.metadata->>'verdict' when 'validated' then -0.05 when 'missed' then 0.05 else 0 end
    - (coalesce(c.importance, 3) - 3) * 0.01
    + (1 - exp(-extract(epoch from (now() - coalesce(c.last_used_at, c.created_at))) / 3600.0 / 72.0)) * 0.02
  limit match_count;
$$;