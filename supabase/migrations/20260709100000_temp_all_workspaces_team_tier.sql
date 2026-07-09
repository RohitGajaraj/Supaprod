-- FOUNDER RULING (2026-07-09, SW-7): pre-traction, every account (existing and
-- future) should see Cadence's full connector capability with zero plan-tier
-- restrictions, so real prospects and the founder's own testing never hit a
-- silent "requires Pro/Business" wall. This is explicitly TEMPORARY: once the
-- product has real traction and paying customers, the founder intends to
-- reinstate tier-limited connectors (pricing-strategy.md 3.3).
--
-- Nothing about the gating LOGIC changes: assertConnectorCapability,
-- entitlementsFor, and the catalog's minTier rules in
-- src/lib/entitlements.ts and src/lib/connectors/catalog.ts are untouched and
-- fully intact. This migration only changes the DEFAULT plan_tier new
-- workspaces get, and backfills existing ones. To revert later: change the
-- column default back to 'free', remove the two ensure_user_default_workspace
-- lines noted below, and re-tier workspaces per whatever billing state
-- applies at that time (this migration never touches the separate
-- public.accounts billing/Stripe table).
--
-- Root cause this closes: HubSpot/Salesforce/Canny/Slack tokens were already
-- configured (env secrets set 2026-07-01) but silently never ingested
-- anything current, because every workspace was on 'free' tier and
-- assertConnectorCapability fails closed with no visible error in the
-- product.
--
-- Two more real, related bugs found and fixed live while closing this out
-- (both re-applied here so this migration is a complete standalone fix):
--   1. handle_new_user called public.ensure_default_workspace(NEW.id), a
--      function name that has never existed - the real one is
--      ensure_user_default_workspace. Every signup's eager workspace-create
--      call has always silently failed and been swallowed by the trigger's
--      own exception handler; a workspace only ever got created lazily,
--      later, whenever the app first called ensure_user_default_workspace
--      directly. Fixed the call site.
--   2. handle_new_user was ALSO missing its PERFORM public.seed_default_agents
--      call entirely - present in 20260708100000_seed_agent_roster_on_signup.sql
--      but silently dropped again by a later Lovable schema resync (the exact
--      recurrence that migration's own comment warned about). New signups
--      were getting zero agents. Restored. No current users were affected
--      (checked live: zero accounts with an empty agent roster right now),
--      so no backfill was needed this time.

-- trg_protect_workspace_billing_columns (added for a real, separate reason:
-- stopping arbitrary non-service-role writes from granting a free plan
-- upgrade) silently reverts any UPDATE to plan_tier that isn't made as
-- Postgres role 'service_role'. This migration runs as a plain SQL migration
-- (not through the app's service-role client), so it disables that one
-- trigger for the single UPDATE below and re-enables it immediately after -
-- the standard, safe pattern for a deliberate, reviewed schema migration to
-- touch a protected column. The trigger itself is never weakened or removed.

ALTER TABLE public.workspaces
  ALTER COLUMN plan_tier SET DEFAULT 'team';

ALTER TABLE public.workspaces DISABLE TRIGGER trg_protect_workspace_billing_columns;

UPDATE public.workspaces
SET plan_tier = 'team'
WHERE plan_tier IS DISTINCT FROM 'team';

ALTER TABLE public.workspaces ENABLE TRIGGER trg_protect_workspace_billing_columns;

-- Fix 1 + the matching in-function tier bump for freshly created workspaces
-- (the column default alone is not enough: this function is SECURITY DEFINER
-- but auth.role() still reads the calling session's JWT, not the function
-- owner, so a brand-new row would otherwise get forced back to 'free' by the
-- same protection trigger the moment a real, non-service-role user signs up).
CREATE OR REPLACE FUNCTION public.ensure_user_default_workspace(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_workspace_id uuid;
  created_workspace_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT m.workspace_id INTO existing_workspace_id
  FROM public.workspace_members m WHERE m.user_id = _user_id
  ORDER BY m.created_at LIMIT 1;
  IF existing_workspace_id IS NOT NULL THEN RETURN existing_workspace_id; END IF;

  SELECT w.id INTO existing_workspace_id
  FROM public.workspaces w WHERE w.owner_id = _user_id
  ORDER BY w.created_at LIMIT 1;
  IF existing_workspace_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (existing_workspace_id, _user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
    RETURN existing_workspace_id;
  END IF;

  INSERT INTO public.workspaces (owner_id, name) VALUES (_user_id, 'My Workspace')
  RETURNING id INTO created_workspace_id;
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (created_workspace_id, _user_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- SW-7 founder ruling (2026-07-09): every new signup should see full
  -- connector capability during the pre-traction period, matching the
  -- 'team' column default above. Temporary: remove this block when
  -- tier-limited connectors are reinstated.
  ALTER TABLE public.workspaces DISABLE TRIGGER trg_protect_workspace_billing_columns;
  UPDATE public.workspaces SET plan_tier = 'team' WHERE id = created_workspace_id;
  ALTER TABLE public.workspaces ENABLE TRIGGER trg_protect_workspace_billing_columns;

  RETURN created_workspace_id;
END;
$function$;

-- Fix 2 + fix 1's call-site correction, both in handle_new_user.
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
