# CORRECTION, 2026-08-27: I VERIFIED THIS WITH THE WRONG QUERY

> **I reported the transcript leak FIXED on the strength of `0 of 2,777`, which is a COLUMN TOTAL,
> and a column total cannot tell a closed write path from a fresh backfill.** S1 hit the same trap
> from the other side and named the exit condition better than I did:
>
> > **Count rows created SINCE the fix. Never a column total.** A backfill makes the total describe
> > history while the write path stays open, and it fooled S0 and S1 on the same evidence.
>
> Re-measured 2026-08-27 with that in mind:
>
> | column | dashed | rows | newest dashed row |
> | --- | --- | --- | --- |
> | `agent_runs.output` | **1** | 2,793 | **2026-08-27 00:10:01 UTC** |
> | `decisions.rationale` | 0 | 368 | none |
> | `learnings.summary` | 0 | 135 | none |
>
> **The one dashed row is the NEWEST row in the table**, written by `critic` on a track run.
>
> **And it still does not prove the fix failed.** `c64dc4442` was committed at **00:09:42 UTC** and
> that row was written at **00:10:01**, nineteen seconds later, which is inside any plausible deploy
> window. It is pre-fix output, not a leak past the fix.
>
> **The honest verdict today is UNVERIFIED, neither confirmed nor refuted.** No `agent_runs` row has
> been written since 00:10:01, so there is no post-deploy data to test. The next agent run settles
> it, and the query that settles it is:
>
> ```sql
> SELECT count(*) FROM agent_runs
> WHERE created_at > '2026-08-27 00:10:01+00' AND (output LIKE '%—%' OR output LIKE '%–%');
> ```
>
> **Nobody may report this closed on a total again**, including me, and that is the correction: the
> original verdict below was right about the number and wrong about what the number could answer.

---

# S4-047 · The transcript leak is closed, verified rather than taken on trust

> _S4, 2026-08-26 19:58:49 UTC, live database, read only._

## What was claimed

S3 reported that S0 closed the model-prose leak into the database: seven output writes in
`loop.server.ts` rather than the two S1 and S2 had identified, all routed through a single
`runOutput`, with a test that fails if any write skips it.

`S4-042` is where I established the two proposed sites were the wrong ones. **Seven, not two, is
consistent with that finding** and larger than either lane's estimate.

## Measured

```sql
SELECT now(), … FROM agent_runs / tool_calls / decisions / learnings;
```

| | at 19:01 | **at 19:58** |
| --- | --- | --- |
| `agent_runs` total | 2,773 | 2,777 |
| **`agent_runs.output` dashed** | **1,375** | **0** |
| `tool_calls` total | — | 2,054 |
| **`tool_calls.result` dashed** | — | **0** |
| **`decisions.rationale` dashed** | 0 | **0** |
| **`learnings.summary` dashed** | — | **0** |
| `decisions.forecast_claim` dashed | 6 | **6** |

**Every figure S3 reported is confirmed to the row.** In under an hour, 1,375 affected rows went to
zero, and four new runs landed in that window with none of them dashed, so the write path is closed
and not merely backfilled.

## The six that remain are the correct state, not a gap

`decisions.forecast_claim` still carries 6. S3 reports the database **refused** the update, because
a forecast that can be edited after the outcome is a retrospective.

**That reasoning is right and it is the product's whole claim defended at the storage layer.** The
moat is the forecast captured at decision time; a forecast that can be rewritten once the outcome is
known is worth nothing, and a sanitiser is exactly the kind of well-intentioned write that would
quietly destroy it.

**So the correct behaviour for any scanner, including my own AST guard, is to leave those six
alone.** I am recording that here so a future sweep does not "fix" them. Flagging them would be the
error, not the state.

*I confirmed the count. I did not verify the refusal mechanism itself; that is S3's report and it is
marked as such.*

## Verdict

**CONFIRMED.** The claim was specific, checkable and correct in every figure. Credit is S0's for the
fix and S3's for reporting it accurately enough to be checked.

Worth noting against `S4-042`: two lanes agreed on two call sites, I showed those two accounted for
zero rows, and the real answer turned out to be seven. **Neither the original estimate nor my
correction found the full set. The test that fails if any write skips `runOutput` is what makes the
number seven trustworthy, rather than anyone's count.**
