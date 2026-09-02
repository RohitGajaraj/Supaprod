-- A TRACK WAITING ON A FORECAST HORIZON HELD THE FRONT OF THE SWEEP FOREVER.
--
-- F-183 correctly stopped the sweep from spending a drive on a track that cannot
-- progress: `scheduledAwayIds` removes a `needs-evidence` track whose forecast
-- horizon is still in the future. What it did not do is give up the track's
-- PLACE. Nothing stamps it, so it sorts first by `driven_at ASC` on the next
-- tick, and the one after that, forever -- consuming one of the fifteen fetched
-- rows every time to be filtered out again.
--
-- That is the same failure shape the comment above that ordering already warns
-- about ("Position in the queue was set by whatever order the tracks first
-- entered the batch and nothing could ever change it"), arriving through the fix
-- for a different one. Two such tracks sat ahead of the live acceptance
-- candidate on 2026-09-03.
--
-- WHY A COLUMN RATHER THAN STAMPING `driven_at`, which is the cheaper fix.
-- `driven_at` is not only the sweep's ordering key: the Start list reads it to
-- say when a run last moved. Stamping it every ten minutes for a track that is
-- deliberately asleep until October would make that run look busy on the one
-- screen a person actually reads, to fix an ordering problem they cannot see.
-- A wrong sentence on the product's front door is a worse trade than a column.
--
-- `deferred_until` says exactly what it means and can be read by anything: the
-- sweep skips it in SQL rather than fetching and discarding it, the Start list
-- can eventually say "asleep until 15 Oct" instead of inferring it, and a NULL
-- is the ordinary state rather than a special case.
--
-- Nullable, no default, and CLEARED whenever the track is driven, so a stale
-- value can never outlive the reason for it.
alter table public.spine_tracks
  add column if not exists deferred_until timestamptz;

-- Partial: the overwhelming majority of rows are NULL and the sweep asks only
-- about the ones that are not.
create index if not exists spine_tracks_deferred_until_idx
  on public.spine_tracks (deferred_until)
  where deferred_until is not null;

comment on column public.spine_tracks.deferred_until is
  'When this track becomes drivable again, for work waiting on a date rather than on a person. NULL means drivable now. Set by the sweep when it schedules a track away; cleared on every drive.';
