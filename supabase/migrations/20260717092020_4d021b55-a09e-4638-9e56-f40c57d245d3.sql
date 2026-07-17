drop function if exists public.match_rag_chunks(vector, uuid, integer, text[], uuid);

create or replace function public.match_rag_chunks(
  query_embedding vector, for_user uuid, match_count integer default 8,
  source_kinds text[] default null, for_product uuid default null,
  for_source_id uuid default null
)
returns table(id uuid, source_kind text, source_id uuid, title text, content text,
              chunk_index integer, metadata jsonb, similarity double precision)
language sql stable security definer set search_path to 'public' as $$
  select c.id, c.source_kind, c.source_id, c.title, c.content, c.chunk_index, c.metadata,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.rag_chunks c
  where c.user_id = auth.uid()
    and public.is_workspace_member(c.workspace_id)
    and (for_product is null or c.product_id = for_product)
    and (for_source_id is null or c.source_id = for_source_id)
    and c.embedding is not null
    and (source_kinds is null or c.source_kind = any(source_kinds))
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_rag_chunks(vector, uuid, integer, text[], uuid, uuid) from public, anon;
grant execute on function public.match_rag_chunks(vector, uuid, integer, text[], uuid, uuid) to authenticated;