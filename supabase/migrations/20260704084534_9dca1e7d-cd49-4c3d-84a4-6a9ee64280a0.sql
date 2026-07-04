-- LOOM W5 (2026-07-04): humanize seeded demo content in place.
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
      CONTINUE;
    END IF;

    EXECUTE format(
      'UPDATE public.%I SET %I = replace(replace(replace(replace(%I, '' — '', '' · ''), '' – '', '' · ''), ''—'', ''·''), ''–'', ''·'')
       WHERE %I IS NOT NULL AND (%I LIKE ''%%—%%'' OR %I LIKE ''%%–%%'') AND ' || scope_sql,
      pair.tbl, pair.col, pair.col, pair.col, pair.col, pair.col
    ) USING demo_ids, demo_ws;
  END LOOP;
END $$;

-- Also apply LOOM QA round 2 seed function updates.
CREATE OR REPLACE FUNCTION public.seed_default_guardrails(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.guardrail_rules (user_id, name, kind, pattern, action, applies_to, built_in) VALUES
    (_user_id, 'Prompt injection · ignore instructions', 'injection', '(?i)ignore (all )?(previous|prior) (instructions|prompts)', 'warn', 'input', true),
    (_user_id, 'Prompt injection · system role', 'injection', '(?i)\bsystem\s*:\s*', 'warn', 'input', true),
    (_user_id, 'Prompt injection · reveal system prompt', 'injection', '(?i)(reveal|show|print).{0,20}(system|developer) prompt', 'block', 'input', true),
    (_user_id, 'PII · email address', 'pii', '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', 'warn', 'both', true),
    (_user_id, 'PII · phone number', 'pii', '\+?\d[\d\s().-]{8,}\d', 'warn', 'both', true),
    (_user_id, 'PII · credit card', 'pii', '\b(?:\d[ -]*?){13,16}\b', 'redact', 'both', true),
    (_user_id, 'Secret leak · sk- API key', 'secret', 'sk-[A-Za-z0-9]{20,}', 'redact', 'both', true),
    (_user_id, 'Secret leak · Bearer token', 'secret', '(?i)bearer\s+[A-Za-z0-9._-]{20,}', 'redact', 'both', true),
    (_user_id, 'Secret leak · AWS access key', 'secret', 'AKIA[0-9A-Z]{16}', 'block', 'both', true)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_default_prompt_templates(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  t_id uuid;
  v_id uuid;
  tpl record;
BEGIN
  FOR tpl IN
    SELECT * FROM (VALUES
      ('chat','default','Chat · default','Conversational assistant baseline prompt.','You are Cadence, a calm, terse AI product co-pilot. Be concise, structured, and helpful.'),
      ('copilot','daily_brief','Copilot · daily brief','Daily focus brief generator.','You synthesize the user''s day into a 5-line brief.'),
      ('discovery','theme_cluster','Discovery · theme cluster','Clusters signals into themes.','You cluster discovery signals into themes.'),
      ('meetings','summarize','Meetings · summarize','Meeting summary + decisions + actions.','You summarize meetings.'),
      ('roadmap','prd_generate','Roadmap · generate spec','Generate a spec from an opportunity.','You are a senior PM. Write a crisp PRD.'),
      ('studio','prototype','Studio · prototype','Generate prototype HTML/CSS/JS.','You generate small prototypes.'),
      ('agent','planner_executor','Agent · planner/executor','Tool-using agent loop prompt.','You are a planning agent.')
    ) AS x(surface,key,name,description,system_prompt)
  LOOP
    INSERT INTO public.prompt_templates(user_id, surface, key, name, description, built_in)
    VALUES (_user_id, tpl.surface, tpl.key, tpl.name, tpl.description, true)
    ON CONFLICT (user_id, surface, key) DO NOTHING
    RETURNING id INTO t_id;
    IF t_id IS NULL THEN CONTINUE; END IF;
    INSERT INTO public.prompt_versions(template_id, user_id, version, system_prompt, status, created_by)
    VALUES (t_id, _user_id, 1, tpl.system_prompt, 'published', _user_id)
    RETURNING id INTO v_id;
    UPDATE public.prompt_templates SET active_version_id = v_id, default_version_id = v_id WHERE id = t_id;
    INSERT INTO public.prompt_assignments(user_id, template_id, variant_a_version_id, split_pct, enabled)
    VALUES (_user_id, t_id, v_id, 100, true)
    ON CONFLICT (user_id, template_id) DO NOTHING;
  END LOOP;
END;
$$;

UPDATE public.guardrail_rules
SET name = replace(replace(name, ' — ', ' · '), '—', '·')
WHERE built_in = true AND name LIKE '%—%';

UPDATE public.prompt_templates
SET name = replace(replace(name, ' — ', ' · '), '—', '·')
WHERE built_in = true AND name LIKE '%—%';

DO $$
DECLARE
  demo_ids uuid[];
BEGIN
  SELECT coalesce(array_agg(id), '{}') INTO demo_ids
  FROM auth.users
  WHERE email IN ('demo@redcadence.app', 'demo2@redcadence.app');

  IF array_length(demo_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.agent_runs
  SET input = replace(replace(replace(replace(input, ' — ', ' · '), ' – ', ' · '), '—', '·'), '–', '·')
  WHERE user_id = ANY (demo_ids) AND input IS NOT NULL
    AND (input LIKE '%—%' OR input LIKE '%–%');

  UPDATE public.eval_suites
  SET name = replace(replace(name, ' — ', ' · '), '—', '·')
  WHERE user_id = ANY (demo_ids) AND name LIKE '%—%';

  UPDATE public.profiles
  SET display_name = 'Demo', full_name = 'Demo'
  WHERE id = ANY (demo_ids)
    AND (display_name IS DISTINCT FROM 'Demo' OR full_name IS DISTINCT FROM 'Demo');
END $$;