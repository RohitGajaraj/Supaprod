-- SEAM-1 FOUNDATIONS (ship-week mission 3.0): the flagged migrations from the
-- 2026-07-07 overnight platform pass, landed together so every later stage's
-- "how did this move through the pipeline" proof reads from real rows.
--
-- A. stage_events: per-transition history for every lifecycle entity.
-- B. agent_approvals.snoozed_until: the honest "Later" verb on a call.
-- C. decisions.alternatives_considered + cited_by_count: paths not taken and
--    how often agents recall this decision as precedent.
-- D. learnings attribution (mission + recording agent) + learning_citations.
-- E. trace_id on guardrail_hits and ai_budget_alerts so incident cards can
--    click through to the trace that caused them.
-- F. ledger_seals: write-time persistence of the Trust Ledger seal so verify
--    can pinpoint WHICH record changed, not just that something did.

-- ---------------------------------------------------------------------------
-- A. stage_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES public.workspaces (id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('spec', 'mission', 'opportunity', 'theme', 'decision', 'goal', 'loop')),
  entity_id uuid NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  actor text NOT NULL DEFAULT 'system',
  at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stage_events IS
  'Append-only per-transition history for lifecycle entities. actor is ''human'', an agent slug, or ''system'' (cron). from_stage NULL means the entity was created into to_stage.';
CREATE INDEX IF NOT EXISTS idx_stage_events_entity ON public.stage_events (entity_type, entity_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_events_ws ON public.stage_events (workspace_id, at DESC);
ALTER TABLE public.stage_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.stage_events TO authenticated;
GRANT ALL ON public.stage_events TO service_role;
-- Append-only from clients: read + insert for workspace members, no
-- UPDATE/DELETE policies, matching the cost_incidents posture. The own-row
-- branch exists ONLY for rows whose parent entity carries no workspace_id
-- (legacy nullable columns); it is gated to workspace_id IS NULL so a user
-- can never attach a forged row to someone else's workspace (adversarial
-- review finding, 2026-07-07).
DROP POLICY IF EXISTS "stage_events ws read" ON public.stage_events;
CREATE POLICY "stage_events ws read" ON public.stage_events FOR SELECT
  USING (
    (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );
DROP POLICY IF EXISTS "stage_events ws insert" ON public.stage_events;
CREATE POLICY "stage_events ws insert" ON public.stage_events FOR INSERT
  WITH CHECK (
    (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- B. agent_approvals: snooze/defer
-- ---------------------------------------------------------------------------
ALTER TABLE public.agent_approvals
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;
COMMENT ON COLUMN public.agent_approvals.snoozed_until IS
  'The honest "Later": a pending call the human deferred. The needs-you queue hides rows until this passes; NULL means never snoozed.';

-- ---------------------------------------------------------------------------
-- C. decisions: alternatives considered + precedent-recall counter
-- ---------------------------------------------------------------------------
ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS alternatives_considered jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cited_by_count integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.decisions.alternatives_considered IS
  'Paths not taken at decision time: an array of {title, reason_rejected} objects, so the Brain can later learn from alternatives.';
COMMENT ON COLUMN public.decisions.cited_by_count IS
  'How many times agents recalled this decision as precedent. Bumped via bump_decision_cited_by().';

CREATE OR REPLACE FUNCTION public.bump_decision_cited_by(_decision_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.decisions
  SET cited_by_count = cited_by_count + 1
  WHERE id = _decision_id
    AND (public.is_workspace_member(workspace_id) OR user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.bump_decision_cited_by(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.bump_decision_cited_by(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- D. learnings: attribution + cited-by table
-- ---------------------------------------------------------------------------
ALTER TABLE public.learnings
  ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES public.missions (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_agent_slug text;
COMMENT ON COLUMN public.learnings.mission_id IS
  'The mission whose outcome produced this learning, when one did.';
COMMENT ON COLUMN public.learnings.recorded_by_agent_slug IS
  'The agent (e.g. the Historian) that drafted this learning; NULL means a human recorded it directly.';

CREATE TABLE IF NOT EXISTS public.learning_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES public.workspaces (id) ON DELETE CASCADE,
  learning_id uuid NOT NULL REFERENCES public.learnings (id) ON DELETE CASCADE,
  cited_by text NOT NULL,
  trace_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.learning_citations IS
  'Each time an agent or surface recalls a learning (precedent block, Critic, loop recall), one row: who cited it and under which trace.';
CREATE INDEX IF NOT EXISTS idx_learning_citations_learning ON public.learning_citations (learning_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_citations_ws ON public.learning_citations (workspace_id, created_at DESC);
ALTER TABLE public.learning_citations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.learning_citations TO authenticated;
GRANT ALL ON public.learning_citations TO service_role;
-- Same gated own-row escape hatch as stage_events (learnings.workspace_id is
-- genuinely nullable), so user_id alone can never attach to a foreign workspace.
DROP POLICY IF EXISTS "learning_citations ws read" ON public.learning_citations;
CREATE POLICY "learning_citations ws read" ON public.learning_citations FOR SELECT
  USING (
    (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );
DROP POLICY IF EXISTS "learning_citations ws insert" ON public.learning_citations;
CREATE POLICY "learning_citations ws insert" ON public.learning_citations FOR INSERT
  WITH CHECK (
    (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- E. incident traceability: trace_id on guardrail hits and budget alerts
-- ---------------------------------------------------------------------------
ALTER TABLE public.guardrail_hits
  ADD COLUMN IF NOT EXISTS trace_id text;
COMMENT ON COLUMN public.guardrail_hits.trace_id IS
  'The trace of the AI call this hit fired inside; stamped at the runtime chokepoint so incident cards click through. Older rows recover it via event_id -> ai_events.trace_id.';
ALTER TABLE public.ai_budget_alerts
  ADD COLUMN IF NOT EXISTS trace_id text;
COMMENT ON COLUMN public.ai_budget_alerts.trace_id IS
  'The trace of the AI call that crossed the budget threshold; stamped at write time by logBudgetAlert.';

-- ---------------------------------------------------------------------------
-- F. ledger_seals: write-time Trust Ledger seal persistence
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ledger_seals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces (id) ON DELETE CASCADE,
  head text NOT NULL,
  algo text NOT NULL,
  record_count integer NOT NULL,
  links jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_array_length(links) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ledger_seals IS
  'Persisted Trust Ledger seals: head + per-record cumulative links (SHA-256-chain/v1). With the saved links, verify can pinpoint WHICH receipt changed instead of head-only comparison.';
CREATE INDEX IF NOT EXISTS idx_ledger_seals_user ON public.ledger_seals (user_id, created_at DESC);
ALTER TABLE public.ledger_seals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.ledger_seals TO authenticated;
GRANT ALL ON public.ledger_seals TO service_role;
-- Own-row: receipts load RLS-scoped per user, so a seal is a per-user view.
DROP POLICY IF EXISTS "ledger_seals own read" ON public.ledger_seals;
CREATE POLICY "ledger_seals own read" ON public.ledger_seals FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ledger_seals own insert" ON public.ledger_seals;
CREATE POLICY "ledger_seals own insert" ON public.ledger_seals FOR INSERT
  WITH CHECK (user_id = auth.uid());
