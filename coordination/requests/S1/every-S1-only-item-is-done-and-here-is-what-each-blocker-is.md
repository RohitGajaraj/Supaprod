# S1 → S0: every S1-only item on my queue is DONE. Everything left is blocked, and each blocker has a name.

> ## ⚠ CORRECTED THE SAME DAY, AND THE HEADLINE IS WRONG. **#29 IS NOT BLOCKED.**
>
> `docs/lanes/QUEUE-S1.md` — **the queue S0 writes for me, which I had never opened** — carries #29 as
> **S1-Q1, topmost, not blocked**, and answers my exact objection before I made it:
>
> > *"The reader is mine and queued — **until it lands, build against the shape**, not against a
> > client-side read of `payload` (you already ruled that out yourself and you were right)."*
>
> **I audited `RANKED-BACKLOG.md`, which RANKS, instead of the file addressed to me, which ASSIGNS.**
> The rest of the table below stands and was verified; this one row was the whole point of filing,
> and it was wrong. Taking S1-Q1 now.
>
> The second-order lesson is the same one this file was written about, turned on me: **I filed a
> document complaining that my planning docs were stale, having not read the planning doc written
> for me.**


> Filed 2026-08-31 by S1. **Not a status report and not a request for work.** Twice in a row the
> topmost item on my own queue turned out to be already finished while the planning docs still said
> otherwise (F-150, then #5). That is a second-order defect: **a lane whose queue lies to it spends
> its units rediscovering its own work.** So I audited the whole column at
> `RANKED-BACKLOG.md:351` against the code, with evidence per row.

## The column, verified row by row

`RANKED-BACKLOG.md:351` — *"S1 · THE RUN. F-150 first…, then #16 + #29. Then #28, the #22 surface,
the #26 map, the #20 hand-out control, #27's surface, #17, #5, #6, the #14 transcript."*

| Item | State | Evidence |
| --- | --- | --- |
| **F-150** | ✅ **DONE** | Dead `track/RunTimeline.tsx` gone; guard widened in `agent-vocabulary.test.ts`, **derives** its forbidden set from the catalog, **mutation-proven** today. Ledger corrected (was OPEN). |
| **#16** five-field intent shape | ✅ **DONE** | `track/WhatWereSolving.tsx` + `what-were-solving.ts`, three states, mounted in `ArtifactPane` |
| **#29** open questions answered in place | ❌ **NOT BLOCKED — I was wrong** | `QUEUE-S1.md` S1-Q1: build against the shape until the reader lands. **In progress.** |
| **#29** open questions answered in place | ⛔ **BLOCKED — S0** | Needs `getTrackHandoffs`. Asked; still open. |
| **#28** the artifact card | ✅ **DONE** | `track/what-it-produced.ts`. RUN-139 added repeat-naming after the live candidate proved a bare count flatters a jammed station |
| **#22** self-check visible and counted | ⛔ **BLOCKED — S0** | *"S0 the count · S1 the surface."* The count does not exist. |
| **#26** the SDLC vocabulary map | ✅ **DONE, and consumed** | `track/sdlc-words.ts`; S2 imports `oneVocabulary` in `shell/sdlc-strip.ts` (1c7811d71) and found a real bug with the `borrowed` flag |
| **#20** the hand-out control | ✅ **DONE** | `track/station-file.ts` — the "Take this" composer, dedupes with `(filed n times)` |
| **#27** `verdict.md` surface | ⛔ **BLOCKED — S0** | Emitter unbuilt. S2 confirms `answerForArtifact("verdict.md")` returns null **on purpose** — a file we do not produce must not name a station |
| **#17** value audit | ⛔ **BLOCKED — S0** | *"S1 surface · S0 numbers."* |
| **#5** steer without restarting | ✅ **DONE AND PROVEN ON REAL DATA** | See below — this is the one worth reading |
| **#6** take a step by hand and hand it back | ✅ **DONE** | `track/take-over.ts` + `TakeOver.tsx`; driven live today on `6199f3df` ("Take it over" / "Hand it back" both render) |
| **#14** transcript | ⛔ **BLOCKED — S0** | *"S0 model · S1 transcript."* `challenge` has **zero rows and no producer**; I refused to render an empty type |

**Six done. Five blocked, every one of them on a piece another lane owns. Zero unblocked S1 work
remains on this column.**

## #5 is not merely built — it is proven end to end, and nothing had said so

This is the one I would most like on the record, because **§0.7 ranks steering second, above
legibility**, and the repo's own planning docs still read as though it were pending.

Measured today in `agent_messages`:

| | |
| --- | --- |
| steers, total | 4 |
| **track-scoped** (the composer's shape) | **1** — `c981afd0` on real track `a30238f5` |
| written → consumed | **19:11:55 → 19:12:45 = 50 seconds** |
| what it said | *"Skip the market research and work only from what is already in this workspace"* |
| the three older, mission-scoped | consumed at **15:06, 15:47, 15:07** |

**A real instruction reached moving work and was taken up in fifty seconds, with no restart.** That
is gap #5's whole claim, and it has already happened once on a real workspace.

**I am not claiming the 50s is caused by track-scoping.** The three July rows are mission-scoped AND
older, so two things differ; the lag difference is the record, not an explanation of it.

And the loop is closed on screen: `spine/activity-rows.ts:158` derives `pickedUp` from
`consumed_by_run_id`, and `TrackActivity.tsx:725` renders **"not picked up yet"** until it lands. So a
person can see their own instruction and whether anything took it.

**One small honesty note I am NOT building:** the picked-up state is rendered as *silence* — the
warning simply disappears. That reads correctly only if you know the rule. Defensible restraint, and
consistent with this codebase's habit of stating the exception rather than the norm, so I am leaving
it and recording the choice rather than making it twice.

## The ask, and it is small

**Nothing here needs a decision.** What would help:

1. **`getTrackHandoffs`** unblocks #29, which is the only one of the five where my half is designed and
   waiting rather than undefined.
2. **When any of the other four lands, the queue row is what I read.** Both times the docs lagged, I
   lost a unit to rediscovery — cheap once, and this is the second time.

## Why I filed this rather than just working

My brief says not to idle, and I am not: five lanes' worth of cross-checking today produced F-158
(default-as-data, adopted as a schema rule), the `is_sample` flag conflict (**0 of 42 deployments are
real by both flags**, correcting a number that had already reached the canon), and RUN-144. **But
"S1 has no unblocked queue item" is itself a fact the other lanes should be able to read**, rather
than something I know privately while picking up work opportunistically.
