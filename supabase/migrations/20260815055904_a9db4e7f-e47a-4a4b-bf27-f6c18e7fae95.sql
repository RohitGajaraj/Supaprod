-- 20260814190000_a_meter_that_loses_updates_undercounts_forever.sql
create or replace function public.record_ai_budget_usage(
  _user_id uuid,
  _tokens integer,
  _usd numeric
)
returns table (
  new_daily_tokens integer,
  new_monthly_tokens integer,
  new_daily_usd numeric,
  new_monthly_usd numeric,
  daily_usd_cap numeric,
  monthly_usd_cap numeric,
  alert_at_pct integer
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _today date := current_date;
  _month date := date_trunc('month', current_date)::date;
begin
  return query
  insert into public.ai_budgets as b (
    user_id, day_window, month_window,
    daily_tokens_used, monthly_tokens_used, daily_usd_used, monthly_usd_used
  )
  values (
    _user_id, _today, _month,
    coalesce(_tokens, 0), coalesce(_tokens, 0), coalesce(_usd, 0), coalesce(_usd, 0)
  )
  on conflict (user_id) do update set
    day_window   = _today,
    month_window = _month,
    daily_tokens_used =
      case when b.day_window = _today then coalesce(b.daily_tokens_used, 0) else 0 end
      + coalesce(_tokens, 0),
    monthly_tokens_used =
      case when b.month_window = _month then coalesce(b.monthly_tokens_used, 0) else 0 end
      + coalesce(_tokens, 0),
    daily_usd_used =
      case when b.day_window = _today then coalesce(b.daily_usd_used, 0) else 0 end
      + coalesce(_usd, 0),
    monthly_usd_used =
      case when b.month_window = _month then coalesce(b.monthly_usd_used, 0) else 0 end
      + coalesce(_usd, 0),
    updated_at = now()
  returning
    b.daily_tokens_used, b.monthly_tokens_used,
    b.daily_usd_used, b.monthly_usd_used,
    b.daily_usd_cap, b.monthly_usd_cap, b.alert_at_pct;
end;
$$;

comment on function public.record_ai_budget_usage(uuid, integer, numeric) is
  'Atomic account-wide AI spend meter. Replaces a JavaScript read-modify-write that lost updates permanently. Handles the day and month window roll inside the same statement that takes the row lock. Returns the new totals so a caller can derive its own before-value by subtracting its own delta.';

create or replace function public.record_ai_surface_usage(
  _user_id uuid,
  _surface text,
  _usd numeric
)
returns table (
  new_daily_usd numeric,
  new_monthly_usd numeric,
  daily_usd_cap numeric,
  monthly_usd_cap numeric
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _today date := current_date;
  _month date := date_trunc('month', current_date)::date;
begin
  return query
  update public.ai_surface_budgets as b set
    day_window   = _today,
    month_window = _month,
    daily_usd_used =
      case when b.day_window = _today then coalesce(b.daily_usd_used, 0) else 0 end
      + coalesce(_usd, 0),
    monthly_usd_used =
      case when b.month_window = _month then coalesce(b.monthly_usd_used, 0) else 0 end
      + coalesce(_usd, 0),
    updated_at = now()
  where b.user_id = _user_id and b.surface = _surface
  returning b.daily_usd_used, b.monthly_usd_used, b.daily_usd_cap, b.monthly_usd_cap;
end;
$$;

comment on function public.record_ai_surface_usage(uuid, text, numeric) is
  'Atomic per-surface AI spend meter. Returns no row when the surface has no budget configured, which is the same "not metered" answer the previous implementation gave.';

revoke all on function public.record_ai_budget_usage(uuid, integer, numeric) from public;
revoke all on function public.record_ai_surface_usage(uuid, text, numeric) from public;
grant execute on function public.record_ai_budget_usage(uuid, integer, numeric) to service_role;
grant execute on function public.record_ai_surface_usage(uuid, text, numeric) to service_role;

do $$
declare
  _uid uuid := '00000000-0000-4000-8000-0000000000ba';
  _first numeric;
  _second numeric;
begin
  begin
    perform public.record_ai_budget_usage(_uid, 100, 0.25);
    select new_daily_usd into _first from public.record_ai_budget_usage(_uid, 100, 0.25);
    select new_daily_usd into _second from public.record_ai_budget_usage(_uid, 100, 0.25);

    if _first is null or _second is null then
      raise exception 'record_ai_budget_usage returned no row for an existing user.';
    end if;
    if _second <= _first then
      raise exception
        'record_ai_budget_usage did not accumulate: % then %. A meter that does not add up is the defect this migration exists to fix.',
        _first, _second;
    end if;

    raise notice 'AI budget meter PROVEN to accumulate: 0.25 -> % -> %.', _first, _second;
    raise exception 'rollback_budget_meter_probe';
  exception
    when sqlstate 'P0001' then
      if sqlerrm = 'rollback_budget_meter_probe' then
        null;
      else
        raise;
      end if;
    when others then
      raise warning
        'AI budget meter NOT exercised here (%: %). The functions are installed; verify on a real call once published.',
        sqlstate, sqlerrm;
  end;
end $$;