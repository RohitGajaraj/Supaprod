-- Queue 64. `'foreground'` said somebody was watching; it could not say whether
-- a HUMAN caused this specific leg. Item 34's auto-continue means one press now
-- buys a whole route, so a route walked by one press plus nine window-closed
-- continuations and a route nudged ten times by hand wrote ten identical
-- `'foreground'` rows each. The half of acceptance criterion 2 that allows a
-- single press but forbids touching a run mid-flight was unprovable on the
-- watched path.
--
-- The split: `'press'` is a person acting (the composer landing, the Run
-- control, a gate being answered); `'continuation'` is the client walking on
-- from a leg that stopped only because its 50s window closed. The sweep stays
-- `'sweep'`.
--
-- `'foreground'` REMAINS VALID AND IS NOT REWRITTEN, for the same reason the
-- F-55 migration refused to backfill NULLs: rows written before the split
-- honestly recorded "watched, origin unrecorded", and rewriting them as either
-- new value would fabricate the distinction this migration exists to record.
-- No caller may write `'foreground'` from here on — the TypeScript union
-- dropped it, and the constraint keeps it only so history stays readable.
--
-- The autonomy query is unchanged: `driven_via = 'sweep'` proves unattended,
-- and both new values remain disqualifying, exactly like the old one. What is
-- newly answerable: "was this watched run touched mid-flight?" is
-- `SELECT count(*) FROM stage_events WHERE ... AND driven_via = 'press'` — a
-- clean run of a watched route shows one press and the rest continuations.

alter table public.stage_events
  drop constraint if exists stage_events_driven_via_check;

alter table public.stage_events
  add constraint stage_events_driven_via_check
  check (driven_via is null or driven_via in ('sweep', 'foreground', 'press', 'continuation'));

comment on column public.stage_events.driven_via is
  'F-55 + queue 64. How this transition was driven: sweep = the unattended cron, press = a person acting on a watched run, continuation = the client walking on from a window-closed leg of that press, foreground = watched but recorded before the press/continuation split (historical only, no writer today). NULL means recorded before the column existed. Autonomy is driven_via = ''sweep''; mid-run human touching is driven_via = ''press'' beyond the first.';

alter table public.spine_tracks
  drop constraint if exists spine_tracks_last_driven_via_check;

alter table public.spine_tracks
  add constraint spine_tracks_last_driven_via_check
  check (last_driven_via is null or last_driven_via in ('sweep', 'foreground', 'press', 'continuation'));

comment on column public.spine_tracks.last_driven_via is
  'F-55 + queue 64. How this track was last driven (sweep / press / continuation; foreground is historical). NULL before the column existed. Per-transition history is stage_events.driven_via.';
