update public.workspaces
   set is_sample = true
 where is_sample is distinct from true
   and name = 'Helio Labs'
   and id::text like '_0000000-0000-4000-8000-000000000000';

do $$
declare
  v_flagged bigint;
  v_graded  bigint;
begin
  select count(*) into v_flagged
    from public.workspaces
   where is_sample is true;

  select count(*) into v_graded
    from public.learnings l
   where l.verdict is not null
     and l.workspace_id in (select id from public.workspaces where is_sample is not true);

  raise notice 'workspaces flagged as sample: % · graded outcomes now counted as real: %',
    v_flagged, v_graded;
end $$;

insert into supabase_migrations.schema_migrations (version, name)
values ('20260811100000', 'six_fixture_workspaces_said_they_were_real')
on conflict (version) do nothing;