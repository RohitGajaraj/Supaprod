-- admin_grant_credits defaulted _reason to 'admin_grant'. credit_ledger.reason is
-- constrained to ('grant','reset','debit','topup','adjustment'). So the function
-- raised a check violation on the one path a caller is most likely to take: calling
-- it without a reason, exactly as its own signature invites.
--
-- The bug survived because every real call so far passed a reason explicitly, which
-- is the failure mode of a bad default: it is invisible to anyone who does not use
-- it, and it fails for the first person who trusts the signature.
--
-- 'topup' rather than 'adjustment', because the reason should name what the function
-- actually did to the balance. Two lines up it writes
--   topup_credits = GREATEST(0, topup_credits + _credits)
-- so the ledger row and the column it moved now agree. 'adjustment' would read as a
-- correction to a wrong balance, which is a different event and would misreport
-- every admin grant as a bookkeeping repair.
--
-- The signature is otherwise unchanged: an explicit reason still wins, and an
-- invalid one still fails at the constraint, which is the right place for it.

CREATE OR REPLACE FUNCTION public.admin_grant_credits(
  _user_id uuid,
  _credits bigint,
  _reason text DEFAULT 'topup'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _account_id uuid;
  _new_balance bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin role required';
  END IF;
  IF _credits IS NULL OR _credits = 0 THEN
    RAISE EXCEPTION 'credits must be non-zero';
  END IF;

  -- Pick primary account (owner first, else earliest membership).
  SELECT account_id INTO _account_id
  FROM public.account_members
  WHERE user_id = _user_id
  ORDER BY role = 'owner' DESC, created_at ASC
  LIMIT 1;

  IF _account_id IS NULL THEN
    RAISE EXCEPTION 'user has no account';
  END IF;

  -- Ensure account_credits row exists.
  INSERT INTO public.account_credits (account_id, balance_credits, monthly_grant_credits, topup_credits, cycle_anchor)
  VALUES (_account_id, 0, 0, 0, now())
  ON CONFLICT (account_id) DO NOTHING;

  UPDATE public.account_credits
     SET balance_credits = balance_credits + _credits,
         topup_credits = GREATEST(0, topup_credits + _credits),
         updated_at = now()
   WHERE account_id = _account_id
   RETURNING balance_credits INTO _new_balance;

  INSERT INTO public.credit_ledger (account_id, user_id, delta_credits, reason, surface)
  VALUES (_account_id, _user_id, _credits, _reason, 'admin');

  RETURN jsonb_build_object(
    'account_id', _account_id,
    'new_balance', _new_balance
  );
END $function$;
