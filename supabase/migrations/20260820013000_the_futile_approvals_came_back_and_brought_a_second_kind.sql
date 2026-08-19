-- 20260820013000_the_futile_approvals_came_back_and_brought_a_second_kind.sql
--
-- Claude lane, 2026-08-20. Follows 20260803170000_clear_futile_cluster_approvals.sql
-- exactly, in method and in reasoning, because that migration was right and this
-- is the same defect twice.
--
-- THE FUTILE APPROVALS CAME BACK, AND BROUGHT A SECOND KIND WITH THEM.
--
-- ================================================================= PART 1 ===
-- cluster.trigger, AGAIN. THE 2026-08-03 FIX REGRESSED AND NOTHING SAID SO.
--
-- That migration cancelled 24 pending `cluster.trigger` approvals and stated,
-- in its own words, "THE CAUSE IS FIXED SEPARATELY AND FIRST ... So no new row
-- of this kind can be created." Measured today:
--
--   select count(*) from agent_approvals
--    where status='cancelled' and tool_name='cluster.trigger';   -- 24, that fix
--   select count(*), min(created_at), max(created_at) from agent_approvals
--    where status='pending' and tool_name='cluster.trigger';
--     -- 18, between 2026-08-17 22:11 and 2026-08-19 08:40
--
-- **Eighteen new ones, in a two-day window, two weeks after the cause was
-- "fixed".** The defaults change did happen and was not enough, because
-- `loop.server.ts:186` demotes a tool back to `confirm` whenever
-- `isHighRiskTool()` says high, and `toolRisk()` FAILED CLOSED TO HIGH for any
-- tool with no catalogue row. `cluster.trigger` had no row. So the default said
-- auto, the risk table said high, and the risk table won on every run.
--
-- **K-11 is what actually closes it**, and it landed on 2026-08-20: all 59
-- registered tools now carry a row, `toolRisk('cluster.trigger')` returns `low`,
-- and the demotion cannot fire. Verified by execution, not by reading the table.
-- This migration is safe to run only because that is already true; running it
-- before K-11 would have cleared a backlog that immediately refilled, which is
-- what happened last time.
--
-- AND EVERY ONE IS STILL FUTILE, measured the same way the first migration
-- measured it rather than assumed:
--
--   select a.workspace_id, count(*),
--          (select count(*) from signals s
--            where s.workspace_id = a.workspace_id and s.theme_id is null)
--     from agent_approvals a
--    where a.status='pending' and a.tool_name='cluster.trigger'
--    group by a.workspace_id;
--
-- Six workspaces hold the 18, and **every one of them has zero unclustered
-- signals**. So all 18 would return `{"themes": 0, "message": "No unclustered
-- signals."}`, which is the exact payload the 2026-08-03 migration recorded from
-- walking the live product.
--
-- ================================================================= PART 2 ===
-- changelog.publish: SEVEN APPROVALS FOR A TOOL THAT DOES NOT EXIST.
--
-- The 2026-08-03 migration deliberately left these alone, and said so: "the
-- changelog.publish, memory.promote, studio.pr.merge, mission.dispatch and
-- backlog.prioritize rows are real decisions a human still owns." **That was true
-- when written and is no longer true for one of the five.**
--
--   grep -rn 'changelog\.' src/lib/ai/tools/ src/lib/tool-consequences.ts   -- nothing
--
-- `changelog.publish` is in no registry, no catalogue and no risk profile. The
-- tool was removed or renamed after those rows were raised. **Approving one now
-- would dispatch a call to a name that does not resolve.** They cannot execute,
-- they cannot be resolved, and they are the oldest rows in the queue at 637
-- hours.
--
-- They are also all seeded: seven rows, one per Helio prefix, identical id
-- suffix `-2a03-4000-8000-000000000004`, same date, same `release-manager`
-- agent, every one in a workspace with `is_sample = true`. Written by
-- `20260725130000_helio_demo_seed_rich.sql:1184`.
--
-- **SO THE SEED IS THE REAL DEFECT AND CANCELLING IS ONLY HALF.** A re-seed puts
-- all seven back, because the clone reads its column list at run time and copies
-- whatever the master workspace holds. Recorded in the ledger and in the audit
-- register so the next re-seed does not quietly restore them; this file cannot
-- fix a migration that has already been applied.
--
-- ================================================================= METHOD ===
-- CANCELLED, NOT DELETED, and not approved-then-executed either. This is taken
-- wholesale from the file this one follows and the argument has not improved on:
-- deleting destroys the evidence that it happened, which is the one thing a
-- tamper-evident record must not do; bulk-approving writes receipts saying a
-- human decided something no human looked at, in a product whose whole claim is
-- that the record can be trusted. Cancelled with a stated reason is the honest
-- state.
--
-- SCOPED to exactly these two tool names in `pending`. `memory.promote`,
-- `studio.pr.merge`, `mission.dispatch` and `backlog.prioritize` are untouched
-- and remain real decisions a person owns. That is 28 of the 53 left standing.

DO $$
DECLARE n int;
BEGIN
  UPDATE public.agent_approvals
     SET status = 'cancelled',
         decision_reason = 'Cancelled 2026-08-20: futile again. cluster.trigger was set to auto on '
                        || '2026-08-03, but toolRisk() failed closed to high for uncatalogued tools '
                        || 'and demoted it back on every run. K-11 catalogued all 59 tools, so this '
                        || 'cannot recur. Every affected workspace has zero unclustered signals, so '
                        || 'each of these would have returned "No unclustered signals."',
         updated_at = now()
   WHERE status = 'pending'
     AND tool_name = 'cluster.trigger';
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'cancelled % futile cluster.trigger approvals', n;
END $$;

DO $$
DECLARE n int;
BEGIN
  UPDATE public.agent_approvals
     SET status = 'cancelled',
         decision_reason = 'Cancelled 2026-08-20: changelog.publish is registered nowhere in the '
                        || 'product. The tool was removed or renamed after these were raised, so '
                        || 'approving one would dispatch a call that cannot resolve. Seeded rows; '
                        || 'the seed at 20260725130000_helio_demo_seed_rich.sql:1184 still writes '
                        || 'them and must be corrected before the next re-seed.',
         updated_at = now()
   WHERE status = 'pending'
     AND tool_name = 'changelog.publish';
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'cancelled % orphaned changelog.publish approvals', n;
END $$;

-- Guards. Not one may survive, or the queue still carries work that cannot
-- succeed and a later reader would wrongly believe this ran.
DO $$
DECLARE n_c int; n_p int; n_rest int;
BEGIN
  SELECT count(*) INTO n_c FROM public.agent_approvals
   WHERE status='pending' AND tool_name='cluster.trigger';
  IF n_c <> 0 THEN
    RAISE EXCEPTION '% futile cluster.trigger approvals are still pending', n_c;
  END IF;

  SELECT count(*) INTO n_p FROM public.agent_approvals
   WHERE status='pending' AND tool_name='changelog.publish';
  IF n_p <> 0 THEN
    RAISE EXCEPTION '% orphaned changelog.publish approvals are still pending', n_p;
  END IF;

  -- And the ones that are somebody's real decision must NOT have been touched.
  SELECT count(*) INTO n_rest FROM public.agent_approvals WHERE status='pending';
  IF n_rest <> 28 THEN
    RAISE EXCEPTION
      'expected 28 pending approvals to remain (7 each of memory.promote, '
      'studio.pr.merge, mission.dispatch, backlog.prioritize), found %. This '
      'migration must not have touched them.', n_rest;
  END IF;
  RAISE NOTICE '% real pending approvals left standing', n_rest;
END $$;
