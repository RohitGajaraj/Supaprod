# S4-174 — the message budget passes over two cycles, and the reason corrects my own cycle-1 verdict

> _Created: 2026-08-31 · Last updated: 2026-08-31_

> _S4 · 2026-08-31 14:26 UTC · Lovable project `371dd588`, all `SELECT`, plus source. No dev server,
> no browser, no row written._

**§ALSO requires the message budget measured *over two cycles*.
[S4-165](./S4-165-the-message-budget-measured-for-the-first-time-and-five-of-seven-types-never-existed.md)
was cycle 1. This is cycle 2, and the comparison says something the single measurement could not.**

## The two cycles

| | cycle 1 · 10:30 UTC | cycle 2 · 14:26 UTC |
| --- | --- | --- |
| runs that consumed a message | 68 | **68** |
| mean message tokens per run | 263 | **263** |
| mean work tokens per run | 25,955 | **25,955** |
| **share of the receiving run's tokens** | 1.0118% | **1.0118%** |
| worst single run | 5.207% | **5.207%** |
| real message tokens, all time | 17,881 | **17,881** |
| real run tokens, all time | 36,118,554 | **36,821,575** |
| all-time share | 0.0495% | **0.0486%** |

**Verdict on the guard: the feature stays, and the trend is away from the threshold.** Work grew by
**703,021 tokens** between the cycles and messages grew by **zero**, so the share fell. Nothing about
this is close to the 50% at which §1 says the feature comes out.

## But the reason it passes is not the reason cycle 1 implied

**Cycle 1 read as "addressed messages stayed bounded exactly as the spec argued they would." Two
cycles say something narrower and less flattering: nothing is sending any.**

| | |
| --- | --- |
| messages created today | **0** |
| **newest message anywhere** | **2026-08-27 02:03:56** — four days ago |
| tracks active since that message | **4** |
| messages on `d2263583`, today's live acceptance candidate | **0** |
| station transitions that track made | **2** |

**A budget check on a dormant feature is vacuous.** That is this repository's own named rule — *a scan
of nothing must never report clean* — and cycle 1 reported clean without asking whether anything was
being counted. **I am correcting my own verdict rather than letting the number stand on its own.**

## Why the spine files no handoff, and it is one missing column

`SPEC-AGENT-COMMS.md` §3 justifies the Handoff type in one sentence:

> *"**The station transition already IS this** and it is invisible today."*

**Measured now, the station transition still is not it.** The type exists and has 143 rows — and the
spine wrote none of them.

| | |
| --- | --- |
| `agent_messages` carrying a `mission_id` | **160 of 161** |
| `agent_messages` carrying a `track_id` | **1 of 161** |

**`enqueueHandoff` (`handoff.server.ts:316`) is the only writer of `kind: "handoff"`, and its insert
sets `mission_id` and never `track_id`** (`:393-407`). Its callers are `fanout.server.ts`,
`mission-advance.server.ts`, `verify-green.server.ts` and one tool in `registry.server.ts`. **None is
in `src/lib/spine/**`** — the spine driver imports only `createMission` from that module.

**So handoffs are a mission-path feature, and the acceptance runs on the track path.** A track can walk
all seven stations and file not one message, which is exactly what `d2263583` did across two
transitions today. The one row that does carry a `track_id` is the exception that shows the column
exists and is simply not set by the writer.

## What this does and does not mean

**It is NOT a claim that the loop is broken.** The stations hand work on through
`spine_track_members` and the driver's own briefing, and that works — `d2263583` reached Decide with
its Discover artifacts intact. **The handoff MESSAGE is a separate, legible record of that transfer,
and it is the thing R-13 and the founder's ruling asked to be able to see.**

**It is a claim that the one message type we have does not reach the surface the product is judged
on.** Every station transition on every track since 2026-08-27 has been invisible to the channel built
to show it.

**And it re-frames S4-165's other half.** I reported five of seven types never written. The sharper
statement is: **of the seven, one is implemented, and it is wired to the wrong path.**

## Owner

**S0** — `src/lib/ai/handoff.server.ts` and `src/lib/spine/**`. The narrow question is whether
`enqueueHandoff` should take a `track_id` and whether the spine's station advance should call it.
**I am not proposing the wiring**: `mission-advance.server.ts` already calls it for missions, and
whether the spine should reuse that path or get its own is an architecture call.

**Cheap and separate: `enqueueHandoff` could set `track_id` from the mission's track today** without
any new call site, which would at least make the existing 143 rows joinable to the tracks they belong
to.

No product code written. Nothing pressed, no approval answered, no row written.
