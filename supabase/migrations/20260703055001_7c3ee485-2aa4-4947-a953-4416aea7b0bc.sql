CREATE TABLE IF NOT EXISTS public.prd_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prd_id uuid NOT NULL UNIQUE REFERENCES public.prds(id) ON DELETE CASCADE,
  steps jsonb NOT NULL,
  edges jsonb NOT NULL,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prd_flows TO authenticated;
GRANT ALL ON public.prd_flows TO service_role;
ALTER TABLE public.prd_flows ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_prd_flows_ws ON public.prd_flows (workspace_id);
DROP POLICY IF EXISTS "prd_flows ws read" ON public.prd_flows;
CREATE POLICY "prd_flows ws read" ON public.prd_flows FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "prd_flows ws write" ON public.prd_flows;
CREATE POLICY "prd_flows ws write" ON public.prd_flows FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
DROP TRIGGER IF EXISTS prd_flows_updated_at ON public.prd_flows;
CREATE TRIGGER prd_flows_updated_at BEFORE UPDATE ON public.prd_flows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.launch_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prd_id uuid NOT NULL UNIQUE REFERENCES public.prds(id) ON DELETE CASCADE,
  positioning text NOT NULL,
  checklist jsonb NOT NULL,
  success_metric text,
  check_by timestamptz,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.launch_plans TO authenticated;
GRANT ALL ON public.launch_plans TO service_role;
ALTER TABLE public.launch_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_launch_plans_ws ON public.launch_plans (workspace_id);
CREATE INDEX IF NOT EXISTS idx_launch_plans_check_by ON public.launch_plans (check_by) WHERE check_by IS NOT NULL;
DROP POLICY IF EXISTS "launch_plans ws read" ON public.launch_plans;
CREATE POLICY "launch_plans ws read" ON public.launch_plans FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "launch_plans ws write" ON public.launch_plans;
CREATE POLICY "launch_plans ws write" ON public.launch_plans FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
DROP TRIGGER IF EXISTS launch_plans_updated_at ON public.launch_plans;
CREATE TRIGGER launch_plans_updated_at BEFORE UPDATE ON public.launch_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.prd_scaffolds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prd_id uuid NOT NULL UNIQUE REFERENCES public.prds(id) ON DELETE CASCADE,
  html text NOT NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','speculative')),
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prd_scaffolds TO authenticated;
GRANT ALL ON public.prd_scaffolds TO service_role;
ALTER TABLE public.prd_scaffolds ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_prd_scaffolds_ws ON public.prd_scaffolds (workspace_id);
DROP POLICY IF EXISTS "prd_scaffolds ws read" ON public.prd_scaffolds;
CREATE POLICY "prd_scaffolds ws read" ON public.prd_scaffolds FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "prd_scaffolds ws write" ON public.prd_scaffolds;
CREATE POLICY "prd_scaffolds ws write" ON public.prd_scaffolds FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
DROP TRIGGER IF EXISTS prd_scaffolds_updated_at ON public.prd_scaffolds;
CREATE TRIGGER prd_scaffolds_updated_at BEFORE UPDATE ON public.prd_scaffolds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();