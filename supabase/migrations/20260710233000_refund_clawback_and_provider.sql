-- PC-05 billing go-live pack: the refund path + the payments-provider marker.
--
-- (1) apply_refund_clawback: a provider refund (Stripe charge.refunded, Paddle
--     refund adjustment) claws the purchased credits back out of the account,
--     FLOORED AT ZERO — a refund may empty a balance but never negative-lock a
--     workspace. Every clawback writes a credit_ledger row so the record shows
--     exactly what left and why. Idempotent per provider refund reference
--     (credit_refunds.refund_ref is the key), so webhook retries are no-ops.
-- (2) subscriptions.provider / credit_topups.provider: which merchant rail a
--     row came from ('stripe' today, 'paddle' once the merchant-of-record
--     account exists). Default 'stripe' backfills every existing row honestly.
--
-- Same posture as 20260621120000_credit_flow_apply.sql: service-role only
-- (called by the payments webhook), SECURITY DEFINER, never gated by
-- credits_enabled() (correcting balances is safe while metering is off).

alter table public.subscriptions
  add column if not exists provider text not null default 'stripe';
alter table public.credit_topups
  add column if not exists provider text not null default 'stripe';

-- One row per provider refund reference: the idempotency ledger for clawbacks.
create table if not exists public.credit_refunds (
  refund_ref text primary key,
  account_id uuid not null,
  user_id uuid,
  provider text not null default 'stripe',
  credits_requested bigint not null,
  credits_clawed bigint not null default 0,
  note text,
  created_at timestamptz not null default now()
);
comment on table public.credit_refunds is
  'PC-05: one row per provider refund event; refund_ref (provider refund/adjustment id) is the idempotency key for apply_refund_clawback. Service-role only.';

alter table public.credit_refunds enable row level security;
-- No client policies on purpose: refunds are written by the webhook (service
-- role) and read by admin tooling through service-role paths only.
grant all on public.credit_refunds to service_role;

create or replace function public.apply_refund_clawback(
  _account_id uuid,
  _user_id uuid,
  _refund_ref text,
  _credits bigint,
  _provider text,
  _note text,
  _topup_session text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _inserted integer;
  _topup bigint;
  _balance bigint;
  _claw_topup bigint;
  _claw_balance bigint;
  _clawed bigint;
begin
  if _account_id is null or _refund_ref is null or _credits is null or _credits <= 0 then
    return jsonb_build_object('applied', false, 'reason', 'bad_args');
  end if;

  -- Idempotency: exactly one clawback per provider refund reference.
  insert into public.credit_refunds (refund_ref, account_id, user_id, provider, credits_requested, note)
  values (_refund_ref, _account_id, _user_id, coalesce(_provider, 'stripe'), _credits, _note)
  on conflict (refund_ref) do nothing;

  get diagnostics _inserted = row_count;
  if _inserted = 0 then
    return jsonb_build_object('applied', false, 'reason', 'duplicate');
  end if;

  perform public._ensure_account_credits(_account_id);

  select coalesce(topup_credits, 0), coalesce(balance_credits, 0)
    into _topup, _balance
  from public.account_credits
  where account_id = _account_id
  for update;

  -- Claw purchased top-up credits first (that is what was refunded), then the
  -- included balance; the floor at zero is by construction — least() never
  -- lets either bucket go negative.
  _claw_topup := least(_credits, _topup);
  _claw_balance := least(_credits - _claw_topup, _balance);
  _clawed := _claw_topup + _claw_balance;

  update public.account_credits
     set topup_credits = _topup - _claw_topup,
         balance_credits = _balance - _claw_balance,
         updated_at = now()
   where account_id = _account_id;

  update public.credit_refunds
     set credits_clawed = _clawed
   where refund_ref = _refund_ref;

  if _clawed > 0 then
    insert into public.credit_ledger (account_id, user_id, delta_credits, reason)
    values (_account_id, _user_id, -_clawed, coalesce(_note, 'refund_clawback'));
  end if;

  -- Mark the refunded purchase so the credits view tells the truth.
  if _topup_session is not null then
    update public.credit_topups
       set status = 'refunded'
     where stripe_session_id = _topup_session;
  end if;

  return jsonb_build_object(
    'applied', true,
    'credits_requested', _credits,
    'credits_clawed', _clawed,
    'shortfall', _credits - _clawed
  );
end;
$$;

revoke all on function public.apply_refund_clawback(uuid, uuid, text, bigint, text, text, text) from public, anon, authenticated;
grant execute on function public.apply_refund_clawback(uuid, uuid, text, bigint, text, text, text) to service_role;
