alter table public.decisions drop constraint if exists decisions_source_kind_check;

alter table public.decisions add constraint decisions_source_kind_check
  check (
    source_kind is null
    or source_kind = any (array[
      'meeting'::text,'mission'::text,'prd'::text,'manual'::text,'roadmap'::text,
      'retrospective'::text,'critic'::text,'opportunity'::text,'mcp'::text,'agent'::text
    ])
  );

insert into supabase_migrations.schema_migrations (version, name)
values ('20260811140000', 'the_decide_stations_own_hand_could_never_write')
on conflict (version) do nothing;