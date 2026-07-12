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