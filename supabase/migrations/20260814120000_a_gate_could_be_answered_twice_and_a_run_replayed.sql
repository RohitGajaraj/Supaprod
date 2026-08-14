-- A gate could be answered twice, and a live run could be replayed by two workers.
--
-- Both defects were read straight out of the application code on 2026-08-14, and
-- both end in the same place: a customer's pull request merged twice, a commit
-- pushed twice, a paid external job dispatched twice.
--
-- (1) NOTHING AUTHORIZED A GATED TOOL RUN. executeApproval READ
-- agent_approvals.status, saw 'approved', ran the tool, and only then stamped
-- 'executed'. The whole duration of the tool call sat between the read and the
-- stamp, so two callers (the /approvals queue and the Govern panel, or one
-- double-click) both read 'approved' and both called def.run(). studio.pr.merge
-- merges the PR twice. The second result blob then overwrote the first, so the
-- audit trail kept one of two real executions and nothing anywhere recorded
-- that the second had happened.
--
-- execution_claimed_at is the authorization. The application takes it with a
-- single conditional UPDATE (status='approved' AND execution_claimed_at IS
-- NULL), which Postgres serializes on the row, so exactly one caller wins and
-- the loser is told, cleanly, that someone else has it.
--
-- IT DELIBERATELY DOES NOT EXPIRE. Every other claim in this schema is a lease
-- that a stalled worker eventually gives back. This one is not, because the
-- work it guards is not repeatable: re-running a claim whose worker died means
-- merging a pull request that may already be merged, and the whole point of
-- this column is that this never happens twice. A crashed execution leaves the
-- row 'approved' with the claim held, which is exactly where a crashed
-- execution left it before this migration -- stuck and visible -- so nothing
-- gets worse, and the loud stuck row is the correct outcome for a tool whose
-- second run would touch a customer's repository.
--
-- (2) THE RESUME SWEEPER REPLAYED LIVE RUNS. resume-runs selects agent_runs at
-- status='running' whose last checkpoint is older than 2 minutes and calls
-- resumeAgentLoop on each. The compare-and-swap inside resumeAgentLoop only
-- fires for 'queued' and 'waiting_approval'; 'running' was never covered, and a
-- comment beside it admits so. The cron period is 60 seconds and one tick can
-- resume up to fifteen runs sequentially, so overlapping ticks replayed the
-- same checkpoint in parallel: doubled model calls, doubled credit debits,
-- doubled tool execution including GitHub writes, and interleaved checkpoint
-- writes that corrupt the step sequence.
--
-- resume_lease_at is a real lease, and here a lease is right: a resume that
-- dies mid-flight must be retried or the run is stranded, which is the failure
-- this sweeper exists to fix. It is NOT NULL DEFAULT '-infinity' rather than
-- nullable so the claim is one comparison (`resume_lease_at < cutoff`) instead
-- of a null-or-older disjunction, and so every row that already exists reads as
-- "never leased" without a backfill.
--
-- (3) THE STATE MACHINE HAD NO FLOOR. agent_approvals carried no unique index
-- and no transition trigger, so any writer -- including the expiry sweeper,
-- which filtered its UPDATE by id alone -- could stamp 'expired' over a call a
-- human had approved and a tool had already executed, complete with a
-- fabricated "no decision" error. The resume path then read that row, told the
-- agent "Tool X was NOT executed", and the agent ran it again. That path needs
-- no double click and no second surface: one sweeper tick landing in the wrong
-- millisecond is enough.
--
-- The application-side guards land in the same change. This trigger is here
-- because the application is not the only writer: a Lovable edit, a SQL console
-- session, or a tick written next year gets the same floor. It raises rather
-- than silently ignoring the write, because an attempt to un-execute an
-- executed call is not a race anyone should lose quietly -- it is a bug, and a
-- caller that sees the exception can say so.

-- ---------------------------------------------------------------------------
-- 1. The claim that authorizes a gated tool run.
-- ---------------------------------------------------------------------------
ALTER TABLE public.agent_approvals
  ADD COLUMN IF NOT EXISTS execution_claimed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.agent_approvals.execution_claimed_at IS
  'Set by the single conditional UPDATE that authorizes executeApproval to call the tool. NULL means unclaimed. Never expires on purpose: the guarded work (merging a PR, pushing a commit, dispatching a paid external job) is not safe to repeat.';

-- ---------------------------------------------------------------------------
-- 2. The lease that stops two sweeper ticks resuming one live run.
-- ---------------------------------------------------------------------------
ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS resume_lease_at TIMESTAMPTZ NOT NULL DEFAULT '-infinity';

COMMENT ON COLUMN public.agent_runs.resume_lease_at IS
  'When a worker last claimed the right to resume this run. Claimed with resume_lease_at < now() - lease window, so an evicted worker hands the run back after the window instead of stranding it. -infinity means never leased.';

CREATE INDEX IF NOT EXISTS idx_agent_runs_resume_lease
  ON public.agent_runs (status, resume_lease_at);

-- ---------------------------------------------------------------------------
-- 3. The transitions no writer may make.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.agent_approvals_guard_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- An executed call is final. Every legitimate update to an executed row
  -- (clearing the escalation flag, attaching a decision note, snoozing) leaves
  -- status alone, so equality here is not a loophole, it is the normal path.
  IF OLD.status = 'executed' AND NEW.status IS DISTINCT FROM 'executed' THEN
    RAISE EXCEPTION
      'agent_approvals %: an executed call cannot become %', OLD.id, NEW.status
      USING ERRCODE = '55000';
  END IF;

  -- Expiry is for calls nobody answered. A row with decided_at set was
  -- answered, and stamping it 'expired' fabricates a history in which it was
  -- not: this is the exact write the sweeper made, and the resumed agent read
  -- it as permission to run the tool again.
  IF NEW.status = 'expired' AND OLD.decided_at IS NOT NULL THEN
    RAISE EXCEPTION
      'agent_approvals %: a call decided at % cannot be expired', OLD.id, OLD.decided_at
      USING ERRCODE = '55000';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_approvals_guard_transition ON public.agent_approvals;
CREATE TRIGGER trg_agent_approvals_guard_transition
  BEFORE UPDATE ON public.agent_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.agent_approvals_guard_transition();
