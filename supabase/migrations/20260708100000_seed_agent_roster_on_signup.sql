-- SHIP-WEEK DEFECT FIX (found driving the seam-2 live oracle): a fresh signup,
-- and the demo account, land with an EMPTY agents roster, so dispatching a
-- spec to Build throws "Studio agent not found in your roster" and the whole
-- build spine is unreachable. Root cause: the 2026-06-17 "restore signup
-- resilience" rebuild of handle_new_user seeds agent TOOLS + studio tools +
-- event subscriptions, but dropped the PERFORM public.seed_default_agents call,
-- so the agents table (which holds the 'builder' / orchestrator / researcher /
-- strategist / engineer roster) is never populated for a new user.
--
-- This restores that one block (exception-safe, same shape as its siblings)
-- and backfills every existing profile that currently has ZERO agents. The
-- seed fn is idempotent (ON CONFLICT (user_id, slug) DO UPDATE), and the
-- backfill is scoped to agent-less profiles so it never disturbs a user who
-- has customized their roster.
--
-- RECURRENCE: like the 2026-06-17 note, handle_new_user reverts when a Lovable
-- sync regenerates it from the schema model; re-apply after any such sync.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_demo boolean := COALESCE(NEW.email LIKE 'demo%@redcadence.app', false);
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for % (%): %', NEW.id, NEW.email, SQLERRM;
  END;

  IF NOT is_demo THEN
    BEGIN
      PERFORM public.ensure_default_workspace(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: ensure_default_workspace failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  -- The agent roster: the builder + the specialist agents every dispatch and
  -- mission needs. Restored (was dropped in the 2026-06-17 rebuild).
  BEGIN
    PERFORM public.seed_default_agents(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: seed_default_agents failed for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    PERFORM public.seed_default_agent_tools(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: seed_default_agent_tools failed for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    PERFORM public.seed_default_event_subscriptions(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: seed_default_event_subscriptions failed for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    PERFORM public.seed_studio_tools(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: seed_studio_tools failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Backfill: every profile that has no agents yet (the demo account + anyone
-- who signed up during the regression window). Idempotent + roster-safe:
-- only touches users with zero agents.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.id
    FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.agents a WHERE a.user_id = p.id)
  LOOP
    BEGIN
      PERFORM public.seed_default_agents(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'agent roster backfill failed for %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;
