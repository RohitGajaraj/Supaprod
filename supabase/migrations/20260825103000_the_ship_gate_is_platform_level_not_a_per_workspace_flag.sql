-- R-27, REVISED on the founder's instruction the same day it shipped, and he was
-- right for a reason already written in this repo's own rulings.
--
-- The first version gated release.publish and studio.revert behind
-- `workspaces.autonomous_ship_enabled`, NOT NULL DEFAULT false. Measured two
-- hours after it landed: false in 21 of 21 workspaces, one enablement — a
-- hand-written UPDATE by MAIN — and **no surface in the product could ever set
-- it**.
--
-- FOUNDER, 2026-08-25: "Whatever features we are building should be live at a
-- platform level, no matter whether a new user onboards tomorrow or a new
-- workspace gets created. All those things should have the same set of features
-- carried forward there as well."
--
-- He is describing R-22's own defect, which this repo wrote down three days ago
-- about a different column: `default_track_spend_cap_usd` was null in all 21
-- workspaces and read as a deliberate choice — "a decision nobody had made and
-- no surface in the product can make". And R-23's: "a function that lands
-- without a door is not finished." A capability that ships off everywhere and is
-- reachable only by SQL is not a feature. It is the eighth instance this week of
-- a mechanism built and a trigger never wired, and this time I built it.
--
-- WHAT REPLACES IT IS NOT "ON FOR EVERYONE". The gate is the PROOF and the pace
-- is the ARC. release.publish and studio.revert now resolve like every other
-- tool: `resolveApprovalMode` starts a new workspace's agents at `confirm` and
-- they earn `auto` through the trust ramp. A workspace created tomorrow carries
-- the feature forward AND starts gated, which is how it can be live everywhere
-- without being loose anywhere.
--
-- The four preconditions are unchanged and are now unconditional: the changeset
-- is merged, CI was green at that head sha, a successful preview deploy exists
-- at that exact commit, and the work carries a forecast. A change nobody can
-- grade still cannot ship itself, in every workspace rather than in one.
--
-- Dropping rather than leaving the columns in place, because a column nothing
-- reads is the same defect this migration exists to correct. Reversal is
-- 20260825090000, which is kept in the repo.

alter table public.workspaces drop constraint if exists workspaces_autonomous_ship_enabled_by_fkey;
alter table public.workspaces drop column if exists autonomous_ship_enabled_by;
alter table public.workspaces drop column if exists autonomous_ship_enabled_at;
alter table public.workspaces drop column if exists autonomous_ship_enabled;
