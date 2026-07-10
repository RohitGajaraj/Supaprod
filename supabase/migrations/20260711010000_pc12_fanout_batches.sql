-- PC-12: parallel fan-out to one review queue. Tracks ONE "explore this
-- from all sides" dispatch (draft/eval/risks, up to 3 children via the
-- existing agent.spawn/enqueueFanout seam) as a single row, so 3 child
-- runs resolve into ONE composite review card instead of 3 separate
-- notifications. Reconciled by a poll tick (fanout-reconcile-tick), not by
-- touching the pinned loop.server.ts completion path.

CREATE TABLE fanout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('opportunity', 'prd')),
  target_id UUID NOT NULL,
  target_title TEXT NOT NULL,
  child_run_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'decided')),
  -- {draft: string|null, eval: string|null, risks: string|null, synthesis: string|null}
  composite JSONB,
  decision TEXT CHECK (decision IN ('accepted', 'dismissed')),
  decided_by UUID,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ready_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_fanout_batches_workspace_status ON fanout_batches(workspace_id, status);

ALTER TABLE fanout_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their workspace's fanout batches"
  ON fanout_batches FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Row-scoped to status = 'ready' on the USING side: a member cannot decide a
-- still-pending batch or re-decide one already decided, even via a raw
-- client call that bypasses decideFanoutBatch's own status guard.
CREATE POLICY "Members decide their workspace's fanout batches"
  ON fanout_batches FOR UPDATE
  USING (
    status = 'ready'
    AND workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members create their workspace's fanout batches"
  ON fanout_batches FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages fanout batches"
  ON fanout_batches FOR ALL
  USING (auth.role() = 'service_role');
