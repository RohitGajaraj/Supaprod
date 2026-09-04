# S4-193 · The acceptance query's F-79 clause reaches 1 answered approval of 176

> _Created: 2026-09-01 · Last updated: 2026-09-01_

**2026-09-01, at close-out. Found chasing an unrelated discrepancy S3 raised.
Lane `lane/proof`.**

## The clause

`CLAUDE.md` publishes the honest acceptance query verbatim. This is the part
added for **F-79**, so that a run a person touched cannot count:

```sql
AND t.id NOT IN (SELECT r.track_id FROM agent_approvals a
                 JOIN agent_runs r ON r.mission_id = a.mission_id
                 WHERE a.decided_at IS NOT NULL AND r.track_id IS NOT NULL)
```

## Its reach, measured

| | |
| --- | --- |
| answered approvals (`decided_at IS NOT NULL`) | **176** |
| of those, **no `mission_id` at all** | **68** |
| of those, no `agent_runs` row via `mission_id` | **70** |
| of those, joined to a run whose `track_id` is **NULL** | **106** |
| **reachable by the clause** | **1** |
| **tracks the clause can exclude** (of 111) | **1** |

For contrast, the other half of the same guard — the **F-112** press clause,
`track_drives.driven_via = 'press'` — **excludes 19 tracks.**

## What that means, stated carefully

**The clause was written from one example and its reach is that one example.**
The row it can see is `bdf32286` on `d1168015`, which is the case it was written
for. Of the other 175 answered boundary calls in this database, **it can see
none.**

**Three things this is NOT.**

1. **It does not change today's answer.** The acceptance query returns **0**
   either way, and it returned 0 before I looked.
2. **It is not necessarily a bug.** An answered approval whose run carries no
   `track_id` may genuinely not be attached to a track, and excluding it would
   then be correct. **I cannot show from here that any of the 175 belongs to a
   track**, and I am not claiming it.
3. **The acceptance is not unguarded.** The press clause is independent and does
   real work on 19 tracks.

**What is certainly true is that nobody knew the reach was 1.** The clause reads
as though it screens the whole population of answered approvals, and
`CLAUDE.md`'s own commentary presents it as *"F-79 as a join rather than a
sentence someone must recall."* It is a join that currently recalls one sentence.

## Why it matters at exactly the wrong moment

**The first time a track walks all seven stations, this clause is what must prove
no person answered a boundary call on it.** It can only see approvals that chain
`agent_approvals.mission_id → agent_runs.mission_id → agent_runs.track_id`. An
answered approval that does not carry that chain — and **68 of 176 have no
`mission_id` at all** — leaves the query reporting a clean unattended run.

This is the class this lane exists for: **a guard whose apparent scope is far
wider than its actual scope**, sitting in the single most important query in the
repository, published verbatim in the file every session loads.

## How it was found, which is the part worth copying

S3 and I disagreed about a number that did not matter — `agent_approvals`
undecided on one workspace, their 77 against my 9. **Neither reproduces.** In my
hands the join they described returns **7**, fleet-wide undecided-and-unexpired
is **39**, and `workspace_id` is populated on **all 328** rows, so my first guess
(a sparse backfill) was wrong too.

**Chasing a discrepancy neither of us could reproduce is what put the join under
a microscope**, and the join turned out to matter somewhere else entirely. The
disagreement was not the finding; **it was the instrument that produced one.**

## CLOSED, not open: 77 was a join fan-out, and it reconciles exactly

S3 found it and I verified it rather than took it. **`count(*)` over a
one-to-many join counts approval-by-run PAIRS, not approvals.**

```
count(*)          over agent_approvals JOIN agent_runs (harbor, undecided, unexpired)  =  77
count(DISTINCT a.id) over the same query                                               =   7
my direct-column count                                                                 =   9
   ... of those, with no agent_runs row at all                                         =   2      9 - 2 = 7
worst fan-out: runs on a single mission_id                                             =  28
```

**Every number is accounted for and nothing is left over.** Seven approvals
arrived as seventy-seven because one mission carries 28 runs, another 18, another
17. The two-row residual is mine: approvals whose mission has no run at all,
which a mission-join cannot reach and a direct column read can.

**So there was never a disagreement between two lanes.** There was one wrong
number and one small, fully explicable difference of instrument.

**And I should not take credit for the diagnosis.** When I ran "their predicate"
I wrote `count(DISTINCT a.id)` without thinking about it, so I got 7 and reported
that their query "returns 7 in my hands" — **I did not catch the fan-out, I
avoided it by habit.** S3 found the cause. Their rule from it is the one to keep:
**an aggregate sitting beside a join is unproven until it is `count(distinct)`,
and 77 looked plausible where 7 would have prompted a check.**

## Independently corroborated

S3 measured the same hole from their side: **in harbor's workspace alone, 14
undecided approvals carry `mission_id IS NULL`.** No mission-join can ever reach
them. That is the same shape as the 68-of-176 above, and it means the F-79
clause is blind to a population that is **large in the live data rather than
rare.**

## One number flagged without a claim

**93 undecided approvals have no `agent_runs` row**, and the board's disputed
total is **93**. That may be coincidence and I have not traced it. Worth ten
minutes from whoever owns that surface.

## The instrument count for one night

Four confident, well-formatted answers from instruments that structurally could
not see what they claimed: **a regex that could not cross a dot**, **a probe
reading `innerText` for an `aria-label`**, **a `count(*)` over a one-to-many
join**, and **my CSP guard whose evidence for an origin was the security log's
own record of a past finding about it.** Three of the four were S3's, one was
mine, and **every one returned a clean answer.** That is the argument for
mutation testing and for looking before measuring, arrived at twice in one night
from opposite directions.
