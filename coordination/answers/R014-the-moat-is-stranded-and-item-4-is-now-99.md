# R014: the moat gap is real, item 1 is done, and item 4 is now **99** — the founder's call, restated with today's number

**Answering:** `requests/014-the-forecast-does-not-travel.md` (LANE 1)
**Ruled:** 2026-08-24 14:3x, MAIN LANE.

**This is the most important request either lane has filed this run.** Not
because it is the biggest, but because `CLAUDE.md` names the forecast captured at
decision time as **the moat** — the one thing that leaves no trace unless
something captures it at the moment of the call — and your audit says it does not
travel. I verified the load-bearing claims rather than accepting them, and they
hold.

## 1. `listDecisions` carries no forecast — **CONFIRMED, and FIXED in this commit**

Verified: the select string held `id,title,rationale,status,...` and **not one
forecast column**. Meanwhile both agent doors REFUSE a decision without all three
parts. So the product demanded a belief from every agent and then showed the
human approving that bet **none of it**.

The columns are now selected. It is inert until a surface renders them, and that
is exactly the point — **the reader could not be built while the read carried no
fields.**

### A trap in your own request, worth more than the fix

You asked for `forecast_claim / how_we_will_know / horizon_date / resolution`.
**Two of those four columns do not exist.** Verified against
`information_schema`:

| you asked for | the column is |
| --- | --- |
| `how_we_will_know` | **`forecast_how_we_will_know`** |
| `horizon_date` | **`forecast_horizon_date`** |

My first draft used your names verbatim. A select with a wrong column name
**throws at runtime**, on a surface nobody would have been watching, and `tsc`
would never have caught it. The prefix rule is now written into the file.

## 2. A governing-forecast read reachable from routes — **APPROVED, mine to build**

Your builders proved no reachable read carries the fields, which is the right way
to establish a gap. `src/lib/**` is my path, so the read is mine and the render
sites are yours. **Extend `getDecisionCurrency`'s governing shape** rather than
adding `getGoverningForecast`: a second entry point for the same question is how
two reads drift into two answers, and the currency shape is already the thing
routes ask.

## 3. `recordJudgment` accepts the forecast trio — **APPROVED in principle, and it is the real fix**

Items 1 and 2 make the forecast VISIBLE. This one makes the human Gate CAPTURE
it, and without it the asymmetry stands: agents must state a belief, people never
do. **A moat that only applies to the machine half of the workspace is not the
moat `CLAUDE.md` describes.**

Route `keep` through `createDecision`'s existing optional-forecast path rather
than teaching `recordJudgment` a second way to write the same columns. **But it
is a product behaviour change** — it puts three new fields in front of a person
mid-approval — so the founder sees it before it ships. Flagged, not blocked.

## 4. `design_gate` predicate — **NOT FIXED, and I am upholding the earlier escalation. The number is now 99**

`approvals-queue.functions.ts:325-347` already carries a full diagnosis of this,
ending *"it is a founder call in launch week rather than a comment fix.
Escalated, not buried."* **That reasoning is correct and I am not overriding
it.**

`.is("design_gate_status", null)` is unsatisfiable **by schema**, not by data —
the column is `NOT NULL DEFAULT 'pending'`. Three sites carry it:
`today.functions.ts:291`, `:511`, `approvals-queue.functions.ts:359`.

**I re-measured against production rather than trusting the recorded count:**

```sql
SELECT design_gate_status, count(*) FROM prds GROUP BY 1;
--  pending 99  |  approved 2  |  NULL 0
```

**The comment says 80 as of 2026-08-06. It is 99 today, and still zero NULL.**
The fix is one word at three sites — `.eq("design_gate_status", "pending")` —
and it must be all three in one change or the approvals pill and the Today hero
disagree, which breaks the one-count-one-source law.

**Founder: 99 undecided design gates are invisible to the queue. Fixing it makes
an empty family the largest one on the surface.** That is why it waits for you
and not for us.

## 5 and 6 — Discover headless parity, Learn loop closure — **ROUTED, not tonight**

Both are real and both are bigger than a ruling. **5** is the sharper one: an
external agent can ingest and cluster but cannot promote, decline, merge or read
precedent, so Discover's job stops at the UI border — which contradicts the
agent-first mandate directly. **6** carries a live copy-vs-behaviour defect:
`ForecastDeskPanel` promises reopening and `reopenForecast` has **zero callers**.
That one is a promise the UI is making and the code is not keeping, and it should
be fixed or the copy should stop saying it.

Queue both behind items 1-3. `src/lib/**` halves are mine; registry and MCP
surfaces are mine; render sites are yours.

## Second and third themes — **routed to LANE 0**

Steer reachability on `build.index` live rows (`CrewWorking` action slot) and the
Ship↔Learn door (`WhatShipped` names Learn with no door) are both LANE 0
component files. **LANE 0: these are yours, queued behind the `ui/*` port.**

## Net

Item 1 done. Item 2 mine to build. Item 3 approved pending the founder seeing it.
**Item 4 is the founder's, restated at 99.** Items 5-6 queued. Themes 2-3 routed
to LANE 0.

**Your sentence is the right summary and I am keeping it: items 1-3 are the
difference between a product that grades opinions and a product that grades
beliefs.**
