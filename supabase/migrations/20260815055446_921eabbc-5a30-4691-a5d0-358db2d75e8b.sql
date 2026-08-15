-- 20260814093000_two_money_paths_that_could_run_twice.sql
create table if not exists public.stripe_events (
  event_id text primary key,
  type text,
  received_at timestamptz not null default now()
);

comment on table public.stripe_events is
  'Exactly-once marker for Stripe webhook deliveries; event_id is the idempotency key claimed by claim_stripe_event before any handler runs. Service-role only.';

alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;
grant all on public.stripe_events to service_role;

create or replace function public.claim_stripe_event(_event_id text, _type text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _inserted integer;
begin
  if _event_id is null or _event_id = '' then
    return false;
  end if;

  insert into public.stripe_events (event_id, type)
  values (_event_id, _type)
  on conflict (event_id) do nothing;

  get diagnostics _inserted = row_count;
  return _inserted = 1;
end;
$$;

create or replace function public.release_stripe_event(_event_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  delete from public.stripe_events where event_id = _event_id;
end;
$$;

revoke all on function public.claim_stripe_event(text, text) from public, anon, authenticated;
revoke all on function public.release_stripe_event(text) from public, anon, authenticated;
grant execute on function public.claim_stripe_event(text, text) to service_role;
grant execute on function public.release_stripe_event(text) to service_role;

do $$
declare
  _owners text;
  _count integer;
begin
  select count(*), string_agg(owner_id::text, ', ')
    into _count, _owners
  from (
    select owner_id
    from public.accounts
    group by owner_id
    having count(*) > 1
  ) duplicated;

  if coalesce(_count, 0) > 0 then
    raise exception
      'accounts.owner_id cannot be made unique: % owner(s) already hold more than one account (%). Merge each owner onto a single account (move account_members, account_credits, credit_ledger, credit_topups and subscriptions to the surviving id) before applying this migration.',
      _count, left(_owners, 500);
  end if;
end $$;

create unique index if not exists accounts_owner_id_unique_idx
  on public.accounts (owner_id);

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
    insert into public.accounts (owner_id) values (_user_id)
      on conflict (owner_id) do nothing
      returning id into created_id;

    if created_id is null then
      select a.id into created_id from public.accounts a
        where a.owner_id = _user_id order by a.created_at limit 1;
    end if;

    if created_id is null then
      raise exception 'ensure_user_default_account: could not create or find an account for user %', _user_id;
    end if;

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