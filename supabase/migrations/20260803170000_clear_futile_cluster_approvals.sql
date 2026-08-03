-- Empty the 40% of the approvals queue that could never have done anything.
--
-- FOUND BY WALKING THE LIVE PRODUCT on 2026-08-03, not by reading code. The Today
-- surface said "32 calls need you". Approving one took 0.9s end to end and worked
-- perfectly, and its result was:
--
--   {"themes": 0, "message": "No unclustered signals.", "theme_ids": []}
--
-- Then the queue composition explained why: 24 of 60 pending approvals were
-- cluster.trigger, accumulating at ~12/day since 2026-08-01, against a workspace
-- holding 152 signals of which exactly 1 is unclustered. Every one of those 24 was
-- guaranteed to return the same empty result. A human was being asked, two dozen
-- times, to authorise an action that could not succeed.
--
-- WHY THIS IS A PRODUCT BUG AND NOT HOUSEKEEPING. The governance canon says a long
-- approvals queue is "a policy failure to surface, not a workload to render", and this
-- is the purest form of it: the queue was not too long because the work was hard, it
-- was long because the work was pointless. It also made the demo read "Nothing finished
-- overnight. 32 need you.", which is the exact opposite of the product's claim.
--
-- THE CAUSE IS FIXED SEPARATELY AND FIRST: tools/defaults.ts moves cluster.trigger from
-- confirm to auto, because clustering is reversible, invisible outside the product, and
-- needs no judgement a human is better at. So no new row of this kind can be created.
-- This migration only clears the backlog that policy already made obsolete.
--
-- CANCELLED, NOT DELETED, and not approved-then-executed either. Deleting would destroy
-- the evidence that this happened, which is the one thing a tamper-evident record must
-- not do. Bulk-approving would be worse: it would write 24 receipts saying a human
-- decided something no human looked at, in a product whose entire claim is that the
-- record can be trusted. Cancelled with a stated reason is the honest state.
--
-- SCOPED to pending cluster.trigger only. Every other pending tool is untouched: the
-- changelog.publish, memory.promote, studio.pr.merge, mission.dispatch and
-- backlog.prioritize rows are real decisions a human still owns.

DO $$
DECLARE n int;
BEGIN
  UPDATE public.agent_approvals
     SET status = 'cancelled',
         decision_reason = 'Cancelled 2026-08-03: cluster.trigger became an auto-mode tool, '
                        || 'and these queued requests were no-ops (no unclustered signals to cluster).',
         updated_at = now()
   WHERE status = 'pending'
     AND tool_name = 'cluster.trigger';
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'cancelled % futile cluster.trigger approvals', n;
END $$;

-- Guard: not one may survive, or the queue still carries work that cannot succeed and a
-- later reader would wrongly believe this ran.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.agent_approvals
   WHERE status = 'pending' AND tool_name = 'cluster.trigger';
  IF n <> 0 THEN
    RAISE EXCEPTION '% futile cluster.trigger approvals are still pending', n;
  END IF;
END $$;
