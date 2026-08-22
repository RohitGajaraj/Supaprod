-- A signal said twice stops being two signals, and stops losing the fact it was said twice.
--
-- NOT YET APPLIED. Written and reported deliberately unapplied, per the brief that
-- produced it. Nothing in the fix depends on it: the sink folds a restatement by NOT
-- INSERTING A ROW, which needs no schema at all. This migration only makes the
-- repetition durable, so "said seven times in twenty minutes" survives past the
-- return value of one function call. Until it is applied the sink's bookkeeping call
-- fails and is swallowed, and the fold still holds.
--
-- WHAT HAPPENED, measured on this database on 2026-08-22. The autonomous loop ran on
-- real customer data for the first time, promoted a theme, and burned the account's
-- whole monthly credit grant in ~80 minutes. The evidence under that theme:
--
--   title                                                        rows  external_id
--   "Users, particularly those in EU timezones, experience sig…"     7  all NULL
--   "Users in EU regions face critical delays of up to 12 hour…"     6  all NULL
--
-- Thirteen rows, all source='agent', all inside 21 minutes, all one workspace. They
-- were two observations. Each sentence had been stored both in full and as a
-- 120-character truncation of itself, and then re-filed: four distinct texts, thirteen
-- rows. `prepare.ts` deduped on `external_id` only and `signals.log` supplies none, so
-- the promotion bar - which asks how many INDEPENDENT signals say this - was answered
-- by repetition.
--
-- THE BAR IS NOT TOUCHED HERE, and that is the point. A bar is only as honest as the
-- units under it, and this makes a unit mean one observation.

-- 1. THE COUNTER, ON THE ROW THAT SURVIVED.
--
--    Not a link table. Storing each restatement as its own row would preserve the
--    variant wording, but it re-creates the exact hazard being closed: N rows about
--    one observation, one careless join away from counting as N units of evidence
--    again. On the incident's own rows the wording it would have preserved was either
--    a byte-identical copy or a prefix truncation, which is not worth re-opening the
--    hole for. A counter cannot be miscounted as evidence, because there is no second
--    row for anything to count.
--
--    DEFAULT 0 AND NOT NULL, so no reader ever has to decide what a null means. A
--    signal nobody has repeated has been repeated zero times; that is a fact, not a
--    missing value, and every "coalesce(restated_count, 0)" this would otherwise
--    scatter through the codebase is a place the default gets forgotten.
alter table public.signals
  add column if not exists restated_count integer not null default 0;

alter table public.signals
  add column if not exists last_restated_at timestamptz;

comment on column public.signals.restated_count is
  'Times this observation was filed again by the same source with no external_id, inside the restatement window, and folded into this row instead of being stored. Evidence quality, never evidence quantity: it must not be summed into any count of independent signals.';

comment on column public.signals.last_restated_at is
  'When this observation was last restated. A high count arriving in minutes is a source misbehaving; the same count spread over weeks is a problem that keeps recurring, and only the timestamp tells them apart.';

-- 2. THE WRITER. One statement, so concurrent folds cannot lose an increment.
--
--    AN RPC RATHER THAN READ-MODIFY-WRITE IN THE APPLICATION. PostgREST cannot
--    express `set c = c + 1`, so the sink's only alternative was to read the count and
--    write count+n. Two ticks folding onto the same row would then both read N and
--    both write N+1. The pathological case this whole fix exists for is precisely one
--    agent hammering one workspace, so that race is the expected condition rather than
--    a corner, and a bookkeeping number that quietly loses increments is a species of
--    bug this repo has already paid for more than once.
--
--    NOT SECURITY DEFINER. It is granted to service_role only, and the sink is the
--    only caller. `recount_theme_frequency` is definer because it runs inside a
--    trigger on behalf of an arbitrary caller and must see rows that caller's RLS
--    hides; this runs as the service role, which already sees everything, so definer
--    would buy nothing and widen the blast radius for free.
create or replace function public.bump_signal_restatement(p_signal_id uuid, p_by integer default 1)
returns void
language sql
set search_path = public
as $$
  update public.signals
     set restated_count  = restated_count + greatest(coalesce(p_by, 1), 1),
         last_restated_at = now()
   where id = p_signal_id;
$$;

revoke execute on function public.bump_signal_restatement(uuid, integer) from public, anon, authenticated;
grant  execute on function public.bump_signal_restatement(uuid, integer) to service_role;

-- 3. THE INDEX THE SCREEN'S OWN QUERY WANTS.
--
--    The sink reads one bounded window per write: (user_id, workspace_id, source),
--    external_id IS NULL, is_sample = false, created_at inside 24 hours, newest first.
--    Measured on this database, that window holds a mean of 3.9 rows, p95 of 14, and a
--    maximum of 146 - the maximum being the incident's own workspace. Small, but read
--    on EVERY signal write, so it must not become a sequential scan of the table as
--    `signals` grows.
--
--    Partial on `external_id is null` because that is the only half the screen ever
--    looks at, and it is 92% of the table today - which is itself the measurement that
--    says the external_id rule was never covering the common case.
create index if not exists signals_restatement_window_idx
  on public.signals (user_id, workspace_id, source, created_at desc)
  where external_id is null;
