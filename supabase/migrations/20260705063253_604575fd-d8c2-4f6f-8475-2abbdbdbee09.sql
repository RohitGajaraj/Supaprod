-- 1) Allow the additional source_kind categories used by the sample seed.
ALTER TABLE public.decisions DROP CONSTRAINT IF EXISTS decisions_source_kind_check;
ALTER TABLE public.decisions ADD CONSTRAINT decisions_source_kind_check
  CHECK (source_kind IS NULL OR source_kind = ANY (ARRAY[
    'meeting','mission','prd','manual','roadmap','retrospective','critic'
  ]));

-- 2) Reseed both demo accounts (with the exception swallow, so one bad user does
-- not abort the other).
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

      DELETE FROM public.workspace_members wm
        USING public.workspaces w
       WHERE wm.workspace_id = w.id
         AND w.owner_id = v_user
         AND w.name IN ('Demo workspace','Sample workspace');
      DELETE FROM public.workspaces w
       WHERE w.owner_id = v_user
         AND w.name IN ('Demo workspace','Sample workspace');

      PERFORM public.seed_sample_workspace(v_user);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'sample-workspace reseed failed for %: %', v_email, SQLERRM;
    END;
  END LOOP;
END $$;