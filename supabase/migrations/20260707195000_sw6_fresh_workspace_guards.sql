-- SW-6 (mission 3.12, tenant safety): make spend guards BIND for brand-new
-- workspaces. Deliberately timestamped BEFORE the SW-6 cron restorations so a
-- partial apply can never leave automatic ingestion armed without cost guards.
--
-- WHY (audit evidence): checkBudget in the pinned AI runtime silently allows
-- when the user has no ai_budgets row or NULL caps; the row is only created
-- lazily AFTER the first call with usage-only NULL caps; nothing at signup
-- seeds caps (only demo-seed functions do). Net: a stranger who signs up gets
-- unbounded platform-key AI spend. This migration binds caps through the
-- EXISTING checkBudget read with zero changes to the pinned runtime.
--
-- Three parts:
--   1. seed defaults for every NEW user (trigger on public.profiles, so both
--      the handle_new_user chain and the self-heal path are covered without
--      touching the fragile trigger chain itself)
--   2. backfill existing all-NULL-cap users (demo accounts keep their
--      hand-seeded caps: they are not all-NULL so the backfill skips them)
--   3. clamp: authenticated non-admins cannot raise caps past the platform
--      ceiling or NULL them out (the RLS policy "own ai_budgets all" lets
--      users UPDATE their own row, so unclamped defaults would be removable
--      with one PATCH)

-- Platform defaults and ceilings (USD). Conservative for unknown users; the
-- founder can raise any individual row as admin.
--   default: 5/day, 50/month     ceiling: 25/day, 250/month

-- 1) Seed defaults for new users -----------------------------------------------

create or replace function public.seed_default_ai_budget()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_budgets (user_id, daily_usd_cap, monthly_usd_cap)
  values (new.id, 5.00, 50.00)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists seed_default_ai_budget_on_profile on public.profiles;
create trigger seed_default_ai_budget_on_profile
  after insert on public.profiles
  for each row execute function public.seed_default_ai_budget();

-- 2) Backfill existing users whose caps are all NULL ---------------------------
-- (lazy usage-only rows AND users with no row at all)

update public.ai_budgets
set daily_usd_cap = 5.00,
    monthly_usd_cap = 50.00,
    updated_at = now()
where daily_usd_cap is null
  and monthly_usd_cap is null
  and daily_token_cap is null
  and monthly_token_cap is null;

insert into public.ai_budgets (user_id, daily_usd_cap, monthly_usd_cap)
select p.id, 5.00, 50.00
from public.profiles p
where not exists (select 1 from public.ai_budgets b where b.user_id = p.id)
on conflict (user_id) do nothing;

-- 3) Clamp self-service cap edits ----------------------------------------------
-- auth.uid() is NULL for service_role connections, so server-side writes stay
-- unrestricted; admins (has_role 'admin') are also exempt. Everyone else gets
-- caps clamped to the ceiling, and NULL caps restored to the default (so the
-- guard cannot be removed by the row owner).

create or replace function public.clamp_ai_budget_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  daily_ceiling  numeric := 25.00;
  monthly_ceiling numeric := 250.00;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  if new.daily_usd_cap is null or new.daily_usd_cap > daily_ceiling then
    new.daily_usd_cap := least(coalesce(new.daily_usd_cap, 5.00), daily_ceiling);
  end if;
  if new.monthly_usd_cap is null or new.monthly_usd_cap > monthly_ceiling then
    new.monthly_usd_cap := least(coalesce(new.monthly_usd_cap, 50.00), monthly_ceiling);
  end if;
  return new;
end;
$$;

drop trigger if exists clamp_ai_budget_caps_on_write on public.ai_budgets;
create trigger clamp_ai_budget_caps_on_write
  before insert or update on public.ai_budgets
  for each row execute function public.clamp_ai_budget_caps();

-- 4) Per-user AI request rate limiting ------------------------------------------
-- Burst protection for the authenticated chat surface (budgets are day
-- granularity; a script can burn a day's cap in seconds). Service-role only:
-- written by the /api/chat handler through the admin client, never by users
-- (mirrors public_decision_rate_limits, keyed on user_id instead of IP).

create table if not exists public.user_ai_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  request_count integer not null default 0,
  window_start timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.user_ai_rate_limits to service_role;
alter table public.user_ai_rate_limits enable row level security;
-- No policies: service-role only by design.
