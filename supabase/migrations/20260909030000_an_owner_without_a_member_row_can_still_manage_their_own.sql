-- ─────────────────────────────────────────────────────────────────────────────
-- P-39 (A-QUEUE.md). THE OWNER OF A WORKSPACE COULD NOT DELETE IT.
--
-- 2026-09-03 14:00 IST: the founder deleted the empty "A2 arrival check"
-- workspace, was told it worked, and it was still there. `deleteWorkspace`
-- ran a plain `.delete().eq("id")` and reported `{ ok: true }` no matter what
-- happened -- fixed client-side in the same commit -- but the ROOT CAUSE is
-- here: the write policy on `workspaces`,
--
--   create policy "ws owner admin manage" on public.workspaces
--     for all
--     using (public.has_workspace_role(id, array['owner', 'admin']))
--     with check (public.has_workspace_role(id, array['owner', 'admin']));
--
-- and `has_workspace_role` (20260619210000) is:
--
--   select exists (
--     select 1 from public.workspace_members m
--     where m.workspace_id = ws and m.user_id = auth.uid()
--       and m.role = any (required_roles)
--   );
--
-- That workspace's owner had no `workspace_members` row. `has_workspace_role`
-- returned false, the delete matched zero rows under RLS, and PostgREST
-- answers a write that matched nothing exactly the way it answers one that
-- succeeded: no error, no rows. A1 removed the row by hand.
--
-- ── WHY A SEPARATE, ADDITIVE POLICY AND NOT A REWRITE ───────────────────────
-- `20260908010000` (the matching gap on SELECT, found the same week) already
-- set the pattern this follows: add a second permissive policy for the case
-- the role-based one cannot see, rather than editing the role-based policy
-- itself. Permissive policies on the same command are OR'd, so this widens
-- nothing else -- a person who is neither the owner nor an admin member
-- still cannot touch the row. It also means `has_workspace_role`'s own
-- membership-checking logic is untouched, and this policy needs no
-- SECURITY DEFINER function of its own: `owner_id = auth.uid()` reads a
-- column already selectable on the row RLS is evaluating.
--
-- `workspace_members`'s OWN write policy ("owner manages members",
-- 20260619210000) already admits `owner_id = auth.uid()` for exactly this
-- reason -- an owner acting on their own workspace has never needed a
-- membership row to manage its MEMBERS. This closes the one place that
-- guarantee stopped at the workspace row itself.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "ws owner manages own regardless of membership" on public.workspaces;

create policy "ws owner manages own regardless of membership"
  on public.workspaces
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
