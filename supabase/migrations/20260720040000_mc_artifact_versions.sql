-- Artifact VERSIONS (front-end reimagining task 10 / gap K7). A lightweight
-- snapshot history for the artifact families (prototypes, specs, docs) so a
-- person can snapshot the current state and restore an earlier one.
--
-- One generic table: each row is a {title, body} snapshot of one artifact at a
-- moment. The body column holds the family's primary text (prds.body_md,
-- docs.content_text, prototypes.description). Restore writes {title, body} back
-- to that family's columns. Keeping the snapshot generic avoids a per-family
-- version table and needs no change to the family tables themselves.
--
-- DEGRADES GRACEFULLY: until this migration is applied (at the Gate-2 merge),
-- listArtifactVersions reads the missing table and returns [] (the history
-- panel shows "no versions yet"), and captureArtifactVersion surfaces an honest
-- "turns on with the next release" message. Mirrors the snooze/feedback/folders
-- pattern.

CREATE TABLE IF NOT EXISTS public.artifact_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid,
  artifact_kind text NOT NULL CHECK (artifact_kind IN ('prototype', 'spec', 'doc')),
  artifact_id uuid NOT NULL,
  title text,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artifact_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own artifact versions all" ON public.artifact_versions;
CREATE POLICY "own artifact versions all" ON public.artifact_versions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS artifact_versions_lookup_idx
  ON public.artifact_versions (user_id, artifact_kind, artifact_id, created_at DESC);
