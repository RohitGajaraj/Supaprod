-- 20260820110000_liveness_results_so_coverage_stops_being_capped.sql
--
-- Claude lane, 2026-08-20.
--
-- THE LIVENESS REPORT CANNOT GROW, AND THE LIMIT IS A WORKER'S SUBREQUEST CAP.
--
-- `buildLivenessReport` asks roughly two queries per tracked capability and more
-- per integrity segment. Measured 2026-08-20 by instrumenting the counter:
--
--   agent_memory 14 · artifact_lineage 6 · job_runs 6 · signals 4
--   ai_events 4 · themes 4 · learnings 2 · error_events 2   =  45
--
-- `report.test.ts` asserts <= 45 because a Cloudflare Worker caps outbound
-- subrequests (50 on the free plan) and "a liveness page that trips that ceiling
-- would report nothing at all, which is precisely the failure it exists to
-- catch". **It is sitting exactly on its limit**, and the last of the headroom
-- went this morning when `eval-judging` was registered.
--
-- THE CEILING APPLIES TWICE. `liveness.functions.ts` computes the whole report
-- for the admin page, and `liveness-tick.ts` computes the whole report daily.
-- Both run inside one Worker invocation. So the cap is not the page's problem to
-- route around: **it is a hard limit on how many capabilities this product may
-- ever watch**, currently 13, against 36 scheduled jobs.
--
-- WHAT WAS REJECTED, AND WHY (full reasoning in `claude-log.md`, 10:56):
--
--   * Raising the number. The test says the fix is a cheaper probe rather than a
--     bigger number, and at 50 the page renders nothing.
--   * A generic aggregate RPC taking a table name. That is identifier quoting
--     inside a SECURITY DEFINER function -- an injection surface added to the one
--     module whose job is telling the truth about everything else, to save
--     queries.
--   * PostgREST 12 aggregates. Possibly the cheapest fix and **unverifiable from
--     this seat**: it is Supabase server configuration, this codebase uses
--     aggregates nowhere, and the only database access here executes SQL directly
--     and never goes through PostgREST.
--
-- WHAT THIS TABLE IS FOR.
--
-- One row per capability, holding its last verdict and when it was taken. The
-- tick stops computing the whole report every run and instead checks **the N
-- least-recently-checked capabilities**, upserting their rows. The page stops
-- computing anything and reads these rows in ONE query.
--
-- Three things follow, and the third is the point:
--
--   1. the page can no longer trip the cap, whatever the registry grows to;
--   2. each tick run has a fixed, small query cost regardless of registry size;
--   3. **the registry may grow.** Coverage becomes a question of which
--      capabilities are worth watching rather than how many fit in one
--      invocation, which is the question the registry was written to ask.
--
-- ORDERING BY `checked_at` NULLS FIRST IS THE WHOLE SCHEDULER. A newly registered
-- capability has no row, sorts first, and is checked on the next run. Nothing
-- needs a cursor, nothing needs to remember where it stopped, and a run that dies
-- half way simply leaves those rows older so the next run picks them up. **The
-- absence of state is the feature**; a cursor is a thing that can be wrong.
--
-- WHY NOT A SINGLE REPORT BLOB. `getLivenessReport` takes a `windowDays`
-- parameter from 1 to 90, so one stored report answers exactly one window and
-- every other request would recompute. Per-capability rows carry the window they
-- were measured in, so a non-default window is a live computation and the default
-- is free, which is the split the page actually needs.

create table if not exists public.liveness_results (
  capability_id text primary key,
  kind          text        not null check (kind in ('capability', 'integrity', 'vocabulary')),
  window_days   int         not null,
  verdict       text        not null,
  reason        text        not null,
  detail        jsonb       not null default '{}'::jsonb,
  checked_at    timestamptz not null default now()
);

comment on table public.liveness_results is
  'The last liveness verdict per tracked capability, written by cron.liveness-tick '
  'and read by the admin health surface. Exists because buildLivenessReport asks '
  'about two queries per capability and a Cloudflare Worker caps outbound '
  'subrequests, so computing the whole report in one invocation capped this '
  'product at 13 watchable capabilities against 36 scheduled jobs. The tick now '
  'checks the least-recently-checked few per run and the page reads these rows. '
  'Added 2026-08-20.';

comment on column public.liveness_results.checked_at is
  'When this verdict was taken. Also the scheduler: the tick orders by this '
  'ascending with nulls first, so a newly registered capability has no row, sorts '
  'first, and is picked up on the next run without any cursor to keep correct.';

-- The tick's only read: oldest first. A partial or covering index is pointless at
-- registry scale (tens of rows), but the order is what every run asks for.
create index if not exists liveness_results_checked_at_idx
  on public.liveness_results (checked_at asc);

-- ADMIN-ONLY, matching every other read on this surface. `has_role('admin')` is
-- the same predicate `observability.functions.ts` gates on, and the service role
-- bypasses RLS, which is how the tick writes.
alter table public.liveness_results enable row level security;

drop policy if exists liveness_results_admin_read on public.liveness_results;
create policy liveness_results_admin_read
  on public.liveness_results for select
  using (public.has_role(auth.uid(), 'admin'));

do $$
declare n_tbl int; n_pol int;
begin
  select count(*) into n_tbl from information_schema.tables
   where table_schema = 'public' and table_name = 'liveness_results';
  if n_tbl <> 1 then raise exception 'liveness_results was not created'; end if;

  select count(*) into n_pol from pg_policies
   where schemaname = 'public' and tablename = 'liveness_results';
  if n_pol < 1 then raise exception 'liveness_results has no RLS policy'; end if;
end $$;
