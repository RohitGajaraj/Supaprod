-- PC-30: capability changes as receipts
-- Wire human edits to instructions and skills as versioned, receipted changes.
-- Each change is recorded as an artifact_lineage edge + metadata.

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

ALTER TABLE public.capability_changes ENABLE ROW LEVEL SECURITY;

-- RLS: owner can see their workspace's capability changes
CREATE POLICY "workspace members can read capability changes" ON public.capability_changes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = capability_changes.workspace_id
        AND workspace_id IN (
          SELECT workspace_id FROM public.workspace_members
          WHERE user_id = auth.uid()
        )
    )
  );

-- RLS: only the member who made the change can see it (for now; could be workspace-level later)
CREATE POLICY "own capability changes all" ON public.capability_changes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_capability_changes_workspace_agent ON public.capability_changes(workspace_id, agent_slug);
CREATE INDEX idx_capability_changes_created_at ON public.capability_changes(created_at DESC);

-- Grant permissions
GRANT SELECT, INSERT ON public.capability_changes TO authenticated;
GRANT ALL ON public.capability_changes TO service_role;
