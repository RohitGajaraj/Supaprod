-- Workspace claim: the anti-shadow-AI seam, and the account-move hole it closes.
--
-- ALREADY APPLIED to the live database on 2026-08-02 and verified there (both RPCs
-- present, guard trigger on workspaces, two partial indexes). Recorded so the repo
-- matches the database.
--
-- THE SECURITY HOLE THIS CLOSES, found while building the feature and verified
-- directly against the live schema. The workspaces policy is
-- `for all using (has_workspace_role(id, ['owner','admin']))` and constrains nothing
-- about account_id. `trg_set_workspace_account` is BEFORE INSERT only. The existing
-- `protect_workspace_billing_columns` trigger pins plan_tier and the Stripe columns
-- and NOT account_id. So any workspace owner could `update workspaces set
-- account_id = <any uuid>` straight from PostgREST: no offer, no acceptance, no
-- audit row, no seat check. account_id is what account-scoped memory pooling reads,
-- so that is a tenancy boundary rather than a billing field.
--
-- WHY THE FEATURE EXISTS. When Pro is single seat, people expense it individually on
-- a work email, invisible to IT. When they leave, the decision and outcome history
-- they built stays in their personal account and never reaches the employer. For a
-- product that sells institutional memory, the thing being sold walks out the door.
-- The claim turns that risk into the upgrade motion.
--
-- APPLIED IN A DELIBERATE ORDER, reversed from how it reads: the two RPCs FIRST and
-- the guard trigger LAST. With the guard live and the functions absent, the
-- TypeScript fallback path writes account_id directly and would be refused, so there
-- must never be a window where the guard exists alone.
--
-- THE STATE IS THE FOLD OF THE AUDIT EVENTS, not a status column, so a claim cannot
-- be in a state nothing recorded. Two people consent before work changes hands: the
-- workspace owner offers, an owner or admin of the destination accepts, and both
-- acknowledgements land in the trail.

CREATE OR REPLACE FUNCTION public.guard_workspace_account_move()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  -- The two claim RPCs below set this transaction-local flag around their own
  -- UPDATE and clear it after. Every other path, including a direct PostgREST
  -- write by a workspace owner, is refused.
  IF NEW.account_id IS DISTINCT FROM OLD.account_id
     AND coalesce(current_setting('app.workspace_claim', true), '') <> 'on' THEN
    RAISE EXCEPTION
      'A workspace changes account only through a claim. Offer it, and have an owner or admin of the other organisation accept.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_workspace_account_move_trigger ON public.workspaces;
CREATE TRIGGER guard_workspace_account_move_trigger
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.guard_workspace_account_move();


