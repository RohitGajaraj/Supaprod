CREATE OR REPLACE FUNCTION public.seed_rf08_missing_agent_tools(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  INSERT INTO public.agent_tools (user_id, tool_name, display_name, description, category, mode, built_in) VALUES
    (_user_id, 'agent.spawn',    'Spawn sub-agents',    'Fan out independent, parallelizable subtasks across bounded sub-agents of one specialist. Gated off by default (AGENT_FANOUT).', 'write',  'confirm', true),
    (_user_id, 'memory.reflect', 'Reflect on this run', 'Distil a one-paragraph lesson from this run and persist it for future runs of the same agent.',                                'memory', 'auto',    true),
    (_user_id, 'memory.promote', 'Promote a memory',    'Escalate a memory from agent-scope to workspace-scope so every agent in the workspace recalls it.',                            'memory', 'confirm', true),
    (_user_id, 'studio.revert',  'Revert a release',    'Roll back a merged release by synthesizing an inverse changeset through the existing commit/PR/CI/merge rails.',                'write',  'review',  true)
  ON CONFLICT (user_id, tool_name) DO NOTHING;
END $function$;

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP PERFORM public.seed_rf08_missing_agent_tools(r.id); END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.rf08_seed_missing_tools_on_profile_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN PERFORM public.seed_rf08_missing_agent_tools(NEW.id); RETURN NEW; END $function$;

DROP TRIGGER IF EXISTS rf08_seed_missing_tools ON public.profiles;
CREATE TRIGGER rf08_seed_missing_tools AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.rf08_seed_missing_tools_on_profile_insert();