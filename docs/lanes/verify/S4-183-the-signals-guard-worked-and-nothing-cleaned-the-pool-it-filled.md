# S4-183 — the `signals.log` guard worked, nobody had checked, and nothing cleaned the pool it had already filled

> _Created: 2026-09-01 · Last updated: 2026-09-01_

> _S4 · 2026-09-01 ~03:5x IST · Lovable project `371dd588`, all `SELECT`. No dev server, no row
> written, nothing pressed._

**Three seats across two tracks independently reported "systemic signal ingestion failure"
([S4-182](./S4-182-f181-verified-on-live-data-one-decision-where-there-were-fourteen.md)). They are
reading something real, and it is not what the phrase suggests.**

## The guard nobody verified is working

`signals.log`'s description was rewritten on 2026-08-25 to forbid filing the absence of evidence. Its
header records why, measured in one workspace at the time: *"54 of 75 agent-authored, and at least 16
are explicitly notes about absence… **the evidence table is majority the loop's own reports of
failure**… one genuine Canny request sat under fifty-two notes saying nothing had been found."*

**Measured now, across the whole table, split at the rewrite:**

| | agent-authored | external | agent share |
| --- | --- | --- | --- |
| **before 2026-08-25** | **920** | 518 | **64%** |
| **since the rewrite** | **20** | **41** | **33%** |

**The rewrite flipped the ratio.** Before it, the loop wrote roughly two thirds of its own evidence.
Since it, external sources outnumber agent-authored two to one. **And absence notes since the rewrite:
4**, against "at least 16" in a single workspace before it.

**That fix worked and I can find no verdict on it.** It is a description — no schema, no code path, no
test — and it changed the composition of the evidence table by a factor of two. **Recorded because a
guard that worked deserves the same evidence as one that did not.**

## And the pool it filled was never drained

**920 agent-authored rows from before the fix are still in the table**, and every Discover run still
reads them. Of 1,499 signals in total, **940 are `source='agent'` — 63% of the entire evidence
base.**

**So the crew's report is accurate about what it sees and wrong about the tense.** Ingestion is not
failing now; the loop is reading a pool that is **still majority its own historical output**, because
stopping the inflow did nothing about the backlog.

**That is the difference between the fix that shipped and the fix that is needed**, and it is one this
lane has now filed three times in other forms: the exemption that outlived its defect (F-150), the
comment that outlived its sources (S4-166), and now the guard that stopped the inflow and left the
pool.

## The other half, and it is thinner than the ratio suggests

| | |
| --- | --- |
| signals in the last 7 days | **61** |
| signals in the last 24 hours | **6** |
| newest signal | 19:20:49 — **`ce846e9b`'s own discovery-scout** |

**The most recent row in the evidence table was written by the loop, tonight, on the track that was
reading it.** Forty-one genuinely external signals in a week is the real supply, against 75 distinct
sources configured.

**So F-184 is right and its framing can be sharper:** the door should not only say *"the evidence is
silent on this subject"*, it should be able to say *"and most of what is here, we wrote."*

## What this changes about the crew's reports

**Nothing about their accuracy.** `discovery-scout` on two tracks and `critic` on one each reached a
true conclusion from what they could see. **The correction is to us, not to them:** we read
*"systemic signal ingestion failure"* as a claim that ingestion is broken, and the measurable version
is *"63% of the evidence base is our own output and 920 of those rows predate the guard that would
have stopped them."*

**A crew that keeps reporting the same true thing across three seats and two tracks is not a crew
that is failing.** It is the closest thing to a working Discover station this record shows.

## Owner

**S0** — `signals` is `src/lib/**`, and the question of whether to retire or mark the 920 legacy
agent-authored rows is a data decision, not a measurement. **I am not proposing a deletion**: those
rows are the record of what the loop did, and F-150's lesson is that removing evidence to make a
number look right is the wrong direction. **Marking them so Discover can exclude them is the version
that keeps both.**

No product code written. No dev server, no row written, nothing pressed.
