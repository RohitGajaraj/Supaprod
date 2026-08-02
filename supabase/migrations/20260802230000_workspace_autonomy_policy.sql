-- Autonomy policy: the two bars that decide what happens without a human.
--
-- The governance canon's fourth floor (CLAUDE.md) says a default the user never
-- set is OUR choice, not their policy, so it must be visible and changeable.
-- Two live thresholds violated it, and both govern autonomy rather than taste:
--
--   THE PROMOTION BAR (frequency 8, severity 4, confidence 0.75) decides when a
--   cluster becomes work with no human involved.
--   THE SETTLE-OR-ASK BAR (floor 0.45, span 0.40) decides when an AGENT settles
--   a shipped bet's verdict instead of asking a person. Sharper, because it
--   governs autonomy over judgment rather than over queueing.
--
-- Every column is NULLABLE and there is DELIBERATELY NO BACKFILL. Null means
-- "this workspace never set it, so ours applies", and the surface says exactly
-- that. Writing our numbers into every row would turn "we chose this" into "you
-- chose this" and destroy the distinction the canon asks us to show.
--
-- The bounds are ranges the value must be inside to mean anything, not opinions
-- about where it should sit. Confidence outside 0..1 is not a strict policy, it
-- is a broken one.
--
-- Shipped WITH its UI on /boundary, never as an unwired column: a column read
-- and never written, or written and never read, is the exact shape that produced
-- five dead features found earlier today.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS promotion_min_frequency integer,
  ADD COLUMN IF NOT EXISTS promotion_min_severity integer,
  ADD COLUMN IF NOT EXISTS promotion_min_confidence numeric(3, 2),
  ADD COLUMN IF NOT EXISTS settle_evidence_floor numeric(3, 2),
  ADD COLUMN IF NOT EXISTS settle_stakes_span numeric(3, 2),
  ADD COLUMN IF NOT EXISTS never_settle_above_impact integer;

-- The ranges the write path already validates against, restated where the data lives, so
-- a value that never went through the server function still cannot mean nothing. They
-- match AUTONOMY_BOUNDS in src/lib/autonomy-policy.ts exactly.
ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_promotion_min_frequency_range
    CHECK (promotion_min_frequency IS NULL OR promotion_min_frequency BETWEEN 1 AND 100),
  ADD CONSTRAINT workspaces_promotion_min_severity_range
    CHECK (promotion_min_severity IS NULL OR promotion_min_severity BETWEEN 1 AND 5),
  ADD CONSTRAINT workspaces_promotion_min_confidence_range
    CHECK (promotion_min_confidence IS NULL OR promotion_min_confidence BETWEEN 0 AND 1),
  ADD CONSTRAINT workspaces_settle_evidence_floor_range
    CHECK (settle_evidence_floor IS NULL OR settle_evidence_floor BETWEEN 0 AND 1),
  ADD CONSTRAINT workspaces_settle_stakes_span_range
    CHECK (settle_stakes_span IS NULL OR settle_stakes_span BETWEEN 0 AND 1),
  ADD CONSTRAINT workspaces_never_settle_above_impact_range
    CHECK (never_settle_above_impact IS NULL OR never_settle_above_impact BETWEEN 1 AND 10);

COMMENT ON COLUMN public.workspaces.promotion_min_frequency IS
  'How many independent signals must say it before a cluster becomes work on its own. NULL means the workspace has not stated one and the shipped bar of 8 applies (src/lib/spine/promote.ts DEFAULT_PROMOTION_BAR). Set on /boundary.';
COMMENT ON COLUMN public.workspaces.promotion_min_severity IS
  'How much a cluster must hurt the people who reported it, 1 to 5, before it becomes work on its own. NULL means the shipped bar of 4 applies. Set on /boundary.';
COMMENT ON COLUMN public.workspaces.promotion_min_confidence IS
  'How sure the clustering must be that the signals belong together, 0 to 1, before work starts. NULL means the shipped bar of 0.75 applies. Set on /boundary.';
COMMENT ON COLUMN public.workspaces.settle_evidence_floor IS
  'The share of the evidence an agent needs before it settles an outcome verdict on which nothing rides, 0 to 1. NULL means the shipped floor of 0.45 applies (src/lib/ai/outcome-review.ts SETTLE_FLOOR). Three hard gates sit above this and no value here can lower them. Set on /boundary.';
COMMENT ON COLUMN public.workspaces.settle_stakes_span IS
  'How much higher that evidence bar climbs at maximum stakes, 0 to 1. NULL means the shipped span of 0.40 applies (SETTLE_STAKES_SPAN), so a verdict with everything riding on it needs 0.85. Set on /boundary.';
COMMENT ON COLUMN public.workspaces.never_settle_above_impact IS
  'The stated carve-out: an agent never settles a verdict on a bet scored ABOVE this impact, whatever the evidence says. NULL means no carve-out, which is a real answer and not a missing one. It can only ever escalate, never hand an agent a call the rule refused. Set on /boundary.';
