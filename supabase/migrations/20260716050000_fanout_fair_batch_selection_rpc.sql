-- PC-12: Fair batch selection RPC for cross-workspace load balancing.
-- Returns pending fanout_batches in random order to prevent head-of-line starvation
-- when stuck batches exist in other workspaces.

CREATE OR REPLACE FUNCTION get_pending_fanout_batches(batch_limit int)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  workspace_id uuid,
  target_title text,
  child_run_ids uuid[],
  created_at timestamptz
) LANGUAGE sql STABLE AS $$
  SELECT
    id,
    user_id,
    workspace_id,
    target_title,
    child_run_ids,
    created_at
  FROM fanout_batches
  WHERE status = 'pending'
  ORDER BY RANDOM()
  LIMIT batch_limit;
$$;
