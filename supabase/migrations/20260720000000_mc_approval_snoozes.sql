-- Mission Control: gate SNOOZE (front-end reimagining Phase 4; founder-authorized
-- 2026-07-19, tray verb option (a)). A gate the operator defers with H disappears
-- from the queue until snoozed_until, then resurfaces on its own.
--
-- WHY a side table, not a column: the Approvals queue federates ten gate families
-- across many source tables (agent_approvals, decisions, prds, memory_candidates,
-- ...). A snooze keyed on the composite the queue already carries per item -
-- (kind, source_id) - defers ANY family without touching a single source table,
-- so no existing gate write path changes. This mirrors the queue's own
-- read-and-reshape posture (it invents no new gate; this adds one defer record).
--
-- DEGRADES GRACEFULLY: until this migration is applied (at the Gate-2 merge), the
-- queue read simply finds no snoozes and shows every gate - getApprovalsQueue's
-- snooze filter tolerates the missing table. Additive only; no destructive change.

CREATE TABLE IF NOT EXISTS public.approval_snoozes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The federated gate family (matches ApprovalKind) + the source row id the
  -- queue decides against. Text on purpose: source ids are heterogeneous across
  -- families (uuids and composite keys), exactly as the decide entry point takes.
  kind text NOT NULL,
  source_id text NOT NULL,
  snoozed_until timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- One live snooze per gate per user; re-snoozing updates the same row.
  UNIQUE (user_id, kind, source_id)
);

ALTER TABLE public.approval_snoozes ENABLE ROW LEVEL SECURITY;

-- A snooze is a purely personal triage state: each user manages only their own.
DROP POLICY IF EXISTS "own snoozes all" ON public.approval_snoozes;
CREATE POLICY "own snoozes all" ON public.approval_snoozes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- The queue read filters by (user_id, snoozed_until > now); index that path.
CREATE INDEX IF NOT EXISTS approval_snoozes_user_until_idx
  ON public.approval_snoozes (user_id, snoozed_until);
