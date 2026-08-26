# S4-005 · Static theatre sweep — surfaces rendering `learnings` / recall data

> _Verified 2026-08-26 by S4 on `lane/proof` at `60dd95e34`. Standing question 3. Constraint named
> up front: **theatre can only be half-proven statically** — I can establish what each surface
> CLAIMS and which row would have to exist for the claim to be true; whether such a row exists
> needs S0's database. Queries 7a-7d in `coordination/requests/S4/db-schema-for-f76.md` close that
> half._

## Settled clean, by reading

**`_authenticated.brain.tsx` — the headline ladder is honest by construction.**
`recordHeadline` (brain.tsx:667) orders claims by strength and falls back to less than it cannot
prove: re-scored calls → graded forecasts → *"The crew has read this record before acting."*
(numberless since 2026-08-11, when its own comment records catching a 4x overstatement — 587 rows
across 146 distinct traces — plus 576 of those pulls marked 'ignored') → bare manifest
("N calls and M learnings are on the record"), explicitly demoted to second-line register. Three
prior honesty passes are documented in-file with their measurements. Nothing here claims
accumulated learning in the present tense.

**`today.functions.ts:662` — learnings appear only as evidence inside a needs-you call**, read
solely where an assumption-challenge row references one (`learning_id`), sliced to 140 chars, for
a human to judge. That is evidence-in-a-call, not an accumulation claim. Residual risk: if the
referenced learning is itself seed, Today presents a seeded sentence as evidence — see query 7d.

## Suspects pending counts (claim ↔ the row that must exist)

| Surface / code | Claim on screen | Row that must exist | Query |
| --- | --- | --- | --- |
| brain rung 3 | "The crew has read this record before acting." | ≥1 `agent_memory.last_used_at` set from a real run's pull | 7b |
| brain guidance region | "694 of 846 … across 3115 recalls" was the 08-05 demo reading | recall events from real runs, not one INSERT wearing activity (cf. the `learning_citations` single-microsecond pattern) | 7b |
| Learn route (`_authenticated.learn.tsx`) | outcomes/verdicts | any non-seed `learnings` row at all (S0 measured 133/133 seed on 08-25) | 7a |
| DecisionDetail `cited_by_count` | "cited by N later calls" | any `cited_by_count > 0` (S0 measured 0 of 355 on 08-25) | 7c |
| trust-ledger / moat functions | track-record framing | same as 7a | 7a |

## Verdict

**NO THEATRE PROVEN STATICALLY; ONE CONFIRMED HONESTY REPAIR OBSERVED; five claim↔row pairs await
S0's counts.** The sweep's sharpest open question is not any single surface but the pattern S0
already caught once: activity-shaped seed data (one INSERT across seven dates) is exactly what a
recall-count claim cannot distinguish from real use. Until 7b returns, no surface should be
defended on the strength of its own numbers — including by me.
