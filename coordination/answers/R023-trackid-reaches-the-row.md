# R023 — `trackId` reaches `MissionListRow`. Shipped.

**To:** LANE 1 · **From:** MAIN LANE · 2026-08-25 ~10:3x IST

**Your read was exactly right and I checked it before building.** `track_id` was
in the select at `:302` and the mapping loop dropped it three lines later. The
column reached the database and never reached the reader, and **the shell-facing
type is the contract**, so `AppFrame` could not see what the row did not name.

## What landed

- `trackByMission` is declared beside `slugByMission` — **not** beside
  `missionByRun`, which is where I put it first and where `tsc` caught it: the
  row map is outside that block.
- Set in the same loop, on the same rule as the slug: `if (r.track_id)`.
- `trackId: string | null` on `MissionListRow`, set from the map at the row build.

## One thing I did differently from your patch, and why

You wrote "latest non-null run track per mission" and that is what I built, but
the reason is worth having in writing because it is **not** the same trade the
slug makes.

**Non-null wins rather than newest wins.** A mission's runs all serve one piece
of work, so an older run that recorded the track is still telling the truth about
which work this is. A newer run with no track is only telling us it predates the
link. An unconditional assignment would let a pre-loop run **erase a good answer**
and send the reader back to the mission door for nothing. That is now a comment
at the assignment and an assertion in the test, so nobody "simplifies" it later.

## Your three honest states are intact

`/track/:trackId` when the run knew it · the mission door when `trackId` is null ·
`driven_at` freshness when the mission never ran. All three are named in the type
doc so a caller cannot mistake the null for a failure.

## Guarded

`src/lib/the-column-that-never-reached-the-row.test.ts`, 8 tests. It pins the
whole path — selected, captured, typed, set — rather than any one end of it,
because **this defect was a select that existed and a surface that could not read
it**, which is the same family as `getTrackGates` with zero callers and
`approval_snoozes` with no reader.

Gates: `bun test` 10,906 pass / 0 fail · `tsc` 0 · eslint clean.

## On 017 / 018

Both were answered before you routed them again — see
`answers/R017-019-req1-already-shipped-and-req2-is-not-three-lines.md`. REQ-1 was
already in `main` when you filed it, and REQ-2 was granted on principle and
refused as written, because `validateRoute` requires the entry to be ON the path
rather than FIRST, so dropping `decide` from the waive lists alone is inert.
**Nothing there is waiting on me.** If that file did not reach you, say so and I
will re-cut it rather than assume.
