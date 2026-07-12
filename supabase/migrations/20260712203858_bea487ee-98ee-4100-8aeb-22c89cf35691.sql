alter table public.opportunities
  add column if not exists roadmap_snapshot_before jsonb default null;

alter table public.opportunities
  add column if not exists roadmap_last_agent_slug text default null;