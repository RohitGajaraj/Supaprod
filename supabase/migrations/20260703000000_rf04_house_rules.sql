-- RF-04: House-rules distillation (v12 §3.2, Tier 1, L5).
--
-- A weekly steward pass clusters a workspace's validated learnings into short,
-- versioned, per-workspace operating rules ("bets touching checkout convert 2x
-- when scoped under a week"), approval-gated, injected at the chokepoint
-- alongside the Strategic Brief (src/lib/ai/loop.server.ts). Supersession
-- follows the SAME convention as `decisions`: superseded-ness is DERIVED from
-- an `artifact_lineage` edge (relation='supersedes', parent=the new rule,
-- child=the old one — see src/lib/ai/supersession.ts), never a status flag on
-- this table. `source_learning_ids` is a plain provenance array rather than a
-- lineage edge because `learning` is not (yet) a lineage ArtifactKind and
-- adding it is out of this ticket's scope.

create table if not exists public.house_rules (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid(),
  workspace_id        uuid not null default public.current_user_default_workspace()
                        references public.workspaces (id) on delete cascade,
  rule_text           text not null,
  rationale           text,
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected')),
  source_learning_ids uuid[] not null default '{}',
  decided_by          uuid,
  decided_at          timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists house_rules_ws_status_idx
  on public.house_rules (workspace_id, status, created_at desc);

alter table public.house_rules enable row level security;

grant select, insert, update, delete on public.house_rules to authenticated;
grant all on public.house_rules to service_role;

-- RLS: workspace members read + write their workspace's rules (mirrors playbook_runs / support_tickets).
drop policy if exists "house_rules ws read" on public.house_rules;
create policy "house_rules ws read"
  on public.house_rules for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "house_rules ws write" on public.house_rules;
create policy "house_rules ws write"
  on public.house_rules for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
