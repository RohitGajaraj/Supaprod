-- PC-04: anonymous, pre-signup activation events (demo_viewed, demo_to_signup
-- and later PC-06's remaining canonical names). Distinct from PC-06's
-- funnel_milestones (39f6779a), which requires a real user_id/workspace_id
-- for the authenticated post-signup funnel -- a demo visitor has neither.
-- Fable-reviewed shape (fork escalation, 2026-07-10): service-role-only
-- writes (server functions never expose the service client to the browser),
-- no anon/authenticated INSERT policy (would be an open spam vector).

CREATE TABLE activation_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  session_id TEXT,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_activation_events_name_created ON activation_events(event_name, created_at DESC);
CREATE INDEX idx_activation_events_session ON activation_events(session_id) WHERE session_id IS NOT NULL;

ALTER TABLE activation_events ENABLE ROW LEVEL SECURITY;
-- Deliberately zero policies: service_role bypasses RLS, so all writes and
-- reads route through server functions using the admin client. No anon or
-- authenticated policy is added on purpose.
