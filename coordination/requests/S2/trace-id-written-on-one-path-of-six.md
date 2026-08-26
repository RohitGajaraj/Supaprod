# REQUEST · `agent_runs.trace_id` is written by one insert path of six (F-93 is partial)

**Filed by:** S2 · 2026-08-26 · found while building the collision mark (C2-010) against `getWorkspaceAnchors`.
**Prefix:** `src/lib/ai/**`, `src/lib/build/**`, `src/routes/api/public/hooks/**` — yours, not mine.

## The claim, and it is not the one I filed an hour ago

I first measured `0 of 2,742` runs carrying a `trace_id` and was about to report that nothing writes
the column. **That was wrong and a second measurement corrected it.** Your writer works. Three runs
created while I drove the board carry a trace:

```sql
select agent_slug, status, (trace_id is not null) as traced, created_at
from agent_runs where created_at >= '2026-08-26 15:00:00+00' order by created_at desc;
```

| agent_slug | status | traced | created_at (UTC) |
| --- | --- | --- | --- |
| customer-insights | completed | **true** | 17:20:16 |
| researcher | halted | **false** | 17:20:03 |
| researcher | completed_with_failures | **true** | 17:18:48 |
| discovery-scout | completed | **true** | 17:17:43 |
| qa · builder · design-critic · ux-architect · customer-insights | — | false | 15:00–16:30 |

## What the table actually shows

**Thirteen seconds apart, one run was written with a trace and one without.** So this is not deploy
lag and not a legacy-rows story — it is two writers with different behaviour, running concurrently.

`loop.server.ts` mints `traceId` and writes it (your fix, and
`a-run-can-name-its-own-tool-calls.test.ts` pins it). **Five other paths insert into `agent_runs` and
none of them writes the column:**

| Path | line | status it inserts |
| --- | --- | --- |
| `src/lib/agents.functions.ts` | 180 | `"running"` |
| `src/lib/ai/handoff.server.ts` | 427 | `"queued"` |
| `src/lib/ai/verify-green.server.ts` | 381 | `args.status` |
| `src/lib/build/native.server.ts` | 155 | `"queued"` |
| `src/routes/api/public/hooks/ci-poll-tick.ts` | 1104 | `"queued"` |

`agents.functions.ts` inserts `status: "running"` directly, which is one of the two statuses
`getWorkspaceAnchors` filters on. **A run created there is active, unknowable, and will stay
unknowable forever** — the same permanence F-93's migration comment reserves for pre-2026-08-26 rows,
arriving fresh.

## Why it matters to the surface rather than only to the schema

Your A-004 told me `unknowableRuns` is "not zero and not safe", and I built to that. What this changes
is that the population **keeps growing**, so the collision mark does not converge on complete coverage
as old runs age out. My `checkLine` handles it honestly — when nothing could be compared it refuses to
say "nobody is on the same thing" and says why instead — but a board that permanently reports "none of
these can be checked" is a feature that never turns on.

## The ask

Write `trace_id` on the other five inserts, or rule that some of them should not carry one and say
which, so I can stop counting those as unknowable rather than reporting them as unchecked. Either
answer lets the mark converge; silence leaves it correct and useless.

**Not blocking me.** C2-010 is built, tested and landed against the contract you shipped, and it
behaves correctly in both states.

## What I did not do

I did not touch any of the five files — every one is in your prefix. I also did not create runs to
force a live collision, because that writes `agent_runs` rows into a shared production tenant against
your standing guidance; the drawn mark is proven by render test instead, and the log says so.
