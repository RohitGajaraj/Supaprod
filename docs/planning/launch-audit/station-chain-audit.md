# The seven stations, measured against production

> _Created: 2026-08-10 · Lane 1 (function / gaps / ship) · Every number below is a query against the live database, not a code reading._

**Read this beside [`GAP-CLOSURE-REGISTER.md`](./GAP-CLOSURE-REGISTER.md), which owns the audit list, and [`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md) section 0, which owns status.**

This audit asks one question per station and one about the system: **does work actually flow through, or does the station merely exist?** The objective test is `artifact_lineage`. A handoff that happened leaves an edge; a handoff a human re-keyed by hand leaves none. So the edge counts below are the honest measure of whether the pass between stations is automatic and lossless.

**Everything is split demo versus real.** Seven `Helio Labs` workspaces (`10000000-…` through `70000000-…`) carry seeded demo data, and counting them is how three prior readings of this chain came out healthy. Only the REAL column means anything.

---

## The headline, and it inverts the assumption the brief was written on

**The brief asks whether Learn dead-ends. It does not. Learn is the strongest cross-station link in the product.**

**The dead end is at the other end of the chain: Discover.** 86 real themes were formed from 156 real signals, and **3** of them ever became an opportunity. 83 dead-ended.

The product ingests and clusters signal well, and then almost never promotes it. That is the single largest leak in the lifecycle and it sits in the first station a new user meets.

---

## The chain, real data only

| Handoff | Real edges | Reading |
| --- | --- | --- |
| signal → theme | **156** | Healthy. Discover's first half works. |
| theme → opportunity | **3** | **The break.** 83 of 86 themes dead-end. |
| signal → opportunity | 2 | The direct path is barely used either. |
| opportunity → decision | 12 | Thin but real. |
| decision → opportunity | 12 | Real backward motion, as the non-linear ruling intends. |
| opportunity → prd | 5 | Thin. |
| decision → prd | **0** | Specs are not being cut from decisions at all. |
| prd → task | 7 | Real. |
| prd → mission | **3** | Near-break, against 228 real missions. |
| prd → prototype | 1 | Barely exercised. |
| mission → changeset | **0** | **Unexercised on real data.** |
| changeset → deployment | **0** | **Unexercised on real data.** |
| prd → design_memory | **0** | Design is not in the loop on real work. |
| design_memory → prd_scaffold | **0** | Same. |
| decision → learning | 8 | Real. |
| **learning → decision** | **36** | **The healthiest cross-station edge in the product.** |
| **learning → opportunity** | **4** | The Learn→Discover arrow, live. |

---

## Station by station

### 01 Discover — **does half its job**
Ingest and clustering are real and working: 156 real signals, 86 real themes. Promotion is not: 3 theme→opportunity edges. **A user finishing real work here would have to promote by hand, and 83 times nobody did.** This is the P0 of the audit. It is also the first station a new user sees, so the leak is in the shop window.

### 02 Decide — **works, and is fed mostly by Learn, not by Discover**
154 real decisions. Its largest real inbound edge is `learning → decision` at 36, four times the 12 it receives from opportunities. **Decide is being fed by the loop's end, not its start**, which is a real and defensible product behaviour, and it is not the story the UI tells.

### 03 Define / Plan — **works, thin intake**
31 real specs. Intake is 5 from opportunities and **0 from decisions**. The decision→spec link does not exist in real data.

### 04 Design — **outside the product**
Zero real edges in either direction. Consistent with the standing observation that design often lives outside the product. **This is not necessarily a defect, but it means the station is decoration on the real path today** and should not be presented to a first-timer as a required step.

### 05 Build — **the busiest station, and it does not hand off**
228 real missions, the largest real population in the lifecycle. But `mission → changeset` is **0**. Build is where work actually happens and where the chain stops recording.

### 06 Ship — **unexercised on real data**
`changeset → deployment` is 0. 42 deployments exist, all demo. No real work has traversed Build→Ship with lineage.

### 07 Learn — **wired, closing the loop, and starved of new input**
81 real learnings, and 40 real write-back edges into Decide and Discover. **The loop closes.** The constraint is upstream: `agent_memory` holds **zero** rows of `kind='outcome'` against 119 learnings, so the precedent pool has never been written. The write path was proven against production inside a rolled-back transaction and every write was accepted, so it is unexercised rather than broken. Closing it needs a human to settle one real outcome; an agent must not sign in as a user.

---

## Is seven the right number?

**On this evidence, the seven are not seven equal doors and should never be drawn as such.** Measured by real throughput they are three groups:

- **Load-bearing and busy:** Discover, Decide, Build (156 / 154 / 228 real artifacts)
- **Load-bearing and thin:** Plan, Learn (31 / 81)
- **Not on the real path today:** Design, Ship (0 real edges either side)

The existing two-altitude nav already reflects this correctly: five rail sections, with the 01-07 strip one altitude down inside `/runs`. **That ruling is confirmed by this data and should not be reopened.** A first-timer greeted by seven equal doors would be given four that real work does not currently flow through.

---

## What this audit changes

| P | Finding | Action |
| --- | --- | --- |
| **P0** | theme → opportunity: 83 of 86 real themes dead-end | Promotion is the missing step in Discover. Needs a real path, not a manual one. |
| **P0** | mission → changeset → deployment: 0 real edges against 228 missions | Build→Ship lineage is not being written. Either the edge is not recorded or the path is not taken. |
| **P1** | decision → prd: 0 real edges | Specs are not cut from decisions. Check whether the door exists. |
| **P1** | Design and Ship carry no real edges | Do not present them as required steps to a first-timer. |
| **Confirmed healthy** | learning → decision (36) and learning → opportunity (4) | The Learn→Discover arrow is live. Say so, in the past tense that the data supports. |

---

## Method, so this can be re-run

Every figure is a query against `artifact_lineage`, `signals`, `opportunities`, `decisions`, `prds`, `missions`, `deployments` and `learnings`, filtered with:

```sql
workspace_id::text not like '_0000000-0000-4000-8000-000000000000'
```

which excludes the seven seeded `Helio Labs` workspaces. **Re-run with that filter or the chain reads healthy and is not.**
