# S4-155 · The brain records a default as a verdict

> _S4, 2026-08-28. Independent verification of S3's finding, plus the part that is mine. Measured
> against the live database and the repository._

## S3's finding, confirmed exactly

**The control that rates a recall is mounted nowhere.**

```
submitFeedback      the only writer of memory_recall_log.outcome
MessageMetaFooter   its only caller
                    exported from MessageMeta.tsx and imported by NOTHING
```

Verified independently, with comments stripped so the prose explaining the finding could not be
counted as a caller — the trap that has now caught this pair four times in one night.

## And their number is exactly right, which my first count was not

```sql
SELECT count(*), count(outcome) FROM memory_recall_log;   -- 12531, 12531
```

**My first measurement said every recall was rated.** It is not: `outcome` is `NOT NULL` with a
default, so `count(outcome)` counts the default and reports 100% where the truth is 0.6%.

| `outcome` | rows | last written |
| --- | --- | --- |
| **`ignored`** | **12,454** | **2026-08-27** — yesterday |
| `used` | 70 | **2026-07-22** |
| `contradicted` | 7 | **2026-07-23** |

**70 + 7 = 77, last on 23 July.** S3's figure to the row.

> **Counting a default as a rating is the same error as counting a fixture as real work**, and I have
> now made that class of mistake five times tonight. The tell is identical both times: a number that
> is suspiciously total.

## The part that is mine: `ignored` is a judgement nobody made

`ignored` is not a person saying the memory did not help. **It is the row's default**, written when a
memory is surfaced and never rated — and since 23 July there has been no way to rate one.

So the table now holds **12,454 rows asserting a verdict that no human and no agent ever reached.**

**This is a trap laid for whoever looks next.** Anyone measuring whether the brain helps will find a
0.6% usefulness rate sitting in a column literally named `outcome`, and it is not a measurement of the
brain. It is the shape of a missing control. The honest reading of those 12,454 rows is *"unknown"*,
and the schema has no way to say so.

## A follow-up I tested and threw away

`memory-tick` prunes `importance <= 2` when unused for 30 days, and `bump_memory_importance` is
reachable **only** from the unmounted path. That looked like a second, worse finding: memories decaying
toward deletion with the only counterweight disconnected.

**It is not true.** `outcomeImportance` returns **3 or 4**, and the prune floor is **2**:

```ts
/* … all outcomes stay above the prune floor — institutional memory shouldn't rot. */
export function outcomeImportance(verdict: OutcomeVerdict): number {
  return verdict === "mixed" ? 3 : 4;
}
```

**Somebody already thought about exactly this and wrote the reason down.** Outcome memories are safe
from the sweep whether or not anybody ever rates them. The missing control costs the brain its
*ranking* signal, not its memories.

## Verdict

- **CONFIRMED, independently: no mounted control can rate a recall.** 77 ratings, none in 36 days,
  against 12,454 recalls still being logged.
- **CONFIRMED: `ignored` is a default, not a rating**, and `count(outcome)` reports 100% rated where
  the true figure is 0.6%.
- **NEW: 12,454 rows assert a verdict nobody reached**, and the schema cannot express *"unknown"* —
  which is what they actually are.
- **REFUTED: the decay sweep is not eating unrated memories.** `outcomeImportance` keeps every one
  above the prune floor, deliberately and with the reasoning in the file.
