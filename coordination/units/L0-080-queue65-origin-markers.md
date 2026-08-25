# UNIT L0-080 — queue 65: the transcript says who moved the work along

**Lane:** LANE 0 · **Queue:** #65 (component half; server half `8dc50c963`)
· **Commit:** `7fa621e8f` · **Date:** 2026-08-25

## What shipped

`stage_events.driven_via` reaches the screen. The transcript now interleaves
station-move markers into its one chronological stream:

- **press** → *"you pressed run here"*
- **sweep** → *"the run moved on its own"*
- **continuation** → *"it carried on by itself"*
- **foreground / NULL** → no marker at all. Rows written before the split or
  before the column claim nothing about a person, so nothing is drawn.

Acceptance met: three origins render distinctly; NULL/foreground never claims
a person (they are dropped in `mergeActivityRows`, not drawn vague); station
words resolve through `AGENT_STATIONS`, never a raw slug; `--mrd-*` tokens
only, drawn with the existing RunClock/RunGlyph/RunRail rhythm so the rows do
not read as a second list.

## Files

- new `src/components/spine/activity-rows.ts`: `transitionLine` + `mergeActivityRows`
  (pure; ties keep a turn ahead of a same-instant move).
- `src/components/spine/TrackActivity.tsx`: renders move rows between turns;
  handoff detection now skips move markers to find the previous TURN;
  arrival-animation bookkeeping keyed on row keys instead of run ids.
- `src/components/spine/activity-rows.test.ts`: 6 tests — three distinct
  origins; unknown/NULL dropped; interleaving order; tie-break; display-name map.

## Gates

`tsc` 0 · full suite 11,113 pass / 0 fail at commit · eslint clean.
Both-theme eyes owed on the next live pass against production.
