-- A re-run was indistinguishable from a first attempt.
--
-- The product brief asks every agent run to report five signals: outcome,
-- retries, abandonment, time to first result, and station. Four are real.
-- `run-analytics.ts` has been returning a hardcoded `retriesNotMeasured: true`
-- for the fifth, because `agent_runs` carries no attempt counter and no parent
-- reference, so nothing on the row can tell a second try from a first.
--
-- MEASURED ON PRODUCTION, 2026-08-10, BEFORE WRITING A LINE OF THIS.
-- The retry MECHANISMS are all already built. What is missing is the record on
-- the run:
--
--   * mission_steps.attempts / max_attempts / next_retry_at  — bounded per-hop
--     retry, wired end to end since 20260614090000. 291 steps: 187 at one
--     attempt, 97 never dispatched, 7 at two. All seven of those are SEEDED demo
--     rows (ids matching '_0000000-2a02-4000-8000-000000000005', agent 'qa',
--     from the Helio seed, whose own comment says "passed on the retry, which is
--     why attempts = 2"). No real mission step has ever been retried.
--   * dispatchReadySteps already computes `attemptNo` and puts it in the handoff
--     payload as `context.attempt`. 75 of 99 handoff messages carry it. Every
--     single one carries the value 1.
--   * event_queue.attempt_count — the reactor's bounded re-dispatch. 10 rows
--     have retried. Each retry calls runAgentLoop and creates a BRAND NEW
--     agent_runs row, and nothing on that row says it is a second attempt.
--   * studio_changesets.fix_attempts — the red-CI autofix budget. 1 changeset
--     has consumed it, to a depth of 2. That path writes "Attempt 2 of 3" into
--     the run's goal PROSE and nowhere queryable.
--
-- So retries happen, they are counted by whoever DISPATCHES, and the count dies
-- at the run boundary. Deriving them after the fact is not available either:
-- only 145 of 1,232 runs are reachable from mission_steps.run_id, and that
-- pointer holds the LATEST attempt, so a retried step overwrites its own link to
-- the attempt before it.
--
-- WHY TWO COLUMNS AND NOT THREE. A `retry_of_run_id` parent link was considered
-- and declined. The only sources for it are `step.run_id` and `evt.run_id`, both
-- of which are single-slot pointers that the retry path overwrites, and
-- mission-advance.server.ts already documents the intended follow-up fix as
-- "`run_id: null` here is the one to take afterwards" — which would silently
-- null the parent link the day it lands. A column whose only feeder is scheduled
-- for removal is a column that starts lying on a date nobody will notice.
--
-- WHY `resume_count` IS NOT A RETRY, AND IS STILL WORTH THE COLUMN. A resume
-- continues the SAME run from its checkpoint; a retry starts a NEW run at the
-- same work. They are different questions and the analytics keeps them apart by
-- name. 1,117 of 1,232 runs have checkpoints, so resumption is the common path
-- and its frequency is the closest thing the loop can measure about itself
-- without a dispatcher's cooperation.
--
-- SAFETY. Additive and nullable, no default and no backfill, on a table with
-- 1,232 live rows. In Postgres 11+ that is a catalog-only change: no table
-- rewrite, no row locks held for the scan, nothing to undo. Existing rows stay
-- NULL, which is the true statement about them — nobody was counting.

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS attempt integer;

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS resume_count integer;

COMMENT ON COLUMN public.agent_runs.attempt IS
  'Which attempt at this unit of work this run is, 1-based. Written ONLY by a dispatcher that genuinely counts attempts (the reactor from event_queue.attempt_count, an orchestrated hop from mission_steps.attempts). NULL means nobody counted, and must render as "not measured" -- never as 1. runAgentLoop deliberately does NOT default it: a caller re-running the same goal by hand is not attempt 1, and a run cannot verify its own ordinal.';

COMMENT ON COLUMN public.agent_runs.resume_count IS
  'How many times a worker picked this run back up AFTER it had already begun -- eviction recovery and post-approval continuation. NOT a retry: a retry is a different run at the same work. 0 is a real measurement (created instrumented, never resumed); NULL is the absence of one. Set to 0 at creation by the instrumented insert paths and incremented by resumeAgentLoop; a NULL is never promoted to a number, because a count that did not start at birth is a lower bound, not a count.';
