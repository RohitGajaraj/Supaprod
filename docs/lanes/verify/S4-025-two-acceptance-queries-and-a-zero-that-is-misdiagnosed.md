# S4-025 · The acceptance test has two canonical forms, and the annotation on the honest one misdiagnoses its own zero

> _Verified 2026-08-26 by S4 on `lane/proof`, statically, against the merged tree. **I could not run
> either query — this machine has no database** (`coordination/requests/S4/no-database-and-no-env-on-this-machine.md`),
> so this is a verdict about the instruments, not about the number._
>
> _Standing question 1 asks whether the acceptance is met. Before asking it again I checked what
> "it" is, because this repo has been wrong about that three times — F-61/F-71 (the `is_sample`
> form), F-79 (the plain form), F-90 (the flag documented backwards)._

---

## 1 · There are two "the acceptance query", and they are not the same query

Both live in files every session is required to read.

**`CLAUDE.md`:**

```sql
SELECT count(*) FROM spine_tracks t
WHERE t.entry_station = 'sense' AND t.station = 'learn' AND t.waived = '[]'
  AND t.id NOT IN (SELECT r.track_id FROM agent_approvals a
                   JOIN agent_runs r ON r.mission_id = a.mission_id
                   WHERE a.decided_at IS NOT NULL AND r.track_id IS NOT NULL);
```

**`the-first-run/OPERATING-MODEL-5-SESSIONS.md` §2:**

```sql
WITH walked AS (
  SELECT id FROM spine_tracks
  WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]'
)
SELECT count(*) FROM walked w
WHERE w.id NOT IN (            -- nobody answered a boundary call mid-run
        SELECT m.track_id FROM spine_track_members m
        JOIN agent_approvals a ON a.mission_id = m.artifact_id
        WHERE a.decided_at IS NOT NULL)
  AND w.id NOT IN (            -- and nobody pressed a transition by hand (F-55)
        SELECT entity_id FROM stage_events WHERE driven_via IS DISTINCT FROM 'sweep');
```

They differ in two ways that change the answer:

| | `CLAUDE.md` | operating model §2 |
| --- | --- | --- |
| **mission → track** | `agent_approvals` → `agent_runs.mission_id`, take `r.track_id` | `agent_approvals` → `spine_track_members.artifact_id`, take `m.track_id` |
| **F-55, hand-pressed transitions** | **absent entirely** | present |

So `CLAUDE.md`'s form **cannot detect a hand-pressed transition at all**, and R-18's requirement is
*"no human touching it mid-run"* — a hand-pressed transition is a human touching it mid-run. Its
count is therefore **≥** the operating model's, and the two can legitimately disagree on the same
data.

The join paths can also disagree independently: one resolves a mission's track through
`agent_runs.track_id` and the other through `spine_track_members.artifact_id`. `CLAUDE.md`'s own
`AND r.track_id IS NOT NULL` concedes that runs with a null `track_id` exist — every such run is an
approval its form cannot attribute to a track, and therefore cannot exclude.

**This is the same defect shape as F-90 and it is in the same two files: canon that disagrees with
itself about the thing every session is told to measure.** One of these should be deleted and
replaced with a pointer to the other. That is S0's call — `CLAUDE.md` and `the-first-run/**` are
both S0's paths — but it should not survive another day, because the whole phase is scored on this
number.

---

## 2 · The F-55 clause is CORRECT. I went after it and it holds — recorded so nobody else spends the hour

I expected `driven_via IS DISTINCT FROM 'sweep'` to be a bug, because `driven_via` is **nullable**
and `NULL IS DISTINCT FROM 'sweep'` is **TRUE** — so every `stage_events` row written before the
column existed counts as "not sweep". The column was added on 2026-08-25 to a table holding
**2,893 rows** that, in the migration's own words, *"honestly did not know"*.

**That is deliberate and it is right.**
`supabase/migrations/20260825100000_a_transition_records_whether_anyone_was_watching.sql:25-32`:

> *"NULL means 'recorded before this column existed' and must stay readable as that, so a query
> proving autonomy has to say `driven_via = 'sweep'` and can never be satisfied by a row that
> predates the question. Nullable for the same reason, rather than NOT NULL DEFAULT 'sweep': a
> default would answer for rows nobody asked … here the unsafe reading is the one that CLAIMS
> autonomy."*

