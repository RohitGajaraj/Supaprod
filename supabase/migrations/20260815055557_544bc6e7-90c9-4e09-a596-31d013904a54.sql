-- 20260814120000_a_gate_could_be_answered_twice_and_a_run_replayed.sql
ALTER TABLE public.agent_approvals
  ADD COLUMN IF NOT EXISTS execution_claimed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.agent_approvals.execution_claimed_at IS
  'Set by the single conditional UPDATE that authorizes executeApproval to call the tool. NULL means unclaimed. Never expires on purpose: the guarded work (merging a PR, pushing a commit, dispatching a paid external job) is not safe to repeat.';

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS resume_lease_at TIMESTAMPTZ NOT NULL DEFAULT '-infinity';

COMMENT ON COLUMN public.agent_runs.resume_lease_at IS
  'When a worker last claimed the right to resume this run. Claimed with resume_lease_at < now() - lease window, so an evicted worker hands the run back after the window instead of stranding it. -infinity means never leased.';

CREATE INDEX IF NOT EXISTS idx_agent_runs_resume_lease
  ON public.agent_runs (status, resume_lease_at);

CREATE OR REPLACE FUNCTION public.agent_approvals_guard_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'executed' AND NEW.status IS DISTINCT FROM 'executed' THEN
    RAISE EXCEPTION
      'agent_approvals %: an executed call cannot become %', OLD.id, NEW.status
      USING ERRCODE = '55000';
  END IF;

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