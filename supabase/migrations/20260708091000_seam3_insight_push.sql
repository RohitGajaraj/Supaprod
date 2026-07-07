-- SEAM-3 (mission 3.9): the Brain pushes, not just stores.
--
-- Adds the push fields to the existing insights table: pushed_at (when the card
-- was actively pushed), digest (true = the candidate landed over the daily push
-- cap and is held for the digest instead, never lost), and push_action (the
-- one-click action {label, kind, targetId} a pushed card carries). Widens the
-- kind vocabulary with the three deterministic push kinds:
--   ground_shift      - a supersession flipped ground under a live decision
--   bet_contradiction - a recorded outcome cuts against the ranked best bet
--   assumption_miss   - a watched (calibrated) assumption resolved as a miss
-- Additive and idempotent; RLS is already enforced by the existing
-- is_workspace_member policies on insights, which cover the new columns.

ALTER TABLE public.insights
  ADD COLUMN IF NOT EXISTS pushed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS digest      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_action jsonb;

-- Widen the kind CHECK to admit the push kinds. The original inline column
-- constraint carries the deterministic Postgres name insights_kind_check, so
-- drop-then-add stays idempotent on re-run.
ALTER TABLE public.insights DROP CONSTRAINT IF EXISTS insights_kind_check;
ALTER TABLE public.insights ADD CONSTRAINT insights_kind_check CHECK (kind IN
  ('prediction','risk','next_best_action','cost_of_inaction','hidden_connection',
   'ground_shift','bet_contradiction','assumption_miss'));

-- Fast path for "today's pushes" (getPushedInsights) and the daily throttle count.
CREATE INDEX IF NOT EXISTS insights_ws_pushed_idx
  ON public.insights (workspace_id, pushed_at DESC)
  WHERE pushed_at IS NOT NULL;
