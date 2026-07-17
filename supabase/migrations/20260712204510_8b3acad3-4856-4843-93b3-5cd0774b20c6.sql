alter table public.account_credits
  add column if not exists overage_enabled boolean not null default false,
  add column if not exists overage_cap_multiplier numeric not null default 1.25
    check (overage_cap_multiplier >= 1.0 and overage_cap_multiplier <= 3.0);