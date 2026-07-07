-- Apply 4 pending migrations from the repo (files 20260708120000, 20260708140000, 20260708150000, 20260708170000)

-- ============================================================================
-- 20260708120000_stage_events_signal_entity.sql
-- Widen stage_events.entity_type to accept 'signal'.
-- ============================================================================
ALTER TABLE public.stage_events
  DROP CONSTRAINT IF EXISTS stage_events_entity_type_check;

ALTER TABLE public.stage_events
  ADD CONSTRAINT stage_events_entity_type_check
  CHECK (entity_type IN ('spec', 'mission', 'opportunity', 'theme', 'decision', 'goal', 'loop', 'signal'));

-- ============================================================================
-- 20260708140000_sw6_ai_budget_ledger_guard.sql
-- Revoke DELETE on ai_budgets from authenticated to prevent cap bypass.
-- ============================================================================
revoke delete on public.ai_budgets from authenticated;

-- ============================================================================
-- 20260708150000_sw4_loop_mode.sql
-- Loops + loop_runs tables, RLS, policies, and pg_cron loop-tick job.
-- ============================================================================
create table if not exists public.loops (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid(),
  workspace_id uuid not null default public.current_user_default_workspace()
                 references public.workspaces (id) on delete cascade,
  kind         text not null
                 check (kind in ('competitor_sweep', 'signal_recluster', 'outcome_review')),
  title        text not null,
  cadence      text not null default 'daily'
                 check (cadence in ('hourly', 'daily', 'weekly')),
  status       text not null default 'active'
                 check (status in ('active', 'paused', 'archived')),
  last_run_at  timestamptz,
  next_run_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists loops_due_idx
  on public.loops (next_run_at asc)
  where status = 'active';
create index if not exists loops_ws_idx
  on public.loops (workspace_id, status, created_at desc);

alter table public.loops enable row level security;

grant select, insert, update, delete on public.loops to authenticated;
grant all on public.loops to service_role;

drop policy if exists "loops ws read" on public.loops;
create policy "loops ws read"
  on public.loops for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "loops ws write" on public.loops;
create policy "loops ws write"
  on public.loops for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create table if not exists public.loop_runs (
  id            uuid primary key default gen_random_uuid(),
  loop_id       uuid not null references public.loops (id) on delete cascade,
  user_id       uuid not null,
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'running'
                  check (status in ('running', 'ok', 'error')),
  summary       text,
  error_message text,
  tokens        integer,
  cost_usd      numeric(12, 6),
  created_at    timestamptz not null default now()
);

create index if not exists loop_runs_loop_idx
  on public.loop_runs (loop_id, started_at desc);

alter table public.loop_runs enable row level security;

grant select, insert, update on public.loop_runs to authenticated;
grant all on public.loop_runs to service_role;

drop policy if exists "loop_runs ws read" on public.loop_runs;
create policy "loop_runs ws read"
  on public.loop_runs for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "loop_runs ws insert" on public.loop_runs;
create policy "loop_runs ws insert"
  on public.loop_runs for insert
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "loop_runs ws update" on public.loop_runs;
create policy "loop_runs ws update"
  on public.loop_runs for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'loop-tick';
  PERFORM cron.schedule(
    'loop-tick',
    '*/10 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/loop-tick')
  );
END $$;

-- ============================================================================
-- 20260708170000_sw4_design_station.sql
-- Design gate columns on prds + design_stage_enabled toggle on workspaces.
-- ============================================================================
alter table public.prds
  add column if not exists design_gate_status text not null default 'pending'
    check (design_gate_status in ('pending', 'approved', 'rejected')),
  add column if not exists design_decided_by uuid,
  add column if not exists design_decided_at timestamptz;

alter table public.workspaces
  add column if not exists design_stage_enabled boolean not null default true;