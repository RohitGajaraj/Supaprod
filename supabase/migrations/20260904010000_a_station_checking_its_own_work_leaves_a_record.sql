-- A STATION'S OWN CHECK RAN ON EVERY DRIVE AND LEFT NOTHING BEHIND WHEN IT PASSED.
--
-- `verifyStationOutput` runs at the end of every drive of every station. Its
-- result reached the database through exactly one path: `spine_tracks.last_hold`
-- and `last_hold_because`, which are written ONLY when it FAILS, and which are
-- overwritten by the next drive.
--
-- So the check that happens almost every time was invisible almost every time.
-- The product's claim is that a person can watch the loop work; a station
-- checking its own work and saying nothing about it is the opposite of that, and
-- there was no number anywhere that could answer "how many times did this run
-- check itself".
--
-- `track_drives` is the right home and already exists: append-only, one row per
-- drive, already carrying the track, the station, the time and who drove it. The
-- self-check is a fact about a drive, so it belongs on the drive.
--
-- WHY JSONB AND NOT TWO INTEGER COLUMNS. A count with no list behind it is a
-- number nobody can check, which is the exact failure this column is being added
-- to fix. The list holds what each comparison LOOKED FOR, so a reader can decide
-- whether the check was worth anything, and a count derived from it can never
-- drift from what it counts.
--
-- Nullable with no default. NULL means this drive predates the column or its
-- write failed; `[]` means the station compared nothing, which is true of Ship
-- by design. Those are different facts and a default of `[]` would erase the
-- difference on every historical row.
alter table public.track_drives
  add column if not exists self_check jsonb;

comment on column public.track_drives.self_check is
  'What this station''s own check compared on this drive, as [{what, held, why?}]. NULL means the drive predates the column; [] means it compared nothing.';
