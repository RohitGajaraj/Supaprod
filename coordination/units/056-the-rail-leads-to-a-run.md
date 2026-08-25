# Unit 056 · the rail leads to a run (backlog item 10)

LANE 1 · 2026-08-25 · commit `69455594f` (pushed as `0df1ad742`).

## What changed

`src/components/shell/AppFrame.tsx` only:

1. **New read:** `listTracks()` polled at the idle cadence (`livePoll(false)`,
   20s), key `["shell","open-tracks"]`. `movingRuns` = open tracks whose
   `drivenAt` is inside five minutes, newest first. Five minutes because the
   foreground walk updates per seat and the cron's round-robin leaves gaps
   shorter than that; older than that is a stopped run and stays silent rather
   than wearing a live dot it did not earn.
2. **The live line can now say it:** when no mission works and nothing waits on
   you, a moving run reads "The crew is moving · Build" (station named in
   passing, transcript register per R-13; label from `STAGE_LABEL`, one map).
   Multiple moving runs count what is countable: "N runs are moving".
3. **The door opens the exact run:** live line click → `/track/$trackId` of the
   track whose own row said it moved. No heuristic mission-to-track mapping.
4. **Nothing else moved:** gates first, working missions second — every existing
   state renders exactly as before. "Nothing running" now means neither world
   moved, which is strictly truer than yesterday.

**Why this matters:** EVIDENCE.md §2 measured nine tracks sitting
`waiting-on-a-person` with zero attempts and nothing surfacing it. A walk through
Discover/Decide/Plan never becomes a mission (`driver.server.ts:674`), so the
header was structurally blind to it until Build. This closes the seeing half;
the saying-it-where-you-are half is the inline consent card (item 1, LANE 0).

## What I did NOT do, and why

- **No mission→track door yet.** `agent_runs.track_id` exists
  (`loop.server.ts:610`) but `listMissions` drops the column
  (`missions.functions.ts:380`, runs select `:289`). Requested as `021`; when it
  lands, a working mission carrying a `track_id` should open `/track/:id`
  directly. Until then any mapping would be a guess, and a guessing door is the
  defect this repo keeps deleting.
- Item 4 (TrackStart navigates after create) routed to LANE 0 with the exact
  one-line change — request `020`. Its edit lives in `src/components/spine/`,
  not my path.
- `/start`'s open-runs section already gives the same one-click door on the one
  surface where runs begin.

## Gates (this tree)

- `bunx tsc --noEmit` → exit 0
- `bun test` → **10,696 pass / 0 fail** across 632 files
- `bunx eslint src/components/shell/AppFrame.tsx` → clean (two pre-existing
  fast-refresh warnings on RAIL_DOORS exports, present before this change)
- Dev server: **not started** (R-21); browser proof delegated below.

## Not verified

- Nothing rendered in a browser by me. The moving-run state needs a track
  driven within five minutes to appear at all — that is a production or
  drive-along check, which is MAIN's/LANE 0's to make (I have no DB).
- Clock skew: freshness compares client `Date.now()` against server ISO stamps.
  A skewed laptop clock could shorten or stretch the five-minute window; the
  failure mode is a quiet line, never a false "moving".
