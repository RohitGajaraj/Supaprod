create table if not exists public.byok_fee_accrual (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  ai_event_id uuid,
  surface text,
  rated_spend_usd numeric not null check (rated_spend_usd >= 0),
  fee_pct numeric not null check (fee_pct >= 0 and fee_pct <= 1),
  fee_usd numeric not null check (fee_usd >= 0),
  created_at timestamptz not null default now()
);

create index if not exists byok_fee_accrual_account_idx
  on public.byok_fee_accrual (account_id, created_at);

grant select on public.byok_fee_accrual to authenticated;
grant all on public.byok_fee_accrual to service_role;

alter table public.byok_fee_accrual enable row level security;

drop policy if exists byok_fee_accrual_member_read on public.byok_fee_accrual;
create policy byok_fee_accrual_member_read on public.byok_fee_accrual
  for select
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = byok_fee_accrual.account_id
        and m.user_id = auth.uid()
    )
  );