-- AGT-03: speculative reversible prep. While a human reviews a freshly
-- drafted Outcome Contract (CNV-04), the agent can pre-stage a design
-- scaffold in the background, zero side effects beyond an idempotent cache
-- write. That requires scaffolds to actually be persisted, which they were
-- not before this migration (generateDesignScaffold was purely ephemeral,
-- per DSN-03's documented finding when it went looking for a scaffold row
-- to anchor a "scaffold derives from flow" lineage edge to).

CREATE TABLE IF NOT EXISTS public.prd_scaffolds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces (id) ON DELETE CASCADE,
  prd_id uuid NOT NULL UNIQUE REFERENCES public.prds (id) ON DELETE CASCADE,
  html text NOT NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'speculative')),
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prd_scaffolds_ws ON public.prd_scaffolds (workspace_id);

ALTER TABLE public.prd_scaffolds ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prd_scaffolds TO authenticated;
GRANT ALL ON public.prd_scaffolds TO service_role;

DROP POLICY IF EXISTS "prd_scaffolds ws read" ON public.prd_scaffolds;
CREATE POLICY "prd_scaffolds ws read" ON public.prd_scaffolds FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "prd_scaffolds ws write" ON public.prd_scaffolds;
CREATE POLICY "prd_scaffolds ws write" ON public.prd_scaffolds FOR ALL
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS prd_scaffolds_updated_at ON public.prd_scaffolds;
CREATE TRIGGER prd_scaffolds_updated_at BEFORE UPDATE ON public.prd_scaffolds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
