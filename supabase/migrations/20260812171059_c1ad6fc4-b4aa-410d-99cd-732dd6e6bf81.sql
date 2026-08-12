alter table public.decisions
  add column if not exists forecast_resolution_suggestion jsonb,
  add column if not exists forecast_resolution_rationale text,
  add column if not exists forecast_resolved_by_agent_slug text,
  add column if not exists forecast_next_check_at timestamptz,
  add column if not exists forecast_deferred_at timestamptz,
  add column if not exists forecast_deferred_count integer not null default 0;

comment on column public.decisions.forecast_resolution_suggestion is
  'Auto-drafted, confidence-tiered resolution suggestion. A draft, never a verdict.';
comment on column public.decisions.forecast_resolution_rationale is
  'Why this forecast resolved the way it did.';
comment on column public.decisions.forecast_resolved_by_agent_slug is
  'Which agent settled this forecast. NULL means a person did.';
comment on column public.decisions.forecast_next_check_at is
  'When this forecast should come back to the Learn desk. NULL means due now.';
comment on column public.decisions.forecast_deferred_at is
  'When a person last pushed this forecast out.';
comment on column public.decisions.forecast_deferred_count is
  'How many times a person pushed this forecast out.';

drop index if exists idx_decisions_forecast_due;
create index if not exists idx_decisions_forecast_due
  on public.decisions (forecast_horizon_date, forecast_next_check_at)
  where forecast_claim is not null and forecast_resolution is null;