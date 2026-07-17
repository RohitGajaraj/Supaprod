alter table public.opportunities
  add column if not exists linked_brief_item_id uuid
    references public.brief_items (id) on delete set null;

create index if not exists opportunities_linked_brief_item_idx
  on public.opportunities (linked_brief_item_id)
  where linked_brief_item_id is not null;