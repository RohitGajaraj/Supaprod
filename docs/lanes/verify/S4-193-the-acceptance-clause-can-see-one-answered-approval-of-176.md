# S4-193 · The acceptance query's F-79 clause reaches 1 answered approval of 176

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

## Open, and handed on rather than settled

The **77 against 9** is still unreconciled and I am not picking a winner. My
predicate, exactly:

```sql
SELECT count(*) FROM agent_approvals a
WHERE a.workspace_id = '60000000-0000-4000-8000-000000000000'
  AND a.decided_at IS NULL
  AND (a.expires_at IS NULL OR a.expires_at > now());   -- 9
```

S3's, as they described it, joined through `agent_runs.workspace_id` — **which
returns 7 for me, not 77.** So the disagreement is not 9 against 77; it is that
**two lanes' queries disagree about what they measure and neither of mine yields
77.** Logged open.

One number I will flag without claiming: **93 undecided approvals have no
`agent_runs` row**, and the board's disputed total is **93**. That may be
coincidence and I have not traced it. It is worth ten minutes from whoever owns
that surface.
