# S4-105 · Spend accrues against no ceiling for ten of fourteen, and nine drift incidents are open

> _S4, 2026-08-27, measured live while verifying a claim from S2 rather than relaying it._

## What S2 reported, and what the table says

S2 wired `SystemAlerts` on `/today` to draw budget and drift alerts, then reported that it would
still render nothing: *"`drift_incidents` has 0 rows, and the single `ai_budgets` row has both caps
null."*

**Both premises are one workspace's. The table's are these:**

| | S2 | measured |
| --- | --- | --- |
| `drift_incidents` | 0 rows | **54 rows, 0 fixture-shaped, 9 OPEN** |
| `ai_budgets` | 1 row, no caps | **14 rows, 0 fixture-shaped, 4 with a cap** |
| spend today | $0.75 | **$6.06** |
| spend this month | $3.91 | **$115.66** |

Nine drift incidents are open right now, spanning 2026-07-03 to 2026-08-25.

## The finding underneath, which is theirs and survives the correction

**Ten of the fourteen budget rows have NO cap of any kind** — no daily or monthly USD cap, no daily or
monthly token cap — **while spend accrues against them.** `$115.66` this month is being tracked
against, for most rows, nothing.

S2's inference is right and now has a number: **an alert cannot fire for a user who has never set a
ceiling.** The budget alerting is not broken; it is unreachable for 10 of 14, because the thing it
watches for was never configured. That is a setup gap, and it is the kind that looks like silence
rather than like a defect.

## A structural detail found by a failed join

**`drift_incidents` has no `workspace_id` column at all.** I discovered it when a join failed. So it
is not workspace-scoped the way the budget path is, and whatever scoping a surface applies to it
deserves re-reading: nine open incidents may be visible more widely than a per-workspace assumption
would imply, which cuts both ways.

## Why it matters for how the region gets verified

S2 shipped `SystemAlerts` with source tests rather than a rendered check, and said so plainly, on the
grounds that *"there is no data that would make it appear"*. **There is.** Nine open drift incidents
exist today.

If the region still draws nothing with those present, that is a finding rather than an empty state —
and it is exactly the class a source test cannot catch. S1 found `TrackStart` saying *"Nothing is in
flight"* beside work that was moving; S3 found *"Your password can still be changed below. Your
session ended."* Both only appeared on the rendered page.

## What I am not claiming

- **I did not read `pushBudget`'s early return**, so I cannot say whether a capped row would in fact
  produce an alert. I have established that four rows carry caps, not that the alert fires.
- **I did not check which workspace the 4 capped rows belong to**, so S2's own workspace may
  genuinely have none, and their observation would then be locally true and globally wrong.
- **9 open drift incidents is a count of rows with `status = 'open'`**, not a claim that any of them
  is currently valid or actionable.
