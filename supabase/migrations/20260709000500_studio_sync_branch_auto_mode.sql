-- Follow-up to 20260709000000_seed_studio_sync_branch_tool.sql, which already
-- shipped to production with mode='confirm'. On reflection studio.sync_branch
-- carries the same low blast-radius as studio.commit / studio.pr.open (both
-- already 'auto' per 20260708150000_founder_autonomy_defaults.sql): it only
-- ever merges the repo's default branch INTO an isolated studio/* feature
-- branch, never touches the default/main branch itself, and is trivially
-- reversible. Flip the existing live rows to match.
--
-- Plain UPDATE, safe to apply directly against production. Idempotent: an
-- already-'auto' row is set to 'auto' again, so re-running has no side effects.

UPDATE public.agent_tools SET mode = 'auto' WHERE tool_name = 'studio.sync_branch';
