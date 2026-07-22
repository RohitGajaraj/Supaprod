-- Mission Control: gate SEND-BACK notes (front-end reimagining Phase 4;
-- founder-authorized 2026-07-19, tray verb option (a)). "Send back" returns a
-- revisable gate (a spec, a design gate) to its draft/revision state WITH the
-- operator's note, so the agent continues the same thread knowing what to fix.
--
-- WHY a side table, not a column: like the snooze record, the note is keyed on
-- the composite the Approvals queue already carries per item - (kind, source_id)
-- - so it attaches to ANY revisable family without touching a source table's
-- write path. The return-to-draft itself reuses the existing resolvers
-- (savePrd -> draft, decideDesignGate -> reject); this table only persists the
-- note that rides along.
--
-- DEGRADES GRACEFULLY: until this migration is applied (at the Gate-2 merge),
-- sendBackApprovalItem's note insert fails and the whole send-back is refused
-- with an honest "turns on with the next release" message - the queue and every
-- other verb are untouched. Additive only; no destructive change.

CREATE TABLE IF NOT EXISTS public.approval_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The federated gate family (matches ApprovalKind) + the source row id the
  -- queue decides against. Text on purpose: source ids are heterogeneous across
  -- families, exactly as the decide entry point takes.
  kind text NOT NULL,
  source_id text NOT NULL,
  -- The operator's revision guidance. Required: a send-back without a note is
  -- just a decline, so the server rejects an empty note.
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_feedback ENABLE ROW LEVEL SECURITY;

-- Send-back feedback is personal triage: each user manages only their own rows.
DROP POLICY IF EXISTS "own approval feedback all" ON public.approval_feedback;
CREATE POLICY "own approval feedback all" ON public.approval_feedback
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reads fetch the latest note per (user, kind, source); index that path.
CREATE INDEX IF NOT EXISTS approval_feedback_source_idx
  ON public.approval_feedback (user_id, kind, source_id, created_at DESC);
