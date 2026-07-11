-- RPT-32: log the human at every gate.
-- Every human decision on an agent's draft (approval, rejection, edit, override)
-- is captured as a first-class event so the agent-draft vs human-approved diff
-- becomes a ranking signal rather than being lost. agent_approvals already holds
-- the raw approve/reject status; this table adds the attribution + the edit/
-- override signal + a durable, queryable log the flywheel reads. Owner-only RLS
-- (a per-user signal, not a shared resource), additive and idempotent.

create table if not exists public.human_gate_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  -- what the human did at the gate
  gate_type text not null check (gate_type in ('approval', 'rejection', 'edit', 'override')),
  -- what the gate was about
  subject_type text not null,
  subject_ref text,
  -- attribution: which agent/tool produced the draft the human judged
  agent_slug text,
  tool_name text,
  -- the resolved verdict + a short human-readable summary of any change
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

-- Recent-activity reads (per workspace), the default per-user recent read
-- (getGateSignals), and per-agent correction-rate rollups.
create index if not exists idx_human_gate_events_ws_created
  on public.human_gate_events (workspace_id, created_at desc);
create index if not exists idx_human_gate_events_user_created
  on public.human_gate_events (user_id, created_at desc);
create index if not exists idx_human_gate_events_agent
  on public.human_gate_events (user_id, agent_slug);
