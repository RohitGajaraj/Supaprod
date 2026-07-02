-- RF-08 (v12 audit §2.4, defect 2 prerequisite): before loop.server.ts can
-- enforce tool enablement at execution (fail closed on any tool absent from
-- agent_tools), every tool actually registered in TOOL_REGISTRY must be
-- seeded somewhere, or the gate would silently disable it for every user.
-- A live agent_tools audit (2026-07-02, via the Lovable MCP) diffed the 39
-- distinct seeded tool_name values against TOOL_REGISTRY and found 4
-- registered tools with zero seeded rows for any user: agent.spawn,
-- memory.promote, memory.reflect, studio.revert. This is the same failure
-- class the 20260630190000 sense-tools-seed migration fixed for a different
-- tool set ("added to registry.server.ts... but never seeded into
-- agent_tools, so no agent run could call them").
--
-- Deliberately does NOT touch seed_default_agent_tools or
-- seed_pm_lifecycle_tools (both replaced by many prior migrations; their
-- exact current combined tool list is hard to reconstruct with confidence,
-- and a mistaken CREATE OR REPLACE could silently drop an already-seeded
-- tool for new signups). Instead: a small standalone function seeds only
-- the 4 missing tools (ON CONFLICT DO NOTHING, so re-running is safe and it
-- never touches the other 39), a backfill covers existing accounts, and a
-- new AFTER INSERT trigger on public.profiles (which has zero existing
-- triggers, confirmed live) covers future signups without touching the
-- fragile, many-times-replaced handle_new_user() trigger chain.
CREATE OR REPLACE FUNCTION public.seed_rf08_missing_agent_tools(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.agent_tools (user_id, tool_name, display_name, description, category, mode, built_in) VALUES
    (_user_id, 'agent.spawn',     'Spawn sub-agents',   'Fan out independent, parallelizable subtasks across bounded sub-agents of one specialist. Gated off by default (AGENT_FANOUT).', 'write',  'confirm', true),
    (_user_id, 'memory.reflect',  'Reflect on this run', 'Distil a one-paragraph lesson from this run and persist it for future runs of the same agent.',                                'memory', 'auto',    true),
    (_user_id, 'memory.promote',  'Promote a memory',    'Escalate a memory from agent-scope to workspace-scope so every agent in the workspace recalls it.',                            'memory', 'confirm', true),
    (_user_id, 'studio.revert',   'Revert a release',    'Roll back a merged release by synthesizing an inverse changeset through the existing commit/PR/CI/merge rails.',                'write',  'review',  true)
  ON CONFLICT (user_id, tool_name) DO NOTHING;
END $function$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_rf08_missing_agent_tools(r.id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.rf08_seed_missing_tools_on_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.seed_rf08_missing_agent_tools(NEW.id);
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS rf08_seed_missing_tools ON public.profiles;
CREATE TRIGGER rf08_seed_missing_tools
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.rf08_seed_missing_tools_on_profile_insert();
