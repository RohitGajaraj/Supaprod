create table if not exists public.human_gate_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  gate_type text not null check (gate_type in ('approval', 'rejection', 'edit', 'override')),
  subject_type text not null,
  subject_ref text,
  agent_slug text,
  tool_name text,
  verdict text,
  diff_summary text,
  created_at timestamptz not null default now()
);

alter table public.human_gate_events enable row level security;

drop policy if exists "users manage their own human_gate_events" on public.human_gate_events;
create policy "users manage their own human_gate_events"
  on public.human_gate_events
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.human_gate_events to authenticated;
grant all on public.human_gate_events to service_role;

create index if not exists idx_human_gate_events_ws_created
  on public.human_gate_events (workspace_id, created_at desc);
create index if not exists idx_human_gate_events_user_created
  on public.human_gate_events (user_id, created_at desc);
create index if not exists idx_human_gate_events_agent
  on public.human_gate_events (user_id, agent_slug);