create table if not exists public.self_improve_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('eval', 'agent', 'playbook')),
  severity text not null check (severity in ('high', 'medium', 'low')),
  title text not null,
  detail text,
  evidence text,
  subject_ref text,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.self_improve_proposals enable row level security;

drop policy if exists "users manage their own self_improve_proposals" on public.self_improve_proposals;
create policy "users manage their own self_improve_proposals"
  on public.self_improve_proposals
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.self_improve_proposals to authenticated;
grant all on public.self_improve_proposals to service_role;

create unique index if not exists idx_self_improve_proposals_key
  on public.self_improve_proposals (workspace_id, kind, subject_ref);

create index if not exists idx_self_improve_proposals_ws_status_created
  on public.self_improve_proposals (workspace_id, status, created_at desc);