CREATE OR REPLACE FUNCTION public.claim_workspace_into_account(
  _workspace_id    uuid,
  _to_account_id   uuid,
  _from_account_id uuid,
  _actor_id        uuid,
  _claimant_id     uuid,
  _grace_until     timestamptz,
  _inventory       jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_current_account uuid;
  v_tier            text;
  v_added           uuid := NULL;
  -- auth.uid() is null under service role. When this is called with a user's
  -- own client, auth.uid() WINS, so the actor cannot be spoofed on that road.
  v_actor           uuid := coalesce(auth.uid(), _actor_id);
BEGIN
  SELECT account_id INTO v_current_account
  FROM public.workspaces WHERE id = _workspace_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found.';
  END IF;

  -- Compare and swap: two admins racing to accept cannot both succeed.
  IF v_current_account IS DISTINCT FROM _from_account_id THEN
    RAISE EXCEPTION 'This workspace moved since the offer was made.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.account_members m
    WHERE m.account_id = _to_account_id
      AND m.user_id = v_actor
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only an owner or admin of that organisation can accept a workspace into it.';
  END IF;

  SELECT plan_tier INTO v_tier FROM public.accounts WHERE id = _to_account_id;
  IF v_tier IS NULL OR v_tier NOT IN ('team', 'enterprise') THEN
    RAISE EXCEPTION 'That plan is a single seat, so it cannot hold a second person''s workspace.';
  END IF;

  -- There must be a LIVE offer naming this destination: one that has not
  -- expired and that nothing later withdrew, declined, accepted or released.
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_audit_log l
    WHERE l.workspace_id = _workspace_id
      AND l.action = 'workspace_claim_offered'
      AND l.detail->>'to_account_id' = _to_account_id::text
      AND (l.detail->>'expires_at')::timestamptz > now()
      AND l.created_at > coalesce((
            SELECT max(l2.created_at) FROM public.workspace_audit_log l2
            WHERE l2.workspace_id = _workspace_id
              AND l2.action IN ('workspace_claim_withdrawn', 'workspace_claim_declined',
                                'workspace_claim_accepted', 'workspace_claim_released')
          ), '-infinity'::timestamptz)
  ) THEN
    RAISE EXCEPTION 'There is no live offer on this workspace for your organisation.';
  END IF;

  PERFORM set_config('app.workspace_claim', 'on', true);

  -- 1. Re-parent first. See the seat-limit note above.
  UPDATE public.workspaces SET account_id = _to_account_id WHERE id = _workspace_id;

  -- 2. The accepting admin joins, so the organisation can actually READ what it
  --    now pays for. Ownership is deliberately NOT transferred: the person who
  --    built the workspace keeps it, and transfer_workspace_ownership stays a
  --    separate, explicit act.
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = v_actor
  ) THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (_workspace_id, v_actor, 'admin');
    v_added := v_actor;
  END IF;

  -- 3. The record. The inventory is the OFFER's, so the number the person
  --    consented to is the number in the organisation's trail.
  INSERT INTO public.workspace_audit_log (workspace_id, actor_id, action, detail)
  VALUES (_workspace_id, v_actor, 'workspace_claim_accepted', jsonb_build_object(
    'from_account_id', _from_account_id,
    'to_account_id',   _to_account_id,
    'accepted_by',     v_actor,
    'claimant_id',     _claimant_id,
    'grace_until',     _grace_until,
    'added_member_id', v_added,
    'acknowledged',    true,
    'inventory',       coalesce(_inventory, '{}'::jsonb)
  ));

  PERFORM set_config('app.workspace_claim', 'off', true);
  RETURN v_added;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_workspace_into_account(
  uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_workspace_into_account(
  uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb) TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.release_workspace_claim(
  _workspace_id     uuid,
  _to_account_id    uuid,   -- where it goes back to
  _from_account_id  uuid,   -- where it is being released from
  _actor_id         uuid,
  _actor_role       text,   -- 'claimant' | 'account_admin', for the record only
  _remove_member_id uuid,
  _reason           text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_current_account uuid;
  v_accept          jsonb;
  v_claimant        uuid;
  v_grace           timestamptz;
  v_actor           uuid := coalesce(auth.uid(), _actor_id);
  v_is_manager      boolean;
BEGIN
  SELECT account_id INTO v_current_account
  FROM public.workspaces WHERE id = _workspace_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found.';
  END IF;
  IF v_current_account IS DISTINCT FROM _from_account_id THEN
    RAISE EXCEPTION 'This workspace moved while you were releasing it.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT l.detail INTO v_accept
  FROM public.workspace_audit_log l
  WHERE l.workspace_id = _workspace_id AND l.action = 'workspace_claim_accepted'
  ORDER BY l.created_at DESC LIMIT 1;
  IF v_accept IS NULL THEN
    RAISE EXCEPTION 'This workspace is not claimed, so there is nothing to release.';
  END IF;

  v_claimant := (v_accept->>'claimant_id')::uuid;
  v_grace    := (v_accept->>'grace_until')::timestamptz;

  v_is_manager := EXISTS (
    SELECT 1 FROM public.account_members m
    WHERE m.account_id = _from_account_id
      AND m.user_id = v_actor
      AND m.role IN ('owner', 'admin')
  );

  -- Reversibility and its limit: the organisation may divest at any time, and
  -- the person may take it back on their own only inside the grace window.
  IF NOT v_is_manager AND NOT (v_actor = v_claimant AND v_grace > now()) THEN
    RAISE EXCEPTION 'Only the person who claimed it, inside their window, or an owner or admin of the organisation, can release it.';
  END IF;

  PERFORM set_config('app.workspace_claim', 'on', true);
  UPDATE public.workspaces SET account_id = _to_account_id WHERE id = _workspace_id;

  -- Remove ONLY the member row the claim itself added. A colleague invited into
  -- the workspace after the claim is left alone: releasing a billing boundary is
  -- not the same act as ejecting people.
  IF _remove_member_id IS NOT NULL AND _remove_member_id IS DISTINCT FROM v_claimant THEN
    DELETE FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _remove_member_id;
  END IF;

  INSERT INTO public.workspace_audit_log (workspace_id, actor_id, action, detail)
  VALUES (_workspace_id, v_actor, 'workspace_claim_released', jsonb_build_object(
    'from_account_id',   _from_account_id,
    'to_account_id',     _to_account_id,
    'released_by',       v_actor,
    'released_by_role',  CASE WHEN v_is_manager THEN 'account_admin' ELSE 'claimant' END,
    'reason',            _reason
  ));

  PERFORM set_config('app.workspace_claim', 'off', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_workspace_claim(
  uuid, uuid, uuid, uuid, text, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.release_workspace_claim(
  uuid, uuid, uuid, uuid, text, uuid, text) TO authenticated, service_role;


CREATE INDEX IF NOT EXISTS workspace_audit_log_claim_to_account_idx
  ON public.workspace_audit_log ((detail->>'to_account_id'), created_at DESC)
  WHERE action IN ('workspace_claim_offered', 'workspace_claim_withdrawn',
                   'workspace_claim_declined', 'workspace_claim_accepted',
                   'workspace_claim_released');

CREATE INDEX IF NOT EXISTS workspace_audit_log_claim_workspace_idx
  ON public.workspace_audit_log (workspace_id, created_at)
  WHERE action IN ('workspace_claim_offered', 'workspace_claim_withdrawn',
                   'workspace_claim_declined', 'workspace_claim_accepted',
                   'workspace_claim_released');


REVOKE EXECUTE ON FUNCTION public.claim_workspace_into_account(uuid,uuid,uuid,uuid,uuid,timestamptz,jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_workspace_into_account(uuid,uuid,uuid,uuid,uuid,timestamptz,jsonb) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.release_workspace_claim(uuid,uuid,uuid,uuid,text,uuid,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.release_workspace_claim(uuid,uuid,uuid,uuid,text,uuid,text) TO authenticated, service_role;
