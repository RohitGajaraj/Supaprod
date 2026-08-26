# S1 → S0: the em dashes the founder can see are in `agent_runs.output`, half of all rows, still being written today

> Filed 2026-08-27 by S1, measured against the live database. **This corrects a belief three lanes
> were working from, mine included**, so it is worth reading before any more sweeping.

## What we all believed, and what is actually true

The working theory was that the model-authored dashes live in `decisions.rationale`. **They do not.**

| Column | Rows with an em or en dash | Total | Newest dashed row |
| --- | --- | --- | --- |
| **`agent_runs.output`** | **1,375** | 2,771 | **2026-08-26 (today)** |
| `decisions.forecast_claim` | 6 | 366 | 2026-08-25 |
| `decisions.rationale` | **0** | 366 | none |
| `decisions.title` | 0 | 366 | none |
| `learnings.summary` | 0 | 135 | none |
| `prds.body_md` | 0 | 115 | none |
| `signals.content` | 0 | 1,484 | none |

**49.6% of `agent_runs.output`.** That column is the agent's own last line in the run transcript, so
roughly every second turn in the product has been showing them. I confirmed rows written **today**
on the founder's own workspace (`60000000-...-000`), including the two tracks I created while
driving this evening. That is almost certainly what he was looking at when he gave the instruction.

`decisions.forecast_claim` is small but worth naming separately: the forecast is the one thing the
product claims nobody else can reconstruct, and six of them carry the punctuation.

## CORRECTION, 2026-08-27: I NAMED THE WRONG CALL SITES. S4 measured it.

**Do not change `loop.server.ts:1411-1413` or `:1485-1487`.** I named those and I was wrong. Both
write `status: "halted"`, and S4 grouped the table by status:

```
completed                1170 runs   709 dashed   60.6%
completed_with_failures   984 runs   667 dashed   67.8%
failed                    596 runs     0 dashed
halted                     18 runs     0 dashed    <- the two sites I named
waiting_approval            7 runs     0 dashed
```

**Fixing my sites would have changed zero rows**, and the buildlog would have recorded it as fixed.

**The real sites are `loop.server.ts:964` and `:2493`, both inside `finalize(finalMsg)`**, which write
exactly the two statuses that hold 100% of the dashed rows. And `grep -n humanize
src/lib/ai/loop.server.ts` returns nothing: that file never calls the sanitizer at all.

S4's proof that this is a content difference rather than a site difference is the part worth keeping:
`:964` writes `halted` too, so if the write site were the whole story, halted rows would be dashed at
the same rate as completed ones. They are 0%. A halted output is the canned taxonomy string a person
wrote; a completed output is the model's prose. **People writing constants do not produce em dashes
at 60%. Models do.**

One open end neither of us traced, stated as an open end rather than a guess: `runtime.server.ts:2073-2074`
DOES humanize, under `if (outputText && !isStructuredOutput)`. Why `finalMsg` still carries dashes is
either that it is assembled from something other than that return value, or `isStructuredOutput` is
true on these paths. That is one read of `finalize`'s callers.

**S2 has deliberately not claimed this**, because they already edited `loop.server.ts` for
`PLAIN_PUNCTUATION_RULE` and two lanes in one file is the collision we keep writing about. So it is
unclaimed and it is yours.

## Why this is yours, and what I did on my side meanwhile

**The write path bypasses the sanitizer.** `humanizeText` is applied to `outputText` in
`runtime.server.ts:2074` and `:2814`, but `loop.server.ts` never calls it, and the two writes that
matter are at **`:964` and `:2493`** inside `finalize(finalMsg)` (see the correction above; my first
version of this file named two other lines and they change nothing). Either the sanitizer needs to
sit on that path, or it needs to move to a single chokepoint that every writer goes through.

**And a write-path fix does nothing for the 1,375 rows that already exist**, which are what a person
reads today. So I applied the same rule on the way out, in my own prefix: `saidLine()` in
`TrackActivity.tsx` runs `humanizeText` before the transcript prints the agent's line. It is your
sanitizer, not a second one; it is idempotent by its own contract, so once you close the write path
this quietly becomes a no-op rather than a competing rule. The row is untouched, and the test beside
it asserts the WORDS are identical before and after, so "trimmed, never rewritten" still holds:
punctuation changes, prose does not.

**A backfill is still yours to judge.** Rendering clean fixes my surface. Anything else that reads
`agent_runs.output` (exports, the summary copy, anything S2 or S3 render) still gets the raw row.

## One thing this settles about the guards

Three lanes wrote three source guards for this instruction in one day. **None of them can see this**,
by construction: the text is in the database, not in the repository. Whatever survives, the honest
statement in its header is that it covers our copy and not the model's, and that the model's half is
`house-style.ts` plus this write path.
