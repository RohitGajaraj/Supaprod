-- PC-06: Activation funnel tracking
-- Tracks signup → connect → first-teardown → first-mission → week-2-return
-- Enables funnel analysis in Engine Room and digest snapshots

CREATE TABLE funnel_milestones (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('signup', 'connected', 'first_teardown', 'first_mission', 'week_2_return')),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id, stage)
);

CREATE INDEX idx_funnel_workspace_stage ON funnel_milestones(workspace_id, stage);
CREATE INDEX idx_funnel_completed_at ON funnel_milestones(completed_at DESC);

-- RLS: Users can only see funnel data for their own workspaces
ALTER TABLE funnel_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see funnel data for their workspaces"
  ON funnel_milestones FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Service role can insert/update (triggered from backend events)
CREATE POLICY "Service role manages funnel milestones"
  ON funnel_milestones FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger: auto-track signup milestone when a workspace is first created for a user
CREATE OR REPLACE FUNCTION track_funnel_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert signup milestone if it doesn't exist (idempotent)
  INSERT INTO funnel_milestones (workspace_id, user_id, stage, completed_at)
  VALUES (NEW.id, NEW.owner_id, 'signup', NEW.created_at)
  ON CONFLICT (workspace_id, user_id, stage) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_funnel_signup
AFTER INSERT ON workspaces
FOR EACH ROW
EXECUTE FUNCTION track_funnel_signup();
