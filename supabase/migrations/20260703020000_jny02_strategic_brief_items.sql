-- JNY-02: the living strategy brief. Graduates the Strategic Brief from free
-- text (workspace_briefs, unchanged, still the legacy dual-projection source)
-- to a structured, versioned decision cluster: vision / icp / positioning are
-- singleton standing items, top_bet is a small portfolio. Each edit creates a
-- new version and marks its predecessor 'superseded' (never mutated in
-- place), the same standing/superseded idiom FS-02's assumptions and CNV-01's
-- contract clauses already use — except here it lives on an explicit status
-- column rather than an artifact_lineage-derived read, because lineage RLS is
-- owner-scoped (see house-rules.functions.ts's documented KNOWN LIMIT) and a
-- workspace-shared brief cannot depend on which member wrote the edge.

CREATE TABLE IF NOT EXISTS public.brief_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('vision', 'icp', 'positioning', 'top_bet')),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'standing' CHECK (status IN ('standing', 'superseded')),
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid REFERENCES public.brief_items (id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brief_items_ws_status ON public.brief_items (workspace_id, kind, status);
CREATE INDEX IF NOT EXISTS idx_brief_items_supersedes ON public.brief_items (supersedes_id) WHERE supersedes_id IS NOT NULL;

ALTER TABLE public.brief_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brief_items TO authenticated;
GRANT ALL ON public.brief_items TO service_role;

DROP POLICY IF EXISTS "brief_items ws read" ON public.brief_items;
CREATE POLICY "brief_items ws read" ON public.brief_items FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "brief_items ws write" ON public.brief_items;
CREATE POLICY "brief_items ws write" ON public.brief_items FOR ALL
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS brief_items_updated_at ON public.brief_items;
CREATE TRIGGER brief_items_updated_at BEFORE UPDATE ON public.brief_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reuse FS-02/CNV-02's supersedable-source idiom on assumptions: a brief
-- item's standing assumptions are typed rows the existing assumption-watch
-- cron already scans (it is keyed on workspace_id + status, never on which
-- source column is populated), so this is a zero-change reuse of that
-- watcher, exactly like CNV-02's prd_id addition before it.
ALTER TABLE public.assumptions
  ADD COLUMN IF NOT EXISTS brief_item_id uuid REFERENCES public.brief_items (id) ON DELETE CASCADE;
ALTER TABLE public.assumptions
  DROP CONSTRAINT IF EXISTS assumptions_source_chk;
ALTER TABLE public.assumptions
  ADD CONSTRAINT assumptions_source_chk
  CHECK (decision_id IS NOT NULL OR prd_id IS NOT NULL OR brief_item_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_assumptions_brief_item ON public.assumptions (brief_item_id) WHERE brief_item_id IS NOT NULL;
