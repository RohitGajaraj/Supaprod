# UNIT L0-025: The spine's missing edges close

**Lane:** LANE 0
**Completed:** 2026-08-24T05:30+05:30
**Commit:** a413cd23f (8 files, -792 lines net)

## What this unit was

Executing the connectivity audit's top findings: the loop's advertised
shape (Discover->Decide->Plan->Build->Ship->Learn) had exactly one missing
edge (Ship->Learn, nonexistent anywhere), one external-only edge
(Build->Ship via PR url), and Brain's why-record capped at 8 rows per
section with no reveal. All three closed.

1. StagePanel Ship stage: "Open what shipped" Door to /ship beside the PR
   link (graph-doors.ts:97 already canonical).
2. WhatShipped: "Learn checks this on <date>." + /learn door in the head
   (date = prds.outcome_check_by); spec-sourced fact rows carry in-app
   "Open the spec" doors (two facts qualified; bet rows left undoor'd -
   no per-bet route exists and fabricating adjacency refused).
3. GraphNodeStory: all three 8-row caps lifted with DocsPanel reveal
   pattern, independent per section, density preserved.
4. EngineRoomSurface dead glance/container + RoomCard + ConnectionStrip
   DELETED (-750 lines): rendered nowhere, largest retired-token
   reservoir (--ds- x9, --text- x21, --madder x3, --hairline x2).
   useEngineGlance/RoomStatus byte-identical; RoomCard's own test file
   went with its subject.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,425 / 184 | **2,211 / 177** | design:ratchet over merged disk |
| Ship->Learn edge | none | door + dated sentence | grep "/learn" src/components/ship |
| tsc / bun test | - | exit 0 / 10,655 pass, 0 fail | full suite |

## Handed forward

- LANE 1: learn.tsx settled rows still need their drill doors (routes);
  OutcomeHistory mount per REQ-L0-007 item 1.
- Follow-up flagged by agent: useEngineRoomGlance's `throughput` return
  field lost its only reader with the deletion (data-minimalism trim
  candidate for a next pass); kiro-queue.md:1916 lists deleted files
  under a focus-ring item (stale doc line).
- Door-guard test extension idea: assert pairwise station edges, not just
  >0 doors per station - would have caught Ship->Learn mechanically.
