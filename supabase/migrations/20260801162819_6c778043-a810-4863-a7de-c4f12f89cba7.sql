-- Idempotent re-assert + ledger reconciliation for 20260801234500, 20260802000000, 20260802001000

-- 1) tools are platform policy, not per-user grants
delete from public.agent_tools where built_in = true;
drop trigger if exists seed_agent_tools on public.profiles;
comment on table public.agent_tools is
  'PER-ACCOUNT OVERRIDES ONLY, never a grant. The tool list is TOOL_REGISTRY and the policy is src/lib/ai/tools/defaults.ts; a row here records where ONE account deviates. No row means the platform default applies. Do not seed this table.';

-- 2) per-track spend ceiling
alter table public.spine_tracks
  add column if not exists spend_used_usd numeric not null default 0,
  add column if not exists spend_cap_usd numeric;
alter table public.workspaces
  add column if not exists default_track_spend_cap_usd numeric;

-- 3) neutralise every tool-seeding routine (kept callable, empty)
create or replace function public.seed_default_agent_tools(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin return; end; $$;
create or replace function public.seed_studio_tools(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin return; end; $$;
create or replace function public.seed_pm_lifecycle_tools(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin return; end; $$;
create or replace function public.seed_rf08_missing_agent_tools(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin return; end; $$;
create or replace function public.seed_seam2_ci_tools(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin return; end; $$;
create or replace function public.seed_station_agent_tools(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin return; end; $$;
create or replace function public.seed_agent_tools_for(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin return; end; $$;

-- ledger reconciliation
insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260801234500','tools_are_platform_not_per_user'),
  ('20260802000000','track_spend_ceiling'),
  ('20260802001000','neutralise_tool_seed_functions')
on conflict (version) do nothing;