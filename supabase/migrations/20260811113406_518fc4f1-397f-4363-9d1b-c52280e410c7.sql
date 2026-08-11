delete from public.artifact_lineage
 where seeded is true
   and parent_kind = 'learning'
   and child_kind in ('deployment', 'prd');

delete from public.artifact_lineage
 where seeded is true
   and parent_kind = 'decision'
   and child_kind = 'prd';

update public.artifact_lineage
   set relation = 'produced'
 where seeded is true
   and parent_kind = 'mission'
   and child_kind = 'changeset'
   and relation = 'promoted';

update public.artifact_lineage
   set relation = 'deployed'
 where seeded is true
   and parent_kind = 'changeset'
   and child_kind = 'deployment'
   and relation = 'promoted';

do $$
declare
  v_left bigint;
begin
  select count(*) into v_left
    from public.artifact_lineage
   where (parent_kind = 'learning' and child_kind in ('deployment', 'prd'))
      or (parent_kind = 'decision' and child_kind = 'prd')
      or (parent_kind in ('mission', 'changeset') and relation = 'promoted');
  raise notice 'impossible or mislabelled seeded hops remaining: %', v_left;
end $$;

insert into supabase_migrations.schema_migrations (version, name)
values ('20260811110000', 'the_demo_walked_a_graph_the_product_cannot_write')
on conflict (version) do nothing;