-- 20260704063000_fix_changelog_released_at_trigger.sql
-- Fix: changelog auto-materialize trigger, targeting the real live column.
--
-- 20260629120200_byo_p3_changelog.sql never actually applied to production
-- (confirmed: absent from supabase_migrations.schema_migrations, and neither
-- its studio_changeset_to_changelog() function nor its trigger exist live).
-- 20260630180128_...sql's CREATE TABLE IF NOT EXISTS won the race instead and
-- created public.changelog_entries with a `released_at` column, not the dead
-- migration's `published_at`. Application code was written against the dead
-- migration's column name and has been fixed separately (changelog.ts,
-- changelog.functions.ts) to use `released_at`. This migration restores the
-- auto-materialize trigger the dead migration was supposed to create, this
-- time against the column that actually exists, plus the same backfill for
-- any already-merged changeset with release notes.

CREATE OR REPLACE FUNCTION public.studio_changeset_to_changelog()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'merged'
     AND NEW.release_notes IS NOT NULL
     AND btrim(NEW.release_notes) <> '' THEN
    INSERT INTO public.changelog_entries
      (user_id, workspace_id, product_id, changeset_id, prd_id, title, body, pr_number, pr_url, released_at)
    VALUES (
      NEW.user_id, NEW.workspace_id, NEW.product_id, NEW.id, NEW.prd_id,
      COALESCE(NULLIF(btrim(NEW.title), ''), 'Shipped an update'),
      btrim(NEW.release_notes),
      NEW.pr_number, NEW.pr_url,
      COALESCE(NEW.release_notes_at, now())
    )
    ON CONFLICT (changeset_id) WHERE changeset_id IS NOT NULL DO UPDATE
      SET title = EXCLUDED.title,
          body = EXCLUDED.body,
          pr_number = EXCLUDED.pr_number,
          pr_url = EXCLUDED.pr_url,
          prd_id = COALESCE(EXCLUDED.prd_id, public.changelog_entries.prd_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_studio_changeset_to_changelog ON public.studio_changesets;
CREATE TRIGGER trg_studio_changeset_to_changelog
  AFTER INSERT OR UPDATE OF status, release_notes ON public.studio_changesets
  FOR EACH ROW EXECUTE FUNCTION public.studio_changeset_to_changelog();

-- Backfill changelog entries for changesets already merged before this trigger
-- existed. Idempotent via the (changeset_id) unique index.
INSERT INTO public.changelog_entries
  (user_id, workspace_id, product_id, changeset_id, prd_id, title, body, pr_number, pr_url, released_at)
SELECT user_id, workspace_id, product_id, id, prd_id,
       COALESCE(NULLIF(btrim(title), ''), 'Shipped an update'),
       btrim(release_notes), pr_number, pr_url, COALESCE(release_notes_at, now())
FROM public.studio_changesets
WHERE status = 'merged'
  AND release_notes IS NOT NULL
  AND btrim(release_notes) <> ''
ON CONFLICT (changeset_id) WHERE changeset_id IS NOT NULL DO NOTHING;

-- 20260704110900_loom_prd_scope_consistency.sql
-- LOOM W4: prd-in-workspace consistency for the three PRD-derived artifact
-- tables (prd_scaffolds, prd_flows, launch_plans). Their write policies
-- checked only is_workspace_member(workspace_id), so a member of workspace A
-- could insert/update a row that points at a PRD belonging to workspace B
-- (cross-tenant artifact attachment). The fix: WITH CHECK now also requires
-- the referenced PRD to live in the row's own workspace.

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