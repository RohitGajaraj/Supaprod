-- SW-4 / mission 3.10 LOOP MODE: hidden crons promoted to user-owned loops.
--
-- A loop is a governed recurring mission: the user owns it, sees every run
-- (loop_runs history) and what each run cost, and holds the pause switch.
-- The kinds wrap passes the platform already runs as hidden crons (the
-- strategy brief sweep, signal re-clustering, outcome reviews); the loop
-- makes them visible, workspace-scoped, and cadence-controlled.
-- stage_events already accepts entity_type='loop' (seam-1 forward-wired it).

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

-- The tick scans due loops oldest-due-first (the goals partial-index idiom).
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

-- Run history: one row per pass, carrying its cost. job_runs stays the
-- admin-only infra ledger; loop_runs is the user-visible receipt.
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

-- loop-tick: every 10 minutes, sweep due active loops (5 per tick, bounded
-- in the handler). Mirrors the goal-tick registration shape.
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
