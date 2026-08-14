-- A connector cap advertised on two surfaces and enforced on none.
--
-- WHAT WAS WRONG. `assertConnectorSlotAvailable` (src/lib/entitlements.ts) refuses
-- a fourth connector on Free, is covered by seven passing tests, and is rendered
-- as a promise in two places: the public pricing page and the authenticated plan
-- picker. It has ZERO callers. `grep -rn "assertConnectorSlotAvailable" src`
-- returns its own definition and its own tests, nothing else. So a Free
-- workspace connects as many sources as it likes while both surfaces say three.
--
-- The tests are green because they test the function. Nothing tested that
-- anything CALLS it. That is the fourth instance of one defect shape found in a
-- single audit: a flag no code could write, three MCP scopes no code could grant,
-- a registry counting declarations instead of imports, and this.
--
-- WHY THE DATABASE AND NOT THE CALL SITES. A connection is created through
-- NINETEEN doors: `saveGatewayConnection`'s insert branch, thirteen native OAuth
-- callbacks writing `connections` directly, and five more writing
-- `user_calendar_connections`. Fourteen edits would still miss a quarter of the
-- fleet, and every callback uses the service-role client, which bypasses RLS.
-- It does NOT bypass triggers. So a BEFORE INSERT trigger is the only shape that
-- closes all nineteen in one place, and it is the same conclusion
-- docs/planning/SOURCE-OF-TRUTH.md reached independently.
--
-- THE COUNT SPANS BOTH TABLES, because a person connecting Gmail and a person
-- connecting Slack have both connected a source, and a cap that counted only one
-- table would be dodgeable by picking the other five providers.
--
-- DORMANT BY DEFAULT, on the WM-M5 precedent (20260619200000) and for its exact
-- reason: a free user must never be capped without a live way to upgrade, and
-- billing is not live. It gets its OWN flag rather than reusing
-- `limit_gates_enabled()` deliberately. Bundling it behind that switch would
-- mean honouring the published connector promise and simultaneously capping free
-- users at two products and one workspace, which is a larger blast radius than
-- the decision calls for. One flag, one meaning.
--
-- OF THE THREE CAPS THIS IS THE OVERDUE ONE. The product and workspace caps are
-- not stated publicly anywhere. The connector cap is, in two places, so the gap
-- between the copy and the behaviour is live today and closes the moment this
-- flag is flipped.
--
-- Idempotent. Mirrors src/lib/entitlements.ts (`connectorLimit`), which stays the
-- single source of truth for the number: free 3, every paid tier uncapped.
-- ---------------------------------------------------------------------------

-- 1. Its own dormancy flag, mirroring credits_enabled / limit_gates_enabled.
create or replace function public.connector_limit_enabled()
returns boolean
language sql
immutable
set search_path to 'public'
as $$ select false $$;

comment on function public.connector_limit_enabled() is
  'Dormancy switch for the per-plan connector cap. Flip to true with the pricing go-live. Free users must never be capped without a live upgrade path.';

-- 2. Pure tier -> cap. Mirrors entitlements.ts connectorLimit. null = uncapped.
create or replace function public.tier_connector_limit(_tier text)
returns int
language sql
immutable
set search_path to 'public'
as $$
  select case _tier
    when 'free' then 3
    else null  -- pro, max, team (Business), enterprise, or unknown -> uncapped
  end;
$$;

comment on function public.tier_connector_limit(text) is
  'Connector cap per plan tier. Keep in sync with connectorLimit in src/lib/entitlements.ts. Three on Free is deliberate: a signal source, a tracker and a doc store is the minimum for the loop to visibly close.';

-- 3. How many sources this person has connected, across BOTH connector tables.
--
-- `connections` is filtered to status 'connected' because a revoked or errored
-- row is not an occupied slot and holding one would make the cap unescapable
-- without support. `user_calendar_connections` carries no status column, so every
-- row counts; a disconnect deletes it there.
create or replace function public.connected_source_count(_user_id uuid)
returns int
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    (select count(*) from public.connections
       where user_id = _user_id and status = 'connected')
  + (select count(*) from public.user_calendar_connections
       where user_id = _user_id);
$$;

comment on function public.connected_source_count(uuid) is
  'Sources one person has connected, spanning connections and user_calendar_connections. Both are connector doors and a cap counting one table would be dodgeable through the other.';

