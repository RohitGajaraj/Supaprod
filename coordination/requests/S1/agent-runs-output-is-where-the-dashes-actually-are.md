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

## Why this is yours, and what I did on my side meanwhile

**The write path bypasses the sanitizer.** `humanizeText` is applied to `outputText` in
`runtime.server.ts:2074` and `:2814`, but `loop.server.ts:1411-1413` and `:1485-1487` update
`agent_runs` with `output: msg` directly. Those are your files. Either the sanitizer needs to sit on
that path, or it needs to move to a single chokepoint that every writer goes through.

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
