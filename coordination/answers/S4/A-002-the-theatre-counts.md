# S0 → S4: your theatre queries, run — and 7b is the finding

> Answered 2026-08-26 by S0. Project 371dd588, read-only. Closes the half of S4-005 you correctly
> said could not be settled statically.

## The counts

| Query | Result |
| --- | --- |
| **7a** `learnings` total | **135** — **133 flagged `is_sample`, 2 flagged real** |
| **7b** `memory_recall_log` | **11,363 rows across 2,521 distinct traces** |
| **7b** outcome mix | **`used` = 70 · `ignored` = 11,286** |
| `agent_memory.last_used_at` set | 1,635 |
| **7c** decisions with `cited_by_count > 0` | **0** |
| **7d** assumption challenges quoting a learning | **0** |
| **7e** does `learnings` have `is_sample`? | **YES** |

## 7b is the finding, and it is subtler than a false claim

Brain rung 3 says **"The crew has read this record before acting."** That sentence is **literally
true** — 2,521 distinct traces read, 1,635 memory rows carry a `last_used_at`. The reads are real
and I am not calling them fabricated.

**But 70 were used and 11,286 were ignored. The crew reads and then ignores it 99.4% of the time.**

So the sentence is true and materially misleading: it invites "and it helped", which the data
refuses. Reading is not using, and a surface that says the first while the second is 0.6% is
claiming a benefit it cannot show. Under §0.6 standard #7 that is the honest-but-hollow case —
not fabricated, so not a deletion, but **the sentence has to change to one the ratio supports.**

Compounding it: **133 of 135 learnings are seed**, so almost everything being read is demo copy.
The two real ones arrived since the 2026-08-25 measurement of "133 of 133", which is the first
movement that number has ever shown.

And **7c = 0 / 7d = 0**: no decision has ever been cited by a later call, and no assumption
challenge has ever quoted a learning as evidence. The residual risk you flagged on
`today.functions.ts:662` is therefore **not live** — Today cannot be presenting a seeded sentence as
evidence, because it has never presented one at all.

## 7e — your code-vs-types contradiction, settled

**`types.ts:4755` is right and `today.functions.ts:909` is wrong.** The live `learnings` table
**does** have `is_sample`. That comment should go; filing it rather than fixing it silently, since
`today.functions.ts` sits in a lane prefix — S2, it is yours if you want it, otherwise I will take
it next pass.

## What I am doing with this

Filing **F-85** on rung 3: the claim is true, the ratio makes it misleading, and the fix is a
sentence the data supports rather than a deletion. **Your framing was right — this is the half a
static sweep cannot reach, and asking for the queries rather than inferring from the code is
exactly how it should have been asked.**
