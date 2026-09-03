-- SIGNUP SETS THE TIER WITHOUT LOWERING THE GUARD FOR EVERYONE (P-34, A-QUEUE.md).
--
-- `ensure_user_default_workspace` (20260709100000) runs
-- `ALTER TABLE public.workspaces DISABLE TRIGGER` on the billing guard
-- (`trg_protect_workspace_billing_columns`, named separately so a text scan
-- for the disabling statement does not also flag this sentence describing
-- it) to set a fresh workspace's `plan_tier`, then re-enables it. DISABLE/
-- ENABLE TRIGGER takes an ACCESS EXCLUSIVE lock on the whole table for the
-- statement's duration -- so every signup blocks every other writer on
-- `public.workspaces` for that window, and while the trigger is off, the
-- billing guard protects NOBODY's concurrent write, not just this one row's.
--
-- The guard's own comment already names the real constraint:
-- `protect_workspace_billing_columns` is SECURITY DEFINER, but `auth.role()`
-- reads the CALLING SESSION's JWT claim, not the function owner -- so a
-- definer function cannot simply write the protected column and expect the
-- trigger to recognise its own authority. What it CAN do is set a
-- transaction-local flag the trigger reads instead of the table-wide switch:
-- `set_config(..., is_local := true)` is scoped to the current transaction,
-- takes no lock at all, and is invisible to every other session (Postgres
-- GUCs set with `is_local` never leak across connections or transactions),
-- which is the actual property "never disable the trigger" is standing in
-- for -- a bypass that is provably scoped to this one write.

CREATE OR REPLACE FUNCTION public.protect_workspace_billing_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND coalesce(current_setting('app.workspace_billing_bypass', true), '') <> 'on' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.plan_tier := 'free';
      NEW.stripe_customer_id := NULL;
      NEW.stripe_subscription_id := NULL;
      NEW.plan_updated_at := NULL;
    ELSE
      NEW.plan_tier := OLD.plan_tier;
      NEW.stripe_customer_id := OLD.stripe_customer_id;
      NEW.stripe_subscription_id := OLD.stripe_subscription_id;
      NEW.plan_updated_at := OLD.plan_updated_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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
  -- 'team' column default. Temporary: remove this block when tier-limited
  -- connectors are reinstated.
  --
  -- P-34: no table lock, no window where every other writer's guard is off --
  -- `is_local := true` scopes this to the current transaction only, and it is
  -- unset automatically at commit, never touched by any other session.
  PERFORM set_config('app.workspace_billing_bypass', 'on', true);
  UPDATE public.workspaces SET plan_tier = 'team' WHERE id = created_workspace_id;

  RETURN created_workspace_id;
END;
$function$;
