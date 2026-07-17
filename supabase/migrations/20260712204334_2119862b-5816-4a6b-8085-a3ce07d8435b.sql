create or replace function public.refund_account_credits(
  _account_id uuid,
  _credits bigint,
  _user_id uuid,
  _surface text,
  _ai_event_id uuid,
  _product_id uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if _credits is null or _credits <= 0 then
    return;
  end if;

  perform 1 from public.account_credits where account_id = _account_id for update;
  if not found then
    return;
  end if;

  update public.account_credits
     set topup_credits = coalesce(topup_credits, 0) + _credits
   where account_id = _account_id;

  insert into public.credit_ledger
    (account_id, user_id, delta_credits, reason, surface, ai_event_id, product_id)
  values
    (_account_id, _user_id, _credits, 'adjustment', _surface, _ai_event_id, _product_id);
end;
$$;

alter table public.agent_runs add column if not exists credits_refunded boolean not null default false;