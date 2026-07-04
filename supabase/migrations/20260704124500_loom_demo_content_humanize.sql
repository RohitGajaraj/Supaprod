-- LOOM W5 (2026-07-04): humanize seeded demo content in place.
-- The original demo-seed migrations (20260604201531, 20260625150000, ...)
-- predate the humanized-output law and baked em/en dashes into titles and
-- body text ("Lumen — Product brief"), which the founder spotted on the
-- published app. Applied migrations are immutable, so this data-fix
-- normalizes the DISPLAY text of the demo accounts' workspaces only:
-- " — " / " – " become " · " (the house separator), stray dashes become "·".
-- Scope: rows belonging to the demo users or their workspaces, NEVER real
-- tenant content (a real user's intentional dash is theirs to keep; new
-- platform-generated text is already cleaned by the runtime sanitizer).
-- eval_suites.name is deliberately excluded: a later migration looks rows
-- up by that exact seeded name, so it stays a functional key.
-- Idempotent: replacing on already-clean text is a no-op.

DO $$
DECLARE
  demo_ids uuid[];
  demo_ws uuid[];
  pair record;
  has_user boolean;
  has_ws boolean;
  scope_sql text;
BEGIN
  SELECT coalesce(array_agg(id), '{}') INTO demo_ids
  FROM auth.users
  WHERE email IN ('demo@redcadence.app', 'demo2@redcadence.app');

  IF array_length(demo_ids, 1) IS NULL THEN
    RAISE NOTICE 'loom_demo_content_humanize: no demo users found, nothing to do';
    RETURN;
  END IF;

  SELECT coalesce(array_agg(id), '{}') INTO demo_ws
  FROM public.workspaces
  WHERE owner_id = ANY (demo_ids);

  FOR pair IN
    SELECT * FROM (VALUES
      ('docs',           'title'),
      ('docs',           'content'),
      ('decisions',      'title'),
      ('decisions',      'rationale'),
      ('learnings',      'title'),
      ('learnings',      'content'),
      ('learnings',      'body'),
      ('opportunities',  'title'),
      ('opportunities',  'brief'),
      ('signals',        'content'),
      ('signals',        'title'),
      ('themes',         'name'),
      ('themes',         'summary'),
      ('prds',           'title'),
      ('prds',           'content'),
      ('meetings',       'title'),
      ('meetings',       'summary'),
      ('notes',          'title'),
      ('notes',          'content'),
      ('daily_briefs',   'content'),
      ('agent_memory',   'content'),
      ('missions',       'title'),
      ('missions',       'goal'),
      ('conversations',  'title'),
      ('messages',       'content'),
      ('agent_messages', 'content')
    ) AS t(tbl, col)
  LOOP
    -- Only touch pairs that exist as text-ish columns in this schema.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = pair.tbl
        AND c.column_name = pair.col AND c.data_type IN ('text', 'character varying')
    ) THEN
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = pair.tbl AND c.column_name = 'user_id'
    ) INTO has_user;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = pair.tbl AND c.column_name = 'workspace_id'
    ) INTO has_ws;

    IF has_user AND has_ws THEN
      scope_sql := '(user_id = ANY($1) OR workspace_id = ANY($2))';
    ELSIF has_user THEN
      scope_sql := 'user_id = ANY($1)';
    ELSIF has_ws THEN
      scope_sql := 'workspace_id = ANY($2)';
    ELSE
      CONTINUE; -- no tenant scope column: skip rather than touch globally
    END IF;

    EXECUTE format(
      'UPDATE public.%I SET %I = replace(replace(replace(replace(%I, '' — '', '' · ''), '' – '', '' · ''), ''—'', ''·''), ''–'', ''·'')
       WHERE %I IS NOT NULL AND (%I LIKE ''%%—%%'' OR %I LIKE ''%%–%%'') AND ' || scope_sql,
      pair.tbl, pair.col, pair.col, pair.col, pair.col, pair.col
    ) USING demo_ids, demo_ws;
  END LOOP;
END $$;
