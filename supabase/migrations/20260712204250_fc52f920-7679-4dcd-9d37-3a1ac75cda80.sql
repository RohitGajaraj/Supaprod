create table if not exists public.self_improve_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  mode text not null default 'scheduled' check (mode in ('auto', 'scheduled', 'off')),
  last_auto_run_at timestamptz,
  last_human_touch_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

grant select, insert, update, delete on public.self_improve_settings to authenticated;
grant all on public.self_improve_settings to service_role;

alter table public.self_improve_settings enable row level security;

drop policy if exists "Members read their workspace self-improve settings" on public.self_improve_settings;
create policy "Members read their workspace self-improve settings"
  on public.self_improve_settings for select
  using (
    workspace_id in (
      select workspace_members.workspace_id
      from public.workspace_members
      where workspace_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members insert their workspace self-improve settings" on public.self_improve_settings;
create policy "Members insert their workspace self-improve settings"
  on public.self_improve_settings for insert
  with check (
    workspace_id in (
      select workspace_members.workspace_id
      from public.workspace_members
      where workspace_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members update their workspace self-improve settings" on public.self_improve_settings;
create policy "Members update their workspace self-improve settings"
  on public.self_improve_settings for update
  using (
    workspace_id in (
      select workspace_members.workspace_id
      from public.workspace_members
      where workspace_members.user_id = auth.uid()
    )
  );

drop policy if exists "Service role manages self-improve settings" on public.self_improve_settings;
create policy "Service role manages self-improve settings"
  on public.self_improve_settings for all
  using (auth.role() = 'service_role');