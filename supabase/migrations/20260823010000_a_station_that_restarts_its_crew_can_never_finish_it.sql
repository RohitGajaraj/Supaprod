-- The spine drives up to five tracks per tick under ONE shared 45s deadline
-- (TICK_DEADLINE_MS, track-caps.server.ts). A station is a crew of up to three
-- agent dispatches, and the crew loop iterates `for (const seat of crew)` from
-- the first seat every time it runs.
--
-- So a station whose crew costs more than the window left to it can never finish.
-- The tick pays for seat one, the clock check between seats fires, the track is
-- stamped `out-of-time`, and the next tick starts that same crew again at seat
-- one. The work is redone, the money is spent again, and the track does not move.
--
-- Measured on 2026-08-22, on the only real workspace with tracks:
--
--   spine.track-tick durations, ten most recent, against a 45s deadline:
--     87s, 107s, 53s, 63s, 54s, 7s, 8s, 46s, 8s, 8s
--   All four tracks: last_hold 'out-of-time', attempts 0, driven_at within one
--   second of each other, spend_used_usd 0.093 / 0.054 / 0.022 / 0.
--
-- attempts stays 0 because running out of OUR time is correctly not counted as
-- the track's attempt. The consequence is that MAX_STATION_ATTEMPTS never trips
-- either, so nothing ever declares the track stuck. It spends and holds forever
-- while job_runs reports status 'ok' on every tick.
--
-- seat_cursor is where the crew got to. The next tick resumes there instead of
-- restarting. The brief survives the gap already: `upstream` is reloaded from
-- the database on every tick by loadUpstream, and each seat's output is filed by
-- attachProducts before the clock is checked, so a resumed seat is briefed on
-- what the earlier seats actually filed rather than on memory that died with the
-- Worker.
--
-- Written ONLY on the out-of-time break and cleared on every other exit. A crew
-- stopped by a human gate, a budget ceiling, a failure or a completed station is
-- not a crew half way through its seats, and treating those as resumable would
-- silently skip work rather than repeat it, which is the worse of the two.

ALTER TABLE public.spine_tracks
  ADD COLUMN IF NOT EXISTS seat_cursor smallint NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.spine_tracks.seat_cursor IS
  'Index of the next crew seat to run at the current station. Non-zero only while a station was interrupted by the tick deadline; cleared on every other exit. See driver.server.ts driveTrackOnce.';
