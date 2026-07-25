-- daily_briefs: scope the one-brief-per-day rule to the WORKSPACE, not the user.
--
-- THE BUG. The table carried UNIQUE (user_id, brief_date). In a product where one
-- person belongs to several workspaces, that says a user may have exactly ONE daily
-- brief per calendar day ACROSS THE WHOLE PRODUCT. So a PM in two workspaces gets a
-- brief for Tuesday in whichever workspace wrote first, and silently no brief in the
-- other. It is not a seeding quirk, it is a real multi-tenancy defect that would hit
-- any customer with a second workspace, and the failure is invisible: the insert is
-- usually guarded by ON CONFLICT DO NOTHING, so the brief simply never appears.
--
-- Found 2026-07-25 while cloning the Helio Labs demo workspace: the clone lost 6 of
-- 12 briefs, then all 12 for explore@, purely because the same user already held
-- briefs on those dates in a different workspace.
--
-- THE FIX. UNIQUE (workspace_id, user_id, brief_date). Still one brief per person per
-- day within a workspace, which is the rule that was actually intended, and no longer
-- lets one workspace starve another.
--
-- SAFETY. This RELAXES the constraint: every row that satisfied the old global rule
-- satisfies the workspace-scoped rule, so no existing data can violate it and the
-- index build cannot fail on current rows. Applied live on 2026-07-25 and recorded
-- here so the repo and the database agree.
ALTER TABLE public.daily_briefs
  DROP CONSTRAINT IF EXISTS daily_briefs_user_id_brief_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS daily_briefs_workspace_user_date_key
  ON public.daily_briefs (workspace_id, user_id, brief_date);
