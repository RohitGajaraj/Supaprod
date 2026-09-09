-- When the stuck-backoff last priced this track's drive history.
--
-- ── THE DEADLOCK THIS BREAKS, MEASURED 2026-09-09 ───────────────────────────
--
-- `stuckBackoffMinutes` reads a track's three most recent drives and, if all
-- three held with nothing produced, defers the track. The deferral is what
-- stops the track being driven. `track_drives` therefore never gains a row, the
-- same three drives are read at the next candidacy, and the same deferral is
-- written again. The ladder's top rung is 90 minutes and it repeats, so the
-- state is permanent.
--
-- On production: `a30d6b62` was deferred at 22:00 today on the strength of
-- three drives from **2026-09-06**, and it was the only selectable track in the
-- product. Two drives in the previous 24 hours across every workspace; the
-- newest row in `track_drives` anywhere was 2026-09-09 04:16. The engine was
-- held shut by a rule that is individually correct, while every tick reported
-- `ok`.
--
-- ── ONE HISTORY EARNS ONE DEFERRAL ──────────────────────────────────────────
--
-- The same rule as `wallet_released_at`, for the same reason: a stamp turns
-- "this evidence justifies a penalty" into "this evidence has already been paid
-- for once". The evidence is not wrong; charging it forever is. A track coming
-- back from a backoff gets ONE drive before it can be backed off again. That
-- drive either moves it, which resets the history honestly, or files another
-- held drive, which legitimately earns the next rung.
--
-- Null means never backed off, which is every track today.
alter table public.spine_tracks
  add column if not exists backed_off_at timestamptz;

comment on column public.spine_tracks.backed_off_at is
  'When the stuck-backoff last priced this track''s drive history. The backoff refuses to re-price a history no newer than this stamp, so one run of held drives earns one deferral rather than a permanent one.';
