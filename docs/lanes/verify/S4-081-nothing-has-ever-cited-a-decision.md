# S4-081 · Nothing has ever cited a decision, and no forecast resolution names who made it

> _S4, 2026-08-27, measured live. Three canon numbers I flagged as stale in `S4-040` and nobody had
> re-measured. One of them nearly reversed a finding of mine, and does not._

## The compounding claim, measured

```sql
SELECT count(*), count(*) FILTER (WHERE cited_by_count > 0), max(cited_by_count) FROM decisions;
```

| | |
| --- | --- |
| decisions | **369** |
| decisions ever cited | **0** |
| highest `cited_by_count` in the table | **0** |

**Nothing has ever cited a decision.** The canon number was "0 of 355"; it is now 0 of 369, and the
distance has grown rather than closed. Decisions are recorded and never referenced back, which is
the compounding half of the moat with no instance in the product's life.

## The forecast numbers, which looked like they refuted `S4-063` and do not

`S4-063` said the forecast is captured at Decide and graded by nobody. Then this came back:

| | |
| --- | --- |
| decisions carrying a forecast | **176** |
| decisions with a `forecast_resolution` | **91** |

Ninety-one resolved forecasts would have been a direct contradiction, so I went looking before
claiming either way.

```sql
SELECT forecast_resolved_by_agent_slug, forecast_resolution, count(*), max(forecast_resolved_at)
FROM decisions WHERE forecast_resolution IS NOT NULL GROUP BY 1,2;
```

| resolver | verdict | n | last resolved |
| --- | --- | --- | --- |
| **NULL** | hit | 46 | 2026-08-13 |
| **NULL** | miss | 23 | 2026-08-16 |
| **NULL** | inconclusive | 22 | 2026-08-17 |

**`forecast_resolved_by_agent_slug` is NULL on all 91.** Every `forecast_resolved_at` is exactly
midnight, and nothing has been resolved since **2026-08-17**, ten days ago.

Split by workspace:

| workspace | decisions | with a forecast | resolved |
| --- | --- | --- | --- |
| `is_sample = true` | 216 | 127 | 79 |
| **`is_sample = false`** | **153** | **49** | **12** |

**So the record cannot attribute a single forecast resolution to an agent.** That is the same defect
shape as `agent_approvals.decided_by` being NULL in `S4-040`: the column that would settle who did it
is empty, so the honest statement is *"the record cannot say"*, not *"an agent did"*.

> **The comparison is weaker than it reads, and the correction is mine.** `decided_by` is populated on
> **158 of 176** answered approvals; only 18 cannot name the decider. So that column is mostly
> working and `S4-040` overstated it from a single row.
> **`forecast_resolved_by_agent_slug` is the stronger case on its own evidence: NULL on all 91.**

Midnight timestamps, a NULL resolver on every row, and a ten-day silence are the signature of seeded
data rather than a working loop. **`S4-063` stands.**

## CORRECTION: the 15 is 13 demo fixtures and 2 real, and both real ones are correctly held

**S0 broke it down by workspace and my number meant something different from what I said.**

| `is_sample` | `auto_derive` | workspaces | overdue |
| --- | --- | --- | --- |
| true | false | 11 | **13** |
| false | true | 1 | **2** |
| false | false | 9 | 0 |

**The 13 are on sample workspaces, which `calibrate-tick` skips by design** because no tick may spend
on a demo fixture. That is F-90, which I have quoted in my own verdicts all night, and I still
counted fixtures as a backlog.

**The real backlog is 2, and both already carry a drafted verdict.** They wait because
`canAutoSettle` requires the linked spec's outcome to have been settled BY A PERSON, which
deliberately closes the chain of agent-judges-outcome then agent-judges-forecast with no human
anywhere. **That gate is correct and is not to be touched.**

> **This is `S4-041` again, by me, four hours later.** There I corrected "45 of 60 open tracks cannot
> move" because I had counted demo fixtures as stranded work, and wrote that the trap was mine. Then
> I published a count of overdue forecasts without asking whose workspace they were on. **A number
> without its population is a rumour, and knowing the rule is not the same as applying it.**

## The number that survives, and it is smaller

## The number that is actionable tonight

```sql
SELECT count(*) FROM decisions WHERE forecast_horizon_date < now() AND forecast_resolution IS NULL;
-- 15
```

**Two real forecasts are past their horizon**, both with a drafted verdict, both correctly waiting on a human outcome settlement. Thirteen more are demo fixtures the tick skips by design. Their due date has arrived and nothing
has graded them. That is the due-forecast queue `S4-040` found wired to a caller that never runs.

## Canon corrections

1. **"0 of 355 decisions cited"** → **0 of 369**. Still zero. Needs its date.
2. **"133 of 133 learnings are seed"** → **135 total, 2 real**, and both are the ones `S4-063` shows
   graded the spec rather than the forecast.
3. **176 decisions carry a forecast and 91 are resolved** is true and misleading on its own. It needs
   the resolver column beside it every time it is quoted, or it reads as a working loop.

## What I am not claiming

- **NULL resolver is not proof no agent ever ran.** It is proof the record cannot name one, and an
  older write path may simply not have populated it. That is why the sentence is *"cannot
  attribute"*.
- **I did not check whether the 12 real-workspace resolutions are seed rows** planted on a real
  workspace or written by a person. They carry the same NULL resolver and midnight stamp as the rest.
