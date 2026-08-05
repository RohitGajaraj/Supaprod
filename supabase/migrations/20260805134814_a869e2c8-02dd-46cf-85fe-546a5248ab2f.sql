-- The invite dropdown promises four roles. The database enforced one.

-- 1. guardrail_rules
drop policy if exists "guardrail_rules ws write" on public.guardrail_rules;
drop policy if exists "guardrail_rules manager insert" on public.guardrail_rules;
drop policy if exists "guardrail_rules manager update" on public.guardrail_rules;
drop policy if exists "guardrail_rules manager delete" on public.guardrail_rules;

create policy "guardrail_rules manager insert" on public.guardrail_rules
  for insert
  with check (public.can_manage_workspace(workspace_id));

create policy "guardrail_rules manager update" on public.guardrail_rules
  for update
  using (public.can_manage_workspace(workspace_id))
  with check (public.can_manage_workspace(workspace_id));

create policy "guardrail_rules manager delete" on public.guardrail_rules
  for delete
  using (public.can_manage_workspace(workspace_id));

-- 2. house_rules
drop policy if exists "house_rules ws write" on public.house_rules;
drop policy if exists "house_rules draft or manage insert" on public.house_rules;
drop policy if exists "house_rules manager update" on public.house_rules;
drop policy if exists "house_rules manager delete" on public.house_rules;

create policy "house_rules draft or manage insert" on public.house_rules
  for insert
  with check (
    public.can_manage_workspace(workspace_id)
    or (
      public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
      and status = 'pending'
    )
  );

create policy "house_rules manager update" on public.house_rules
  for update
  using (public.can_manage_workspace(workspace_id))
  with check (public.can_manage_workspace(workspace_id));

create policy "house_rules manager delete" on public.house_rules
  for delete
  using (public.can_manage_workspace(workspace_id));

-- 3. agent_tools
drop policy if exists "agent_tools own read" on public.agent_tools;
create policy "agent_tools own read" on public.agent_tools
  for select
  using (auth.uid() = user_id and public.is_workspace_member(workspace_id));

drop policy if exists "own agent_tools in member workspace" on public.agent_tools;
drop policy if exists "own agent_tools all" on public.agent_tools;
drop policy if exists "agent_tools manager insert" on public.agent_tools;
drop policy if exists "agent_tools manager update" on public.agent_tools;
drop policy if exists "agent_tools manager delete" on public.agent_tools;

create policy "agent_tools manager insert" on public.agent_tools
  for insert
  with check (auth.uid() = user_id and public.can_manage_workspace(workspace_id));

create policy "agent_tools manager update" on public.agent_tools
  for update
  using (auth.uid() = user_id and public.can_manage_workspace(workspace_id))
  with check (auth.uid() = user_id and public.can_manage_workspace(workspace_id));

create policy "agent_tools manager delete" on public.agent_tools
  for delete
  using (auth.uid() = user_id and public.can_manage_workspace(workspace_id));

-- 4. ai_budgets and ai_surface_budgets
drop policy if exists "ai_budgets ws insert" on public.ai_budgets;
drop policy if exists "ai_budgets owner update" on public.ai_budgets;
drop policy if exists "ai_budgets owner delete" on public.ai_budgets;

create policy "ai_budgets ws insert" on public.ai_budgets
  for insert
  with check (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

create policy "ai_budgets owner update" on public.ai_budgets
  for update
  using (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  )
  with check (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

create policy "ai_budgets owner delete" on public.ai_budgets
  for delete
  using (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

drop policy if exists "ai_surface_budgets ws insert" on public.ai_surface_budgets;
drop policy if exists "ai_surface_budgets owner update" on public.ai_surface_budgets;
drop policy if exists "ai_surface_budgets owner delete" on public.ai_surface_budgets;

create policy "ai_surface_budgets ws insert" on public.ai_surface_budgets
  for insert
  with check (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

create policy "ai_surface_budgets owner update" on public.ai_surface_budgets
  for update
  using (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  )
  with check (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

create policy "ai_surface_budgets owner delete" on public.ai_surface_budgets
  for delete
  using (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

-- 5. Guard.
do $$
declare
  leftover text;
  missing text;
  reads int;
begin
  select string_agg(format('%s.%s', tablename, policyname), ', ')
    into leftover
    from pg_policies
   where schemaname = 'public'
     and tablename in ('guardrail_rules', 'house_rules', 'agent_tools',
                       'ai_budgets', 'ai_surface_budgets')
     and cmd <> 'SELECT'
     and coalesce(qual, '') || coalesce(with_check, '') like '%is_workspace_member%'
     and coalesce(qual, '') || coalesce(with_check, '') not like '%has_workspace_role%'
     and coalesce(qual, '') || coalesce(with_check, '') not like '%can_manage_workspace%';
  if leftover is not null then
    raise exception 'membership-only write policy still open after tightening: %', leftover;
  end if;

  select string_agg(want.name, ', ')
    into missing
    from (values
      ('guardrail_rules', 'guardrail_rules manager insert'),
      ('guardrail_rules', 'guardrail_rules manager update'),
      ('guardrail_rules', 'guardrail_rules manager delete'),
      ('house_rules', 'house_rules draft or manage insert'),
      ('house_rules', 'house_rules manager update'),
      ('house_rules', 'house_rules manager delete'),
      ('agent_tools', 'agent_tools own read'),
      ('agent_tools', 'agent_tools manager insert'),
      ('agent_tools', 'agent_tools manager update'),
      ('agent_tools', 'agent_tools manager delete'),
      ('ai_budgets', 'ai_budgets ws insert'),
      ('ai_budgets', 'ai_budgets owner update'),
      ('ai_budgets', 'ai_budgets owner delete'),
      ('ai_surface_budgets', 'ai_surface_budgets ws insert'),
      ('ai_surface_budgets', 'ai_surface_budgets owner update'),
      ('ai_surface_budgets', 'ai_surface_budgets owner delete')
    ) as want(tbl, name)
   where not exists (
     select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = want.tbl and p.policyname = want.name
   );
  if missing is not null then
    raise exception 'policies missing after migration: %', missing;
  end if;

  select count(distinct tablename) into reads
    from pg_policies
   where schemaname = 'public'
     and cmd = 'SELECT'
     and tablename in ('guardrail_rules', 'house_rules', 'agent_tools',
                       'ai_budgets', 'ai_surface_budgets');
  if reads <> 5 then
    raise exception 'a tightened table lost its read policy: only % of 5 still have one', reads;
  end if;

  raise notice 'Role-aware writes installed. A viewer now reads everything and writes none of it.';
end $$;