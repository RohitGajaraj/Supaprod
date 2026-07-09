-- WHY (founder ruling 2026-07-09): a new account's starter grant moves
-- 500 -> 750 so an explorer can run the whole first loop without the meter
-- cutting the session short. Tier multipliers unchanged (Pro 5x, Max/Team
-- 20x), so the CASE scales with the base exactly like
-- entitlements.ts#FREE_MONTHLY_CREDITS * multiplier - the drift guard
-- (credit-grant-sql-parity.test.ts) pins this block to the TS numbers and
-- reads the LATEST migration that defines this function.
create or replace function public.backfill_account_credits()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare _granted integer := 0;
begin
  with base as (
    select c.account_id,
           case a.plan_tier
             when 'free' then 750 when 'pro' then 3750
             when 'max' then 15000 when 'team' then 15000
             else 0
           end as amount
    from public.account_credits c
    join public.accounts a on a.id = c.account_id
    where coalesce(c.monthly_grant_credits, 0) = 0
  ),
  upd as (
    update public.account_credits c
       set monthly_grant_credits = b.amount, balance_credits = b.amount,
           cycle_anchor = now(), updated_at = now()
      from base b where c.account_id = b.account_id and b.amount > 0
    returning c.account_id, b.amount
  )
  insert into public.credit_ledger (account_id, delta_credits, reason)
  select account_id, amount, 'grant' from upd;
  get diagnostics _granted = row_count;
  return jsonb_build_object('granted_accounts', _granted);
end;
$$;

-- True-up: free accounts granted at the old 500 base get the +250 difference
-- so the 750 promise holds for accounts created before this migration too.
-- Idempotent: after the first run no row matches the 500 predicate.
with bumped as (
  update public.account_credits c
     set monthly_grant_credits = 750,
         balance_credits = c.balance_credits + 250,
         updated_at = now()
    from public.accounts a
   where a.id = c.account_id
     and a.plan_tier = 'free'
     and c.monthly_grant_credits = 500
  returning c.account_id
)
insert into public.credit_ledger (account_id, delta_credits, reason)
select account_id, 250, 'grant' from bumped;
