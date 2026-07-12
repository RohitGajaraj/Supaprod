-- G-PRICE PR-C2: BYOK platform fee accrual — a thin % of pass-through spend on
-- enterprise BYOK calls, accrued as a SINGLE contract/invoice line, never a live
-- per-call dual-meter the admin watches (pricing-architecture §4).
--
-- Spec: docs/strategy/pricing/implementation-plan.md PR-C2. The customer's own key
-- pays the raw model tokens (invisible to Cadence's UI, per §4); this table accrues
-- Cadence's thin orchestration-margin cut on that rated spend so it can be read back
-- as one committed-invoice line at contract time. Never surfaced as a live balance the
-- admin watches tick — the reporting is a periodic (monthly) admin/contract rollup, not
-- a chokepoint-adjacent UI. The exact % is founder-config, set at enterprise-contract
-- time (research band ~10-20%); this migration ships the structure only.

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

alter table public.byok_fee_accrual enable row level security;

-- Service-role only (the chokepoint writes it; account owners/admins read their own
-- account's rollup via a dedicated server fn, not a direct table policy, mirroring
-- credit_ledger's own service-role-only write posture).
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
