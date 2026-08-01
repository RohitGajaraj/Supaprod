-- Give the four handless stations their tools (founder ruling 2026-08-01).
--
-- THE FINDING. Sense had six registered tools, Define four, Build fifteen.
-- Decide, Design, Ship and Learn had ZERO that create their station's artifact:
-- decision.revise could only edit a decision that already existed, and the other
-- three had nothing at all. Every one of those stations has an active lead agent
-- (strategist, ux-architect, release, data-analyst) and a fully shaped table
-- waiting for it (decisions, prototypes, deployments, learnings). So an agent
-- arrived at four of the seven stops, was handed a goal, and had no way to write
-- anything down. A track walked its whole route and left no record at more than
-- half of it.
--
-- The product had started EXCUSING this on the surface, in a panel that told
-- people "design is done with people today". That is the wrapper story told in
-- our own UI: four sevenths of the loop advertised to a customer as human work,
-- on the one surface whose job is to show that agents ran the loop. The doctrine
-- is explicit that a surface an autonomous agent cannot run end to end under
-- policy is legacy the day it ships. The excuse is deleted and the hands are
-- built.
--
-- WHY THIS MIGRATION IS THE LOAD-BEARING HALF. loop.server.ts pulls a run's
-- tools from agent_tools filtered to the user, so a tool that is registered in
-- code but absent from this table is unreachable by every agent for every user.
-- Registering the four without seeding them would have been the same defect
-- rebuilt one layer down: capability built, door missing.
--
-- SHAPE COPIED FROM 20260702235500 (RF-08), for the reason it states: it does
-- NOT touch seed_default_agent_tools or seed_pm_lifecycle_tools, both replaced
-- by many prior migrations, because a mistaken CREATE OR REPLACE could silently
-- drop an already-seeded tool for new signups. A standalone function seeds only
-- these four, ON CONFLICT DO NOTHING makes re-running safe, a backfill covers
-- existing accounts, and its own AFTER INSERT trigger on profiles covers new
-- ones without touching the fragile handle_new_user chain.
--
-- THE MODES. The three reversible internal writes seed as 'confirm', which is
-- what every comparable write in this table already seeds as, and which
-- resolveApprovalMode turns into 'auto' under the default trusted arc: a new
-- workspace is autonomous on arrival, not on probation. release.publish seeds as
-- 'review' AND is pinned in HIGH_RISK_FORCE_REVIEW in code, so the floor holds
-- even if this row is edited. A production deploy is irreversible from inside
-- the product and customers see it, which is two of the four governance floors
-- at once. It is the only gate in the seven-station loop, and that is precisely
-- what makes the autonomy of the other six defensible rather than reckless.

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

-- Existing accounts get them now.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_station_agent_tools(r.id);
  END LOOP;
END $$;

-- New accounts get them on signup. Its own trigger, beside RF-08's rather than
-- replacing it, so neither migration's set can be lost by editing the other.
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
