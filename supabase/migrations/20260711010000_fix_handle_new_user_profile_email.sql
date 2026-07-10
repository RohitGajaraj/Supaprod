-- Fix a latent signup bug found during the 2026-07-11 full migration
-- verification: handle_new_user (20260708100000, re-applied by
-- 20260709100000) inserts into profiles (id, email, full_name), but
-- public.profiles has NEVER had an email column (original DDL
-- 20260520170838; generated types agree). The insert always fails, the
-- per-block exception handler swallows it as a WARNING, and the signup
-- completes with NO profiles row - observed live (a user with 34
-- agent_tools rows and no profile, which also made the profile-driven
-- studio.sync_branch backfill skip them).
--
-- Fix: the profile insert writes the columns that exist (id, full_name).
-- Everything else in the function is byte-identical to 20260709100000.
-- Also backfills a profiles row for any existing auth user missing one.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_demo boolean := COALESCE(NEW.email LIKE 'demo%@redcadence.app', false);
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for % (%): %', NEW.id, NEW.email, SQLERRM;
  END;

  IF NOT is_demo THEN
    BEGIN
      PERFORM public.ensure_user_default_workspace(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: ensure_user_default_workspace failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;

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

-- Heal every existing auth user that the broken insert left profile-less.
INSERT INTO public.profiles (id, full_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- And give the healed users the studio.sync_branch tool the profile-driven
-- backfill (20260709000000) skipped over them.
INSERT INTO public.agent_tools (user_id, tool_name, display_name, description, category, mode, built_in)
SELECT p.id,
       'studio.sync_branch',
       'Sync branch with main',
       'Studio: sync this mission''s changeset branch with the repo''s default branch to re-trigger a stale CI check. Touches no files. Auto-approved.',
       'write',
       'auto',
       true
FROM public.profiles p
ON CONFLICT (user_id, tool_name) DO NOTHING;
