-- FS-02: Assumption watchers, proactive supersession.
-- At decision time, the assumptions a decision stands on are extracted as
-- typed rows. A watcher matches incoming signals/learnings against standing
-- assumptions and opens a supersession-candidate Call BEFORE the outcome
-- fails; the human decides, and a confirmed challenge writes a real
-- artifact_lineage contradicts edge + reopens the decision for review.

CREATE TABLE IF NOT EXISTS public.assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces (id) ON DELETE CASCADE,
  decision_id uuid NOT NULL REFERENCES public.decisions (id) ON DELETE CASCADE,
  statement text NOT NULL,
  status text NOT NULL DEFAULT 'standing' CHECK (status IN ('standing', 'challenged', 'superseded')),
  last_watched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assumptions_ws_status ON public.assumptions (workspace_id, status, last_watched_at ASC NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_assumptions_decision ON public.assumptions (decision_id);
ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assumptions TO authenticated;
GRANT ALL ON public.assumptions TO service_role;
DROP POLICY IF EXISTS "assumptions ws read" ON public.assumptions;
CREATE POLICY "assumptions ws read" ON public.assumptions FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "assumptions ws write" ON public.assumptions;
CREATE POLICY "assumptions ws write" ON public.assumptions FOR ALL
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
DROP TRIGGER IF EXISTS assumptions_updated_at ON public.assumptions;
CREATE TRIGGER assumptions_updated_at BEFORE UPDATE ON public.assumptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.assumption_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  assumption_id uuid NOT NULL REFERENCES public.assumptions (id) ON DELETE CASCADE,
  signal_id uuid REFERENCES public.signals (id) ON DELETE SET NULL,
  learning_id uuid REFERENCES public.learnings (id) ON DELETE SET NULL,
  rationale text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid
);
-- One open challenge per assumption at a time: the watcher's natural dedup,
-- and the reason a second contradicting signal on the same tick is a no-op.
CREATE UNIQUE INDEX IF NOT EXISTS uq_assumption_challenges_open
  ON public.assumption_challenges (assumption_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_assumption_challenges_ws_status
  ON public.assumption_challenges (workspace_id, status, created_at DESC);
ALTER TABLE public.assumption_challenges ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assumption_challenges TO authenticated;
GRANT ALL ON public.assumption_challenges TO service_role;
DROP POLICY IF EXISTS "assumption_challenges ws read" ON public.assumption_challenges;
CREATE POLICY "assumption_challenges ws read" ON public.assumption_challenges FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "assumption_challenges ws write" ON public.assumption_challenges;
CREATE POLICY "assumption_challenges ws write" ON public.assumption_challenges FOR ALL
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  DELETE FROM cron.job WHERE jobname = 'assumption-watch-tick';

  PERFORM cron.schedule(
    'assumption-watch-tick',
    '0 */4 * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-key', public.get_cron_hook_secret()),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/assumption-watch-tick')
  );
END $$;
