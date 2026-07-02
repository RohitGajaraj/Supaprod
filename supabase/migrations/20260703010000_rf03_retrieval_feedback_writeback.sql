-- RF-03: retrieval feedback writeback.
--
-- touchMemory (src/lib/ai/memory.server.ts) already marks a recalled memory's
-- last_used_at, but that only says "this was recalled," never whether the run
-- that recalled it turned out to be useful. This table closes that gap: one
-- row per (memory, run) recorded at recall time (default 'ignored'), keyed by
-- trace_id rather than the specific ai_events row — a single recall's lines
-- are baked into the run's system prompt once and reused by every callModel
-- call in that run (loop.server.ts's executeLoop step loop), so trace_id is
-- the correct correlation key, not any one event_id.
--
-- feedback.functions.ts's submitFeedback (not pinned) is the behavioral
-- consumer named in the ticket: a rating on ANY event in the run's trace
-- upgrades these rows to 'used' (rating > 0) or 'contradicted' (rating < 0),
-- and nudges the memory's own `importance` by +/-1 (clamped 1..5) so the
-- signal feeds RF-02's `match_agent_memory` ranking through the importance
-- term it already reads — no RF-02 change needed.
CREATE TABLE public.memory_recall_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.agent_memory(id) ON DELETE CASCADE,
  trace_id uuid,
  user_id uuid NOT NULL,
  workspace_id uuid,
  outcome text NOT NULL DEFAULT 'ignored' CHECK (outcome IN ('used', 'ignored', 'contradicted')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_recall_log TO authenticated;
GRANT ALL ON public.memory_recall_log TO service_role;

CREATE INDEX memory_recall_log_trace_idx ON public.memory_recall_log (trace_id);
CREATE INDEX memory_recall_log_memory_idx ON public.memory_recall_log (memory_id);

ALTER TABLE public.memory_recall_log ENABLE ROW LEVEL SECURITY;

-- Same own-row pattern as ai_events / ai_feedback (20260602204949): these are
-- per-user telemetry rows, not workspace-shared content, so ownership is by
-- user_id, not workspace membership.
CREATE POLICY "own memory_recall_log all" ON public.memory_recall_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Atomic importance nudge: a plain read-then-write from the app would race
-- against a DIFFERENT trace's feedback landing on the same popular memory at
-- the same instant. A single UPDATE ... RETURNING is what Postgres actually
-- makes atomic (row-locked for the statement's duration), so the clamp has to
-- happen here, not in application code. Mirrors agent_memory.importance's own
-- CHECK (BETWEEN 1 AND 5) so this can never write an out-of-range value.
--
-- Deliberately SECURITY INVOKER (the default — no SECURITY DEFINER here):
-- this is only ever called from submitFeedback's user-scoped client, and
-- agent_memory's own "own agent_memory in member workspace" RLS policy must
-- keep gating the UPDATE, exactly as if the caller ran it directly. A
-- SECURITY DEFINER here would let any authenticated user bump the importance
-- of ANY memory by id, not just their own — a real cross-tenant write bug,
-- caught in review before this shipped.
CREATE OR REPLACE FUNCTION public.bump_memory_importance(p_memory_id uuid, p_delta integer)
RETURNS integer LANGUAGE sql AS $$
  UPDATE public.agent_memory
  SET importance = LEAST(5, GREATEST(1, importance + p_delta))
  WHERE id = p_memory_id
  RETURNING importance;
$$;
REVOKE EXECUTE ON FUNCTION public.bump_memory_importance(uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.bump_memory_importance(uuid, integer) TO authenticated;
