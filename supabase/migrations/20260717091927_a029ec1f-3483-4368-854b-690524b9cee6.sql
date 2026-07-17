-- PC-30: capability_changes table + policies (idempotent; objects already present)
CREATE TABLE IF NOT EXISTS public.capability_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  agent_slug text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('instructions', 'skill_enabled', 'skill_disabled')),
  description text NOT NULL,
  previous_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.capability_changes TO authenticated;
GRANT ALL ON public.capability_changes TO service_role;

ALTER TABLE public.capability_changes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='capability_changes' AND policyname='workspace members can read capability changes') THEN
    EXECUTE 'CREATE POLICY "workspace members can read capability changes" ON public.capability_changes FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspaces WHERE id = capability_changes.workspace_id AND workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='capability_changes' AND policyname='own capability changes all') THEN
    EXECUTE 'CREATE POLICY "own capability changes all" ON public.capability_changes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_capability_changes_workspace_agent ON public.capability_changes(workspace_id, agent_slug);
CREATE INDEX IF NOT EXISTS idx_capability_changes_created_at ON public.capability_changes(created_at DESC);