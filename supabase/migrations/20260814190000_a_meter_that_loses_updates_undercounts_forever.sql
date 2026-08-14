-- A spend meter that loses updates undercounts for the rest of the window.
--
-- WHAT WAS WRONG. `incrementBudget` and `incrementSurfaceBudget`
-- (src/lib/ai/runtime.server.ts) both read the current usage, add to it in
-- JavaScript, and blind-write the sum. Two concurrent AI calls both read
-- daily_usd_used = 10.00 and both write 10.50, so one call's spend is gone.
--
-- THIS IS NOT THE SELF-CORRECTING KIND. A lost update on a balance check is
-- recovered by the next read of the true balance. A lost update on a LEDGER is
-- permanent: the number is the record, nothing recomputes it, and the cap
-- under-reports for the remainder of the day and the month. The agent loop makes
-- these calls in parallel by design (a station runs a crew of two or three seats,
-- the fanout path turns one tool call into N runs), so the collision is the
-- normal case rather than a rare race.
--
-- The correct shape already existed in this schema, twelve weeks earlier:
-- `record_mission_usage` does the same job as one atomic `SET x = x + n`.
--
-- WHY AN RPC AND NOT `ON CONFLICT` FROM THE CLIENT. The increment is not a plain
-- addition, it is an addition OR a window roll: when day_window has moved on, the
-- counter resets to this call's usage instead of accumulating. That decision was
-- being made in JavaScript from the row it had just read, which is the same
-- read-modify-write with an extra branch. Deciding it inside SQL, in the same
-- statement that takes the row lock, is what makes it atomic.
--
-- WHAT THE FUNCTIONS RETURN, and why it matters. The soft-cap alert fires when a
-- call CROSSES the threshold, which needs the value before and after. Returning
-- the new totals lets the caller derive its own "before" by subtracting its own
-- contribution, which is more correct than the old code: under concurrency the
-- old "before" was a stale read shared by every racing caller, so the crossing
-- either fired several times or not at all. Subtracting your own delta from the
-- authoritative new total means exactly one caller sees the crossing.
--
-- Idempotent. No column is added and no row is touched by this migration itself.
-- ---------------------------------------------------------------------------

-- 1. The account-wide meter. Upsert, because a first call for a user must create
--    the row and two first calls must not create two. `ai_budgets.user_id`
--    carries a UNIQUE constraint from its original definition, which is what
--    makes the conflict target valid and the row lock serialize the racers.
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
    -- THE WINDOW ROLL, decided here rather than by the caller. When the stored
    -- window is not today's, this call is the first of a new day and its usage
    -- IS the new total.
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

-- 2. The per-surface meter. NOT an upsert: a surface with no configured budget
--    row is not metered at all, and the old code returned early on a missing row.
--    Inventing one here would start metering surfaces nobody has budgeted, which
--    is a behaviour change rather than a race fix. Zero rows returned means
--    "nothing configured", exactly as before.
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

-- 3. The runtime meters through the service role. `authenticated` is deliberately
--    column-restricted on both tables (migration 20260708153000) so a user cannot
--    reset their own usage to zero or roll the window forward to dodge a cap, and
--    a SECURITY DEFINER function granted to `authenticated` would hand back
--    exactly that power. So only service_role may execute these.
revoke all on function public.record_ai_budget_usage(uuid, integer, numeric) from public;
revoke all on function public.record_ai_surface_usage(uuid, text, numeric) from public;
grant execute on function public.record_ai_budget_usage(uuid, integer, numeric) to service_role;
grant execute on function public.record_ai_surface_usage(uuid, text, numeric) to service_role;

-- 4. Prove the increment actually accumulates, rather than asserting the function
--    exists. Advisory, never fatal, for the reason given in 20260814180000: the
--    fixture needs a user id and `ai_budgets.user_id` may carry a foreign key, so
--    a probe that could not run must not fail a correct schema change. The only
--    hard failure is the meter demonstrably not accumulating.
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
