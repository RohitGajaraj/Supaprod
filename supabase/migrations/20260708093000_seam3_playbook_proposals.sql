-- SEAM-3 (mission 3.8b): the compounding pass, playbook proposals.
--
-- Checked first, as the mission requires: the playbook registry's DEFINITIONS
-- live in code (src/lib/playbooks/registry.ts) and playbook_runs only records
-- applications, so nothing in the schema could hold a machine-proposed,
-- human-confirmed playbook and nothing distinguished proposed from confirmed.
-- This table is that missing half. When >= 3 same-shaped learnings repeat
-- (same verdict + same dominant signal; src/lib/ai/learning-compound.ts), the
-- outcome-tick pass writes ONE row here per group key, always status
-- 'proposed'. A human confirms or dismisses it (playbooks.functions.ts);
-- nothing is ever auto-confirmed. Provenance is first-class:
-- source_learning_ids carries the exact learnings the proposal quotes.
--
-- RLS follows the house pattern (house_rules / playbook_runs): workspace
-- membership keys both read and write.

create table if not exists public.playbook_proposals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid(),
  workspace_id        uuid not null default public.current_user_default_workspace()
                        references public.workspaces (id) on delete cascade,
  -- Deterministic idempotency key: verdict + the dominant signal of the
  -- linked opportunity/spec (theme link, else title stem). One proposal per
  -- group key, enforced by the unique index below.
  group_key           text not null,
  title               text not null,
  body                text not null,
  status              text not null default 'proposed'
                        check (status in ('proposed', 'confirmed', 'dismissed')),
  source_learning_ids uuid[] not null default '{}',
  decided_by          uuid,
  decided_at          timestamptz,
  created_at          timestamptz not null default now()
);

create unique index if not exists playbook_proposals_ws_group_key
  on public.playbook_proposals (workspace_id, group_key);

create index if not exists playbook_proposals_ws_status_idx
  on public.playbook_proposals (workspace_id, status, created_at desc);

alter table public.playbook_proposals enable row level security;

grant select, insert, update, delete on public.playbook_proposals to authenticated;
grant all on public.playbook_proposals to service_role;

drop policy if exists "playbook_proposals ws read" on public.playbook_proposals;
create policy "playbook_proposals ws read"
  on public.playbook_proposals for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "playbook_proposals ws write" on public.playbook_proposals;
create policy "playbook_proposals ws write"
  on public.playbook_proposals for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
