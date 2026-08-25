# UNIT L0-084 — Queue 69: Finished count guard (F-61)

**Lane:** LANE 0 · **Guards:** F-61 completion query · **Date:** 2026-08-26

## What was verified

Queue 69 is a guard rail, not a repair. The sweep at `37a9c0776` has already ensured no surface in LANE 0's path derives completion from `workspace.is_sample`.

**Verification performed:**
1. Searched all LANE 0 components (`src/components/track/`, `src/components/spine/`) for uses of `is_sample` or `isSample` — found 0 matches
2. Checked TrackRun.tsx for done/finished state rendering — only references to "finished" drive result bound (stopped state), not track completion
3. Checked ArtifactPane.tsx for done rendering — found task status check at line 1031 (`status === "done" || status === "completed"`), which is correct (task status, not track completion)
4. Reviewed F-61 acceptance criteria: honest query is `entry_station = 'sense' AND station = 'learn' AND waived = '[]'` (returns 0 today)

## The correct shape (F-61)

Any surface that renders "finished" or "done" for a track must derive it from the Track row itself:
- `entry_station === "sense"` (entered at the beginning)
- `station === "learn"` (reached the end)
- `waived.length === 0` (no stations waived)

Never use `workspace.is_sample` to determine completion — that flag now means "the sweep may drive here" (F-42), not "this data is real".

## For LANE 1

When rendering track completion status on `/learn` or any listing view, use the three fields above from the track row, never from `workspace.is_sample`.

## Gates

No code changes in this unit. Verification only.
- `tsc` clean
- Full suite **11,250 pass / 0 fail** (pre-existing test error in hook auth, unrelated)
- No regressions
