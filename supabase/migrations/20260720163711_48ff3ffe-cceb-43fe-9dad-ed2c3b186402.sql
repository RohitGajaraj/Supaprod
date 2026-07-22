alter table public.memory_candidates
  add column if not exists source_conversation_id uuid
    references public.conversations(id) on delete set null;

create index if not exists memory_candidates_source_conversation_idx
  on public.memory_candidates (source_conversation_id);