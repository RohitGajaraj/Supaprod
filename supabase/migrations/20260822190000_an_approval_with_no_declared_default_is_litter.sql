-- 20260822190000_an_approval_with_no_declared_default_is_litter.sql
--
-- Claude lane, 2026-08-22. Schema half of the approvals-expiry fix; the policy
-- lives in src/lib/ai/approval-expiry.ts and the sweep in approvals-tick.ts.
--
-- MEASURED FIRST, AGAINST PRODUCTION, so this is not a fix for a guessed problem:
--
--   select status, escalation_state, count(*), min(created_at)
--     from agent_approvals where status='pending'
--    group by 1,2;
--     -- 21 (pending, expired)   oldest 2026-07-24 14:20  -- 696h
--     --  7 (pending, escalated) oldest 2026-07-25 02:20  -- 684h
--     -- 10 (pending, pending)   oldest 2026-08-19 20:20  --  66h
--
-- Thirty-eight pending, every one past 24 hours, and `approvals-tick` has run
-- every minute throughout. Two separate reasons, both now closed in code:
--
--   * 28 of them sat outside the sweep's own select, which carried
--     `.eq("escalation_state","pending")`. Escalation was a one-way exit from the
--     clock. That filter is gone; `status='pending'` is the whole definition of an
--     unanswered call, which is what every queue surface already reads.
--   * All 38 had a deadline in the FUTURE. Twenty-eight are seeded rows written
--     2026-07-27 with a sixty-day fuse (expires_at = 2026-09-25 20:30:27.393262,
--     identical to the microsecond across all of them). The other ten carry the
--     flat seven days `loop.server.ts` stamped on every gate it ever raised.
--
-- WHY A COLUMN AND NOT A DERIVATION. The default IS derivable — reversibility and
-- the external boundary both live in `tool-consequences.ts`, which is client-safe,
-- so any surface could compute it. It is stored anyway, for the reason
-- `expires_at` is stored: a person shown "this goes ahead on its own at 09:14
-- tomorrow" must get that outcome even if the catalogue moves before the deadline.
-- A promise made at raise time is not re-decidable at sweep time.
--
-- NO BACKFILL, AND THAT IS THE POINT. Writing a default onto the 38 rows standing
-- today would auto-decide 38 calls in one statement, which is the failure this
-- work exists to prevent and is worse than the queue it would clear. They keep
-- their existing expires_at (all in the future), the sweeper leaves them alone,
-- and what to do with them is proposed separately for a person to rule on. The
-- guard at the bottom asserts exactly that: this file changes no row's fate.

ALTER TABLE public.agent_approvals
  ADD COLUMN IF NOT EXISTS expiry_default text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.agent_approvals'::regclass
       AND conname  = 'agent_approvals_expiry_default_check'
  ) THEN
    ALTER TABLE public.agent_approvals
      ADD CONSTRAINT agent_approvals_expiry_default_check
      CHECK (expiry_default IS NULL OR expiry_default IN ('proceed','cancel'));
  END IF;
END $$;

COMMENT ON COLUMN public.agent_approvals.expiry_default IS
  'What happens to this call if nobody answers before expires_at, declared when the call is raised and never recomputed: ''proceed'' (reversible and internal — it goes ahead and the record says it went ahead unasked) or ''cancel'' (irreversible, external, only partly reversible, or uncatalogued — nothing runs). NULL means the row predates the column; the sweeper re-derives from the consequence catalogue and says so in the row.';

-- The sweep's new predicate is (status, expires_at). The 2026-06-03 index is
-- (escalation_state, expires_at) WHERE escalation_state='pending' and cannot serve
-- it — which is also why the old filter was there in the first place.
CREATE INDEX IF NOT EXISTS agent_approvals_pending_expiry_idx
  ON public.agent_approvals (expires_at)
  WHERE status = 'pending';

-- Guard: nothing above may have decided anything. If the pending count or any
-- deadline moved, this file did more than it claims and must be looked at.
DO $$
DECLARE n_pending int; n_declared int; n_overdue int;
BEGIN
  SELECT count(*) INTO n_pending  FROM public.agent_approvals WHERE status = 'pending';
  SELECT count(*) INTO n_declared FROM public.agent_approvals WHERE expiry_default IS NOT NULL;
  SELECT count(*) INTO n_overdue  FROM public.agent_approvals
   WHERE status = 'pending' AND expires_at < now();

  IF n_declared <> 0 THEN
    RAISE EXCEPTION
      '% rows already carry expiry_default; this migration must not backfill', n_declared;
  END IF;
  IF n_overdue <> 0 THEN
    RAISE EXCEPTION
      '% pending approvals are already past their deadline. The next tick would '
      'resolve them under a policy nobody reviewed. Rule on the backlog first.', n_overdue;
  END IF;
  RAISE NOTICE
    '% pending approvals left exactly as found; none is past its deadline', n_pending;
END $$;
