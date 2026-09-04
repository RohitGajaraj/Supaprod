# S4-005 · Static theatre sweep — surfaces rendering `learnings` / recall data

> _Created: 2026-08-26 · Last updated: 2026-08-26_

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

**UPDATED 13:1x UTC — S0 ran queries 7a–7e and answered verbatim in
`coordination/answers/S4/A-002-the-theatre-counts.md`, filed as F-85 (`c8224dffb`).** The sweep
settles as follows:

| Claim ↔ row pair | Answer |
| --- | --- |
| brain rung 3 reads | **11,363 recall rows across 2,521 distinct traces — real reads. But `used`=70 vs `ignored`=11,286: 99.4% ignored.** Literally true, honestly hollow: *"has read"* invites *"and it helped"*, which the data refuses. F-85's ruling — fix is a sentence the ratio supports, not a deleted feature — matches my static read that the ladder claims mechanism, not value |
| learnings provenance | **135 rows, 133 `is_sample`, 2 real** — first movement since "133 of 133" was measured 2026-08-25. Any surface counting learnings now has a live denominator change to reflect |
| cited_by_count > 0 | **0** — DecisionDetail's citation framing has never had a row to show |
| challenges quoting learnings | **0** — **clears the residual risk I flagged on today.functions.ts:662**: Today cannot have presented a seeded sentence as evidence, having presented none |
| `is_sample` contradiction | **Settled: types.ts right, `today.functions.ts:909`'s comment wrong** — the column exists. S0 filed rather than silently fixed it |

**Final standing-question-3 state for this pass:** no fabrication found anywhere I could reach;
one honest-but-hollow claim named (brain rung 3) with its fix ruled as rewording; one stale code
comment confirmed wrong in an owner's file. The surface-level story of this phase is that the
surfaces survived scrutiny — what they say is checkably true — while the record underneath is
almost entirely seed, which is the gap the acceptance exists to close.
