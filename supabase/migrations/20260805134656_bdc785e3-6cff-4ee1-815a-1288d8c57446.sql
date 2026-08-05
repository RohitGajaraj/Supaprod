-- Retire the "[auto] " title marker in favour of a real provenance column.
alter table public.decisions
  add column if not exists auto_origin boolean not null default false;

comment on column public.decisions.auto_origin is
  'True when the ambient trigger raised this decision rather than a human. Replaces the retired "[auto] " title prefix; read this, never the title.';

update public.decisions
   set auto_origin = true
 where title like '[auto] %'
   and auto_origin = false;

update public.missions
   set auto_trigger_source = 'trigger'
 where title like '[auto] %'
   and auto_trigger_source is null;

update public.decisions
   set title = regexp_replace(title, '^\[auto\]\s*', '')
 where title like '[auto] %';

update public.missions
   set title = regexp_replace(title, '^\[auto\]\s*', '')
 where title like '[auto] %';

create index if not exists missions_auto_trigger_source_idx
  on public.missions (workspace_id, auto_trigger_source)
  where auto_trigger_source is not null;