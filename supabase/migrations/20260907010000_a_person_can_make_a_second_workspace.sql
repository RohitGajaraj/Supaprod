-- NOBODY COULD EVER CREATE A SECOND WORKSPACE, AND THE BUTTON HAS BEEN THERE ALL ALONG.
--
-- Walked on production 2026-09-03: Settings > About your company > Start another
-- workspace, a name, Create. The toast read "No new workspace was created." and
-- said nothing else. HTTP 200, nothing in the console, no row on the database.
--
-- ── THE CAUSE ────────────────────────────────────────────────────────────
-- `workspaces` carried exactly two policies, and the only one permitting INSERT
-- was `ws owner admin manage`, WITH CHECK `has_workspace_role(id, ...)`. That
-- asks whether the caller is already a member of the workspace being inserted.
-- On an insert the row does not exist yet and neither does its membership, so
-- the check is false by construction and every insert through a user client was
-- refused.
--
-- The FIRST workspace works because it never takes that path:
-- `ensure_user_default_workspace` is SECURITY DEFINER, bypasses RLS, and creates
-- both the workspace and its `workspace_members` owner row. So signup succeeded,
-- the product's own button could not, and no account on this database has ever
-- had two non-sample workspaces. That is the wall, not a preference.
--
-- `workspaces.functions.ts` asserted the opposite in a comment -- "RLS already
-- permits an owner insert. Same shape as onboarding's." Both halves were false,
-- and the comment is corrected in the same commit as this migration.
--
-- ── WHY A POLICY AND NOT ANOTHER DEFINER FUNCTION ────────────────────────
-- The definer path exists for signup, where there is no session to check
-- against: the account is being created and `auth.uid()` is the thing being
-- established. Here there IS a session, and a policy that reads it is both
-- smaller and safer than a function that runs as the table owner. A definer
-- function is a permanent hole with a comment on it; a WITH CHECK is a rule the
-- database enforces on every caller forever.
--
-- ── WHAT IT PERMITS, EXACTLY ─────────────────────────────────────────────
-- Insert a workspace you yourself own, and nothing else. It cannot be used to
-- create a workspace owned by somebody else, to move an existing one, or to read
-- one: SELECT is still `is_workspace_member(id)` and UPDATE/DELETE are still
-- `has_workspace_role(id, ...)`, both unchanged.
--
-- The membership row that makes the new workspace READABLE is written by
-- `createWorkspace` in the same handler. It is not done here because a trigger
-- that inserts membership would also fire for the definer path, which already
-- writes its own, and two writers for one row is how the second one comes to be
-- wrong.
create policy "ws owner creates own"
  on public.workspaces
  for insert
  to authenticated
  with check (owner_id = auth.uid());
