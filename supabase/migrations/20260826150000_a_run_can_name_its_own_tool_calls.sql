-- A RUN CAN NAME ITS OWN TOOL CALLS (F-93).
--
-- WHAT WAS MISSING. `tool_calls.trace_id` is the only key it shares with
-- `agent_runs`, and `agent_runs` HAS NO SUCH COLUMN. `driver.server.ts:2713` says
-- so in its own words: "`agent_runs` has no `trace_id` column, which is why the
-- ids are carried down from each `runAgentLoop` result rather than looked up."
--
-- So the link between a run and what it actually DID exists only in memory, for
-- the duration of that run. Afterwards nothing can answer "what did this run
-- call?" — measured: `tool_calls.trace_id` matches **0 of 1,689** `agent_runs.id`.
--
-- WHAT THAT HAS COST, IN ONE DAY. Three investigations were nearly concluded
-- wrongly on it. I twice filtered `tool_calls` by workspace as a stand-in, got a
-- different track's crew back, and almost reported "the release agent makes zero
-- tool calls" (it makes seven). S4 hit the same wall verifying F-87 and correctly
-- stopped rather than infer. A join that does not exist is worse than a slow one:
-- it invites a plausible substitute.
--
-- IT ALSO BLOCKS A BUILT FEATURE. S2's collision derivation is specified as
-- "newest `tool_calls` row per ACTIVE `agent_run`", which is unjoinable today.
-- This column is what makes that read possible at all.
--
-- NOT BACKFILLABLE, AND THAT IS STATED RATHER THAN HIDDEN. The correlation for
-- past runs was never written down anywhere, so the 1,689 existing rows stay
-- NULL forever. Only runs created after this migration can name their calls. A
-- reader must treat NULL as "unknowable", never as "made no calls" — that is the
-- same distinction F-76 was built out of, and getting it backwards here would
-- turn a missing join into a false claim about what an agent did.
ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS trace_id uuid;

COMMENT ON COLUMN public.agent_runs.trace_id IS
  'Correlates this run with its rows in tool_calls. NULL for every run created before 2026-08-26 — the link was never recorded, so NULL means unknowable, never "made no calls".';

CREATE INDEX IF NOT EXISTS agent_runs_trace_id_idx ON public.agent_runs (trace_id);
