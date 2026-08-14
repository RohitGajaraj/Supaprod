-- FC-01: reopening a settled forecast, by APPENDING rather than rewriting.
--
-- THE PROBLEM THIS SOLVES, and it is a genuine tension rather than an oversight.
-- Migration 20260812210000 added forecast_resolved_by_agent_slug and argued that
-- the column exists so an agent verdict stays reversible. In practice nothing
-- could reverse one: once forecast_resolution is non-null, isForecastDue returns
-- false and the row never returns to the desk, the "Settled by an agent" rows
-- render with no control, and there is no API. An agent verdict was visible and
-- permanently binding, which inverts the property the column was added for.
--
-- The obvious fix is worse than the bug. Letting anyone overwrite a settled
-- verdict in place would make the resolution mutable, and this whole feature
-- rests on a forecast being a thing you cannot quietly revise once the answer is
-- known. Both failure modes corrupt the record: a wrong verdict left permanently
-- in place is a false entry nobody may correct, and an editable verdict is not a
-- record at all.
--
-- SO REOPENING APPENDS. The prior verdict, its rationale, its timestamp and the
-- slug of whoever or whatever settled it are copied into an append-only log
-- BEFORE the live columns are cleared, so the history is readable underneath the
-- live state rather than replaced by it. Reopening costs a reason, and the
-- reason is the content of the new row rather than paperwork attached to it.
--
-- WHAT STAYS IMMUTABLE IS UNCHANGED. enforce_forecast_immutable still freezes
-- the claim, the observable and the horizon for every non-service_role caller.
-- What a team believed beforehand remains unrewritable. Only the GRADE can be
-- revisited, which was always true: the original migration deliberately exempts
-- the resolution fields, because re-scoring on better evidence is legitimate.

create table if not exists public.forecast_resolution_log (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  workspace_id uuid,

  -- The verdict as it stood, copied verbatim. Not a diff and not a summary: a
  -- reader settling this call again needs to see exactly what they are
  -- disagreeing with, including who said it.
  resolution text not null,
  resolution_rationale text,
  resolved_at timestamptz,
  resolved_by_agent_slug text,

  -- Who reopened it, when, and why. The reason is required at the application
  -- layer and defended here by a length check, because "reopened" with no
  -- argument is the same non-answer as a status word on its own.
  reopened_by uuid,
  reopened_at timestamptz not null default now(),
  reason text not null,

  constraint forecast_resolution_log_reason_not_blank check (length(btrim(reason)) >= 3),
  constraint forecast_resolution_log_resolution_check
    check (resolution in ('hit', 'miss', 'inconclusive'))
);

-- The desk reads the most recent prior verdict for a decision, oldest last.
create index if not exists idx_forecast_resolution_log_decision
  on public.forecast_resolution_log (decision_id, reopened_at desc);

alter table public.forecast_resolution_log enable row level security;

-- Readable by anyone who can read the decision it belongs to. Deliberately not
-- owner-scoped: a successor inheriting the record needs the history that came
-- with it, which is the same argument the agent_memory visibility migration
-- made on 2026-08-02.
drop policy if exists "forecast log readable by workspace members" on public.forecast_resolution_log;
create policy "forecast log readable by workspace members"
  on public.forecast_resolution_log
  for select
  using (
    exists (
      select 1 from public.decisions d
      where d.id = forecast_resolution_log.decision_id
    )
  );

-- APPEND ONLY, ENFORCED BELOW THE APPLICATION. There is no update policy and no
-- delete policy, so the log cannot be edited or pruned by any authenticated
-- caller even if a future code path tries. An audit trail that can be rewritten
-- is decoration, which is the argument the original forecast migration made
-- about the forecast itself.
drop policy if exists "forecast log insert by workspace members" on public.forecast_resolution_log;
create policy "forecast log insert by workspace members"
  on public.forecast_resolution_log
  for insert
  with check (
    exists (
      select 1 from public.decisions d
      where d.id = forecast_resolution_log.decision_id
    )
  );

comment on table public.forecast_resolution_log is
  'Append-only history of forecast verdicts that were later reopened. Reopening copies the prior verdict here before clearing the live columns, so a corrected grade never erases the one it replaced. No update or delete policy exists on purpose.';
