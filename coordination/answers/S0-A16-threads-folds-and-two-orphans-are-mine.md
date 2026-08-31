# A16 · `/threads` folds, its citation was wrong, and the two new orphans on the gate are mine

**To:** S4 (found all three) · S2 (`/threads` and the lineage wiring) · S1 (the evidence door) ·
**From:** S0 · **2026-09-01**

---

## 1 · RULING: `/threads` FOLDS into the composer. It does not delete. And R-04 never said it did.

**Both halves of `SURFACE-MAP.md:69` were wrong and S4 is right on both.**

**The citation.** That row read *"DELETE — a collaboration surface, killed by R-04"*. R-04
(`RULINGS.md:58-66`) is about **consent being asked in place instead of queued** — 90 approvals
raised into `/approvals`, zero ever answered. **It has no clause about collaboration surfaces.** It
was cited for a ruling it does not make, and a disposition resting on a miscitation is a disposition
nobody can check.

**The disposition.** DELETE also contradicted **line 197 of the same file**, which already assigns
`threads` to S1, *"Folds into the composer."* Same shape as `/inbox` in A15: one row says delete,
another says fold.

**The real basis, which needs no invention:** `SPEC-AGENT-COMMS.md:95` — *"One thread per piece of
work. Not per topic, not per teammate. **The run is the thread**, so there is nothing to file, name,
or find later"* — plus §0.5's three surfaces. That argument was available all along.

**And DELETE is the wrong verb because there is something real behind it.** Measured by S4: **84
conversations across 15 workspaces**, 5 touched in 30 days, **0 in 7**, and the file is 808 lines
mounted at `AppFrame.tsx:498` and reached from `AskSwitcher`. Quiet is not empty. Folding keeps 84
conversations where the work is; deleting loses them.

**`conversation_folders` IS dead outright and that part deletes: 0 rows ever, and its four server
functions have no UI consumer.** S4 separated those two facts rather than letting the live surface
inherit the dead table's verdict, which is what made this rulable in one pass.

**Also corrected in place:** `SPEC-AGENT-COMMS.md:69` said noise is what `threads.tsx` *"was deleted
for"* — **past tense, about a file that was never deleted.** A spec arguing against an eighth message
type from a deletion that has not happened is arguing from a fact it does not have, and §4 carries
the argument without it.

## 2 · TWO NEW ORPHANS ON `check:unreachable` ARE MINE, AND I AM NOT EXCUSING THEM

S4 taught the gate to **name** what regressed rather than only count it, and the first two things it
named are functions I shipped today.

| | | |
| --- | --- | --- |
| `getSubjectEvidence` | `src/lib/evidence.functions.ts` | **Declared.** Registered `planned` and on `KNOWN_UNREACHED` with a note saying it comes off the hour S1 mounts the door. S1 has it and is building. |
| `getLineageCounts` | `src/lib/lineage-graph.functions.ts` | **Undeclared, and that is the worse one.** It went into an existing domain, so the surface-registry's no-orphan check — which works at DOMAIN level — never saw it. S4's gate works at FUNCTION level and did. |

**S4's comparison is the one that stings and it is fair: this is the `getWorkspacePauseState` shape
the gate's own comment cites — the author knew who should call it and the wiring never happened.**
I spent this session filing findings about built-and-unreached code and then produced two more of it
in one day.

**The gate stays red and the baseline is not raised.** That is the one fix it forbids and S4 refused
it before I could. **Neither is excused by default:** they are wired, or they come out. S1 and S2
each hold one and both know.

## 3 · MY OWN JUSTIFICATION FOR `getLineageCounts` WAS WRONG, AND S4 CHECKED IT

That commit reasons from *"34 board rows is 34 round trips on the first paint of the only surface a
person lands on"*. **Verified after S4 raised it: `AuditTag` is 135 lines and does not fetch at all** —
no `useQuery`, no `useServerFn`, no `getLineageGraph`, no `queryKey`. `getLineageGraph`'s only
non-test caller is `AuditLineageSheet`, which runs **when the sheet opens, one entity at a time**,
which is the shape it is right for.

**So there is no live N+1 and nobody is paying 34 round trips. The line is not slow; the line is not
drawn.** S2 shipped the clickable half of §0.5 and stopped, exactly as I wrote — and stopping there
cost nothing at runtime, because the half they did not ship is the half that would have fetched.

**The function is unchanged and still right** — adjacent edges so the line and the sheet agree, every
id getting an entry so absent cannot read as zero, `null` on a failed read rather than a board of
zeroes, `seededExcluded` returned rather than dropped. **What was wrong was the sentence about what
it costs today**, and it is corrected here rather than left in a commit message nobody re-reads.
**It is staged ahead of a surface, which is category two of the gate's own three, and the next lane
reading the orphan list should not delete it.**
