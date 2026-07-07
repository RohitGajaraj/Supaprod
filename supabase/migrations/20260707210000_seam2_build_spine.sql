-- SEAM-2 BUILD SPINE (ship-week mission 3.5/3.6/3.7): the schema for the
-- continuous spec -> branch -> PR -> self-correct -> merge -> deploy motion.
--
-- A. studio_changesets.fix_attempts: the bounded red-CI self-correction budget.
--    The ci-poll tick increments it per autonomous fix dispatch and stops at
--    the cap, escalating to the human instead of looping forever.
-- B. missions.build_driver: which engine built this mission (BD-1 seam), so
--    engine choice is data, not prompt-level tool selection.
-- C. ci-poll-tick cron: wakes parked builder runs when a studio branch's CI
--    finishes (green -> nudge toward the merge gate; red -> bounded self-fix),
--    and auto-deploys merged changesets to a preview environment.

-- ---------------------------------------------------------------------------
-- A. Retry budget
-- ---------------------------------------------------------------------------
ALTER TABLE public.studio_changesets
  ADD COLUMN IF NOT EXISTS fix_attempts integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.studio_changesets.fix_attempts IS
  'Autonomous red-CI fix dispatches consumed for this changeset. The ci-poll tick stops at the budget cap and escalates to the human.';

-- ---------------------------------------------------------------------------
-- B. Build driver (BD-1)
-- ---------------------------------------------------------------------------
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS build_driver text NOT NULL DEFAULT 'native';
COMMENT ON COLUMN public.missions.build_driver IS
  'The engine that runs this mission''s build: native (the in-house loop) or an external adapter (openhands, ...). BD-1: engine choice is config, forever.';

-- ---------------------------------------------------------------------------
-- C. Seed the two new builder tools (RF-08 standalone pattern: never touch the
--    many-times-replaced seed_default_agent_tools).
--    ci.logs: read failing CI detail. studio.fix.commit: append a bounded CI
--    fix to a branch whose PR a HUMAN already opened (that prior human gate is
--    why its mode is auto: the blast radius is the already-reviewed PR branch,
--    and the merge gate still holds).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_seam2_ci_tools(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.agent_tools (user_id, tool_name, display_name, description, category, mode, built_in) VALUES
    (_user_id, 'ci.logs',           'Read failing CI detail', 'Fetch the failing check runs on a PR with their output detail and log tails. Read-only; the diagnose half of the self-correction loop.', 'read',  'auto', true),
    (_user_id, 'studio.fix.commit', 'Commit a CI fix',        'Append staged CI-fix changes to this mission''s EXISTING pr_open studio branch. Only works after a human opened the PR; bounded by the changeset''s fix budget.', 'write', 'auto', true)
  ON CONFLICT (user_id, tool_name) DO NOTHING;
END $function$;

-- Only the trigger (definer) and service paths need this; an authenticated
-- user has no reason to seed rows into ANOTHER user's agent_tools.
REVOKE ALL ON FUNCTION public.seed_seam2_ci_tools(uuid) FROM public;
REVOKE ALL ON FUNCTION public.seed_seam2_ci_tools(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.seed_seam2_ci_tools(uuid) TO service_role;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_seam2_ci_tools(r.id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.seam2_seed_ci_tools_on_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.seed_seam2_ci_tools(NEW.id);
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS seam2_seed_ci_tools_after_profile_insert ON public.profiles;
CREATE TRIGGER seam2_seed_ci_tools_after_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.seam2_seed_ci_tools_on_profile_insert();

-- ---------------------------------------------------------------------------
-- D. ci-poll-tick every 2 minutes
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'ci-poll-tick';

  PERFORM cron.schedule(
    'ci-poll-tick',
    '*/2 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/ci-poll-tick')
  );
END $$;
