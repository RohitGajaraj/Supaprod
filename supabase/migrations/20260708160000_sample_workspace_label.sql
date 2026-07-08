-- Sample-data honesty: mark the rich seeded workspace (the "Explore workspace"
-- Prism + Trellis showcase from seed_sample_workspace) with a durable is_sample
-- flag so the app labels it unmistakably (a tag + a banner), rather than fragile
-- name/slug matching. The flag is set by the seed's own service-role caller
-- (seedSampleWorkspace), keyed on the exact workspace the seed created, so a
-- rename can never hide that the data is example data and a real workspace that
-- happens to be named "Explore ..." is never mis-flagged.

alter table public.workspaces
  add column if not exists is_sample boolean not null default false;

-- Backfill workspaces already seeded before the flag existed. The seed
-- back-links its sentinel rows to the workspace it created
-- (agent_memory.workspace_id = the sample workspace, set at 20260705120000:924),
-- so joining on workspace_id picks EXACTLY the seeded workspace, name-independent
-- and drift-proof: never a false positive on a real workspace, never a miss.
update public.workspaces w
  set is_sample = true
  where w.is_sample = false
    and exists (
      select 1 from public.agent_memory m
      where m.workspace_id = w.id
        and m.metadata->>'seed' = 'sample-workspace-v1'
    );

-- Keep the honest label durable: only the service role (the seeder) may change
-- is_sample. A non-service UPDATE (a user renaming the workspace, changing any
-- other field) preserves the prior value, so a user cannot strip the "sample
-- data" label off example data. auth.uid() is null for the service role and
-- non-null for a user request, which is exactly the distinction we want.
create or replace function public.protect_workspace_is_sample()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.is_sample := old.is_sample;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_workspace_is_sample_on_update on public.workspaces;
create trigger protect_workspace_is_sample_on_update
  before update on public.workspaces
  for each row execute function public.protect_workspace_is_sample();
