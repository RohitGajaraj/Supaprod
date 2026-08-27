# S4-071 · The honest query is about to report a false pass, tonight

> _S4, 2026-08-27 ~02:10 UTC, measured against the live database. **This is time-critical: the track
> that triggers it is one station away.**_

## The defect

`CLAIM: the acceptance query in `CLAUDE.md` and `OPERATING-MODEL-5-SESSIONS.md` §2 excludes tracks
whose approvals a person decided. **It does not exclude tracks a person PRESSED.**

R-18 is *"no human touching it mid-run"*. A press is a human touching it mid-run. The query cannot
see one.

## The track that is about to prove it

`a30238f5-767b-4a2b-854d-3624f714f068`, measured now:

| | |
| --- | --- |
| `entry_station` | `sense` |
| `station` | **`ship`** ← one from `learn` |
| `waived` | `[]` |
| `last_hold` | null |
| decided approvals | **0** ← the F-79 clause does not fire |
| **presses** | **7** |

```sql
SELECT driven_via, count(*) FROM track_drives WHERE track_id = 'a30238f5…' GROUP BY 1;
--  sweep 31 | press 7 | continuation 3
```

**All seven presses are at `sense`**, between 17:17 and 22:27 UTC, every one of them *before* the
Discover brief fix landed. After 22:27 the track walked `sense → decide → define → design → build →
ship` on sweep and continuation alone.

**So the moment it reaches `learn`, the published query returns 1 and somebody reports the acceptance
as met.** That is arithmetic, not a prediction: the track already satisfies every clause the query
tests.

## Measured now, both forms

```sql
plain form                    1
honest form (today's)         0
honest form + presses         0
tracks carrying a press      19   of 106
total tracks                106
```

Both honest forms agree **today**, which is exactly why this is worth filing before they diverge.
**Nineteen tracks carry a press**, so this is not a one-track problem.

## The query that survives a press

```sql
SELECT count(*) FROM spine_tracks t
WHERE t.entry_station = 'sense' AND t.station = 'learn' AND t.waived = '[]'
  AND t.id NOT IN (SELECT r.track_id FROM agent_approvals a
                   JOIN agent_runs r ON r.mission_id = a.mission_id
                   WHERE a.decided_at IS NOT NULL AND r.track_id IS NOT NULL)
  AND t.id NOT IN (SELECT d.track_id FROM track_drives d WHERE d.driven_via = 'press');
```

One extra `NOT IN`. `track_drives.driven_via` already records it; nothing new needs to be built.

## What I am NOT saying

- **The mechanism is not broken. It is working, and better than it was.** That same track produced a
  signal, decisions, specs, tasks, a prototype, a mission, a changeset and an open pull request, and
  walked five stations in under three hours after twelve drives that filed nothing this morning.
- **This track being disqualified is not a criticism of it.** Its presses are all from before the
  fixes, at one station, and a human unsticking a track that could not clear Discover was the right
  thing to do at the time.
- **`continuation` is not counted as a human touch**, because it is the driver resuming its own work.
  If that is wrong, the same query needs a third clause, and that is a ruling rather than a
  measurement.

## The two clauses catch different tracks, and neither catches both

This stopped being an argument and became a measurement. The only two tracks that come near the
acceptance:

| track | station | presses | decided approvals | caught by |
| --- | --- | --- | --- | --- |
| `d1168015` | **`learn`** | **0** | **3** | the approvals clause ONLY |
| `a30238f5` | `ship` | **7** | **0** | the presses clause ONLY |

**Each is invisible to the clause that catches the other.**

- With only the **published** clause (decided approvals), `a30238f5` passes the moment it reaches
  `learn`. Seven presses, unseen.
- With only the **press** clause, `d1168015` passes today. It is already at `learn` with
  `waived = '[]'`, and **three answered calls are unseen**.

S1 found the same thing from the other direction, building the run screen: of 106 tracks, 20 have any
drive recorded, 19 carry at least one human drive, and **exactly one was moved only by the loop** —
`d1168015`. From the drive record alone it reads as the acceptance. **A person answered three calls on
it, and an answer is not a move, so nothing in the drive data can see them.**

**That is the whole argument for two clauses, made by the data rather than by me.**

## The press clause is complete by construction, not just today

S1 flagged a forward risk worth checking: `getTrackActivity` treats `foreground` and NULL as
*unrecorded* and never folds them into `sweep`, so a human drive recorded under another name would
slip past a clause matching only `press`.

**It cannot.** The schema constrains it:

```sql
track_drives_driven_via_check
  CHECK (driven_via = ANY (ARRAY['sweep'::text, 'press'::text, 'continuation'::text]))
-- and driven_via is NOT NULL
```

| value | rows | tracks | what it is |
| --- | --- | --- | --- |
| `sweep` | 222 | 13 | the loop |
| **`press`** | **40** | **19** | **a person** |
| `continuation` | 6 | 3 | the driver resuming its own work |

**No `foreground`. No NULL, and none possible** — a CHECK passes on NULL, but the column is
`NOT NULL`, so both doors are shut.

So `driven_via = 'press'` is not merely complete against today's rows: **the database cannot produce
a fourth kind of drive without a migration**, and a migration adding one would have to be written by
someone who then owns updating this query.

`continuation` remains deliberately uncounted as a human touch, because it is the driver resuming
itself. **If that is wrong the query needs a third clause, and that is a ruling rather than a
measurement**, so I have not made it.

## Why it matters more than one track

The whole build exists to reach this number. **A query that reports a pass the rule does not allow is
worse than no query**, because the honest form was itself introduced to fix exactly this class of
error, and it has the same hole one layer down. F-79 was found by a person remembering an approval.
This one would be found by nobody.
