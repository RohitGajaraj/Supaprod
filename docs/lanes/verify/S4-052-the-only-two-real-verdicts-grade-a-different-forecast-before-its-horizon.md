# S4-052 · The only two real verdicts grade a different claim, four days before its horizon

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27, live database, read only. **This corrects my own `S4-040`, which told the founder
> the loop's payoff had happened.** It happened in the sense that rows exist. It did not happen in
> the sense the product sells._

## Why this one matters more than anything else I have filed

The moat, in `CLAUDE.md`'s own words, is **the forecast captured at decision time**: what a team
believed would happen, recorded before the outcome was known, then graded against what actually
happened. `learnings` holds exactly **two** non-seeded agent-written rows in the entire database
(`S4-040`). **These two are the product's whole claim, in its only live instance.**

## The forecast

Decision `663c7376`, written at Decide on 2026-08-25 17:21 by agent `strategist`:

| field | value |
| --- | --- |
| `forecast_claim` | **"The PRD will be approved and design gate cleared within 3 business days"** |
| `forecast_horizon_date` | **2026-08-29** |
| `forecast_resolution` | **null** |

## The verdicts

Both written 2026-08-25 **19:40**, two hours and nineteen minutes after the forecast:

| id | agent | verdict | summary |
| --- | --- | --- | --- |
| `d94a259e` | `data-analyst` | **missed** | *"Spec required ≤5% abandonment on tablet address re-confirm screen within 7 days of full rollout. Actual outcome: tablet checkout completion is 67%, meaning ~33% abandonment, far above target."* |
| `604cfb90` | `insight-keeper` | **missed** | same claim, same numbers |

## Three defects, and they compound

**1. The verdict grades a different claim than the forecast makes.**

- Forecast: *the PRD will be approved and the design gate cleared within 3 business days.* A claim
  about **process speed**.
- Verdict: *tablet abandonment is ~33% against a ≤5% target.* A claim about **a product metric**.

These are not the same proposition. The learning grades **the spec's success metric**; the forecast
was about **whether the work would move**. Nothing was measured against what was predicted.

**2. It was graded four days before the horizon.**

Horizon is **2026-08-29**. The verdicts were written **2026-08-25**. As I write, the horizon is still
two days away. **A forecast about the next three business days was marked `missed` the same evening
it was written.**

**3. `forecast_resolution` is still null.**

So the decision does not consider itself resolved. Two learnings point at it by `decision_id`, both
saying `missed`, while the forecast they are attached to remains open. Whatever wrote the learnings
did not close the forecast, and whatever owns the forecast does not know they exist.

## What I got wrong in S4-040, said plainly

I wrote: *"A verdict, against a forecast, graded `missed`, written by agents, not seed, tied to the
decision that made the bet. That is the product's entire claim, and it happened."*

**The clause "against a forecast" is wrong.** They are tied to the decision by `decision_id` and I
took the foreign key as evidence of the pairing. It is not. The pairing the product sells is
*semantic* (this outcome answers that prediction), and a foreign key cannot carry it.

**I checked that the rows existed and were agent-written, and did not read what they said against
what was predicted.** That is the same error I have filed against three lanes tonight in other
forms: taking a structural signal for a substantive one. `S4-040` is corrected in place.

## What this does not overturn

- The track still walked all seven stations with every transition sweep-driven (`S4-040`).
- The learnings are still genuinely agent-written and not seed.
- The acceptance still fails for the reason given, one decided approval, and that is unrelated.

**The loop moved. The payoff did not land.** Those are separable and I merged them.

## The question this raises, which is bigger than the two rows

`learning.record` has fired exactly **twice** (`tool_calls`, `S4-040`). Both times it produced a
verdict on a claim the forecast did not make, before the horizon it named. **So the grading path has
never once produced a correct pairing**, and there is no sample of it working to compare against.

`F-86` built `isForecastCheckable` at Decide to ask *"is what you just promised checkable"* while it
can still be changed. This forecast passed that gate: *"the PRD will be approved within 3 business
days"* is checkable. **The gap is not checkability. It is that nothing at Learn verifies the verdict
answers the question the forecast asked**, or that the horizon has arrived.

## SHARPENED: the guard exists, and it is prose rather than a check

My first draft said *"nothing at Learn verifies the verdict answers the forecast's question, or that
the horizon has arrived."* **Applying my own scope rule (`S4-051`) before sending it to S0, that is
wrong in an interesting way.**

**A horizon check does exist**, at `forecast.functions.ts:94`:

```ts
.lte("forecast_horizon_date", nowIso)
```

But it is in the **due-forecast queue**, which the operating model records as having *"processed zero
workspaces in its life"* (F-51). **So the gated path has never run, and the ungated path has run
twice.**

**And `learning.record` does carry a guard. It is an instruction to the model:**

> *"If the evidence is not in yet, **DO NOT CALL THIS TOOL AT ALL**: a deferral is the absence of an
> outcome rather than a kind of one, the spec stays on the Learn desk and comes back when it is due,
> and nothing is lost by waiting. **Guessing is the one thing that costs something**, because every
> verdict re-ranks the bet behind it and compounds into later guidance, so a wrong confident verdict
> is not a wrong row, it is wrong advice for months."*

That paragraph is correct, well argued, and names this exact failure in advance. **It is also the
only thing standing between a model and a wrong verdict, and on both of its live uses the model went
ahead anyway.**

**So the accurate finding is not "there is no guard". It is: the guard is prose where it needed to be
a predicate.** The horizon is a date on the row. `forecast_how_we_will_know` is populated. Both
checks are one comparison each, and both were left to the model's judgement.

## And these are the first two rows ever to carry the pairing

The same tool's comment records that `learnings.decision_id` *"has existed as a column and **nothing
has ever written it**: 133 learnings in production, `decision_id` NULL on all 133. The forecast and
its outcome have never once been joined."*

**So `decision_id` was wired, and its first two uses both point at a forecast the verdict does not
grade.** The join the product's whole claim rests on has now been exercised twice, and neither
exercise produced the pairing it exists for.

## Verdict

**CONFIRMED, and it is the most serious finding I have.** The product's only two live verdicts grade
the wrong claim, early, against a forecast that remains unresolved.

**Two checks are missing at Learn, and both are cheap:**

1. **Refuse to grade before `forecast_horizon_date`.** The date is right there on the decision.
2. **Require the verdict to name the forecast's own metric.** `forecast_how_we_will_know` is
   populated on this decision. Nothing compared the learning to it.

`src/lib/**` and the Learn station are S0's. I have changed nothing.
