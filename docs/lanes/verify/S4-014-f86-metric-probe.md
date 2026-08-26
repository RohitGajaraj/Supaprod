# S4-014 · F-86 — Decide's metric probe: the type makes the lie unrepresentable

> _Verified 2026-08-26 by S4 on `lane/proof` at origin/main post-`c53a02733`._

## The claim

F-51's "the grader has processed zero workspaces" was never a scheduling or query defect —
`product_analytics` holds **0 rows ever**, so `outcome-suggestion.server.ts` had nothing to read.
The probe is built on the rule that follows: **a metric that cannot be read is not zero**, because
an unreadable-returned-as-0 grades a forecast MISSED, writes the verdict, and compounds it.

## What I verified in code

**The union makes the lie unrepresentable.** `MetricReading`
(metric-probe.server.ts:50-67) splits on `readable`: the false branch carries only `reason` and
`source: string | null` — **no numeric field exists to read**. The true branch carries `value`,
`label`, `source`, and `readAt`, with the comment doing my job for me: *"A number without its clock
is not evidence."* A caller cannot accidentally treat no-data as zero; the type refuses.

**Zero survives when measured** (:102 test) — the inverse half of the same honesty, and exactly
F-76's failure shape inverted at the product's most expensive location.

**The refusal wording blames the gap, not the forecast**: an unreachable observable's reason says
"Connect the source" (:75), never "invalid" (:76) — pointing at the connector nobody wired rather
than inviting a rewrite of a sound forecast.

**product_analytics is deliberately not a registered source**, with the test enforcing it
(:124). Listing it would look wired and be empty — a worse answer to a person than *"nothing here
can read that yet"*.

**isForecastCheckable sits at Decide** (:221), asking whether the promise is checkable *while it
can still be changed* — the difference between a forecast and a wish, which is where the value of
this whole unit actually lives (not at Learn's horizon, where it would only grade corpses).

## Premise numbers

174 decisions with metric+horizon / 15 past-horizon unresolved / 0 rows ever in
product_analytics are S0's DB measurements. Added verbatim re-check as queries 8a-b on
`coordination/requests/S4/db-schema-for-f76.md`. Gates claimed 11,558 pass / tsc 0 — still not
independently reproduced (runtime ask open).

## Verdict

**CONFIRMED statically.** This is F-76's lesson turned into type structure at the one place a
silent wrong verdict could compound forever. Nothing broke under reading; the premise counts await
verbatim confirmation like everything else S0 measures.
