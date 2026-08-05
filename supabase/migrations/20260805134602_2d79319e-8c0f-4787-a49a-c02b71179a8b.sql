-- Guardrails become workspace policy, which is what the product already claims.
alter table public.guardrail_rules
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;

update public.guardrail_rules r
   set workspace_id = coalesce(
     (select m.workspace_id
        from public.workspace_members m
       where m.user_id = r.user_id
       order by m.created_at asc
       limit 1),
     (select w.id from public.workspaces w where w.owner_id = r.user_id order by w.created_at asc limit 1)
   )
 where r.workspace_id is null;

do $$
declare orphans int;
begin
  select count(*) into orphans from public.guardrail_rules where workspace_id is null;
  if orphans > 0 then
    raise exception '% guardrail rules could not be placed in a workspace; resolve before tightening', orphans;
  end if;
end $$;

alter table public.guardrail_rules alter column workspace_id set not null;
alter table public.guardrail_rules
  alter column workspace_id set default public.current_user_default_workspace();

create index if not exists guardrail_rules_workspace_enabled_idx
  on public.guardrail_rules (workspace_id, enabled);

alter table public.guardrail_rules enable row level security;
drop policy if exists "own guardrail_rules all" on public.guardrail_rules;
drop policy if exists "guardrail_rules ws read" on public.guardrail_rules;
drop policy if exists "guardrail_rules ws write" on public.guardrail_rules;

create policy "guardrail_rules ws read" on public.guardrail_rules
  for select using (public.is_workspace_member(workspace_id));
create policy "guardrail_rules ws write" on public.guardrail_rules
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

do $$
declare n int; helio uuid; visible int;
begin
  select count(*) into n from public.guardrail_rules where workspace_id is null;
  if n <> 0 then raise exception '% guardrail rules still have no workspace', n; end if;

  select id into helio from public.workspaces where name ilike '%helio%' limit 1;
  if helio is not null then
    select count(*) into visible from public.guardrail_rules where workspace_id = helio and enabled;
    raise notice 'Helio Labs now sees % enabled guardrails (was reported as 0)', visible;
  end if;
end $$;