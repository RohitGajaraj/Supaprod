-- Auto-clustering is always-on (founder ruling 2026-07-07). The owner-only
-- opt-in toggle was retired from the Discover capture row, so the workspace
-- flag now defaults to true and every existing workspace is switched on.
-- Idempotent and safe to re-run.
alter table public.workspaces
  alter column auto_cluster_enabled set default true;

update public.workspaces
  set auto_cluster_enabled = true
  where auto_cluster_enabled is false
     or auto_cluster_enabled is null;
