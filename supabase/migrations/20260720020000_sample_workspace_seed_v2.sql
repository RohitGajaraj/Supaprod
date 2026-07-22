-- SAMPLE-SEED v2 · Mission Control augment (front-end reimagining Phase 5).
--
-- BUILDS ON TOP of seed_sample_workspace (v1, migration 20260705120000); it does
-- NOT replace or wipe it. v1 is already a deep, surface-by-surface seed (Prism +
-- Trellis, 20+ surfaces) and every reimagined surface (the 7 Canvas faces,
-- Threads, Artifacts) already renders on it. The ONE thing the reimagined room
-- adds that v1 did not need is a fully-exercisable GATE interaction:
--   - v1's Prism specs are all approved / draft / shipped - NONE is 'review',
--     and getApprovalsQueue's `spec` family reads exactly `prds.status='review'`.
--     So the tray's revisable verbs (Approve -> approved, Send back -> draft) and
--     the Plan face's "your call" had nothing to act on.
-- This layer adds a single believable Prism spec awaiting the human's call, so
-- the Approvals tray, the Spine "your call", the signature moment, and the
-- send-back verb are all experienceable on the sample data. v1's existing
-- pending tool_call gate (rollout.ramp) already covers approve / decline / snooze.
--
-- SAFE + ADDITIVE: idempotent (sentinel agent_memory.metadata->>'seed' =
-- 'sample-mc-v2'), guarded (a missing table/column is caught and skipped, never
-- aborts), no-op for anyone without the v1 sample workspace, and it deletes
-- nothing. Applies at the Gate-2 merge alongside the other Phase 4/5 migrations.
-- The design-gate demonstration is deliberately deferred (it depends on the
-- workspace design-stage flag, whose default would surface every spec at once).

CREATE OR REPLACE FUNCTION public.seed_sample_workspace_v2(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
  proj_id uuid;
BEGIN
  -- Idempotent: this augment runs once per user.
  IF EXISTS (
    SELECT 1 FROM agent_memory
     WHERE user_id = _user_id AND metadata->>'seed' = 'sample-mc-v2'
  ) THEN
    RETURN;
  END IF;

  -- Only augment a user who already has the v1 sample workspace; otherwise no-op.
  SELECT id INTO ws_id FROM workspaces
    WHERE owner_id = _user_id AND name = 'Explore workspace' LIMIT 1;
  IF ws_id IS NULL THEN RETURN; END IF;

  SELECT id INTO proj_id FROM projects
    WHERE workspace_id = ws_id AND name = 'Prism' LIMIT 1;
  IF proj_id IS NULL THEN RETURN; END IF;

  -- The spec awaiting your call. status='review' is exactly what the queue's
  -- `spec` family reads, so this surfaces in the reimagined Approvals tray with
  -- the full revisable verb set (Approve, Send back, Decline, Snooze) and lights
  -- up the Spine's "your call". Guarded so a schema drift never aborts the seed.
  BEGIN
    INSERT INTO prds (user_id, workspace_id, project_id, opportunity_id, title, body_md, status, model)
    VALUES (_user_id, ws_id, proj_id, NULL,
      'PRD · Instant balance after a peer transfer',
      E'# Instant balance after a peer transfer\n\n## Problem\nAfter a peer-to-peer send, the recipient''s balance takes up to 30 seconds to reflect the money. Support sees a steady trickle of "where is my money" tickets, and the sender loses trust in the moment that should feel best.\n\n## Goal\nShow the new balance to the recipient within 2 seconds of a completed transfer, with no rise in reversed or duplicated postings.\n\n## Approach\n1. Post an optimistic pending credit the instant the transfer clears risk, tagged so it cannot be double-spent.\n2. Reconcile against the ledger settlement and flip pending to settled, silently, when it lands.\n3. If settlement fails, reverse the optimistic credit and tell both people plainly.\n\n## Success metrics\n- Recipient balance reflects the transfer within 2 seconds for 99% of sends.\n- "Where is my money" tickets cut by 80%.\n- Zero rise in reversed or duplicated postings.\n\n## Open question for you\nDo we show the pending credit as spendable immediately, or hold it as visible-but-not-spendable until settlement? That is a trust-versus-risk call, so it is yours.',
      'review', 'openai/gpt-5');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'sample-mc-v2: review spec insert skipped for %: %', _user_id, SQLERRM;
  END;

  -- Sentinel (also the one row that makes the idempotency guard true next time).
  BEGIN
    INSERT INTO agent_memory (user_id, workspace_id, content, kind, scope, importance, metadata, created_at)
    VALUES (_user_id, ws_id,
      'Mission Control v2 seed augment applied: a spec awaits your call so the Approvals tray, Send back, and the signature moment are all live on the sample data.',
      'note', 'workspace', 1,
      jsonb_build_object('seed','sample-mc-v2','product','prism','pattern_id','mc-gate-demo'),
      now() - INTERVAL '2 hours');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'sample-mc-v2: sentinel insert skipped for %: %', _user_id, SQLERRM;
  END;
END;
$$;

-- Apply the augment to every user who already carries the v1 sample seed (the
-- demo accounts and anyone who explored a sample workspace). Guarded per-user so
-- one failure never blocks the rest.
DO $$
DECLARE
  v_user uuid;
BEGIN
  FOR v_user IN
    SELECT DISTINCT user_id FROM agent_memory WHERE metadata->>'seed' = 'sample-workspace-v1'
  LOOP
    BEGIN
      PERFORM public.seed_sample_workspace_v2(v_user);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'sample-mc-v2 augment failed for %: %', v_user, SQLERRM;
    END;
  END LOOP;
END $$;
