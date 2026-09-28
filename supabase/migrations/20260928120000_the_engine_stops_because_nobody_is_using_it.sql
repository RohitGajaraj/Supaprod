-- THE ENGINE STOPS BECAUSE NOBODY IS USING IT (founder instruction, 2026-09-28).
--
-- R-42 stopped Supaprod product work on 2026-09-23 but left one thing running:
-- the scheduled fleet. Its last line reads "Still the founder's call: pausing the
-- autonomous engine's scheduled jobs, which spend model credits on a product with
-- no users." He made that call on 2026-09-28. This is it.
--
-- WHAT WAS RUNNING. 20260909050000 defines 36 HTTP tick jobs plus
-- `reap-stuck-job-runs`, and 20260909070000 adds `health-warm-tick`. Four of them
-- fire every minute or every other minute (`approvals-tick`, `event-reactor-tick`,
-- `resume-runs` at `* * * * *`; `ci-poll-tick` and `fanout-reconcile-tick` at
-- `*/2`), and `health-warm-tick` every four. Each POSTs a hook on supaprod.ai that
-- can reach the model chokepoint. Measured usage on the other side of that spend,
-- from A1-REPORT.md §1.2 and session-handoff.md: 16 auth users, 4 real identities,
-- no human sign-in since 2026-07-19, zero revenue.
--
-- WHY IT UNSCHEDULES EVERYTHING RATHER THAN A NAMED LIST. The named list in
-- 20260909050000 was accurate to production on 2026-09-03 and is already one job
-- short (`health-warm-tick` landed two days later). A loop over `cron.job` cannot
-- go stale, and the guard below fails the migration if anything survives. Stopping
-- some of the fleet would be worse than stopping none, because the remaining spend
-- would look like a bug rather than a decision.
--
-- REVERSIBLE, AND HERE IS THE EXACT REVERSAL. Nothing is dropped: the hooks, the
-- handlers, the secret function and every scheduling migration stay in the tree.
-- To restore the fleet, re-run the two migrations that define it, in this order:
--   \i supabase/migrations/20260909050000_the_cron_jobs_are_defined_where_a_replay_would_find_them.sql
--   \i supabase/migrations/20260909070000_a_ping_every_four_minutes_keeps_the_isolate_warm.sql
-- Both are idempotent (`cron.unschedule` then `cron.schedule` by name), which is
-- why this file does not need to record the 38 schedules itself.
--
-- ON A FULL REPLAY this is dated after every scheduling migration, so a rebuilt
-- database ends with an empty `cron.job`. That is intended: a replay of a stopped
-- product should not wake up spending money.

DO $$
DECLARE
  j record;
  removed int := 0;
BEGIN
  FOR j IN SELECT jobid, jobname FROM cron.job LOOP
    PERFORM cron.unschedule(j.jobid);
    removed := removed + 1;
    RAISE NOTICE 'unscheduled cron job % (%)', j.jobname, j.jobid;
  END LOOP;

  RAISE NOTICE 'the engine is stopped: % scheduled job(s) removed', removed;
END $$;

-- THE GUARD, in the same shape 20260909050000 uses: a migration that silently
-- leaves half the fleet running is worse than one that fails loudly at apply time.
DO $$
DECLARE
  survivors int;
  names text;
BEGIN
  SELECT count(*), coalesce(string_agg(jobname, ', ' ORDER BY jobname), '')
    INTO survivors, names
    FROM cron.job;

  IF survivors > 0 THEN
    RAISE EXCEPTION 'engine not stopped: % scheduled job(s) survive (%)', survivors, names;
  END IF;
END $$;
