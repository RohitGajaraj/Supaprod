-- The forecast is the part that cannot be rebuilt.
--
-- Founder ruling 2026-08-10 (relayed via Lane 0, positioning-locked §5E):
-- capture, at the moment a decision is committed, what the team expects to
-- happen and how they will know. Build now, P0.
--
-- WHY THIS IS THE MOAT AND THE RECORD IS NOT. Audited earlier today: a CAUSE
-- is recoverable. Vercel's COO reconstructed the true reason a deal was lost
-- by running an agent over Slack, email and call recordings, in two days.
-- Surviving artifacts are enough. A FORECAST is not recoverable, because it
-- never existed in any artifact unless somebody wrote it down BEFORE the
-- outcome was known. No volume of retrospective data reconstructs a belief
-- nobody recorded.
--
-- So this is the one thing a competitor starting next year genuinely cannot
-- backfill, and it is cheap for us because we already sit at the decision.
--
-- MIRRORS A PROVEN LIVE PATTERN RATHER THAN INVENTING ONE. `insights` already
-- carries claim / horizon_date / resolution / brier_score / resolved_at, and
-- `calibrateExpiredInsights` already scores expired claims Brier-style through
-- the calibrate-tick. The same five fields land on `decisions` with the same
-- names and the same vocabulary, so the auditor that scores an insight can
-- score a decision without a second implementation or a second vocabulary.
--
-- BINARY, NOT A ONE-TO-FIVE SCORE. `resolution` reuses the insights vocabulary
-- hit / miss / inconclusive. A scored forecast is a way of not deciding; a
-- forecast that resolves binary is one that actually resolves. `inconclusive`
-- exists because the honest third answer is "the evidence did not settle it",
-- and forcing that into hit or miss would poison the calibration record it
-- feeds.
--
-- SHORT HORIZONS FIRST. No default is imposed here, but the intended shape is
-- "what do I expect this prototype to prove" resolving in days, not "will this
-- quarter's bet pay off" resolving in quarters. A short horizon closes the
-- loop faster and is cheaper to be wrong about.
--
-- ─────────────────────────────────────────────────────────────────────────
-- THE PROPERTY THAT MAKES THE CLAIM TRUE, and without it this is decoration.
--
-- A forecast that can be edited after the outcome is known is not a forecast.
-- It is a retrospective wearing a timestamp, and it is exactly as backfillable
-- as the record we already stopped claiming was un-backfillable.
--
-- So once `forecast_claim` is set it CANNOT be changed or cleared by an
-- application caller, and neither can what-we-will-know or the horizon. They
-- can be set once, on a decision that has none. Everything else about the
-- decision stays editable.
--
-- The resolution fields are deliberately NOT frozen: those are written AFTER
-- the horizon passes, by the calibrator or a human, and re-scoring a claim as
-- better evidence arrives is legitimate. What must not move is what was
-- believed beforehand.
--
-- service_role is exempt for the same reason as the created_at guard: the
-- platform may correct history, the SUBJECT of the record may not. A ledger is
-- evidence against the person it describes.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.decisions
  add column if not exists forecast_claim text,
  add column if not exists forecast_how_we_will_know text,
  add column if not exists forecast_horizon_date timestamptz,
  add column if not exists forecast_resolution text,
  add column if not exists forecast_resolved_at timestamptz;

alter table public.decisions drop constraint if exists decisions_forecast_resolution_check;
alter table public.decisions add constraint decisions_forecast_resolution_check
  check (
    forecast_resolution is null
    or forecast_resolution = any (array['hit'::text, 'miss'::text, 'inconclusive'::text])
  );

comment on column public.decisions.forecast_claim is
  'What the team expected to happen, recorded BEFORE the outcome was known. Immutable once set (enforce_forecast_immutable). This is the un-backfillable artifact: a cause can be reconstructed from surviving evidence, a belief cannot.';
comment on column public.decisions.forecast_how_we_will_know is
  'The observable that will settle the claim. Immutable once set: choosing the test after seeing the result is how a forecast becomes a retrospective.';
comment on column public.decisions.forecast_horizon_date is
  'When the claim should be resolvable. Immutable once set, so a missed forecast cannot be rescued by moving the date.';

create or replace function public.enforce_forecast_immutable()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- The platform may correct history; the subject of the record may not.
  if coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  -- Set-once. A decision that carries no forecast may gain one; a decision
  -- that carries one keeps exactly the one it was committed with.
  if OLD.forecast_claim is not null
     and NEW.forecast_claim is distinct from OLD.forecast_claim then
    raise exception
      'forecast_claim is immutable: a forecast you can edit after the outcome is a retrospective, not a forecast'
      using errcode = 'check_violation';
  end if;

  if OLD.forecast_how_we_will_know is not null
     and NEW.forecast_how_we_will_know is distinct from OLD.forecast_how_we_will_know then
    raise exception
      'forecast_how_we_will_know is immutable: choosing the test after seeing the result settles nothing'
      using errcode = 'check_violation';
  end if;

  if OLD.forecast_horizon_date is not null
     and NEW.forecast_horizon_date is distinct from OLD.forecast_horizon_date then
    raise exception
      'forecast_horizon_date is immutable: a missed forecast cannot be rescued by moving the date'
      using errcode = 'check_violation';
  end if;

  return NEW;
end; $function$;

comment on function public.enforce_forecast_immutable() is
  'Freezes decisions.forecast_claim / _how_we_will_know / _horizon_date once set, for any caller that is not service_role. The resolution fields stay writable on purpose: those are recorded after the horizon passes and re-scoring on better evidence is legitimate. What must not move is what was believed beforehand.';

drop trigger if exists trg_decisions_forecast_immutable on public.decisions;
create trigger trg_decisions_forecast_immutable
  before update on public.decisions
  for each row execute function public.enforce_forecast_immutable();

-- Resolvable-now lookup for the calibrator: unresolved claims past their
-- horizon. Partial, so it stays small however many decisions carry no forecast.
create index if not exists idx_decisions_forecast_due
  on public.decisions (forecast_horizon_date)
  where forecast_claim is not null and forecast_resolution is null;