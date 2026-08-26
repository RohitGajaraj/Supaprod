# S4-063 · The forecast is captured at Decide and graded by nobody

> _S4, 2026-08-27, measured against the live database and read back against the source. This
> corrects `S4-052`, which blamed the crew for doing exactly what it was told._

## The claim, and where it breaks

`CLAUDE.md`: **"The moat is the forecast captured at decision time."**

The capture half works. `FILE_IT.decide` refuses a decision without a forecast, and names all three
parts: what you expect to happen, the observable that will settle it, and the date it comes due.

The read-back half does not exist.

| | what it names |
| --- | --- |
| `FILE_IT.learn` (`driver.ts:1002`) | `prd_id`, "the spec this work was graded against" |
| `data-analyst.job` (`driver.ts:341`) | "Grade the outcome against **what the spec above said it was for**" |
| `insight-keeper.job` (`driver.ts:354`) | "Say what this outcome means for the NEXT piece of work" |

**None of the three names the forecast.** The seat that grades is never told what was predicted.

## Measured, whole population

Every run these two seats have ever had, all time, 18 runs:

```sql
SELECT agent_slug, created_at, length(input),
       (input ILIKE '%forecast%') AS names_forecast
FROM agent_runs WHERE agent_slug IN ('insight-keeper','data-analyst') ORDER BY created_at DESC;
```

**`names_forecast` is false on 18 of 18**, including the two composed station briefs of **7,800 and
7,842 characters** written on 2026-08-25. It is not a truncation and not a deploy lag. The word is
not in the brief because it is not in the code.

`insight-keeper` is also never told to call `learning.record`: false on all 6 of its runs, while
being `recorded_by_agent_slug` on both learnings in the database.

## This corrects S4-052

`S4-052` reported that `learning.record` had fired twice and produced a wrong verdict both times,
grading tablet abandonment against a 5% spec target rather than the forecast, which said the PRD
would be approved and the design gate cleared within 3 business days.

**Both verdicts were the crew doing exactly what it was briefed to do.** The brief said grade against
the spec. They graded against the spec. The defect is the brief, and blaming the model for it would
have sent someone to tune a prompt that was working.

Two further facts that make the timing point sharper rather than softer: the forecast's horizon is
**2026-08-29**, four days after those verdicts were written, and `forecast_resolution` is still
`null`. Even a Learn seat that knew about the forecast should have refused to grade it that day.

## What it costs

The product's stated moat is the forecast recorded before the outcome was known. It is being
recorded. Nothing reads it back, so no verdict has ever been measured against a prediction, and the
compounding record compounds nothing. This is not a surface defect; it is the loop's last station
grading a different question from the one the first station asked.

## Fix, and it is S0's

Two comparisons, both against columns already on the decision row, and both are the same two I
proposed in `S4-052` before I knew the cause:

1. **Learn's brief must name the forecast**, so the seat grading knows what was predicted. One
   sentence in `FILE_IT.learn`, which now reaches every seat since `8b724e096`.
2. **Refuse to grade before `forecast_horizon_date`**, and require the verdict to name
   `forecast_how_we_will_know`.

Guarded meanwhile in `src/lib/spine/every-seat-is-told-how-to-finish.test.ts` as a todo carrying the
assertion, so it flips green the moment the brief changes.

## Adding it to the brief is NOT enough, and this is the part that would have cost a cycle

I filed the fix above as one change, then went and checked whether the forecast's VALUES could even
reach the seat. They cannot. Two more things drop them first:

| where | what it does |
| --- | --- |
| `chain.ts:120` | `decision: { table: "decisions", title: "title", body: "rationale" }` |
| `driver.ts:871` | `describeUpstream(upstream, station === "learn" ? ["prd"] : [])` |

**Only `rationale` is selected**, so not one of the **eleven** `forecast_*` columns on `decisions`
is ever loaded. And `describeUpstream` inlines only the two NEWEST bodies plus the yardstick, whose
only entry at Learn is `prd`. On a full seven-station walk the decision is among the oldest
artifacts, so even a forecast-carrying body would be dropped before the seat read it.

**Three changes, and any one alone does nothing:**

1. `chain.ts:120` carries the forecast columns in the decision's body.
2. `driver.ts:871` makes `decision` a yardstick at Learn, beside `prd`.
3. `FILE_IT.learn` names the forecast, so the seat grades it.

## What I am not claiming

- **I did not check the other five stations for the same shape.** Learn was checked because it is
  where the forecast would have to be read.
- **I did not verify that `decisions.title` and a forecast-carrying body fit the inline budget.**
  `describeUpstream` bounds how much it inlines, and three more columns is more text.
