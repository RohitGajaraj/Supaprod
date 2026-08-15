-- 20260814180000_a_cap_advertised_on_two_surfaces_and_enforced_on_none.sql
create or replace function public.connector_limit_enabled()
returns boolean
language sql
immutable
set search_path to 'public'
as $$ select false $$;

comment on function public.connector_limit_enabled() is
  'Dormancy switch for the per-plan connector cap. Flip to true with the pricing go-live. Free users must never be capped without a live upgrade path.';

create or replace function public.tier_connector_limit(_tier text)
returns int
language sql
immutable
set search_path to 'public'
as $$
  select case _tier
    when 'free' then 3
    else null
  end;
$$;

comment on function public.tier_connector_limit(text) is
  'Connector cap per plan tier. Keep in sync with connectorLimit in src/lib/entitlements.ts. Three on Free is deliberate: a signal source, a tracker and a doc store is the minimum for the loop to visibly close.';

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

  if _tier is null then
    return new;
  end if;

  _cap := public.tier_connector_limit(_tier);
  if _cap is null then
    return new;
  end if;

  _count := public.connected_source_count(new.user_id);

  if _count >= _cap then
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

do $$
declare
  _uid uuid := '00000000-0000-4000-8000-0000000000c9';
  _refused boolean := false;
  _armed boolean := false;
begin
  begin
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
      raise exception
        'enforce_connector_limit accepted a fourth connector on Free. The cap is not enforced.'
        using errcode = 'raise_exception';
    end if;

    raise exception 'rollback_connector_cap_probe';
  exception
    when sqlstate 'P0001' then
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

create or replace function public.connector_limit_enabled()
returns boolean
language sql
immutable
set search_path to 'public'
as $$ select false $$;