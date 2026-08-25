-- A station that always runs out of time never escalates, and runs forever.
--
-- `attempts` bounds a station that FILES NOTHING. It is deliberately not
-- incremented by `out-of-time`, and that is correct: F-14 established that a
-- crew cut short by the tick deadline has not failed, and charging it an
-- attempt punished a station for a clock it does not control.
--
-- The gap is that NOTHING ELSE COUNTS EITHER. A station that runs out of time
-- on every pass holds `out-of-time` forever, keeps `attempts` at 0 forever, and
-- is therefore dispatched forever.
--
-- MEASURED 2026-08-25 06:1x, open tracks with 10 or more runs:
--
--   SELECT t.id, t.station, t.last_hold, t.attempts, t.spend_used_usd,
--          (SELECT count(*) FROM agent_runs r WHERE r.track_id = t.id) AS runs
--     FROM spine_tracks t WHERE t.status = 'open' ORDER BY runs DESC;
--
--   ef50b26a | design | out-of-time | 0 | $0.62 | 316 runs   <- since 2026-08-01
--   96f58feb | sense  | out-of-time | 0 | $0.30 | 174 runs
--   425e6887 | sense  | out-of-time | 0 | $0.73 |  90 runs
--   8fa79aad | design | out-of-time | 2 | $0.35 |  77 runs
--   94bdccce | sense  | out-of-time | 0 | $0.48 |  63 runs
--   44f207cb | sense  | NULL        | 0 | $0.23 |  56 runs
--
-- **776 runs across six tracks, roughly $2.70, and not one of them advanced a
-- station.** The oldest has been dispatched 316 times over 24 days while
-- reporting `attempts: 0`, which is the honest value for the question `attempts`
-- asks and a useless one for the question nobody was asking.
--
-- `station_drives` counts EVERY dispatch at the current station, whatever the
-- outcome, and resets when the work actually moves. It is the counter that
-- answers "is this converging?" rather than "did this station produce?".
alter table public.spine_tracks
  add column if not exists station_drives integer not null default 0;

comment on column public.spine_tracks.station_drives is
  'Dispatches at the CURRENT station, any outcome, reset on arrival at a new one. Distinct from `attempts`, which counts only stations that filed nothing and is deliberately not incremented by `out-of-time`. This is the counter that catches a station which never converges: 316 dispatches with attempts=0 is the state it exists to stop.';
