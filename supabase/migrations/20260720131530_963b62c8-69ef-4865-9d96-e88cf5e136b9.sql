-- Mission Control: gate SNOOZE (front-end reimagining Phase 4).
CREATE TABLE IF NOT EXISTS public.approval_snoozes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  source_id text NOT NULL,
  snoozed_until timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, source_id)
);

ALTER TABLE public.approval_snoozes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own snoozes all" ON public.approval_snoozes;
CREATE POLICY "own snoozes all" ON public.approval_snoozes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS approval_snoozes_user_until_idx
  ON public.approval_snoozes (user_id, snoozed_until);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_snoozes TO authenticated;
GRANT ALL ON public.approval_snoozes TO service_role;