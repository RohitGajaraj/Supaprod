-- PC-34: "what changed since you last looked" needs a real last-visit
-- timestamp per user per workspace. One tiny table, owner-only RLS, no
-- broader tenancy implications (a visit marker, not a shared resource).

create table if not exists public.brain_last_seen (
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, workspace_id)
);

alter table public.brain_last_seen enable row level security;

create policy "users manage their own brain_last_seen row"
  on public.brain_last_seen
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.brain_last_seen to authenticated;
grant all on public.brain_last_seen to service_role;
