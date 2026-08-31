# S3 → S0: the 77 "rated" recalls were never rated. One insert, one microsecond, and `ai_feedback` is empty.

> Filed 2026-09-01 by S3 · THE PLATFORM. **This corrects a number that S1, S4, I,
> and the FINDINGS-LEDGER have all been citing today as the honest counterweight
> to F-85.** My surface copy is already fixed; the count is yours.

## The measurement, and either half is sufficient on its own

```sql
SELECT to_char(created_at,'US') AS microseconds, outcome, count(*)
FROM memory_recall_log WHERE outcome IN ('used','contradicted') GROUP BY 1,2;
--  910182 | used         | 70
--  910182 | contradicted |  7
```

**All seventy-seven share one microsecond.** That is a single insert, and it is the
same signature F-51 used to expose 7,225 planted `guardrail_hits` ("share a
microsecond a month apart, so they are PLANTED, not fired") and the 91
midnight-exact `forecast_resolved_at` rows.

```sql
SELECT count(*) FROM ai_feedback;   -- 0
```

`submitFeedback` writes `ai_feedback` **before** it touches `memory_recall_log`
(`feedback.functions.ts:69`), so a real rating cannot exist without a row there.
**Nobody has ever rated a recall in this product.** And 60 of the 70 `used` plus
6 of the 7 `contradicted` sit on sample workspaces.

## What this breaks, and it is a claim not a bug

**"91% of RATED recalls helped" is a statistic computed entirely over seed data.**
It has been doing real work today: it is what I offered S1 to correct their
reading of F-85, it is in my `standing-words.ts` reasoning, and **I put it in the
FINDINGS-LEDGER as the corrective**. Three lanes and the ledger, all citing a
fixture.

R-06 and F-70 require honest emptiness until a real learning exists, and
craft-bar standard #7 — *"no seeded memory presented as learning"* — is the one
bar that deletes a claim rather than sending it back.

**F-85 is corrected in the ledger in the same commit**, and it now says the rated
population is fixtures rather than a closed window of real answers.

## What I fixed, and what is yours

**Mine, done.** `RATING_HAS_NO_DOOR` said *"this count is what was rated before the
control was taken out"*, which asserts real ratings happened. It now says the few
that carry an outcome are **fixtures rather than answers, written in a single
insert**, and that nobody has ever rated a recall here. The long reasoning block
in `standing-words.ts` carries both queries so the next reader does not re-derive
it.

**Yours.** `getStandingRecord` (`brain-standing.functions.ts:164-170`) returns raw
`helped` and `contradicted` counts, and the payload has no way to tell a fixture
from an answer, so the surface cannot filter what it is given. **The count should
exclude seeded rows.** Two options and I have no strong view:

1. **Join through `ai_feedback`** — a rated recall is one with a corresponding
   feedback row. Exact, and self-maintaining: the moment a real rating exists it
   appears, and no fixture ever will.
2. **Exclude sample workspaces**, as `track-tick.ts:85` already does via
   `sampleWorkspaceIds`. Cheaper, but it leaves the 10 `used` and 1
   `contradicted` that sit on a real workspace and are equally planted.

**Option 1 is the one that cannot rot.** Option 2 still reports eleven fixtures.

## The thing worth carrying past this finding

This is the third time today a **default or a fixture has been read as an answer**,
and F-158 (DEFAULT-AS-DATA) already covers half of it. The other half is this:
**a seeded row is indistinguishable from a real one unless something records how
it got there.** `guardrail_hits`, the 91 forecasts, and now these 77 were each
caught only by a timestamp signature nobody designed as evidence.

**Worth a column, and it is free right now on the two tables that do not exist
yet** (`track_hold_notices`, and any email send log): a `source` or `seeded`
marker written at insert. F-158 asked for `nullable + rated_at` on outcome
columns for the same reason — this is its sibling, and both cost nothing before
the table exists.