`driven_via IS DISTINCT FROM 'sweep'` is the exact NULL-safe negation of `driven_via = 'sweep'`, so
the exclusion subquery implements precisely the prescription above. **Not a defect. Do not
re-investigate.**

**Two more traps checked and clear:**

- **The `NOT IN` NULL poison** — a `NOT IN (subquery)` returns nothing at all if the subquery yields
  a single NULL. Both subqueries are safe: `spine_track_members.track_id` is
  `uuid NOT NULL REFERENCES spine_tracks(id)` (`20260801090150_…sql:20`) and `stage_events.entity_id`
  is `uuid NOT NULL` (`20260707190000_stage_events_foundations.sql:23`).
- **`entity_type` accepts `'spine_track'`** — the original CHECK listed seven types and did not
  include it, but it was properly widened in
  `20260801150000_spine_track_drive_state.sql:47-50` to nine, alongside the TS union, in the same
  commit.

---

## 3 · The finding: the comment on that clause names the wrong cause, and it is the cause everyone repeats

```sql
AND w.id NOT IN (            -- and nobody pressed a transition by hand (F-55)
      SELECT entity_id FROM stage_events WHERE driven_via IS DISTINCT FROM 'sweep');
```

**The clause does not detect hand-pressing.** It detects the *absence of positively recorded sweep
provenance*, which is two different populations wearing one answer:

1. **a transition a person actually drove** — `driven_via = 'foreground'`; and
2. **a transition recorded before 2026-08-25**, when the column did not exist — `driven_via IS NULL`,
   which the column's own comment says *"must never be read as either"*.

The query is right to exclude both. **The comment is wrong to call both the first one**, and the
consequence is not academic: this product is three months old and the column is one day old, so for
almost every track that has walked any distance, the true reason for exclusion is (2) and the
recorded reason is (1).

Someone reading the `0` beside that comment concludes *"a person keeps touching the runs"* and goes
looking for the human in the loop. For a pre-2026-08-25 track the honest sentence is *"we cannot
know how this was driven, because the instrument is newer than the run."* **Those are different
facts with different fixes, and one of them is not a fix at all.**

The two files also carry the older narrative — *"0 of 93 tracks in three months"* — which the F-55
clause cannot support on its own, for exactly this reason.

---

## 4 · The query that turns the ambiguous zero into a diagnosis

One clause, and it separates the two causes instead of merging them. **For whoever holds the
database — I do not:**

```sql
WITH walked AS (
  SELECT id FROM spine_tracks
  WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]'
)
SELECT w.id,
       count(*) FILTER (WHERE e.driven_via = 'sweep')                            AS driven_by_sweep,
       count(*) FILTER (WHERE e.driven_via IS NULL)                              AS provenance_unknown,
       count(*) FILTER (WHERE e.driven_via IS NOT NULL AND e.driven_via <> 'sweep') AS pressed_by_hand
FROM walked w
LEFT JOIN stage_events e
  ON e.entity_id = w.id AND e.entity_type = 'spine_track'
GROUP BY w.id;
```

A track with `pressed_by_hand > 0` fails R-18 and the finding is real. A track with
`pressed_by_hand = 0` and `provenance_unknown > 0` is excluded by the instrument's age, and saying so
costs nothing and stops a search for a person who was never there.

**Note the `entity_type = 'spine_track'` filter, which the §2 clause omits.** `stage_events`
legitimately holds nine entity types; the driver filters on it everywhere it reads
(`driver.server.ts:936`), and the §2 subquery does not. It is not a correctness bug — uuids do not
collide across tables — but it scans the whole table and it hides what the clause is about.

---

## Verdict

- **Two canonical acceptance queries that are not equivalent, in the two files every session must
  read** — **CONFIRMED**, and it should be collapsed to one. S0's paths.
- **The F-55 `IS DISTINCT FROM` clause** — **NOT a defect.** Deliberate, documented, correct.
  Examined so nobody pays for it again.
- **`NOT IN` NULL poison, and `entity_type` accepting `spine_track`** — **checked, both clear.**
- **The annotation on the F-55 clause** — **WRONG, and it misdiagnoses the number the whole phase is
  scored on.** Not "nobody pressed a transition by hand": *"every transition is positively recorded
  as sweep-driven"*. The difference is the difference between a product defect and a missing
  instrument.
- **The number itself** — **not measured here.** I have no database. When it is next reported it
  should name which of the two forms was asked, and split the exclusions with §4's query.
