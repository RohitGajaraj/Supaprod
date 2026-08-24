-- A ceiling nobody set is not a ceiling somebody removed.
--
-- `resolveTrackSpendCap` (src/lib/spine/track-caps.server.ts) reads
-- `workspaces.default_track_spend_cap_usd` and returns `null` -- meaning NO
-- CEILING -- when the column is null, on the reasoning that "a workspace that
-- deliberately cleared its ceiling gets none. That is a human decision on the
-- record, not an accident, so it is obeyed."
--
-- Nobody has ever made that decision. The column was added without a default
-- and never backfilled, so every row has been null since the day it existed.
--
--   SELECT count(*), count(default_track_spend_cap_usd) FROM workspaces;
--   -- 21, 0                                        measured 2026-08-24
--   SELECT column_default FROM information_schema.columns
--    WHERE table_name='workspaces'
--      AND column_name='default_track_spend_cap_usd';   -- null
--
-- So the track spend ceiling has been OFF in all 21 workspaces, and the product
-- read "nobody ever chose" as "somebody chose none". That is the unattended
-- half of the product running with the one guard that makes it sayable switched
-- off, which is exactly the version GOVERNANCE-PRINCIPLE.md says a risk officer
-- refuses.
--
-- It also contradicts the file's own stated fail direction, three paragraphs
-- above the line that does it: "An unreadable workspace gets the conservative
-- built-in number, never `null`: `null` means 'no ceiling', so failing to
-- `null` would let a database hiccup silently remove the limit." An unset
-- column is the same hazard as an unreadable one.
--
-- 5.00 is `DEFAULT_TRACK_SPEND_CAP_USD`, sized from measurement rather than
-- feel: a full seven-station pass is about sixteen runs at roughly three cents,
-- so about fifty cents, and nearer a dollar fifty with every station retried to
-- the attempt ceiling. Five dollars is several times the worst honest case,
-- which is the right shape for a runaway guard.
--
-- THE DEFAULT IS THE HALF THAT LASTS. The backfill fixes the 21 rows that
-- exist; the default is what stops the twenty-second workspace from being
-- created uncapped tomorrow. Both, or this comes back.
--
-- The column stays NULLABLE on purpose. `resolveTrackSpendCap` still honours an
-- explicit per-track null as "no ceiling on this one", which is a deliberate
-- human act on a single piece of work. What changes is that a WORKSPACE-level
-- null can no longer arise by omission.

alter table public.workspaces
  alter column default_track_spend_cap_usd set default 5.00;

update public.workspaces
   set default_track_spend_cap_usd = 5.00
 where default_track_spend_cap_usd is null;
