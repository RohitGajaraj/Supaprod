-- LOOM W4: prd-in-workspace consistency for the three PRD-derived artifact
-- tables (prd_scaffolds, prd_flows, launch_plans). Their write policies
-- checked only is_workspace_member(workspace_id), so a member of workspace A
-- could insert/update a row that points at a PRD belonging to workspace B
-- (cross-tenant artifact attachment). The fix: WITH CHECK now also requires
-- the referenced PRD to live in the row's own workspace.
--
-- Shape notes (follows the 20260703 dsn03/jny04/agt03 policy idiom):
--   - DROP POLICY IF EXISTS + CREATE POLICY, idempotent, re-runnable.
--   - USING stays membership-only so a member can still read/fix/delete any
--     legacy inconsistent row; the consistency check gates INSERT and the
--     new row values of UPDATE (WITH CHECK), where the hole was.
--   - The prds subquery is additionally guarded by prds' own RLS for
--     authenticated callers; service_role bypasses RLS as before.

-- prd_scaffolds ---------------------------------------------------------------
DROP POLICY IF EXISTS "prd_scaffolds ws write" ON public.prd_scaffolds;
CREATE POLICY "prd_scaffolds ws write" ON public.prd_scaffolds FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (
    public.is_workspace_member(workspace_id)
    AND EXISTS (
      SELECT 1 FROM public.prds p
      WHERE p.id = prd_scaffolds.prd_id
        AND p.workspace_id = prd_scaffolds.workspace_id
    )
  );

-- prd_flows -------------------------------------------------------------------
DROP POLICY IF EXISTS "prd_flows ws write" ON public.prd_flows;
CREATE POLICY "prd_flows ws write" ON public.prd_flows FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (
    public.is_workspace_member(workspace_id)
    AND EXISTS (
      SELECT 1 FROM public.prds p
      WHERE p.id = prd_flows.prd_id
        AND p.workspace_id = prd_flows.workspace_id
    )
  );

-- launch_plans ----------------------------------------------------------------
DROP POLICY IF EXISTS "launch_plans ws write" ON public.launch_plans;
CREATE POLICY "launch_plans ws write" ON public.launch_plans FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (
    public.is_workspace_member(workspace_id)
    AND EXISTS (
      SELECT 1 FROM public.prds p
      WHERE p.id = launch_plans.prd_id
        AND p.workspace_id = launch_plans.workspace_id
    )
  );
