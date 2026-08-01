-- THE FRONT DOOR OF THE LOOP, which was shut.
--
-- FOUNDER RULING 2026-08-01: "nothing turns a cluster into work. That is a very
-- bad sign. Please make sure that is most important."
--
-- Measured live: 308 signals across 26 sources, 307 clustered into 181 themes,
-- and ONE track. `startTrack` had exactly one caller, a button in the UI. The
-- driver exists because "a station transition was a navigate() call, which means
-- it required a person to click, which means the loop stopped the moment nobody
-- was watching" -- and the ENTRANCE to the loop still had exactly that shape.
--
-- theme_id is the link that makes promotion safe to run repeatedly. Without it
-- the sweep cannot tell a theme it already promoted from one it has not, so
-- every ten minutes it would open another track for the same cluster of
-- evidence, forever, each one spending against its own ceiling.
--
-- The partial UNIQUE index is the real guard. Checking in application code
-- before inserting is a read-then-write race, and two overlapping ticks would
-- both read "not promoted" and both insert. The database refuses the second one.

alter table public.spine_tracks
  add column if not exists theme_id uuid references public.themes(id) on delete set null;

create unique index if not exists uq_spine_tracks_theme
  on public.spine_tracks(theme_id) where theme_id is not null;

comment on column public.spine_tracks.theme_id is
  'The cluster of evidence this work came from, when the platform started it rather than a person. '
  'UNIQUE where present: one cluster becomes work at most once, enforced by the database because '
  'checking in code is a read-then-write race two overlapping ticks would both win.';
