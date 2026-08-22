-- 20260822120000_the_promotion_bar_is_unreachable_for_a_new_workspace.sql
--
-- Claude lane, 2026-08-22.
--
-- THE AUTONOMOUS LOOP HAS NEVER RUN ON REAL DATA, AND THE BAR IS WHY.
--
-- Measured against production, 2026-08-22. Autonomous promotion needs a theme at
-- frequency >= 8 (`DEFAULT_PROMOTION_BAR`, src/lib/spine/promote.ts). Across all
-- nine real workspaces there are 27 themes, average frequency 1.26, MAXIMUM 3.
-- Zero can ever qualify. Sample workspaces reach 19 and clear it 17 times. So
-- `spine_tracks` has never held a row for a real workspace, `agent_runs` has been
-- empty for 24 hours, and the last agent run in the product's history is
-- 2026-08-21 12:10 -- ten minutes before the AI-spend leak was closed by
-- excluding sample workspaces, which left the spine with nothing at all to drive.
--
-- The bar is not wrong. Its own argument is that fewer than eight independent
-- signals is a hunch rather than something worth spending money on unwatched, and
-- for a workspace holding four hundred signals that is exactly right. The defect
-- is that frequency is the only one of the three numbers that is RELATIVE to the
-- corpus it came from. Three of four hundred is noise; three of five is the
-- dominant thing that workspace knows.
--
-- `coldStartBarFor` (src/lib/autonomy-policy.ts) scales the frequency bar with
-- how much the workspace has actually said, clamped so it can only ever lower the
-- bar and never below three. Severity and confidence do not scale: they measure
-- the QUALITY of a cluster rather than its weight, and 17 of those 27 real themes
-- already clear both, so frequency alone is what stops them.
--
-- THIS COLUMN IS THE GATE, AND IT IS OFF. Turning it on is a decision to start
-- spending with nobody watching, which the canon's fourth floor makes a person's
-- call rather than ours. Existing behaviour is unchanged for every workspace
-- until somebody sets it deliberately.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS cold_start_promotion_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.workspaces.cold_start_promotion_enabled IS
  'When true, the autonomous promotion FREQUENCY bar scales with the workspace''s own signal corpus below 40 signals, floored at 3 and never above the configured bar. Severity and confidence are unaffected. Default false: enabling it starts autonomous spend.';
