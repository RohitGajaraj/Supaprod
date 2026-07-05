DO $$
DECLARE
  v_user uuid;
  v_ws   uuid;
  ws_name text;
  r RECORD;
BEGIN
  -- demo@ : delete stray workspaces (dynamically cascade all workspace-scoped children)
  SELECT id INTO v_user FROM auth.users WHERE email = 'demo@redcadence.app';
  IF v_user IS NOT NULL THEN
    FOREACH ws_name IN ARRAY ARRAY['Test','Project Glasswing'] LOOP
      FOR v_ws IN SELECT id FROM public.workspaces WHERE owner_id = v_user AND name = ws_name LOOP
        BEGIN DELETE FROM public.mission_steps WHERE mission_id IN (SELECT id FROM public.missions WHERE workspace_id = v_ws); EXCEPTION WHEN undefined_table THEN NULL; END;
        FOR r IN
          SELECT c.conrelid::regclass::text AS tbl
          FROM pg_constraint c
          WHERE c.contype = 'f' AND c.confrelid = 'public.workspaces'::regclass
        LOOP
          EXECUTE format('DELETE FROM %s WHERE workspace_id = $1', r.tbl) USING v_ws;
        END LOOP;
        DELETE FROM public.workspaces WHERE id = v_ws;
        RAISE NOTICE 'deleted stray workspace % (%) for demo@', ws_name, v_ws;
      END LOOP;
    END LOOP;
  END IF;

  -- demo2@ : wipe old content and reseed
  SELECT id INTO v_user FROM auth.users WHERE email = 'demo2@redcadence.app';
  IF v_user IS NOT NULL THEN
    BEGIN
      -- delete workspaces owned by demo2@ (except keep 'My workspace' if present)
      FOR v_ws IN
        SELECT id FROM public.workspaces
        WHERE owner_id = v_user AND name IN ('Demo workspace','Sample workspace','Explore workspace')
      LOOP
        BEGIN DELETE FROM public.mission_steps WHERE mission_id IN (SELECT id FROM public.missions WHERE workspace_id = v_ws); EXCEPTION WHEN undefined_table THEN NULL; END;
        FOR r IN
          SELECT c.conrelid::regclass::text AS tbl
          FROM pg_constraint c
          WHERE c.contype = 'f' AND c.confrelid = 'public.workspaces'::regclass
        LOOP
          EXECUTE format('DELETE FROM %s WHERE workspace_id = $1', r.tbl) USING v_ws;
        END LOOP;
        DELETE FROM public.workspaces WHERE id = v_ws;
      END LOOP;
      PERFORM public.seed_sample_workspace(v_user);
      RAISE NOTICE 'reseeded demo2@ with Prism + Trellis';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'demo2@ reseed failed: %', SQLERRM;
    END;
  END IF;

  -- Rename Sample workspace to Explore workspace on both demo accounts
  UPDATE public.workspaces
     SET name = 'Explore workspace',
         slug = 'explore-' || substr(owner_id::text, 1, 8)
   WHERE name = 'Sample workspace'
     AND owner_id IN (SELECT id FROM auth.users WHERE email IN ('demo@redcadence.app','demo2@redcadence.app'));
END $$;