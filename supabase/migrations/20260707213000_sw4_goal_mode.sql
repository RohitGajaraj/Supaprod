-- SW-4 / mission 3.10 GOAL MODE: standing objectives the swarm keeps working.
--
-- A goal is the user's stated outcome ("grow activation 15% this quarter").
-- It never executes anything itself: the goal-tick cron re-plans against
-- active goals, and each pass proposes AT MOST one new opportunity into
-- Decide per goal per day, linked via opportunities.goal_id so progress is
-- traceable end to end. HITL stays exactly at the existing gates (the
-- proposal lands in the Decide queue like any other opportunity).
--
-- stage_events already accepts entity_type='goal' (seam-1 forward-wired it);
-- this migration adds the entity table that history was reserved for.

create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid(),
  workspace_id   uuid not null default public.current_user_default_workspace()
                   references public.workspaces (id) on delete cascade,
  title          text not null,
  description    text,
  target_metric  text,
  target_date    date,
  status         text not null default 'active'
                   check (status in ('active', 'paused', 'achieved', 'archived')),
  last_worked_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- The tick scans active goals oldest-worked-first (the auto_* cron idiom:
-- partial index so the queue query stays cheap at any table size).
create index if not exists goals_active_worked_idx
  on public.goals (last_worked_at asc nulls first)
  where status = 'active';
create index if not exists goals_ws_idx
  on public.goals (workspace_id, status, created_at desc);

alter table public.goals enable row level security;

grant select, insert, update, delete on public.goals to authenticated;
grant all on public.goals to service_role;

drop policy if exists "goals ws read" on public.goals;
create policy "goals ws read"
  on public.goals for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "goals ws write" on public.goals;
create policy "goals ws write"
  on public.goals for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Goal-driven proposals land in Decide carrying their provenance.
alter table public.opportunities
  add column if not exists goal_id uuid references public.goals (id) on delete set null;
create index if not exists opportunities_goal_idx
  on public.opportunities (goal_id)
  where goal_id is not null;

-- goal-tick: every 20 minutes, bounded (5 goals per tick, 1 proposal per
-- goal per 24h enforced in the handler). Mirrors the house-rules-tick shape.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'goal-tick';
  PERFORM cron.schedule(
    'goal-tick',
    '*/20 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/goal-tick')
  );
END $$;
