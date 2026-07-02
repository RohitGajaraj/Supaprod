-- DSN-03: Flow before screens. A typed user-flow graph (steps, states,
-- decision points) generated from a PRD, stored as its own derived artifact
-- (one flow per PRD; regenerating replaces it in place, the same dual
-- projection idiom CNV-01 used for contract jsonb — the PRD's narrative
-- stays authoritative, the flow is a structured view an agent or a designer
-- can consume directly). The PRD-derives-flow relationship is recorded as a
-- real artifact_lineage edge, not implied only by the FK, so the Brain graph
-- can walk it like any other derived artifact.

CREATE TABLE IF NOT EXISTS public.prd_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces (id) ON DELETE CASCADE,
  prd_id uuid NOT NULL UNIQUE REFERENCES public.prds (id) ON DELETE CASCADE,
  steps jsonb NOT NULL,
  edges jsonb NOT NULL,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prd_flows_ws ON public.prd_flows (workspace_id);

ALTER TABLE public.prd_flows ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prd_flows TO authenticated;
GRANT ALL ON public.prd_flows TO service_role;

DROP POLICY IF EXISTS "prd_flows ws read" ON public.prd_flows;
CREATE POLICY "prd_flows ws read" ON public.prd_flows FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "prd_flows ws write" ON public.prd_flows;
CREATE POLICY "prd_flows ws write" ON public.prd_flows FOR ALL
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS prd_flows_updated_at ON public.prd_flows;
CREATE TRIGGER prd_flows_updated_at BEFORE UPDATE ON public.prd_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
