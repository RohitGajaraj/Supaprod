-- SEAM-2: fully autonomous stale-branch syncing budget for ci-poll-tick.
--
-- ci-poll-tick's red-CI path now first checks whether a PR's failing check
-- is explained by the base branch having moved on since the PR was opened
-- (another PR merged first) rather than a real code problem in this PR, and
-- if so autonomously syncs the PR branch with the base branch (GitHub's
-- Merge-a-branch endpoint), matching how Dependabot / GitHub auto-merge keep
-- PR branches current. No agent dispatch, no human approval.
--
-- branch_sync_attempts is that path's own small retry budget (separate from
-- fix_attempts, which bounds the genuine-code-failure autofix path below it)
-- so a genuinely broken PR that conflicts every time is never resynced
-- forever.
ALTER TABLE public.studio_changesets
  ADD COLUMN IF NOT EXISTS branch_sync_attempts integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.studio_changesets.branch_sync_attempts IS
  'Autonomous stale-branch sync attempts (GitHub Merge-a-branch, base -> PR branch) consumed for this changeset. The ci-poll tick stops at BRANCH_SYNC_BUDGET and falls through to the normal red-CI fix path instead of retrying forever.';
