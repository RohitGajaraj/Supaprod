-- Mission Control: gate SEND-BACK notes (front-end reimagining Phase 4).
CREATE TABLE IF NOT EXISTS public.approval_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  source_id text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own approval feedback all" ON public.approval_feedback;
CREATE POLICY "own approval feedback all" ON public.approval_feedback
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS approval_feedback_source_idx
  ON public.approval_feedback (user_id, kind, source_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_feedback TO authenticated;
GRANT ALL ON public.approval_feedback TO service_role;