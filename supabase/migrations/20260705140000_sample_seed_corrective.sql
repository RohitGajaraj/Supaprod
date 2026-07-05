-- SAMPLE-SEED corrective (2026-07-05): finish the seed on BOTH demo accounts + remove stray workspaces.
--
-- Context (verified live via the demo accounts' own RLS reads):
--   • demo@redcadence.app  : the Sample workspace (Prism + Trellis) IS seeded, but two stray
--     workspaces survived because the original 20260705120000 DO-block never ran here (only the
--     function got called): "Test" and "Project Glasswing" (the renamed original demo/Lumen
--     workspace, slug demo-*). The founder wants both removed.
--   • demo2@redcadence.app : never reseeded, still the old "Demo workspace" (Lumen). Needs the
--     full Prism + Trellis seed.
--
-- This runs the FULL, current seed_sample_workspace() function (defined by 20260705120000, now
-- live in the DB). Idempotent + resilient (per-account exception handler). Apply via the Lovable
-- SQL editor directly (NOT via Lovable's AI agent, which truncated the function last time).

DO $$
DECLARE
  v_user uuid;
  v_ws   uuid;
  ws_name text;
BEGIN
  -- ── demo@ : delete the two stray workspaces (keep "Sample workspace") ────────────────
  SELECT id INTO v_user FROM auth.users WHERE email = 'demo@redcadence.app';
  IF v_user IS NOT NULL THEN
    FOREACH ws_name IN ARRAY ARRAY['Test','Project Glasswing'] LOOP
      FOR v_ws IN SELECT id FROM public.workspaces WHERE owner_id = v_user AND name = ws_name LOOP
        BEGIN
          -- mission children first (mission_steps FK -> missions)
          DELETE FROM public.mission_steps WHERE mission_id IN (SELECT id FROM public.missions WHERE workspace_id = v_ws);
        EXCEPTION WHEN undefined_table THEN NULL; END;
        DELETE FROM public.agent_memory      WHERE workspace_id = v_ws;
        DELETE FROM public.artifact_lineage  WHERE workspace_id = v_ws;
        DELETE FROM public.learnings         WHERE workspace_id = v_ws;
        DELETE FROM public.agent_approvals   WHERE workspace_id = v_ws;
        DELETE FROM public.agent_messages    WHERE workspace_id = v_ws;
        DELETE FROM public.agent_runs        WHERE workspace_id = v_ws;
        DELETE FROM public.missions          WHERE workspace_id = v_ws;
        DELETE FROM public.messages          WHERE workspace_id = v_ws;
        DELETE FROM public.conversations     WHERE workspace_id = v_ws;
        DELETE FROM public.ai_events         WHERE workspace_id = v_ws;
        DELETE FROM public.decisions         WHERE workspace_id = v_ws;
        DELETE FROM public.tasks             WHERE workspace_id = v_ws;
        DELETE FROM public.prds              WHERE workspace_id = v_ws;
        DELETE FROM public.signals           WHERE workspace_id = v_ws;
        DELETE FROM public.opportunities     WHERE workspace_id = v_ws;
        DELETE FROM public.themes            WHERE workspace_id = v_ws;
        DELETE FROM public.docs              WHERE workspace_id = v_ws;
        DELETE FROM public.notes             WHERE workspace_id = v_ws;
        DELETE FROM public.meetings          WHERE workspace_id = v_ws;
        DELETE FROM public.projects          WHERE workspace_id = v_ws;
        DELETE FROM public.workspace_members WHERE workspace_id = v_ws;
        DELETE FROM public.workspaces        WHERE id = v_ws;
        RAISE NOTICE 'deleted stray workspace % (%) for demo@', ws_name, v_ws;
      END LOOP;
    END LOOP;
  END IF;

  -- ── demo2@ : wipe the old Lumen content and reseed with the full Prism + Trellis seed ──
  SELECT id INTO v_user FROM auth.users WHERE email = 'demo2@redcadence.app';
  IF v_user IS NOT NULL THEN
    BEGIN
      -- mission children first
      BEGIN
        DELETE FROM public.mission_steps WHERE mission_id IN (SELECT id FROM public.missions WHERE user_id = v_user);
      EXCEPTION WHEN undefined_table THEN NULL; END;
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
      -- drop the old demo/sample workspaces (content gone); keep any 'My workspace'
      DELETE FROM public.workspace_members wm USING public.workspaces w
        WHERE wm.workspace_id = w.id AND w.owner_id = v_user AND w.name IN ('Demo workspace','Sample workspace','Explore workspace');
      DELETE FROM public.workspaces w
        WHERE w.owner_id = v_user AND w.name IN ('Demo workspace','Sample workspace','Explore workspace');
      -- reseed with the full function (Prism + Trellis)
      PERFORM public.seed_sample_workspace(v_user);
      RAISE NOTICE 'reseeded demo2@ with Prism + Trellis';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'demo2@ reseed failed: %', SQLERRM;
    END;
  END IF;

  -- ── Rename the seeded workspace to a clearer, non-'sample' display name ──────────────
  -- The function still creates 'Sample workspace'; rename it (name + slug) on both demo
  -- accounts so the user sees "Explore workspace" (a space to explore the product) instead.
  UPDATE public.workspaces
     SET name = 'Explore workspace',
         slug = 'explore-' || substr(owner_id::text, 1, 8)
   WHERE name = 'Sample workspace'
     AND owner_id IN (SELECT id FROM auth.users WHERE email IN ('demo@redcadence.app','demo2@redcadence.app'));
END $$;
