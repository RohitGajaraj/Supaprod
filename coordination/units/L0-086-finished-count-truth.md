# UNIT L0-086 — queue #69: the finished count traced, the guard written

**Lane:** LANE 0 · **Date:** 2026-08-25 · **Verdict:** guard rail delivered; no repair needed

## The trace (every done/finished render in this lane's path)

| Surface | What it claims | Derivation | Honest per F-61? |
| --- | --- | --- | --- |
| `TrackRun.tsx` character line (:250) | "It reached the end of its route." | `track.status === "done"` off the track row | YES — it says ITS ROUTE ended, never that the whole loop ran; a define-entry track with waives did reach its own route's end |
| `TrackRun.tsx` `STOPPED_LINE.finished` (:81) | "It reached the end of its route." | drive result's own verdict from the server fn | YES — same route-scoped wording |
| `RunsGrid.tsx` (:309) "Done" filter chip + tile states | run-level state words | `runState(run.status)` — a RUN finished, not a loop | YES — different question; run completion is real regardless of track shape |
| Today's shipped lane (`ShippedState`) | "done"/"partial" on runs | same run-level source | YES |

No file under `src/components/**` or `src/routes/**` derives TRACK/LOOP
completion from anything, let alone from `workspace.is_sample`. The four
`is_sample` mentions in components are comments and one declared-but-refused
interface field (OpportunityDetailSheet), none of them a derivation. **The
sweep MAIN ran at `37a9c0776` holds as of this unit.**

## The guard

`coordination/is-sample-never-means-done.test.ts` is written and ready to land
verbatim at `src/__tests__/is-sample-never-means-done.test.ts` — that directory
is outside this lane's path, so it goes to MAIN by way of INBOX item 18. It
bans two shapes across components+routes: provenance-flag co-occurring with the
loop-completion fields, and any filter/branch on the flag outside lib. Words in
comments pass; shapes do not.

## Gates

`tsc` 0 · full suite green at time of writing (11,426 pass) · eslint clean on
touched files.
