-- JNY-04: launch + GTM kit. The v12 audit graded "Launch/GTM/marketing" THIN:
-- the LCH-01 launch-kit generator (channel copy: changelog/blog/email/social/
-- docs) already exists on a shipped changeset, but nothing composes the
-- higher-level launch plan a decision's own rationale implies: positioning,
-- a launch checklist, and an armed outcome-check window. This table is that
-- missing layer, one per PRD (a launch plan is a spec-level artifact, not a
-- per-changeset one — reuses LCH-01's copy rather than duplicating it).

CREATE TABLE IF NOT EXISTS public.launch_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces (id) ON DELETE CASCADE,
  prd_id uuid NOT NULL UNIQUE REFERENCES public.prds (id) ON DELETE CASCADE,
  positioning text NOT NULL,
  checklist jsonb NOT NULL,
  success_metric text,
  check_by timestamptz,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_launch_plans_ws ON public.launch_plans (workspace_id);
CREATE INDEX IF NOT EXISTS idx_launch_plans_check_by ON public.launch_plans (check_by) WHERE check_by IS NOT NULL;

ALTER TABLE public.launch_plans ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.launch_plans TO authenticated;
GRANT ALL ON public.launch_plans TO service_role;

DROP POLICY IF EXISTS "launch_plans ws read" ON public.launch_plans;
CREATE POLICY "launch_plans ws read" ON public.launch_plans FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "launch_plans ws write" ON public.launch_plans;
CREATE POLICY "launch_plans ws write" ON public.launch_plans FOR ALL
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS launch_plans_updated_at ON public.launch_plans;
CREATE TRIGGER launch_plans_updated_at BEFORE UPDATE ON public.launch_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
