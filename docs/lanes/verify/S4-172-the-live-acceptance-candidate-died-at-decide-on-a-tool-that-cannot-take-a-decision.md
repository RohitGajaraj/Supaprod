# S4-172 — the live acceptance candidate died at Decide, on a brief that calls a tool the tool's schema rejects

> _Created: 2026-08-31 · Last updated: 2026-08-31_

> _S4 · 2026-08-31 ~14:1x UTC · Lovable project `371dd588`, all `SELECT`, plus source. No dev server,
> no browser, no row written, nothing pressed, nothing answered._

**Standing question 1 asks, if the acceptance is still 0, to name the mechanism that stopped it THIS
time. There is a new answer, on a track that was being driven while I measured it.**

## Standing question 1 — the acceptance is 0, measured 14:07:26 UTC

| | |
| --- | --- |
| short form (`entry_station='sense' AND station='learn' AND waived='[]'`) | **1** ← the false pass |
| walked all seven and `status='done'` | 1 |
| of those, a person decided an approval | **1** |
| of those, somebody pressed a transition | 0 |
| **acceptance, honest** | **0** |

Census: **107 tracks · 104 entered at `sense` · 81 still there.** (Was 106/103/81 this morning, so one
new track — and it is the subject of this verdict.)

## The mechanism THIS time, and it is not `d1168015`'s

`d1168015`'s disqualifier is unchanged: one approval a person decided. **But it is no longer the
interesting one, because a fresh candidate entered and died at station two while I was measuring.**

**Track `d2263583`**, created 12:51 UTC today:

| | |
| --- | --- |
| `entry_station` | **`sense`** ← the acceptance requires this |
| `waived` | **`[]`** ← and this |
| drives | **7, every one `driven_via='sweep'`** — nobody pressed anything |
| station reached | **`decide`** — station 2 of 7 |
| `attempts` | **3**, which is `MAX_STATION_ATTEMPTS` |
| `last_hold` | **`nothing-to-hand-on`** |
| **`last_hold_because`** | **NULL** |
| runs | 12, **7 of them `completed_with_failures`** |
| **`failure_kind` on those 7** | **NULL on all seven** |
| tokens | **611,844 on the track · 261,771 at Decide alone** |

**This is the exact shape the acceptance needs — entered at Discover, nothing waived, driven entirely
by the sweep — and it got two stations in.**

## The cause, verified in code rather than taken from the agent

The critic's own final output names it:

> *"Decision recorded … **Critic evaluation cannot be performed because `critic.evaluate` only accepts
> opportunities or PRDs, not decisions**, and the red-teaming was fully executed in the rationale…"*

**That is an agent's claim, so it is not evidence. Both halves check out:**

- **`src/lib/spine/driver.ts:131`** — the Decide checking seat's brief, in full:
  *"**Call `critic.evaluate` on the decision.** If it should not stand, call `decision.revise` rather
  than leaving the objection in prose."*
- **`src/lib/ai/tools/registry.server.ts:7254`** — `critic.evaluate`'s schema:
  `target_kind: z.enum(["opportunity", "prd"])`.

**A decision is not an accepted kind. The station whose entire output is a decision is briefed to
red-team it with a tool that refuses decisions by construction.** The brief's second clause is fine —
`decision.revise` exists at `registry.server.ts:4559` — so the sentence is half callable, which is
why it reads as reasonable.

**The agent behaved correctly throughout.** It could not call the tool, did the red-teaming in prose
instead, said so plainly, and recorded a falsifiable forecast anyway. It was marked
`completed_with_failures` for doing the right thing with the only means available.

## What makes this worse than a broken tool call

**1 · The station produced, six times, and the track says it handed on nothing.**
`spine_track_members` holds **6 decisions** at `decide`, and **all six carry a forecast**
(`forecast_claim IS NOT NULL` on 6 of 6). That is precisely the artifact the product's whole moat
claim rests on — a prediction recorded before the outcome is known — filed six times, while the track
holds `nothing-to-hand-on`.

**2 · The three attempts contradict each other**, which is the part a person would care about most:

| | the strategist's call |
| --- | --- |
| 13:40 | *"Tablet address layout contributes to checkout abandonment"* — **evidence confirms the layout issue causes it** |
| 13:50 | *"Tablet layout fix without A/B evidence"* — call is **`do-not-build`** |
| 14:00 | *"Do not attribute tablet checkout abandonment to address layout without A/B isolation"* — **we reject the causal claim** |

**The loop changed its mind about the product question on every retry**, and the retries happened
because the *checking* seat could not run, not because the decision was wrong. Three different answers
are now on the record, each attached to the same track, with nothing marking which one stands.

**3 · Nothing anywhere says why.** `last_hold_because` is NULL, and `failure_kind` is NULL on all
seven failed runs. A person opening this track is told it stopped and not one word about what
stopped it. **That is the same hole S1 has open for `tools-refused`, `given-up` and `going-in-circles`
— now demonstrated on `nothing-to-hand-on` as well, on the live acceptance candidate.**

**4 · It cost 261,771 tokens at Decide** to discover a schema mismatch that a type would have caught.

## What this is NOT, checked before filing

- **Not F-14.** `driver.ts:1528-1552` records a structurally similar Decide failure — same station,
  same `strategist → critic` crew — where a slow first seat split the crew across ticks and the
  harvest read as empty. That was fixed by `didStationProduce`. **This is a different cause:** the
  crew ran in one tick and the checking seat's *tool call* was refused.
- **Not F-147.** That was a finished tool briefed at zero stations. **This is the inverse:** a tool
  named in a brief that cannot accept the station's own object.
- **Not the sweep failing.** Every one of the 7 drives is `driven_via='sweep'`. The loop did its job
  and reached station two unattended, which is further than most.

## Standing question 3, answered on a live track rather than by reading code

*Does the loop hold end to end with no person in it?* **No, and the point it breaks is now named.**

| point | did the product know it was asking? |
| --- | --- |
| Decide's checking seat could not run its briefed tool | **No.** The run was marked `completed_with_failures` with `failure_kind` NULL. |
| Three attempts burned on the same impossible call | **No.** Nothing compared attempt N's failure to attempt N-1's. |
| The track stopped at `attempts = 3` | **Partly.** It set a hold, and left the reason NULL. |
| Six decisions filed, none marked as the one that stands | **No.** |

**No person was needed and none was consulted. It stopped on its own, for a reason nothing recorded.**

## Owner

**S0** — `src/lib/spine/driver.ts` and `src/lib/ai/tools/**`. The narrow fix is one of two: widen
`critic.evaluate`'s `target_kind` to include `decision`, or change the brief at `driver.ts:131` to
name a call the tool accepts. **I am not choosing between them** — the first changes a tool's
contract and the second changes a station's behaviour, and that is S0's call.

**The second thing is smaller and worth doing either way: a run that ends
`completed_with_failures` with `failure_kind` NULL, and a hold with `last_hold_because` NULL, are the
reason this took a database read to diagnose rather than a glance at the screen.**

No product code written. Nothing pressed, no approval answered, no row written.
