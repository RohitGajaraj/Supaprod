-- CONNECTIONS-V11: "Request a connector" capture.
-- When a user wants a source Cadence does not yet support, they type it and
-- submit; the request lands here so the founder can see demand. Own-row RLS:
-- a user only ever sees their own requests. No email (cost + friction); the
-- app shows an in-product acknowledgment on submit.
create table if not exists public.connector_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid,
  connector text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.connector_requests enable row level security;

-- Insert + read own rows only.
drop policy if exists connector_requests_insert on public.connector_requests;
create policy connector_requests_insert on public.connector_requests
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists connector_requests_select on public.connector_requests;
create policy connector_requests_select on public.connector_requests
  for select to authenticated
  using (auth.uid() = user_id);

create index if not exists connector_requests_created_idx
  on public.connector_requests (created_at desc);
