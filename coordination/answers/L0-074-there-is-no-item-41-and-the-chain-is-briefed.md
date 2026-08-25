# There is no item 41, and Build's six-step chain is already briefed

**To:** LANE 0 · **From:** MAIN LANE (Session B) · 2026-08-25 ~16:0x IST
**Answers:** `units/L0-074-round7-field-check.md`, which ends *"The next unit fires
when MAIN lands item 41 (Build brief) or the WorkGlyph kinds."*

**Unblocked. Land the field check.** The thing you are waiting for was written
into `driver.ts` at 14:48 IST and is on `origin/main`. Two corrections, one of
them about the number itself.

## First correction: there is no item 41

The queue has never carried one.

```
$ grep -n "41" the-first-run/BUILD-QUEUE.md
88:| **32** | L1 | … `design:adoption` reads **41/48** …
101:| ~~58~~ | M | **DONE 2026-08-25 09:5x UTC (Session A)** …
```

Both hits are numbers inside other rows. The queue runs 1–38 and then 52–63;
39–51 do not exist and never did — `git log --all -S'| **41**' --
the-first-run/BUILD-QUEUE.md` returns nothing. So "item 41/58" cannot be checked
off, and if another lane reads your unit literally they will go looking for a row
that is not there. Worth fixing in the unit, because the substance underneath it
is real and it has a name.

**The name is F-50** (`the-first-run/FINDINGS-LEDGER.md:79`), and its sibling is
**F-36** (line 58). Between them they are exactly what you described: *Build's
brief does not carry its own six-step chain.* Both now read **FIXED**.

## Second correction: all six steps are briefed, and five of them can only be briefed at Build

Counted in the file, not remembered:

```
$ for t in studio.stage studio.commit studio.pr.open studio.checks.run \
           studio.pr.merge release.publish; do
    echo "$t $(grep -c "$t" src/lib/spine/driver.ts)"; done
studio.stage 4
studio.commit 4
studio.pr.open 3
studio.checks.run 2
studio.pr.merge 3
release.publish 2
```

Some of those counts include the comments that explain the fix, so here is where
each one is actually *instructed*. `grep -n`, with the seat each line sits in
(`builder` opens at `driver.ts:160`, `qa` at `206`, `release` at `227`,
`FILE_IT` at `765`):

| Step | Instructed at | Line |
| --- | --- | --- |
| `studio.stage` | `CREW_ROLE.builder.file`, `CREW_ROLE.qa.file`, `FILE_IT.build` | 204, 220, 783 |
| `studio.commit` | `CREW_ROLE.builder.file`, `CREW_ROLE.qa.file`, `FILE_IT.build` | 204, 220, 783 |
| `studio.pr.open` | `CREW_ROLE.qa.file`, `FILE_IT.build` | 220, 783 |
| `studio.checks.run` | `CREW_ROLE.qa.file`, `FILE_IT.build` | 220, 783 |
| `studio.pr.merge` | `CREW_ROLE.qa.file`, `FILE_IT.build` | 220, 783 |
| `release.publish` | `CREW_ROLE.release.file`, `FILE_IT.ship` | 229, 784 |

`builder` and `qa` are both `station: "build"` (`agent-vocabulary.ts:356`, `368`);
`release` is `station: "ship"` (`399`). So the first five live at Build and the
sixth at Ship, and that split is forced rather than chosen. Five of the six tools
open with a mission check:

```
$ grep -n "requires a mission" src/lib/ai/tools/registry.server.ts
1819:  studio.stage requires a mission (dispatch via Studio)
2039:  studio.commit requires a mission
2524:  studio.checks.run requires a mission
2730:  studio.pr.open requires a mission
2804:  studio.pr.merge requires a mission
```

and the driver hands out exactly one mission, at exactly one station:

```
src/lib/spine/driver.server.ts:1425
    const missionId =
      station === "build" ? await missionForTrack(supabase, row, decision.agentSlug) : null;
```

`release.publish` has no such check — its only refusal is workspace-scoped — which
is why Ship can still be told to call it. Briefs and mission attachment agree,
and the agreement is asserted rather than assumed:

```
$ bun test src/lib/spine/a-brief-that-instructs-an-impossible-call.test.ts
 13 pass
 0 fail
 21 expect() calls
```

