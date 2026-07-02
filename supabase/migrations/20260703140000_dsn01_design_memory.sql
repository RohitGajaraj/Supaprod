-- DSN-01: Design memory (v12 §6.2, Tier 1).
--
-- The workspace's design language (tokens, type, spacing, principles, voice,
-- patterns) as first-class brain content: each entry a standing decision with
-- provenance and supersession, exactly like `house_rules` (see
-- supabase/migrations/20260703000000_rf04_house_rules.sql). Supersession is
-- DERIVED from an `artifact_lineage` edge (relation='supersedes', parent=the
-- new entry, child=the old one), never a status flag on this table.
--
-- Seeded three ways (source_kind): 'url_import' (extract from a live page),
-- 'pasted' (a pasted design constitution), 'default' (generic starter set),
-- or accrued over time from scaffold approve/reject feedback ('learned').

create table if not exists public.design_memory (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid(),
  workspace_id uuid not null default public.current_user_default_workspace()
                 references public.workspaces (id) on delete cascade,
  category     text not null
                 check (category in ('token', 'type', 'spacing', 'principle', 'voice', 'pattern')),
  title        text not null,
  content      text not null,
  rationale    text,
  source_kind  text not null default 'default'
                 check (source_kind in ('url_import', 'pasted', 'default', 'learned')),
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  decided_by   uuid,
  decided_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists design_memory_ws_status_idx
  on public.design_memory (workspace_id, status, category, created_at desc);

alter table public.design_memory enable row level security;

grant select, insert, update, delete on public.design_memory to authenticated;
grant all on public.design_memory to service_role;

drop policy if exists "design_memory ws read" on public.design_memory;
create policy "design_memory ws read"
  on public.design_memory for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "design_memory ws write" on public.design_memory;
create policy "design_memory ws write"
  on public.design_memory for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
