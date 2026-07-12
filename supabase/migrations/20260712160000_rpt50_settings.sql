-- RPT-50 increment 2: per-workspace spend + autonomy governance for the
-- self-improvement engine.
--
-- The founder's requirement: give the workspace owner an explicit choice over
-- how much the engine spends and how autonomously it acts, with the trade-offs
-- shown, plus a nudge if it is left off so long the engine dies, plus our own
-- health check. This one row per workspace holds that choice:
--
--   mode = 'auto'      -- real-time: enrich + auto-apply fixes that clear the
--                          safety screen, as flags fire. Human only for exceptions.
--   mode = 'scheduled' -- (DEFAULT) on an interval: enrich open flags so they are
--                          ready for a one-tap human Apply. No unattended apply.
--   mode = 'off'       -- fully manual: the human clicks Explain + Apply. Zero
--                          unattended spend. Nudged if left off too long.
--
-- last_auto_run_at   -- when the tick last did an auto pass (drives the scheduled
--                        interval + the health check).
-- last_human_touch_at -- when a human last drove Explain/Apply (drives staleness).
--
-- Default 'scheduled' keeps the engine alive on a predictable, cost-bounded
-- cadence without ever auto-applying a governance change unattended. Auto is an
-- explicit opt-in (which, per the trust doctrine, IS the human accepting the
-- graduation to unattended apply -- a standing, revocable consent, not a silent
-- flip). RLS mirrors workspace_routine_prefs: members read + set, service role
-- (the tick) manages all.

create table if not exists public.self_improve_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  mode text not null default 'scheduled' check (mode in ('auto', 'scheduled', 'off')),
  last_auto_run_at timestamptz,
  last_human_touch_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

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
