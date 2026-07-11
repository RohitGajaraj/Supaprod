-- RPT-50 (deterministic slice): materialized self-improvement proposals.
--
-- The self-improve tick recomputes each workspace's proposals deterministically
-- (eval pass rates, per-agent human-correction rates, per-playbook win rates;
-- no AI) and upserts them here so the workspace can review, acknowledge, or
-- dismiss them. Owner-only RLS (a per-user signal about the owner's own quality
-- data, not a shared resource), mirroring brain_last_seen / human_gate_events.
-- Forward-only and idempotent.

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

-- The deterministic proposal key: one row per (workspace, kind, subject). Lets the
-- tick upsert idempotently on recompute (refresh title/severity/evidence) while a
-- human's status (acknowledged/dismissed) is preserved, since the upsert omits it.
create unique index if not exists idx_self_improve_proposals_key
  on public.self_improve_proposals (workspace_id, kind, subject_ref);

-- The default read: a workspace's open proposals, newest first.
create index if not exists idx_self_improve_proposals_ws_status_created
  on public.self_improve_proposals (workspace_id, status, created_at desc);
