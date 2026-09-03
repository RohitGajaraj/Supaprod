-- ─────────────────────────────────────────────────────────────────────────────
-- THE INSERT WAS ONLY HALF THE WALL, AND THE OTHER HALF IS THE RETURNING.
--
-- 20260907010000 added `ws owner creates own` so a person could insert a second
-- workspace at all. Probed against production afterwards, the insert STILL
-- failed with 42501, and the reason is the part of the statement nobody looks
-- at:
--
--   insert into workspaces (...) values (...) returning *
--                                        ^^^^^^^^^^^^^^^^
--
-- PostgreSQL applies the SELECT policy to a row handed back by RETURNING. The
-- only SELECT policy on this table is
--
--   "ws members read"  using (is_workspace_member(id))
--
-- and a workspace one microsecond old has no membership row, because the row
-- that would make `is_workspace_member` true is written by the NEXT statement.
-- So the read of the row fails, the whole statement is rolled back, and the
-- caller is told the insert violated a policy. The insert did not: the read
-- did.
--
-- This is why the earlier probe was so confusing. The same insert succeeds
-- inside a plpgsql block, where nothing is returned, and fails at the top level
-- with `returning`. `createWorkspace` uses supabase-js
-- `.insert(...).select().single()`, which is exactly the failing shape.
--
-- ── WHY A POLICY AND NOT A REORDER ────────────────────────────────────────
-- The membership row cannot be written first: it references the workspace that
-- does not exist yet. It cannot be written in the same statement either, from
-- PostgREST. And the honest reading of the table is that this policy was always
-- missing: an owner who cannot read the workspace they own is a state no part
-- of this product wants. `is_workspace_member` is about SHARED access; it was
-- never meant to be the only way an owner sees their own row, and where the
-- membership row is missing for any other reason, this makes that workspace
-- repairable instead of invisible.
--
-- Permissive policies are OR'd, so this widens nothing else: a person still
-- reads a workspace only when they own it or belong to it.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "ws owner reads own" on public.workspaces;

create policy "ws owner reads own"
  on public.workspaces
  for select
  to authenticated
  using (owner_id = auth.uid());
