CREATE TABLE IF NOT EXISTS public.brief_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('vision','icp','positioning','top_bet')),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'standing' CHECK (status IN ('standing','superseded')),
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid REFERENCES public.brief_items(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brief_items TO authenticated;
GRANT ALL ON public.brief_items TO service_role;
ALTER TABLE public.brief_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_brief_items_ws_status ON public.brief_items (workspace_id, kind, status);
CREATE INDEX IF NOT EXISTS idx_brief_items_supersedes ON public.brief_items (supersedes_id) WHERE supersedes_id IS NOT NULL;
DROP POLICY IF EXISTS "brief_items ws read" ON public.brief_items;
CREATE POLICY "brief_items ws read" ON public.brief_items FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "brief_items ws write" ON public.brief_items;
CREATE POLICY "brief_items ws write" ON public.brief_items FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
DROP TRIGGER IF EXISTS brief_items_updated_at ON public.brief_items;
CREATE TRIGGER brief_items_updated_at BEFORE UPDATE ON public.brief_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assumptions ADD COLUMN IF NOT EXISTS brief_item_id uuid REFERENCES public.brief_items(id) ON DELETE CASCADE;
ALTER TABLE public.assumptions DROP CONSTRAINT IF EXISTS assumptions_source_chk;
ALTER TABLE public.assumptions ADD CONSTRAINT assumptions_source_chk CHECK (decision_id IS NOT NULL OR prd_id IS NOT NULL OR brief_item_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_assumptions_brief_item ON public.assumptions (brief_item_id) WHERE brief_item_id IS NOT NULL;