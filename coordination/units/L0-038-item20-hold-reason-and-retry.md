# UNIT L0-038 — item 20: the run says why it stopped, and offers retry

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #20 (P0) · **Date:** 2026-08-25

## What changed

Two files, both L0 paths.

**`src/components/track/TrackRun.tsx`**
- New query on `getTrack` (`["spine-track", trackId]`, 10s poll — same beat and
  rationale as `TrackActivity`). `getTrack` had **zero callers**; this is its
  first door.
- New `Why it stopped` region, rendered only when the track is open and
  `holdTone(track.holdReason)` is non-null: the driver's own sentence
  (`Track.hold`, already station-named by `holdLine`), last-moved time,
  and a `StatusChip` ("Waiting on you" / "On hold") toned off the RAW reason,
  never off prose.
- Retry control via `retryStation` (second-ever caller): offered on every hold
  EXCEPT `waiting-on-a-person`, where releasing buys nothing because the pending
  call stays queued and the driver re-holds at the gate — there the row says the
  call is the unblock instead of carrying a dead button.
- Release receipt renders OUTSIDE the conditional region so it survives the
  refetch that clears the hold.
- The drive mutation now also invalidates `["spine-track"]`, so the banner
  updates the moment a walk ends rather than up to ten seconds later.

**`src/components/spine/TrackStart.tsx`**
- The MoreMenu was hidden whenever `holdTone === "you"` — four holds — which hid
  the release control on three of the four holds it exists for
  (`station-cannot-finish`, `corrections-spent`, `given-up`; no code path clears
  them). The gate is now exactly `t.holdReason === "waiting-on-a-person"`, the
  one hold whose argument (pending call scoped to the person) the original
  comment describes. Both controls return on the other three.
- No behaviour change for non-person holds; no change for `waiting-on-a-person`.

## Which Meridian component was checked first (R-20 §Meridian)

No new component. Composed: `Region`, `Row`, `Action` (existing in file),
`StatusChip` — checked first because TrackStart renders the identical fact
(hold tone chip) with it; `Receipt` — checked first because TrackStart reports
release results with it. Nothing needed from Meridian; no `mrd-` request filed.

## Gates (run on the tree this commit lands on)

- `bunx tsc --noEmit` — 0 errors
- `bun test` — **10,646 pass / 0 fail**, 22 skip, 36 todo (the former 12-14
  pre-existing failures are gone on current main; nothing claimed)
- `bun run lint` — repo-wide prettier backlog still fails (3,085 problems);
  **both files in this unit lint clean** individually. Backlog is deferred per
  AGENTS.md; not touched.
- Dev server: never started (R-21). See verification note below.

## What I could NOT verify

- No database, no deploy, no login. I cannot open `/track/:trackId` for a real
  held track, so **no screenshot and no rendered-text assertion**. Filed
  `coordination/requests/verify-item20-hold-reason.md` for cross-verification.
  57 of 59 production tracks carry a hold, so any track id from
  `SELECT id, last_hold FROM spine_tracks WHERE status='open' AND last_hold IS NOT NULL LIMIT 5`
  exercises it.
- `retryStation`'s write path is server-owned and already covered by
  `src/lib/spine/retry-station.test.ts`; this unit adds its first foreground UI,
  not new server behaviour.
