-- PC-08: Routines, productized. Per-workspace on/off for the platform's
-- background pg_cron jobs, surfaced in plain language. routine_id matches
-- the catalog ids in src/lib/routines-catalog.ts (a code constant, not a
-- table -- the schedule/name/description live in code, only the toggle and
-- a light run receipt live here). enabled defaults true: existing workspaces
-- keep today's real behavior until a human explicitly turns something off.

CREATE TABLE workspace_routine_prefs (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  routine_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, routine_id)
);

CREATE INDEX idx_workspace_routine_prefs_workspace ON workspace_routine_prefs(workspace_id);

ALTER TABLE workspace_routine_prefs ENABLE ROW LEVEL SECURITY;

-- A workspace's own members can see and change their own routine toggles --
-- this is a real user-facing setting, unlike the service-role-only
-- activation/funnel telemetry tables from PC-04/PC-06.
CREATE POLICY "Members read their workspace's routine prefs"
  ON workspace_routine_prefs FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members toggle their workspace's routine prefs"
  ON workspace_routine_prefs FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members update their workspace's routine prefs"
  ON workspace_routine_prefs FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages routine prefs"
  ON workspace_routine_prefs FOR ALL
  USING (auth.role() = 'service_role');
