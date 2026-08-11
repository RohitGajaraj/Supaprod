update public.themes t
   set status = 'promoted'
 where t.status not in ('dismissed', 'merged', 'promoted')
   and exists (
     select 1 from public.spine_tracks st where st.theme_id = t.id
   );

do $$
declare
  v_stranded bigint;
begin
  select count(*) into v_stranded
    from public.themes t
   where t.status not in ('dismissed', 'merged', 'promoted')
     and exists (select 1 from public.spine_tracks st where st.theme_id = t.id);
  raise notice 'themes with a track still offered in the queue: %', v_stranded;
end $$;

insert into supabase_migrations.schema_migrations (version, name)
values ('20260811130000', 'forty_two_clusters_asked_a_human_about_work_already_running')
on conflict (version) do nothing;