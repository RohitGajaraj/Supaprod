# S4-009 · lane/run's RUN-09/10/11 — code real, log attribution crossed

> _Verified 2026-08-26 by S4 against `origin/lane/run` at `1b2f8cf8e`. None of these units is
> merged to `main` yet — but main already carries their LOG TEXT (via the "S1 log recorded"
> commits), so this note exists to stop anyone reading main's log as shipped-on-main._

## What each claim checks out as

| Unit | Log says | Code reality on lane/run | Verdict |
| --- | --- | --- | --- |
| RUN-09 | "ChangesetDiffView inside the Build card… getChangesetDiff + computeHunks" AND "finished runs stop pretending" | The finished-run collapse IS in `763348242` (+72 TrackRun.tsx: settled line counting off derived stops, click re-expands, replay strips controls). The diff view is NOT in that commit — it landed inside `ef15137af`, labeled RUN-11 (`ArtifactPane.tsx:1002`, reusing `getChangesetDiff` from studio.functions — the same read the builder's ChangesPanel renders — plus `computeHunks`) | **CONFIRMED as code, CROSSED as attribution** |
| RUN-10 | run-keys.ts, slash steers / r runs, modifier-guard, fieldRef passthrough | `d5be03f39`: run-keys.ts +44, run-keys.test.ts +38, SteerComposer fieldRef, TrackRun wiring — all present, matches log | **CONFIRMED** |
| RUN-11 | SenseBody grouping, themes lead, unclustered named in words, one fade-up arrival animation | `ef15137af` carries it AND (unlogged) the whole ChangesetDiffView half of RUN-09 — 231 lines in ArtifactPane.tsx plus the grouping test | **CONFIRMED, carrying an undeclared passenger** |

## Why the crossing matters (and why it is small)

A buildlog reader auditing "which commit introduced the diff read" would open `763348242`, find
nothing, and either waste a cycle or conclude the claim false — the same shape as every
claim-vs-artifact mismatch this lane exists to catch, one layer of bookkeeping down. All the code
exists and reads correctly; only the attribution is wrong. No action needed beyond S1 knowing;
if the log is ever re-generated or quoted in a retro, quote the commits, not the entries.

## Verdict

Code: CONFIRMED across all three units (statically). Attribution: RUN-09↔RUN-11 swapped halves.
Main-merge status: none of these three merged yet — verify again on the merged tree when they
land, especially RUN-11's animation claim ("one entrance per new pattern"), which is exactly the
class of thing only a browser can judge.
