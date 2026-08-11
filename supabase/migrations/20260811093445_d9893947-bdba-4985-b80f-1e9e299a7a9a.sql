ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS attempt integer;

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS resume_count integer;

COMMENT ON COLUMN public.agent_runs.attempt IS
  'Which attempt at this unit of work this run is, 1-based. Written ONLY by a dispatcher that genuinely counts attempts (the reactor from event_queue.attempt_count, an orchestrated hop from mission_steps.attempts). NULL means nobody counted, and must render as "not measured" -- never as 1. runAgentLoop deliberately does NOT default it: a caller re-running the same goal by hand is not attempt 1, and a run cannot verify its own ordinal.';

COMMENT ON COLUMN public.agent_runs.resume_count IS
  'How many times a worker picked this run back up AFTER it had already begun -- eviction recovery and post-approval continuation. NOT a retry: a retry is a different run at the same work. 0 is a real measurement (created instrumented, never resumed); NULL is the absence of one. Set to 0 at creation by the instrumented insert paths and incremented by resumeAgentLoop; a NULL is never promoted to a number, because a count that did not start at birth is a lower bound, not a count.';