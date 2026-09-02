-- A STOP THE DRIVER CAN SEE, RATHER THAN A NUMBER IN ONE BROWSER TAB (P-01).
--
-- WHAT "STOP" MEANT BEFORE THIS COLUMN. `TrackRun`'s Stop set a React state to zero:
-- `stopRef.current = () => setLegsLeft(0)`. That cancels the automatic legs THIS TAB
-- would have bought next and nothing else. The leg already dispatched finishes, which is
-- honest and is why the control has always said "Stop after this leg" -- but the sweep
-- picks the same track up on its next tick and drives it again, because nothing on the
-- record ever said the person asked it to stop. Closing the tab has exactly the same
-- effect as pressing Stop, and pressing Stop has exactly the same effect as closing the
-- tab: none, ten minutes later.
--
-- SO THE STOP BECOMES A ROW. `driveTrackOnce` is the one door every drive goes through --
-- the foreground press and the cron sweep both -- so a column it reads before dispatching
-- is the only form of stop that binds both callers.
--
-- NULLABLE, WITH NO DEFAULT, AND THAT IS THE WHOLE DESIGN. The column has three readings
-- and each is a different byte: NULL is "nobody asked", a timestamp is "a person asked, at
-- this moment", and the clearing back to NULL is "the same person started it again". A
-- boolean would have collapsed the middle one and lost WHEN, which is the half an audit
-- trail needs; a `NOT NULL DEFAULT false` would have made "nobody asked" and "asked and
-- withdrawn" the same byte, which is the default-as-data trap SESSION-0-CONDUCTOR named
-- on 2026-08-31.
--
-- NO INDEX. Every read is by primary key -- the driver already holds the track's id when
-- it asks -- and the sweep selects its five candidates on other columns entirely. An index
-- here would be paid for on every write of a hot table and read by nothing.
--
-- WHO MAY WRITE IT is settled by the RLS already on `spine_tracks`: the column inherits
-- the table's policies, so a person can only stop work their own workspace owns. There is
-- deliberately no new policy, because a new policy on one column is how a table ends up
-- with two answers to who owns a row.

ALTER TABLE public.spine_tracks
  ADD COLUMN IF NOT EXISTS stop_requested_at timestamptz;

COMMENT ON COLUMN public.spine_tracks.stop_requested_at IS
  'When a person asked this run to stop. NULL means nobody has. driveTrackOnce refuses to dispatch a new seat while it is set and holds the track with "Stopped by you."; the next "Run it now" press clears it.';
