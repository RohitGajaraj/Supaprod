-- Artifact VERSIONS (front-end reimagining task 10 / gap K7).
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artifact_versions TO authenticated;
GRANT ALL ON public.artifact_versions TO service_role;