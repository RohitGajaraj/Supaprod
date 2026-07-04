-- LOOM QA round 2 (2026-07-04): stop the seeds minting em-dash names, and
-- clean what they already minted.
--
-- The live-UI QA pass found two STILL-ACTIVE seed functions writing em-dash
-- display names for every new signup (guardrail rules, prompt templates) —
-- patching rows without patching the seeds would regress on the next
-- account. This migration: (1) re-declares both seed functions with the
-- house middot; (2) normalizes the existing PLATFORM-AUTHORED rows globally
-- (built_in = true rows are our strings on every account, not user
-- content); (3) extends the demo-workspace sweep (20260704124500) with the
-- tables the QA catalog surfaced: agent_runs.input, eval_suites.name
-- (safe on replay: the 20260703193006 lookup by the dashed name runs before
-- this rename in migration order), and pins the demo profiles' display name
-- to 'Demo' so the brief greets the same person the account chip shows.

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

-- (2) Platform-authored rows on EVERY account: these names are ours.
UPDATE public.guardrail_rules
SET name = replace(replace(name, ' — ', ' · '), '—', '·')
WHERE built_in = true AND name LIKE '%—%';

UPDATE public.prompt_templates
SET name = replace(replace(name, ' — ', ' · '), '—', '·')
WHERE built_in = true AND name LIKE '%—%';

-- (3) Demo-workspace additions the QA catalog surfaced.
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

  -- The demo greets the same person its account chip names.
  UPDATE public.profiles
  SET display_name = 'Demo', full_name = 'Demo'
  WHERE id = ANY (demo_ids)
    AND (display_name IS DISTINCT FROM 'Demo' OR full_name IS DISTINCT FROM 'Demo');
END $$;
