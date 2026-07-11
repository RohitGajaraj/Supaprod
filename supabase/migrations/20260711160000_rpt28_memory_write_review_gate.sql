-- RPT-28: Memory write review gate.
--
-- The general agent_memory table auto-writes with no gate: the loop distills an
-- outcome or an agent reflects, and the row lands in the moat with no human in
-- the way. Wrong memories anchor every future judgment, so this adds a consent
-- gate AT THE WRITE: a dedicated pending queue (`memory_candidates`) in front of
-- agent_memory, mirroring the design_memory dedicated-table + status shape (see
-- supabase/migrations/20260703140000_dsn01_design_memory.sql).
--
-- Nothing lands in agent_memory without an approval (curate-at-write). An
-- approved candidate that conflicts with an existing memory retires it
-- (supersede-on-conflict) via supersedes_memory_id. A candidate carries its own
-- source (user = the "save this to the brain" affordance, agent, outcome).
--
-- RLS is owner-scoped (auth.uid() = user_id), matching agent_memory itself: a
-- candidate is the caller's own proposal, decided by the caller. Every read in
-- memory-candidates.functions.ts is additionally workspace-scoped as defense in
-- depth.

create table if not exists public.memory_candidates (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid(),
  workspace_id          uuid not null default public.current_user_default_workspace()
                          references public.workspaces (id) on delete cascade,
  source_kind           text not null
                          check (source_kind in ('user', 'agent', 'outcome')),
  scope                 text,
  kind                  text,
  content               text not null,
  importance            integer,
  status                text not null default 'pending'
                          check (status in ('pending', 'approved', 'rejected')),
  supersedes_memory_id  uuid,
  decided_by            uuid,
  decided_at            timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists memory_candidates_ws_status_idx
  on public.memory_candidates (workspace_id, status, created_at desc);

alter table public.memory_candidates enable row level security;

grant select, insert, update, delete on public.memory_candidates to authenticated;
grant all on public.memory_candidates to service_role;

-- Owner-scoped (auth.uid() = user_id), verbatim shape from agent_memory's own
-- policy. Split per-command so the intent of each grant is explicit.
drop policy if exists "memory_candidates own read" on public.memory_candidates;
create policy "memory_candidates own read"
  on public.memory_candidates for select
  using (auth.uid() = user_id);

drop policy if exists "memory_candidates own insert" on public.memory_candidates;
create policy "memory_candidates own insert"
  on public.memory_candidates for insert
  with check (auth.uid() = user_id);

drop policy if exists "memory_candidates own update" on public.memory_candidates;
create policy "memory_candidates own update"
  on public.memory_candidates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
