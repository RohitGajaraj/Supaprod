-- 1) Patch seed_sample_workspace: cast bare boolean literals to jsonb inside
--    artifact_lineage INSERTs only (leave decisions.is_public untouched).
DO $$
DECLARE
  src text;
  parts text[];
  i int;
  seg text;
  head text; tail text;
  cut int;
  fixed text := '';
BEGIN
  SELECT pg_get_functiondef('public.seed_sample_workspace(uuid)'::regprocedure) INTO src;
  parts := regexp_split_to_array(src, 'INSERT INTO artifact_lineage');
  fixed := parts[1];
  FOR i IN 2 .. array_length(parts, 1) LOOP
    seg := parts[i];
    cut := position(';' in seg);
    IF cut = 0 THEN head := seg; tail := '';
    ELSE head := substr(seg, 1, cut); tail := substr(seg, cut + 1); END IF;
    head := replace(head, 'to_jsonb(true)',  'true');
    head := replace(head, 'to_jsonb(false)', 'false');
    head := regexp_replace(head, E'''([a-z\\-]+)'', (true|false), now\\(\\)', E'''\\1'', to_jsonb(\\2), now()', 'g');
    fixed := fixed || 'INSERT INTO artifact_lineage' || head || tail;
  END LOOP;
  EXECUTE fixed;
END $$;

-- 2) Reseed demo2@ fresh.
DO $$
DECLARE
  v_user uuid;
  v_ws   uuid;
  r RECORD;
BEGIN
  SELECT id INTO v_user FROM auth.users WHERE email = 'demo2@redcadence.app';
  IF v_user IS NULL THEN RETURN; END IF;

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

  DELETE FROM public.agent_memory WHERE user_id = v_user;
  -- Keep agents; seed_default_agents will upsert.

  PERFORM public.seed_sample_workspace(v_user);

  UPDATE public.workspaces
     SET name = 'Explore workspace',
         slug = 'explore-' || substr(owner_id::text, 1, 8)
   WHERE name = 'Sample workspace' AND owner_id = v_user;
END $$;