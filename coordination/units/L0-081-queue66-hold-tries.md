# UNIT L0-081 — queue 66: a hold says which try this was

**Lane:** LANE 0 · **Queue:** #66 (component half; server half `8dc50c963`)
· **Date:** 2026-08-25

## What shipped

Round 7's live track sat at `build` on `attempts: 2` and the screen could not
say so. The "Why it stopped" region's sub line now carries one more sentence,
built by `triesLine(attempts, stationName)`:

- 1 → *"One try at Build has not cleared it."*
- 2 → *"Two tries at Design have not cleared it."*
- ≥ MAX_STATION_ATTEMPTS → *"All three tries at Build are spent."*
- 0 / null → nothing. Rows older than the counter claim no history.

The ceiling is imported from `driver.ts` (`MAX_STATION_ATTEMPTS`), never
copied, so a driver change drags the copy with it. A moving track renders no
hold region at all, which is the "shows nothing" half of the acceptance.

Copy passes the say-it-in-a-meeting test by stating the count and stopping —
no countdown drama, no "final warning" phrasing.

## Files

- new `src/components/track/hold-tries.ts` (+ test, 4 cases).
- `src/components/track/TrackRun.tsx`: hold Row sub joins the last-moved
  sentence with the tries line; eslint --fix formatting only.

## Gates

`tsc` 0 · hold-tries + run-summary suites green · eslint clean on all three
files. Full-suite note: three UNRELATED tests flaked under parallel load this
run (client-storage ×2, tempo-font-guard) and pass in isolation — recorded so
nobody reads them as a regression from this unit.
