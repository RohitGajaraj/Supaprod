create or replace function public.is_production_workspace(_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
      from public.workspaces w
      join auth.users u on u.id = w.owner_id
     where w.id = _workspace_id
       and w.is_sample is not true
       and u.email <> all (public.demo_account_emails())
       and u.email not like '%@redcadence.app'
  );
$fn$;

comment on function public.is_production_workspace(uuid) is
  'True only when a workspace is provably NOT a demo: not flagged is_sample AND not owned by a demo-allowlist account AND not owned by a retired redcadence.app login. Fails closed on an unknown, orphaned or unresolvable workspace. Use this rather than reading is_sample directly: the product auto-creates workspaces for demo accounts and nothing flags those.';

create or replace function public.production_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $fn$
  select w.id
    from public.workspaces w
    join auth.users u on u.id = w.owner_id
   where w.is_sample is not true
     and u.email <> all (public.demo_account_emails())
     and u.email not like '%@redcadence.app';
$fn$;

comment on function public.production_workspace_ids() is
  'The allowlist form of is_production_workspace, for callers that need to scope a query with IN rather than test one id. An ALLOWLIST on purpose: a blocklist admits whatever it has not heard of, which is how six fixture workspaces and one orphan came to be counted as production.';

grant execute on function public.is_production_workspace(uuid) to authenticated;
grant execute on function public.production_workspace_ids() to authenticated;

do $$
declare
  v_all bigint;
  v_prod bigint;
begin
  select count(*) into v_all from public.workspaces;
  select count(*) into v_prod from public.production_workspace_ids();
  raise notice 'workspaces: % total, % production, % demo or test', v_all, v_prod, v_all - v_prod;
end $$;

insert into supabase_migrations.schema_migrations (version, name)
values ('20260811120000', 'a_demo_account_kept_making_workspaces_nobody_flagged')
on conflict (version) do nothing;