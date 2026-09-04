# S4-165 — the message budget, measured for the first time, and five of the seven types never existed

> _Created: 2026-08-31 · Last updated: 2026-08-31_

> _S4 · 2026-08-31 ~10:30 UTC · Lovable project `371dd588`, all `SELECT`, plus source reads. No dev
> server (R-21), no browser, no row written._

**`SPEC-AGENT-COMMS.md` §1 makes this a standing check on me: *"a run carries a message budget. If
teammates spend more tokens addressing each other than doing the work, the feature has caused the
regression the objection predicted and it comes out. S4 measures this, per run, and it is a standing
check rather than a one-off."*** No S4 verdict file mentions it. **The spec was written 2026-08-26
and this is the first time it has been run.**

## Verdict on the guard: the feature stays, and it is not close

Real workspaces only, `is_sample` excluded throughout.

| | |
| --- | --- |
| runs that consumed at least one message | **68** |
| mean message tokens delivered into a run | **263** |
| mean work tokens for those same runs | **25,955** |
| **messages as a share of the tokens of the runs receiving them** | **1.01%** |
| worst single run | **5.21%** |
| all-time real message payload | 71,525 chars ≈ **17,881 tokens** |
| all-time real run tokens | **36,118,554** |
| **all-time share** | **0.0495%** |

**The threshold is "more than the work", i.e. 50%. The measured figure is 1.01% per run and 0.05%
across all traffic — three orders of magnitude of headroom.** The objection §2.5 refused was
*unbounded ambient context*; addressed messages have stayed bounded exactly as the spec argued they
would. **CONFIRMED: the feature does not come out, and a second cycle cannot change that answer** at
this volume. I am recording the threshold as unreachable rather than pretending it is marginal.

### One honest limit on the instrument, and it is in the schema

The guard says *"per run"*. Delivery is attributable — `consumed_by_run_id` is set on 144 of 161
rows. **Composition is not: 111 of 161 messages carry no `source_run_id`**, so the tokens a run spent
*writing* a message cannot be charged to it. The figure above is therefore **delivery cost only**.
Even if composing cost the same as delivering, the total would be ~2%, so the verdict is unchanged —
but the guard as written is only half computable, and whoever tightens it should set `source_run_id`
on every insert.

---

## The finding that matters more: five of the seven types have never been written

§3 declares the vocabulary and closes it: *"**No eighth type without a ruling.** An open message
vocabulary becomes chat, chat becomes noise, and noise is what `_authenticated.threads.tsx` was
deleted for."*

Every `kind` value in the table, all workspaces, all time:

| spec type | rows, real workspaces | rows, all |
| --- | --- | --- |
| **Handoff** | 68 | 143 |
| **Ask** (teammate → teammate) | **0** | **0** |
| **Ask** (teammate → person) | **0** | **0** |
| **Claim** | **0** | **0** |
| **Challenge** | **0** | **0** |
| **Escalate** | **0** | **0** |
| **Broadcast** | **0** | **0** |
| `kickoff` — *not in the spec* | 0 | 14 (last **2026-07-22**) |
| `steer` — *not in the spec's type table* | **1** | 4 |

**One of the seven declared types exists. The other six have never had a row.**

**And the spec says so about the most important one, in its own words:** Challenge is
*"**The most valuable one, and nobody ships it.** This is gap #1 made social: a station that can be
told its output is bad, by something that did not produce it."* Written five days ago, still true,
and it is the one type that would make a station refusable by something other than itself — which is
the same hole S4-162 found in F-149's and F-151's guards this morning, one layer up.

**Escalate is the second absence worth naming.** R-26 says a refused station is not a failed station,
and Escalate is how a teammate says *"here is exactly which door is locked."* Zero rows. Meanwhile
`spine_tracks` carries terminal holds like `given-up` and `tools-refused` whose reason field is
routinely NULL — the message type that would carry the reason was never built.

### The mismatch runs in both directions, and one half is a spec gap rather than drift

Production writes two kinds the type table does not declare. They are not the same case:

- **`steer` is defensible.** §4 describes exactly this behaviour — *"You can `@` a teammate … it
  lands as an addressed message, mid-flight, without restarting anything"* — and calls it *steer
  without restarting*. The behaviour is ruled; **the type table simply forgot to name it.** That is a
  gap in §3, not drift in the code, and the fix is a row in the table.
- **`kickoff` has no home in the spec at all**, and its last row is **2026-07-22**, five weeks before
  the spec was written. It is legacy, not drift either — but it is an undeclared value in a closed
  vocabulary, and a reader of §3 would not know it exists.

**Neither is a violation of "no eighth type without a ruling", because neither was added after the
ruling. But §3 currently describes a vocabulary that does not match the column it governs, in both
directions.**

### `steer` has one real use, ever

*Steer without restarting* is a headline capability in the register (§11) and §5's second priority.
**One real message, on 2026-08-26.** The capability is built and essentially unused. That is not a
defect — it may simply be new — but it is the number anyone claiming the capability should quote.

---

## Two smaller things the same read turned up

1. **55% of all message rows are planted.** 89 of 161 sit on `is_sample` workspaces, and 34 rows
   share a `created_at` microsecond across just 5 distinct timestamps — the single-INSERT signature,
   the same shape as the 7,225 planted `guardrail_hits` and the 133 seed `learnings`. The seed
   migrations that write them are `20260604201531`, `20260705052457`, `20260705063047` and
   `sample_workspace_seed.sql`. **This is NOT filed as new**: it is more evidence for
   [S4-055](./S4-055-the-shell-was-built-to-label-demo-data-and-does-not.md), open at OPEN-QUEUE
   §2.3b, which already says demo data is unlabelled everywhere a person looks. `TrackActivity.tsx:478`
   reads this table and renders it, so the sample rows do reach a surface.
2. **Three rows name a workspace that does not exist.** `161 total` versus `89 sample + 69 real`;
   the remaining 3 `workspace_id` values have no matching `workspaces` row. Small, and worth one
   line to whoever owns the table.

## What I did not do

The §12 read-it-out-loud check on how these messages are **worded on screen** is not in here. The
`kind` values are internal and the rendered wording is derived in `activity-rows.ts` and
`handoff-said.ts`; judging it means reading the rendered page, not the source, and that needs the dev
server. **Deferred to the browser pass, and named rather than skipped quietly.**

No approval answered, nothing pressed, no track driven, no row written.

**Owner: S0 for `source_run_id` and the three orphan rows; whoever owns `SPEC-AGENT-COMMS.md` §3 for
the vocabulary mismatch. Challenge and Escalate are backlog, not defects.**
