CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- JNY-01 competitor-tick
DO $$
DECLARE base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'competitor-tick';
  PERFORM cron.schedule('competitor-tick','0 8 * * 1',
    format($job$SELECT net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-key', public.get_cron_hook_secret()), body := '{}'::jsonb) AS request_id;$job$,
    base_url || '/api/public/hooks/competitor-tick'));
END $$;

-- FS-01 prediction calibration
ALTER TABLE public.insights
  ADD COLUMN IF NOT EXISTS claim text,
  ADD COLUMN IF NOT EXISTS horizon_date timestamptz,
  ADD COLUMN IF NOT EXISTS resolution text CHECK (resolution IS NULL OR resolution IN ('hit','miss','inconclusive')),
  ADD COLUMN IF NOT EXISTS brier_score real,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
CREATE INDEX IF NOT EXISTS insights_due_for_calibration_idx
  ON public.insights (workspace_id, horizon_date)
  WHERE kind IN ('prediction','risk') AND status = 'open' AND resolution IS NULL;
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS prediction_throttle_until timestamptz,
  ADD COLUMN IF NOT EXISTS risk_throttle_until timestamptz;
DO $$
DECLARE base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'calibrate-tick';
  PERFORM cron.schedule('calibrate-tick','0 */6 * * *',
    format($job$SELECT net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-key', public.get_cron_hook_secret()), body := '{}'::jsonb) AS request_id;$job$,
    base_url || '/api/public/hooks/calibrate-tick'));
END $$;

-- FS-02 assumption watchers
CREATE TABLE IF NOT EXISTS public.assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces(id) ON DELETE CASCADE,
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  statement text NOT NULL,
  status text NOT NULL DEFAULT 'standing' CHECK (status IN ('standing','challenged','superseded')),
  last_watched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assumptions TO authenticated;
GRANT ALL ON public.assumptions TO service_role;
ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_assumptions_ws_status ON public.assumptions (workspace_id, status, last_watched_at ASC NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_assumptions_decision ON public.assumptions (decision_id);
DROP POLICY IF EXISTS "assumptions ws read" ON public.assumptions;
CREATE POLICY "assumptions ws read" ON public.assumptions FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "assumptions ws write" ON public.assumptions;
CREATE POLICY "assumptions ws write" ON public.assumptions FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
DROP TRIGGER IF EXISTS assumptions_updated_at ON public.assumptions;
CREATE TRIGGER assumptions_updated_at BEFORE UPDATE ON public.assumptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.assumption_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assumption_id uuid NOT NULL REFERENCES public.assumptions(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES public.signals(id) ON DELETE SET NULL,
  learning_id uuid REFERENCES public.learnings(id) ON DELETE SET NULL,
  rationale text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','confirmed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assumption_challenges TO authenticated;
GRANT ALL ON public.assumption_challenges TO service_role;
ALTER TABLE public.assumption_challenges ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS uq_assumption_challenges_open ON public.assumption_challenges (assumption_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_assumption_challenges_ws_status ON public.assumption_challenges (workspace_id, status, created_at DESC);
DROP POLICY IF EXISTS "assumption_challenges ws read" ON public.assumption_challenges;
CREATE POLICY "assumption_challenges ws read" ON public.assumption_challenges FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "assumption_challenges ws write" ON public.assumption_challenges;
CREATE POLICY "assumption_challenges ws write" ON public.assumption_challenges FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

DO $$
DECLARE base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'assumption-watch-tick';
  PERFORM cron.schedule('assumption-watch-tick','0 */4 * * *',
    format($job$SELECT net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-key', public.get_cron_hook_secret()), body := '{}'::jsonb) AS request_id;$job$,
    base_url || '/api/public/hooks/assumption-watch-tick'));
END $$;

-- FS-03 reach channel
ALTER TABLE public.agent_approvals ADD COLUMN IF NOT EXISTS expiry_notified_at timestamptz;
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS last_digest_sent_at timestamptz;

DO $$
DECLARE base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'digest-tick';
  PERFORM cron.schedule('digest-tick','0 * * * *',
    format($job$SELECT net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-key', public.get_cron_hook_secret()), body := '{}'::jsonb) AS request_id;$job$,
    base_url || '/api/public/hooks/digest-tick'));
END $$;

-- RF-01 outcome suggestion
ALTER TABLE public.prds ADD COLUMN IF NOT EXISTS outcome_suggestion jsonb;
COMMENT ON COLUMN public.prds.outcome_suggestion IS 'RF-01: auto-drafted, confidence-tiered outcome suggestion.';