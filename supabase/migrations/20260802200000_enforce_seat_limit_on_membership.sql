-- Seat limits: enforce them where they cannot be bypassed.
--
-- WHAT WAS TRUE BEFORE THIS. `tier_seat_limit(tier)` returns 1 for free, pro and
-- max, and null (unlimited) for team and enterprise. TS mirrors it in
-- entitlements.ts and a parity test pins the two together. Exactly ONE caller
-- checked it: `create_workspace_invitation`. But the RLS on workspace_members is
-- "owner manages members" FOR ALL, so a workspace owner can INSERT a member row
-- directly and never touch the invitation path at all. The limit was real on one
-- road and absent on the other.
--
-- This is the same failure shape as signals.embedding earlier today: a rule that
-- lives at one call site is not a rule, it is a habit. So the check moves to a
-- trigger, which every write path goes through by construction, and the
-- invitation function keeps its own check as the friendlier, earlier error.
--
-- BEHAVIOUR IS DELIBERATELY UNCHANGED TODAY. `limit_gates_enabled()` currently
-- returns FALSE, so no limit fires anywhere, and this trigger honours the same
-- flag. That is on purpose and it is not a hedge: at the time of writing the live
-- database holds 4 members across 2 `pro` accounts, against a limit of 1. Turning
-- enforcement on is a decision about existing users, not a schema fix, and it
-- belongs to the founder rather than to a migration. What this migration
-- guarantees is that when that flag is flipped, the limit is actually enforced on
-- BOTH roads instead of one.
--
-- Tier is read from `accounts.plan_tier` through the workspace, matching
-- create_workspace_invitation exactly. Reading `workspaces.plan_tier` instead
-- would have been the obvious guess and the wrong one: billing lives on the
-- account, and the two columns can disagree.

CREATE OR REPLACE FUNCTION public.enforce_workspace_seat_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_tier text;
  v_seat_limit integer;
  v_used integer;
BEGIN
  -- Same global switch the invitation path obeys, so enforcement is consistent
  -- and reversible from one place rather than two.
  IF NOT public.limit_gates_enabled() THEN
    RETURN NEW;
  END IF;

  SELECT a.plan_tier INTO v_tier
  FROM public.workspaces w
  JOIN public.accounts a ON a.id = w.account_id
  WHERE w.id = NEW.workspace_id;

  v_seat_limit := public.tier_seat_limit(v_tier);
  IF v_seat_limit IS NULL THEN
    RETURN NEW; -- team and enterprise: unlimited seats
  END IF;

  SELECT count(*) INTO v_used
  FROM public.workspace_members
  WHERE workspace_id = NEW.workspace_id;

  IF v_used >= v_seat_limit THEN
    RAISE EXCEPTION
      'Seat limit reached: the % plan includes % seat(s) per workspace. Upgrade to Team to add people.',
      coalesce(v_tier, 'current'), v_seat_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- BEFORE INSERT only. An UPDATE that moves a member between workspaces is not a
-- path the app has, and blocking UPDATE would make role changes fail once a
-- workspace is at its limit, which is the opposite of what we want: a full
-- workspace must still be able to promote someone to admin.
DROP TRIGGER IF EXISTS enforce_workspace_seat_limit_trigger ON public.workspace_members;
CREATE TRIGGER enforce_workspace_seat_limit_trigger
  BEFORE INSERT ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_workspace_seat_limit();
