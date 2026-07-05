DO $$
DECLARE
  d text;
  lineage_start int;
  lineage_end int;
  before_part text;
  lineage_part text;
  after_part text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO d
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='seed_sample_workspace';

  -- Step 1: undo the earlier over-broad replacement in the decisions inserts
  -- (`to_jsonb(true)` in the is_public position needs to be plain `true`).
  d := replace(d, '''strategist'', to_jsonb(true), now()',  '''strategist'', true, now()');
  d := replace(d, '''strategist'', to_jsonb(false), now()', '''strategist'', false, now()');
  d := replace(d, '''critic'', to_jsonb(true), now()',      '''critic'', true, now()');
  d := replace(d, '''critic'', to_jsonb(false), now()',     '''critic'', false, now()');
  d := replace(d, '''prd-writer'', to_jsonb(true), now()',  '''prd-writer'', true, now()');
  d := replace(d, '''prd-writer'', to_jsonb(false), now()', '''prd-writer'', false, now()');

  -- Step 2: scope the boolean->jsonb rewrite to each artifact_lineage INSERT block only.
  -- Loop: find each 'INSERT INTO artifact_lineage' ... 'ON CONFLICT (user_id, parent_kind'
  -- window and rewrite booleans within it. There are two such blocks (Prism + Trellis).
  FOR i IN 1..2 LOOP
    lineage_start := strpos(d, 'INSERT INTO artifact_lineage');
    IF lineage_start = 0 THEN EXIT; END IF;
    lineage_end := strpos(substr(d, lineage_start), 'ON CONFLICT (user_id, parent_kind');
    IF lineage_end = 0 THEN EXIT; END IF;
    lineage_end := lineage_start + lineage_end - 1;

    before_part  := substr(d, 1, lineage_start - 1);
    lineage_part := substr(d, lineage_start, lineage_end - lineage_start);
    after_part   := substr(d, lineage_end);

    -- Within the artifact_lineage insert, wrap the boolean inference flag.
    lineage_part := replace(lineage_part, '''strategist'', true, now()',  '''strategist'', to_jsonb(true), now()');
    lineage_part := replace(lineage_part, '''strategist'', false, now()', '''strategist'', to_jsonb(false), now()');
    lineage_part := replace(lineage_part, '''critic'', true, now()',      '''critic'', to_jsonb(true), now()');
    lineage_part := replace(lineage_part, '''critic'', false, now()',     '''critic'', to_jsonb(false), now()');
    lineage_part := replace(lineage_part, '''prd-writer'', true, now()',  '''prd-writer'', to_jsonb(true), now()');
    lineage_part := replace(lineage_part, '''prd-writer'', false, now()', '''prd-writer'', to_jsonb(false), now()');

    -- Neutralize the marker in this block so the next loop iteration finds the next block.
    lineage_part := replace(lineage_part, 'INSERT INTO artifact_lineage', 'INSERT INTO artifact_lineage /*done*/');

    d := before_part || lineage_part || after_part;
  END LOOP;

  -- Restore the marker in both blocks.
  d := replace(d, 'INSERT INTO artifact_lineage /*done*/', 'INSERT INTO artifact_lineage');

  EXECUTE d;
END $$;

-- Reseed both demo accounts.
DO $$
DECLARE
  v_emails text[] := ARRAY['demo@redcadence.app','demo2@redcadence.app'];
  v_email text;
  v_user uuid;
BEGIN
  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT id INTO v_user FROM auth.users WHERE email = v_email LIMIT 1;
    IF v_user IS NULL THEN CONTINUE; END IF;

    BEGIN
      DELETE FROM public.agent_memory      WHERE user_id = v_user;
      DELETE FROM public.artifact_lineage  WHERE user_id = v_user;
      DELETE FROM public.learnings         WHERE user_id = v_user;
      DELETE FROM public.eval_case_results WHERE user_id = v_user;
      DELETE FROM public.eval_runs         WHERE user_id = v_user;
      DELETE FROM public.eval_cases        WHERE user_id = v_user;
      DELETE FROM public.eval_suites       WHERE user_id = v_user;
      DELETE FROM public.agent_approvals   WHERE user_id = v_user;
      DELETE FROM public.agent_messages    WHERE user_id = v_user;
      DELETE FROM public.agent_runs        WHERE user_id = v_user;
      DELETE FROM public.missions          WHERE user_id = v_user;
      DELETE FROM public.messages          WHERE user_id = v_user;
      DELETE FROM public.conversations     WHERE user_id = v_user;
      DELETE FROM public.ai_events         WHERE user_id = v_user;
      DELETE FROM public.ai_budgets        WHERE user_id = v_user;
      DELETE FROM public.drift_snapshots   WHERE user_id = v_user;
      DELETE FROM public.drift_baselines   WHERE user_id = v_user;
      DELETE FROM public.daily_briefs      WHERE user_id = v_user;
      DELETE FROM public.decisions         WHERE user_id = v_user;
      DELETE FROM public.tasks             WHERE user_id = v_user;
      DELETE FROM public.prds              WHERE user_id = v_user;
      DELETE FROM public.signals           WHERE user_id = v_user;
      DELETE FROM public.opportunities     WHERE user_id = v_user;
      DELETE FROM public.themes            WHERE user_id = v_user;
      DELETE FROM public.docs              WHERE user_id = v_user;
      DELETE FROM public.notes             WHERE user_id = v_user;
      DELETE FROM public.meetings          WHERE user_id = v_user;
      DELETE FROM public.projects          WHERE user_id = v_user;

      DELETE FROM public.workspace_members wm USING public.workspaces w
       WHERE wm.workspace_id = w.id AND w.owner_id = v_user
         AND w.name IN ('Demo workspace','Sample workspace');
      DELETE FROM public.workspaces w
       WHERE w.owner_id = v_user AND w.name IN ('Demo workspace','Sample workspace');

      PERFORM public.seed_sample_workspace(v_user);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'sample-workspace reseed failed for %: %', v_email, SQLERRM;
    END;
  END LOOP;
END $$;