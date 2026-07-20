-- SAMPLE-SEED v2 · Mission Control augment (front-end reimagining Phase 5).
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
  IF EXISTS (
    SELECT 1 FROM agent_memory
     WHERE user_id = _user_id AND metadata->>'seed' = 'sample-mc-v2'
  ) THEN
    RETURN;
  END IF;

  SELECT id INTO ws_id FROM workspaces
    WHERE owner_id = _user_id AND name = 'Explore workspace' LIMIT 1;
  IF ws_id IS NULL THEN RETURN; END IF;

  SELECT id INTO proj_id FROM projects
    WHERE workspace_id = ws_id AND name = 'Prism' LIMIT 1;
  IF proj_id IS NULL THEN RETURN; END IF;

  BEGIN
    INSERT INTO prds (user_id, workspace_id, project_id, opportunity_id, title, body_md, status, model)
    VALUES (_user_id, ws_id, proj_id, NULL,
      'PRD · Instant balance after a peer transfer',
      E'# Instant balance after a peer transfer\n\n## Problem\nAfter a peer-to-peer send, the recipient''s balance takes up to 30 seconds to reflect the money. Support sees a steady trickle of "where is my money" tickets, and the sender loses trust in the moment that should feel best.\n\n## Goal\nShow the new balance to the recipient within 2 seconds of a completed transfer, with no rise in reversed or duplicated postings.\n\n## Approach\n1. Post an optimistic pending credit the instant the transfer clears risk, tagged so it cannot be double-spent.\n2. Reconcile against the ledger settlement and flip pending to settled, silently, when it lands.\n3. If settlement fails, reverse the optimistic credit and tell both people plainly.\n\n## Success metrics\n- Recipient balance reflects the transfer within 2 seconds for 99% of sends.\n- "Where is my money" tickets cut by 80%.\n- Zero rise in reversed or duplicated postings.\n\n## Open question for you\nDo we show the pending credit as spendable immediately, or hold it as visible-but-not-spendable until settlement? That is a trust-versus-risk call, so it is yours.',
      'review', 'openai/gpt-5');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'sample-mc-v2: review spec insert skipped for %: %', _user_id, SQLERRM;
  END;

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