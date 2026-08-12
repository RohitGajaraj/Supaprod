-- A forecast horizon passed and nothing was on the other side.
--
-- FC-01 shipped capture on 2026-08-10 (schema) and 2026-08-11 (server plus UI):
-- claim, observable and horizon, frozen once set. It shipped no way to settle
-- one. The only mention of forecast_resolution in application code is a comment
-- at decisions.functions.ts:421 saying attachForecast deliberately does not
-- touch it, so idx_decisions_forecast_due described a work queue that no query
-- read. Capture records a belief; only resolution turns beliefs into
-- calibration.
--
-- Design and the task-by-task build:
-- docs/planning/initiatives/forecast-resolution-plan.md
--
-- WHY A DEFERRAL COLUMN AND NOT A REUSED ENUM VALUE. Migration 20260806100000
-- ruled this for specs: a future check date says "too early to tell" WITHOUT
-- writing a verdict, "because a deferral is the absence of an outcome rather
-- than a kind of one". inconclusive is reserved for the case where the evidence
-- arrived and genuinely did not settle the claim. The sibling insight
-- calibrator conflates the two: judgeOutcome answers inconclusive whenever
-- evidence does not clearly confirm or deny, and calibrateExpiredInsights then
-- writes that verdict with status expired, permanently. Copying that here would
-- stamp verdicts on forecasts looked at too soon and poison the calibration
-- record the whole feature exists to produce.
--
-- WHY AN AGENT SLUG COLUMN. prds marks an agent verdict inside a jsonb key
-- (outcome->>settled_by) and listAgentSettledOutcomes filters on it so a person
-- can reconsider what an agent decided. forecast_resolution is a constrained
-- text column and cannot carry a key, so the marker gets its own column,
-- mirroring decisions.decided_by_agent_slug. NULL means a person settled it.
-- This is what makes an agent verdict identifiable, and therefore reversible in
-- one query, which is the property the auto-settle gate rests on. The resolution
-- fields were left writable by 20260810180000 on purpose, because re-scoring a
-- claim as better evidence arrives is legitimate.
--
-- NO CAP ON DEFERRALS, and the count is kept, carried from the prds ruling: a
-- bet deferred four times is a bet whose metric never moves, and that is worth
-- surfacing rather than hiding. A forecast hides less than a spec did, because
-- the horizon is frozen, so forecast_resolved_at minus forecast_horizon_date
-- stays computable for the life of the row. Uncapped deferral cannot conceal a
-- slipped call.
--
-- NO BACKFILL. Every existing forecast keeps forecast_resolution NULL and simply
-- becomes due when its horizon passes.
--
-- NOTHING HERE IS FROZEN. enforce_forecast_immutable guards exactly three
-- columns, forecast_claim, forecast_how_we_will_know and
-- forecast_horizon_date. None of the six below are touched by it, which is
-- correct: what must not move is what was believed beforehand.

alter table public.decisions
  add column if not exists forecast_resolution_suggestion jsonb,
  add column if not exists forecast_resolution_rationale text,
  add column if not exists forecast_resolved_by_agent_slug text,
  add column if not exists forecast_next_check_at timestamptz,
  add column if not exists forecast_deferred_at timestamptz,
  add column if not exists forecast_deferred_count integer not null default 0;

comment on column public.decisions.forecast_resolution_suggestion is
  'Auto-drafted, confidence-tiered resolution suggestion. Mirrors '
  'prds.outcome_suggestion. A draft, never a verdict: the tick writes here and '
  'promotes into forecast_resolution only behind the gate.';

comment on column public.decisions.forecast_resolution_rationale is
  'Why this forecast resolved the way it did. forecast_resolution is a '
  'constrained text column, so the reason needs its own home.';

comment on column public.decisions.forecast_resolved_by_agent_slug is
  'Which agent settled this forecast. NULL means a person did. Every agent '
  'verdict stays identifiable so the set is reversible in one query.';

comment on column public.decisions.forecast_next_check_at is
  'When this forecast should come back to the Learn desk. NULL means due now. A '
  'future value is how the product says "too early to tell" WITHOUT writing a '
  'verdict, because a deferral is the absence of an outcome rather than a kind '
  'of one. The frozen horizon is never moved by this.';

comment on column public.decisions.forecast_deferred_at is
  'When a person last pushed this forecast out.';

comment on column public.decisions.forecast_deferred_count is
  'How many times a person pushed this forecast out. Kept because it is signal: '
  'a forecast deferred four times is one whose observable never resolved.';

-- The old index predicate matched no query, because the consumer was never
-- built. This one matches the queue exactly, so the deferral clause rides the
-- same scan instead of filtering after it. Still partial, so it stays small
-- however many decisions carry no forecast.
drop index if exists idx_decisions_forecast_due;
create index if not exists idx_decisions_forecast_due
  on public.decisions (forecast_horizon_date, forecast_next_check_at)
  where forecast_claim is not null and forecast_resolution is null;
