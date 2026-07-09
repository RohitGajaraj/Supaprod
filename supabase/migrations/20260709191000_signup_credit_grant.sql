-- WHY (SW-7 step-0 rerun, 2026-07-09): accounts materialize with a zeroed
-- account_credits row and nothing ever granted the tier allowance after the
-- one-time backfill ran, so every account created since runs at 0 credits.
-- Observed live on a fresh production signup: the default signal.created
-- pipeline dispatched missions that all died on the cost guard ("Account
-- credit balance (0) is below the projected cost (14)") in retry waves - 12
-- halted missions inside the account's first 15 minutes, and every autonomous
-- feature (goal-tick, reactor, build missions) dead on arrival.
--
-- Fix: fund a never-granted account at the exact chokepoint that materializes
-- it. ensure_user_default_account already runs on every billing/credits read
-- and is the single place accounts + account_credits rows are born, so after
-- ensuring the row we call backfill_account_credits() - the ONE grant source
-- whose per-tier CASE is drift-guarded against entitlements.ts by
-- credit-grant-sql-parity.test.ts - whenever this account's monthly grant is
-- still 0. The exists-check keeps the hot path to a single-row lookup; the
-- global backfill only runs while a zero-grant account exists (it is
-- idempotent and also heals any stragglers in the same pass). Enterprise
-- accounts (grant 0 by design) would re-trigger the no-op scan; none exist
-- today and the backfill writes nothing for them.
--
-- Also closes a smaller gap in the original function: the account_members
-- fast path returned without ensuring an account_credits row at all.

create or replace function public.ensure_user_default_account(_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare existing_id uuid; created_id uuid;
begin
  select m.account_id into existing_id from public.account_members m
    where m.user_id = _user_id order by m.created_at limit 1;

  if existing_id is null then
    select a.id into existing_id from public.accounts a
      where a.owner_id = _user_id order by a.created_at limit 1;
    if existing_id is not null then
      insert into public.account_members (account_id, user_id, role)
        values (existing_id, _user_id, 'owner')
        on conflict (account_id, user_id) do nothing;
    end if;
  end if;

  if existing_id is null then
    insert into public.accounts (owner_id) values (_user_id) returning id into created_id;
    insert into public.account_members (account_id, user_id, role)
      values (created_id, _user_id, 'owner')
      on conflict (account_id, user_id) do nothing;
    existing_id := created_id;
  end if;

  insert into public.account_credits (account_id) values (existing_id)
    on conflict (account_id) do nothing;

  if exists (
    select 1 from public.account_credits c
    where c.account_id = existing_id and coalesce(c.monthly_grant_credits, 0) = 0
  ) then
    perform public.backfill_account_credits();
  end if;

  return existing_id;
end;
$$;
