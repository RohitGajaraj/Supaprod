-- 20260814140000_a_wrong_verdict_nobody_can_correct_is_also_a_false_entry.sql
create table if not exists public.forecast_resolution_log (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  workspace_id uuid,
  resolution text not null,
  resolution_rationale text,
  resolved_at timestamptz,
  resolved_by_agent_slug text,
  reopened_by uuid,
  reopened_at timestamptz not null default now(),
  reason text not null,
  constraint forecast_resolution_log_reason_not_blank check (length(btrim(reason)) >= 3),
  constraint forecast_resolution_log_resolution_check
    check (resolution in ('hit', 'miss', 'inconclusive'))
);

create index if not exists idx_forecast_resolution_log_decision
  on public.forecast_resolution_log (decision_id, reopened_at desc);

grant select, insert on public.forecast_resolution_log to authenticated;
grant all on public.forecast_resolution_log to service_role;

alter table public.forecast_resolution_log enable row level security;

-- Scoped to the workspace of the referenced decision (owner or member), not
-- merely to the decision's existence.
drop policy if exists "forecast log readable by workspace members" on public.forecast_resolution_log;
create policy "forecast log readable by workspace members"
  on public.forecast_resolution_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.decisions d
      where d.id = forecast_resolution_log.decision_id
        and (
          (d.workspace_id is not null and public.is_workspace_member(d.workspace_id))
          or d.user_id = auth.uid()
        )
    )
  );

drop policy if exists "forecast log insert by workspace members" on public.forecast_resolution_log;
create policy "forecast log insert by workspace members"
  on public.forecast_resolution_log
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.decisions d
      where d.id = forecast_resolution_log.decision_id
        and (
          (d.workspace_id is not null and public.is_workspace_member(d.workspace_id))
          or d.user_id = auth.uid()
        )
    )
  );

comment on table public.forecast_resolution_log is
  'Append-only history of forecast verdicts that were later reopened. Reopening copies the prior verdict here before clearing the live columns, so a corrected grade never erases the one it replaced. No update or delete policy exists on purpose.';