-- 4. The guard. BEFORE INSERT on each connector table.
--
-- FAILS OPEN on an unresolved account, matching enforce_product_limit: a person
-- whose account row has not been backfilled must not be blocked from connecting
-- anything. The cap is a commercial boundary, not a safety control, so the safe
-- direction here is to allow. (Contrast mission spend caps, where an unknown
-- ceiling must never mean "no ceiling".)
create or replace function public.enforce_connector_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _tier text;
  _cap int;
  _count int;
begin
  if not public.connector_limit_enabled() then
    return new;
  end if;

  select a.plan_tier into _tier
  from public.accounts a
  where a.owner_id = new.user_id
  limit 1;

  -- No account resolved: allow. See the note above on failing open.
  if _tier is null then
    return new;
  end if;

  _cap := public.tier_connector_limit(_tier);
  if _cap is null then
    return new;
  end if;

  _count := public.connected_source_count(new.user_id);

  if _count >= _cap then
    -- The message a person reads. It states the number, the way out, and the
    -- upgrade, in that order, and matches assertConnectorSlotAvailable so the
    -- friendly path and the authoritative one cannot tell two stories.
    raise exception
      'The Free plan connects up to % sources. Disconnect one, or upgrade to Pro to connect as many as you like.', _cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_connector_limit on public.connections;
create trigger trg_enforce_connector_limit
  before insert on public.connections
  for each row
  execute function public.enforce_connector_limit();

drop trigger if exists trg_enforce_connector_limit_calendar on public.user_calendar_connections;
create trigger trg_enforce_connector_limit_calendar
  before insert on public.user_calendar_connections
  for each row
  execute function public.enforce_connector_limit();

-- 5. Prove the mechanism rather than asserting it exists.
--
-- This repo has been burned by migrations whose objects were present and whose
-- behaviour was never exercised, so this block flips the flag inside a
-- transaction it rolls back, drives the trigger past the cap on a synthetic
-- user, and raises if the refusal did not happen. It touches no real row and
-- leaves the flag at false.
-- ADVISORY, NEVER FATAL, and that is a deliberate call rather than timidity.
-- The probe needs a synthetic user, and `connections.user_id` may carry a
-- foreign key to auth.users, so on some environments the setup inserts cannot
-- run at all. A probe that failed the migration on THAT would block a correct
-- schema change for a reason unrelated to the change. So every unexpected
-- condition downgrades to a WARNING naming what could not be checked, and the
-- one thing that raises is the case the probe exists for: the fourth connector
-- being ACCEPTED while the cap is armed, which would mean the trigger is
-- decoration. Read the output; a WARNING here means this is proven by
-- construction only and wants a live check.
do $$
declare
  _uid uuid := '00000000-0000-4000-8000-0000000000c9';
  _refused boolean := false;
  _armed boolean := false;
begin
  begin
    -- Arm the flag for this transaction only. Rolled back with everything else.
    execute $f$create or replace function public.connector_limit_enabled()
             returns boolean language sql immutable set search_path to 'public'
             as 'select true'$f$;
    _armed := true;

    insert into public.accounts(owner_id, plan_tier) values (_uid, 'free');

    insert into public.connections(user_id, provider, auth_kind, status)
      values (_uid, 'slack', 'token', 'connected'),
             (_uid, 'stripe', 'token', 'connected'),
             (_uid, 'canny', 'token', 'connected');

    begin
      insert into public.connections(user_id, provider, auth_kind, status)
        values (_uid, 'hubspot', 'token', 'connected');
    exception when check_violation then
      _refused := true;
    end;

    if _refused then
      raise notice 'connector cap PROVEN: a fourth source was refused on Free.';
    else
      -- The only hard failure. The trigger accepted what it exists to refuse.
      raise exception
        'enforce_connector_limit accepted a fourth connector on Free. The cap is not enforced.'
        using errcode = 'raise_exception';
    end if;

    -- Undo the fixtures and the armed flag.
    raise exception 'rollback_connector_cap_probe';
  exception
    when sqlstate 'P0001' then
      -- Ours: either the rollback marker, or the real assertion above.
      if sqlerrm = 'rollback_connector_cap_probe' then
        null;
      else
        raise;
      end if;
    when others then
      raise warning
        'connector cap NOT exercised here (%: %). The trigger and functions are installed; verify on a real workspace once the flag is flipped.',
        sqlstate, sqlerrm;
  end;

  if not _armed then
    raise warning 'connector cap probe could not arm its flag, so nothing was exercised.';
  end if;
end $$;

-- Restore the dormant definition unconditionally, in case the probe above left
-- the armed one behind on any path.
create or replace function public.connector_limit_enabled()
returns boolean
language sql
immutable
set search_path to 'public'
as $$ select false $$;
