CREATE OR REPLACE FUNCTION public.seed_station_agent_tools(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.agent_tools (user_id, tool_name, display_name, description, category, mode, built_in) VALUES
    (_user_id, 'decision.record', 'Record a decision',  'Record a decision you have made: the call, why you made it, and the alternatives you rejected. Requires at least one rejected alternative -- a choice with nothing weighed against it is an assertion, not a decision.', 'write', 'confirm', true),
    (_user_id, 'design.draft',    'Register a design',  'Register a prototype for a spec at the Design station: a name, what it shows, and the entry file.',                                                                                                                  'write', 'confirm', true),
    (_user_id, 'learning.record', 'Record a learning',  'Record what a shipped piece of work actually taught us, with a verdict of validated, missed, mixed or uncertain.',                                                                                                  'write', 'confirm', true),
    (_user_id, 'release.publish', 'Ship to production', 'Ship a merged changeset to production. Irreversible and customers see it, so it always goes to a person before it runs.',                                                                                           'write', 'review',  true)
  ON CONFLICT (user_id, tool_name) DO NOTHING;
END $function$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_station_agent_tools(r.id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.seed_station_tools_on_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.seed_station_agent_tools(NEW.id);
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS seed_station_tools ON public.profiles;
CREATE TRIGGER seed_station_tools
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.seed_station_tools_on_profile_insert();