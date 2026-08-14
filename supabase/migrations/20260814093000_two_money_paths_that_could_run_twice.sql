-- Two money paths that could run twice, and neither could be closed in application code.
--
-- Both defects were confirmed against the production database on 2026-08-14.
--
-- (1) THE STRIPE WEBHOOK HAD NO IDEMPOTENCY AT ALL. There was no stripe_events
-- table and no webhook_events table anywhere in the schema, and the adapter
-- never read event.id: the type cast around its switch did not even name the
-- field. Stripe delivers at least once and retries on any non-2xx, so every
-- handler was written on the assumption that some inner guard would catch a
-- redelivery. Two of them do (credit_topups.stripe_session_id and
-- credit_refunds.refund_ref) and the most expensive one does not:
-- reset_subscription_cycle sets balance_credits = monthly_grant
-- unconditionally, so a redelivered invoice.payment_succeeded arriving after a
-- customer had spent their month restored the balance to full, free, on every
-- retry. The fix is a claim taken once per event id, before the switch, so it
-- covers handlers written later as well as the ones here today.
--
-- WHY A RELEASE FUNCTION EXISTS. The same release of the adapter starts
-- throwing when a paid top-up cannot be granted, so the route answers non-2xx
-- and Stripe redelivers. A claim with no way back would cancel exactly that
-- retry: the failed delivery would have marked the event processed and the
-- redelivery would return early having done nothing. Claim and release are one
-- mechanism and shipping either alone is worse than shipping neither.
--
-- (2) accounts.owner_id HAD NO UNIQUE INDEX. Verified live: zero unique indexes
-- on the column, sixteen accounts, zero duplicates, which is luck rather than a
-- guarantee. ensure_user_default_account runs on every billing and credits read
-- and did SELECT-finds-nothing then INSERT, so two parallel first-touch calls
-- (two page loads at signup is enough) could each find nothing and each insert.
-- The result is two accounts for one person: two credit pools, two monthly
-- grants, and spend split across both so every cap under-counts. The insert is
-- now an ON CONFLICT DO NOTHING with a re-select, which is the same claim shape
-- the rest of this file uses, and the index is what makes it enforceable.
--
-- Idempotent, because a migration may be applied more than once: every object
-- is IF NOT EXISTS or CREATE OR REPLACE, and the duplicate scan is a read.
--
-- DEPLOY ORDER MATTERS. The adapter calls claim_stripe_event on every event, so
-- this migration must be applied before or with the code that calls it. If the
-- code lands first, every webhook answers non-2xx and Stripe retries until it
-- does, which is loud and recoverable rather than silent and lossy.

-- ---------------------------------------------------------------------------
-- 1. stripe_events: one row per Stripe event id we have taken responsibility for.
-- ---------------------------------------------------------------------------
create table if not exists public.stripe_events (
  event_id text primary key,
  type text,
  received_at timestamptz not null default now()
);

comment on table public.stripe_events is
  'Exactly-once marker for Stripe webhook deliveries; event_id is the idempotency key claimed by claim_stripe_event before any handler runs. Service-role only.';

-- No policies on purpose. RLS with an empty policy set denies every client
-- role outright, and the only writers are the SECURITY DEFINER functions
-- below, called by the webhook under the service role. A client that could
-- insert a marker could block a customer's grant; one that could delete a
-- marker could replay it.
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;
grant all on public.stripe_events to service_role;

-- ---------------------------------------------------------------------------
-- 2. claim / release. The claim mirrors apply_topup_credits exactly: one
--    statement decides, and GET DIAGNOSTICS reads what it decided. A
--    SELECT-then-INSERT here would reproduce, at the outermost layer, the very
--    race every inner guard exists to close.
-- ---------------------------------------------------------------------------
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
    -- A signed Stripe event always carries an id. Refusing the claim rather
    -- than inventing one keeps the caller from processing an event it could
    -- never recognize a second time.
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
  -- Called only when a handler threw after claiming, so the redelivery Stripe
  -- is about to send is not discarded as a duplicate of a delivery that did
  -- nothing. Deleting the marker is correct precisely because the handler
  -- failed: no grant, no reset and no clawback survived it.
  delete from public.stripe_events where event_id = _event_id;
end;
$$;

revoke all on function public.claim_stripe_event(text, text) from public, anon, authenticated;
revoke all on function public.release_stripe_event(text) from public, anon, authenticated;
grant execute on function public.claim_stripe_event(text, text) to service_role;
grant execute on function public.release_stripe_event(text) to service_role;

-- ---------------------------------------------------------------------------
-- 3. One owner, one account. The duplicate scan runs FIRST and on purpose:
--    creating the index on dirty data fails with a bare "could not create
--    unique index" plus one duplicate key value, which tells an operator
--    nothing about how many owners are affected or which ones to merge.
-- ---------------------------------------------------------------------------
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

-- The pre-existing accounts_owner_id_idx is a plain btree on the same column
-- and stays: dropping an index another query plan may be sitting on is a
-- separate decision from adding the constraint that was missing.
create unique index if not exists accounts_owner_id_unique_idx
  on public.accounts (owner_id);

-- ---------------------------------------------------------------------------
-- 4. ensure_user_default_account: same body as 20260709191000 (the membership
--    fast path, the account_credits row, the zero-grant backfill trigger), with
--    the bare INSERT replaced by a claim. Only the account creation changed.
-- ---------------------------------------------------------------------------
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
    -- The claim. A concurrent first-touch call for the same user now loses the
    -- insert instead of creating a second account and a second credit pool.
    insert into public.accounts (owner_id) values (_user_id)
      on conflict (owner_id) do nothing
      returning id into created_id;

    if created_id is null then
      -- Lost the race, which is a normal outcome and not an error: read the
      -- winner's row and carry on with it. RETURNING gives back nothing on a
      -- DO NOTHING conflict, so without this the caller would carry a null
      -- account id into the account_members insert below.
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
