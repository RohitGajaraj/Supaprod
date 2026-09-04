# S4-040 · Standing question 1, answered: the loop walked, and one human touch is the only thing that fails it

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-26 19:01 UTC, measured directly against the Lovable database (project
> `371dd588-1b70-4629-9bb5-9f003f3af373`) with the plugin finally callable in this session.
> **Read-only. No writes.** Every number below is followed by the query that produced it._

## The answer

```sql
SELECT now() AS measured_at,
  (SELECT count(*) FROM spine_tracks
     WHERE entry_station='sense' AND station='learn' AND waived='[]') AS q1a_plain_form,
  (SELECT count(*) FROM ( … honest form, OPERATING-MODEL §2 … ) w) AS q1b_honest_form,
  (SELECT count(*) FROM spine_tracks) AS total_tracks;
```

| | |
| --- | --- |
| `measured_at` | **2026-08-26 19:01:42 UTC** |
| plain form (1a) | **1** |
| honest form (1b) | **0** |
| tracks in the database | **106** |

**The acceptance is NOT met.** And for the first time the reason is measured rather than recalled.

## Which clause disqualifies it, and it is only one

Track `d1168015-05fb-4d6e-82b2-d80bdf7f5ff8`:

| Check | Result |
| --- | --- |
| transitions driven by the sweep | **6** |
| transitions with unknown provenance (`driven_via IS NULL`) | **0** |
| transitions pressed by hand | **0** |
| any non-sweep event of **any** entity type | **0** |
| `spine_track_members` rows | **15** |
| **approvals decided by a person** | **1** ← |

**Everything passes except one decided approval.** F-79 is confirmed exactly, with the row:

```
approval_id      bdf32286-31ed-458d-b524-9333c4f78ef4
mission_id       310bd16b-c9cd-433e-863d-1d3f799699f6   (the Build mission)
created_at       2026-08-25 18:11:17 UTC
decided_at       2026-08-25 18:48:31 UTC
status           rejected
expires_at       2026-08-28 18:11:17 UTC   (2d 23h of headroom unused)
decided_by       NULL   ← the schema cannot name who
```

A person rejected a boundary call **mid-run**, 37 minutes after it was raised and nearly three days
before it would have expired. R-18: *"no human touching it mid-run."* That is the whole failure.

## What this changes, and it is the important part

**The loop is not broken. It walked.** Every station filed real work:

```sql
SELECT station, artifact_kind, count(*) FROM spine_track_members
WHERE track_id='d1168015…' GROUP BY 1,2;
```

| station | filed |
| --- | --- |
| sense | 3 signals, 2 themes |
| decide | 1 decision |
| define | 1 prd, 2 tasks |
| design | 1 prototype |
| build | 1 changeset, 1 mission |
| ship | 1 decision |
| learn | **2 learnings** |

**No station is empty.** It carries a forecast written at Decide, which is the one thing the earlier
near-miss `3fbf73c9` could never show (it entered at `define` with Decide waived). And its two
learnings are real:

```
604cfb90  verdict=missed  recorded_by_agent_slug=insight-keeper  is_sample=false  decision_id=663c7376…
d94a259e  verdict=missed  recorded_by_agent_slug=data-analyst    is_sample=false  decision_id=663c7376…
"Spec required ≤5% abandonment on tablet address re-confirm screen within 7 days of full rollout. Actual outcome…"
```

**A verdict, against a forecast, graded `missed`, written by agents, not seed, tied to the decision
that made the bet.** That is the product's entire claim, and it happened.

> **CORRECTION, 2026-08-27. The clause "against a forecast" is WRONG and I am withdrawing it. See
> `S4-052`.** The two learnings are tied to the decision by `decision_id`, and I took the foreign key
> as evidence of the pairing. It is not. The forecast says *"the PRD will be approved and design gate
> cleared within 3 business days"* with a horizon of **2026-08-29**; the learnings grade *"tablet
> abandonment ~33% against a ≤5% target"* and were written on **2026-08-25**, two hours after the
> forecast and four days before its horizon. `forecast_resolution` is still `null`.
>
> **The rows are real and agent-written, which is what I verified. They do not grade what was
> predicted, which is what I claimed.** The loop moved; the payoff did not land. I merged two
> separable things.

So the honest sentence is not *"nothing works."* It is:

> **The loop completed a real walk end to end, produced a forecast at Decide and a graded verdict at
> Learn, and the acceptance still fails because one person answered one approval mid-run.**

## Three numbers in canon are now stale

1. **"133 of 133 `learnings` rows are seed"** — now `135 total, 133 seed, 2 agent-written and
   `is_sample=false``. The two real ones are this track's. The brain has its first genuine entries.
2. **"0 of 93 tracks in three months"** — there are **106** tracks now, and one has walked. The
   statement needs its date.
3. **`decisions.cited_by_count` is 0 on all 355** — there are **366** decisions now; the count needs
   re-measuring before it is repeated.

## One cross-lane correction, measured

S2 built `src/lib/ai/house-style.ts` on the stated premise that `decisions.rationale` rows carry em
dashes in a model's register. Measured:

```sql
SELECT count(*) FROM decisions WHERE rationale  LIKE '%—%' OR rationale  LIKE '%–%';  -- 0 of 366
SELECT count(*) FROM decisions WHERE forecast_claim LIKE '%—%' …                       -- 6 of 366
SELECT count(*) FROM agent_runs WHERE output LIKE '%—%' …                              -- 1375 of 2773
SELECT max(created_at) FROM agent_runs WHERE output LIKE '%—%';                        -- 2026-08-26 18:50:32
```

**`decisions.rationale` is clean. The carrier is `agent_runs.output` at 49.6%, still being written
today.** S1's independent measurement is confirmed to the row. The house-style rule is still the
right fix; the evidence cited for it was the wrong column, and the target is `agent_runs.output`,
which is what the transcript renders.

## Verdict

- **Standing question 1: ANSWERED. The acceptance is NOT met**, honest form returns **0** at
  2026-08-26 19:01 UTC.
- **The mechanism is a single decided approval**, not a broken loop, not missing artifacts, and not
  the provenance ambiguity I raised in `S4-025` — that ambiguity does not arise here, because all six
  transitions positively record `sweep`.
- ~~**`agent_approvals.decided_by` is NULL**, so the record cannot say who decided.~~
  **CORRECTED 2026-08-27, and I generalised from one row.** S1 measured the column and I confirmed it:

  | | |
  | --- | --- |
  | approvals decided | **176** |
  | **that DO name the decider** | **158** |
  | that cannot | **18** |

  **`bdf32286` is one of the 18.** So the sentence is true of that row and false as a statement about
  the column, which is how I wrote it. The honest caveat is *"18 of 176 answered calls cannot name
  who answered"* — a much smaller hole, and the acceptance query can name the decider on about 90% of
  answered calls.

  The same wording is in `CLAUDE.md` as a general claim. **S0's to change**, and S1 has told them.
- **The loop itself is demonstrably working.** Anyone reporting "zero in three months" without that
  sentence beside it is reporting the distance as larger than it is.
