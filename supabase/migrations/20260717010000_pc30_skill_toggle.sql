-- PC-30: skill enable/disable, a per-agent deny-list for playbooks.
-- Absence of a row = enabled (today's behavior for every agent, unchanged).
-- A row here means this agent will never be auto-picked to use that playbook
-- at mission-plan time (src/lib/ai/tools/orchestrator.server.ts, mission.plan).

CREATE TABLE IF NOT EXISTS public.agent_disabled_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  agent_slug text NOT NULL,
  playbook_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, agent_slug, playbook_id)
);

ALTER TABLE public.agent_disabled_skills ENABLE ROW LEVEL SECURITY;

-- Workspace-shared, bidirectionally-toggled state (any member can disable or
-- re-enable a skill another member turned off) -- the same is_workspace_member
-- idiom house_rules and playbook_runs already use for exactly this shape, not
-- an ownership check. An auth.uid() = user_id check here would let a caller
-- plant a row in a workspace they never joined (WITH CHECK never validates
-- membership) and would make another member's re-enable silently delete zero
-- rows (USING would exclude a row someone else owns), leaving a skill stuck
-- disabled for the whole team.
CREATE POLICY "workspace members read disabled skills" ON public.agent_disabled_skills
  FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace members write disabled skills" ON public.agent_disabled_skills
  FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE INDEX idx_agent_disabled_skills_workspace_agent
  ON public.agent_disabled_skills(workspace_id, agent_slug);

-- UPDATE is required even though the app only ever inserts/deletes: the
-- disable path's upsert(..., {onConflict: ...}) compiles to
-- INSERT ... ON CONFLICT DO UPDATE, and Postgres needs UPDATE privilege for
-- that arm even when it is expected to be a no-op.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_disabled_skills TO authenticated;
GRANT ALL ON public.agent_disabled_skills TO service_role;
