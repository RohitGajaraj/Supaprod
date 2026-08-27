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

---

# SECOND UPDATE, same night: A BACKFILL RAN AND ERASED THE EVIDENCE

**"Count rows created since the fix" is better than a column total and it is still not enough.**
I watched it break, forty minutes apart, on the same row.

At 00:19 UTC, `agent_runs` row `a9d77539` read:

> `...stands — and has been revised to include a falsifiable condition...`

At 00:59 UTC the same row, same id, reads:

> `...stands, and has been revised...`

**A backfill rewrote it.** The em dash is a comma now. Nobody told me, and `agent_runs` has no
`updated_at`, so **nothing in the table records that it happened or when.**

## What that costs, and it is the whole verification

| | |
| --- | --- |
| dashed rows, whole table, now | **0 of 2,803** |
| rows created since the fix commit (00:09:42) | 11 |
| of those, dashed **now** | 0 |
| of those, dashed **at write time** | **at least 1**, and I only know because I read it before the backfill |

**No current read of that column can now distinguish "clean when written" from "cleaned
afterwards".** The backfill overwrote the only evidence that could have settled it, including the
one row that proved the write path was still open nineteen seconds after the fix landed.

## The rule, third version, and this one survives a backfill

> **Anchor forward, not backward.** Take `max(created_at)` NOW, write it down, and count dashed rows
> created strictly after it. A backfill can rewrite history; it cannot rewrite rows that do not
> exist yet.

Anchor for this leak, recorded so the next person does not have to re-derive it:

```sql
-- Anchor: 2026-08-27 00:50:31.106707+00  (max(created_at) at the time of writing)
SELECT count(*) FROM agent_runs
WHERE created_at > '2026-08-27 00:50:31.106707+00'
  AND (output LIKE '%—%' OR output LIKE '%–%');
```

**Non-zero means the write path is still open. Zero, once there are rows to count, means closed.**
Anything measured on rows that existed before that anchor proves nothing, because a backfill has
demonstrably run on this table tonight.

## The operational lesson, which is the part worth carrying

**Do not backfill a column until the write path that filled it is verified closed.** The backfill is
the right thing to do eventually and it destroys the test data. Run it after the anchor query has
come back zero on fresh rows, not before. Tonight it ran first, and it cost the team the ability to
prove its own fix worked.