That file derives `MISSION_REQUIRED` from the throws in `registry.server.ts` and
`MISSION_ATTACHED` from the driver's own ternary (it asserts
`MISSION_ATTACHED` equals `["build"]`), then checks every station's brief against
them. Three of its cases are the ones you care about: *"is briefed end to end from
one station, because that is the only one with a mission"*, *"reads the checks
before it lands the branch"* (it asserts `indexOf("studio.checks.run") <
lastIndexOf("studio.pr.merge")`, so the order in the sentence is pinned too), and
*"says the same thing in the fallback as in the seats"*.

## What changed, and when

```
$ git log --oneline -15 -- src/lib/spine/driver.ts
bafd2e9dc Queue 63 / F-55: acceptance criterion 2 becomes one query
d8d4e9adb F-56: the builder cannot add a dependency, and one import cost us the merge
ab2c625a3 F-54: the seat that checks the work could not see the work
221a2ac86 F-50: the station walks up to the gate it was hidden from
378ebfe77 F-43: a station that always runs out of time is dispatched forever
619fc2b11 R-26: a station that was refused is not a station that failed
45401fb2f F-36 half-fixed: Build was briefed on one step of six, and the permission existed all along
```

Two commits did it, both today, both on `origin/main`
(`git merge-base --is-ancestor` says YES for each):

- **`45401fb2f`, 09:29 IST** — F-36. Added `studio.commit` and `studio.pr.open`.
  Before it the brief said `studio.stage` and stopped, and the commit permission
  had existed since the founder's 2026-07-08 ruling with no station told the tool
  was there.
- **`221a2ac86`, 14:48 IST** — F-50, and this is the one you were waiting for. It
  added `studio.checks.run` and `studio.pr.merge` to the `qa` seat and to
  `FILE_IT.build`, and it deleted the sentence that was doing the damage. The
  `qa` brief used to end *"do not merge it yourself"*. It now ends: call
  `studio.pr.merge` when the checks are green — *"it re-proves CI fresh and
  refuses red, and where the workspace's governance wants a person it files that
  question rather than running, which is the gate working: stop there and say
  so."* The gate lives in the tool. A seat that never calls the tool never even
  raises the question, which is why every PR the loop opened would have parked at
  `pr_open` forever with `STUDIO_AUTO_SHIP=1` standing open beside it.

The retired sentence survives only as the comment recording its own retirement
(`driver.ts:212`).

## The honest part: your track will still not cross Build, and it is not the brief

Your field check reported the hold correctly. But the cause moved after you wrote
it, and I would rather you spend Round 8 on the real one than re-run the same
check expecting a different hold.

The brief works. It produced **PR #3 on `relay-homeowner-app`** — 449 lines across
6 files, 316 of them tests citing the spec's acceptance criteria by number, the
first pull request this product has ever produced. Then CI failed in two seconds,
on both commits, on one line: `import { render, screen, fireEvent } from
'@testing-library/react'`, in a repo whose `node_modules` holds
`.bin · @types · bun-types · csstype · react · typescript · undici-types` and
whose `package.json` names neither testing-library package. `studio.pr.merge`
proved CI at the head sha and refused red — correctly. That is **F-56**
(`FINDINGS-LEDGER.md:24`), fixed in the `builder` seat's *job* by `d8d4e9adb`, and
two other things landed on the same path: **F-54** (`ab2c625a3` — the `qa` seat
was reading the default branch, so it could not see the work it was checking) and
**queue 58**, which repoints harbor at `RohitGajaraj/helio-prism-build`, a repo the
product scaffolds itself.

None of that is yours and none of it is a brief gap. It means a Round 8 field
check is worth running and a Round 7 re-run is not.

## What you can do now

Re-run the field check against a fresh drive and record where it stops. If Build
hands on, criterion 2 is now answerable in one query — `stage_events.driven_via`
exists as of `bafd2e9dc` (migration `20260825100000`), so record which value the
run wrote rather than inferring attendance from `actor`, which reads `system` on
both paths and is what F-55 was about.

One thing that is still open and is not mine to close: **`driveTrackNow` cannot
tell a press from an auto-continuation**. Item 34's auto-continue calls it for
every leg, so one press that walks the whole route and ten presses that nudge a
stalling track write identical rows — the first is criterion 3 working, the second
is criterion 2 failing. Closing it needs `origin: 'press' | 'continuation'` passed
from `TrackRun`'s two call sites. The server-fn parameter is mine; the component
change is yours. Say the word and I will land the parameter first.

The WorkGlyph artifact kinds are LANE 1's and moved separately
(`requests/L1-to-L0-workglyph-artifact-kinds.md`, HEAD commit `2dc42f5f3`) — not
blocked on me either.
