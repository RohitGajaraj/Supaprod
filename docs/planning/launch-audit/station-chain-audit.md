# The seven stations, measured against production

> _Created: 2026-08-10 · Last updated: 2026-08-11_

> # 🛑 EVERY EDGE COUNT IN THIS AUDIT IS SEED DATA. RETRACTED 2026-08-11.
>
> This document separated real lineage from demo lineage by **matching the shape of a workspace id**. `seed_sample_workspace()` gives its workspace an ordinary random id, so **seeded rows counted as production and the test was wrong in both directions.**
>
> **What is actually true, requeried against the `seeded` column:** all **71** `learning → decision` edges are seeded, **zero** are real. `prd → learning` returns **zero rows**; that writer had never fired. Of 1,121 `artifact_lineage` rows, **120** were written by the product itself.
>
> **So the "36" that this audit calls "the healthiest cross-station edge in the product" does not exist**, and neither does the 4:1 ratio derived from it. **No number in this file may be cited.**
>
> **AND THE STRUCTURAL HALF IS SUSPECT TOO. This retraction first said the writer-existence findings still stood; that was too generous and Lane 1 was right to push back.** Those findings were derived by asking *which hop types had rows*, which is the same census, so a hop whose only rows sat in a mis-classified workspace read as "no writer exists". At least two were wrong that way: `design_memory -> prd_scaffold` and `prd -> design_memory` both have live writers and had written rows.
>
> **Writer existence must be derived from the code, never from row counts.** Done 2026-08-11 by grepping every `artifact_lineage` insert plus every call to `recordLineage`, `recordLineageSafe`, `recordDecisionOrigins` and `recordLearningPrecedents`: **12 direct write sites, 18 helper call sites.** The pairs that genuinely have a writer in `src/`:
>
> | Writer exists | Where |
> | --- | --- |
> | `signal -> opportunity` | `discovery.functions.ts:943`, `:3909` |
> | `signal -> theme` | `ai/cluster.server.ts:433` |
> | `theme -> opportunity` | `discovery.functions.ts:927` |
> | `opportunity -> decision` | `discovery.functions.ts:1774` |
> | `opportunity -> prd` | `discovery.functions.ts:3733` |
> | `prd -> mission` | `studio.functions.ts:405` |
> | `prd -> prd_flow` | `flows.functions.ts:158` |
> | `prd -> prototype` | `prototypes.functions.ts:121` |
> | **`prd -> learning`** | **`outcome.functions.ts:632`** |
> | `prd_flow -> prd_scaffold` | `design-scaffold.functions.ts:596` |
> | `design_memory -> prd_scaffold` | `design-scaffold.functions.ts:640` |
> | `mission -> decision` | `test-station.functions.ts:238` |
> | `mission -> prd` | `design-parity.functions.ts:217` |
> | `mission -> changeset` | `ai/tools/registry.server.ts:1739` |
> | `changeset -> deployment` | `deployments.functions.ts:993` |
> | `capability_change -> decision` | `capabilities.functions.ts:665` |
> | `decision -> decision` | `contradiction-auditor.functions.ts:77` |
> | `house_rule -> house_rule` | `house-rules.functions.ts:430` |
>
> **The distinction this makes, and it is the honest version of our own claim:** `prd -> learning` **has a writer, and as of 2026-08-11 it has fired.** 14 rows, all in demo workspaces, production still 0. It read "never fired" until Lane 1 settled 14 shipped specs through the product's own write sequence. That is a very different statement from "the loop is not built", and it is the true one. **A writer that exists and has not run is a product waiting for a user. A hop with no writer is a hole.** Only the code can tell them apart, and the row count cannot.
>
> Correct figures and their queries: [`../../pitch/verified-numbers.md`](../../pitch/verified-numbers.md).

> _Created: 2026-08-10 · Lane 1 (function / gaps / ship) · Every number below is a query against the live database, not a code reading._
>
> _Revised 2026-08-10: the `decision → prd` row is **struck**. It was an error in this audit, not a gap in the product. What replaced it is a new P1 pointing the other way, and a correction to the generalizable lesson at the foot of this page._

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
| opportunity → prd | 5 | Thin, and it is the *whole* of the Decide→Plan handoff. |
| ~~decision → prd~~ | ~~**0**~~ | ~~Specs are not being cut from decisions at all.~~ **Row struck 2026-08-10. The expectation was wrong, not the code** — see "The row that was struck" below. |
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

**What those 154 rows actually are, measured, because the count alone misleads** and it is what the struck row below turns on:

| `source_kind` | Real rows | Written by |
| --- | --- | --- |
| `mission` | **105** | 84 of them `auto_origin`, the "Mission completed: …" receipt `src/lib/ai/handoff.server.ts` files when a Build mission finishes. The rest are the "Capture · files this as a decision" press on a mission, and agent captures. |
| `roadmap` | 28 | strategist / prd-writer |
| `retrospective` | 8 | strategist |
| `critic` | 8 | critic |
| `manual` | 3 | human |
| `meeting` | 2 | meeting extraction |

**Zero of the 154 carry a `prd_id`**, and 105 of them are receipts for a mission that only exists because a spec already did. `decisions` is not station 02's queue; it is **the company's ledger of calls, written from every station**. The queue a person works on `/decide` is `opportunities` — README's own definition, "a living, re-scored opportunity queue".

### 03 Define / Plan — **works, and its only intake is the bet**
31 real specs, and every real edge into one comes from an opportunity (5). That is not a *partial* intake, it is the whole of it: the product has exactly one spec origin, the bet. The `decision → spec` link the table above measured as missing is a hop the product was never built to have, in either direction. See below.

### 04 Design — **outside the product**
Zero real edges in either direction. Consistent with the standing observation that design often lives outside the product. **This is not necessarily a defect, but it means the station is decoration on the real path today** and should not be presented to a first-timer as a required step.

### 05 Build — **the busiest station, and it does not hand off**
228 real missions, the largest real population in the lifecycle. But `mission → changeset` is **0**. Build is where work actually happens and where the chain stops recording.

### 06 Ship — **unexercised on real data**
`changeset → deployment` is 0. 42 deployments exist, all demo. No real work has traversed Build→Ship with lineage.

### 07 Learn — **wired, closing the loop, and starved of new input**
81 real learnings, and 40 real write-back edges into Decide and Discover. **The loop closes.** The constraint is upstream: `agent_memory` holds **zero** rows of `kind='outcome'` against 119 learnings, so the precedent pool has never been written. The write path was proven against production inside a rolled-back transaction and every write was accepted, so it is unexercised rather than broken. Closing it needs a human to settle one real outcome; an agent must not sign in as a user.

---

## The row that was struck: `decision → prd`

**The first reading of this row asked the wrong question.** It read a zero and asked "where is the door?". The answer is that there is no door because there is no hop, and the correct action was to fix the audit.

**What decided it, in the order the evidence arrived:**

1. **The schema models the arrow the other way.** `prds` carries `opportunity_id` and no reference to a decision of any kind. `decisions` carries `prd_id`, `mission_id` and `meeting_id` — every foreign key on a decision points at the artifact the call was made *about*. `createDecision`'s `source_kind` enum is `meeting | mission | prd | manual | roadmap | retrospective | critic | opportunity | mcp`: a spec is named as a decision's **source**. The reverse is not named anywhere, and never has been.
2. **No door, and none is missing.** Two code paths create a spec: `generatePrd` (`src/lib/discovery.functions.ts:3300`, the human door) and the `prd.draft` agent tool (`src/lib/ai/tools/registry.server.ts:3188`). Both take `opportunity_id` **or** `brief`, and `prd.draft` was deliberately widened to the brief path on 2026-08-06 so mid-lifecycle work could enter. Neither takes a decision, and the widening that was written specifically to fix "the Define station had no door for work that skipped Decide" reached for a brief, not for a decision.
3. **Every `child_kind: "prd"` writer in `src/` has a non-decision parent.** There are exactly three. `discovery.functions.ts:3712` writes `opportunity → prd`; `design-parity.functions.ts:221` writes `mission → prd` under relation `design_parity`, and nothing calls it yet; `registry.server.ts:3489` writes the `revised` attribution edge for rewind, whose parent is the spec's own bet or, failing that, the spec itself. None of the three has a branch that could ever put a decision on the parent side.
4. **The Decide→Plan handoff already exists, and it is the row above.** `/decide`'s Gate says "Keep it and draft the spec"; it runs `generatePrd({ opportunity_id })`. The `decisions` row that the same settle writes (`recordJudgment`, `source_kind: 'opportunity'`) is a **sibling** of the spec under the same bet, not its parent. Recording `decision → prd` would double-count one handoff and put a judgment receipt upstream of the thing it was a receipt for.
5. **Nothing reads it.** Learn closes the loop through the bet: `applyOutcome` writes `prd → opportunity` (`inferDirectEdge`), and the write-back lands as `learning → decision` (36) and `learning → opportunity` (4). The walk from a settled spec to "the decision that caused it" goes through the opportunity. No reader in the product asks for a decision's child spec.
6. **The 154 decisions could not have produced a spec.** 105 are mission receipts, 8 retrospectives, 8 critic verdicts. Zero carry a `prd_id`. See the station 02 table.

**Where the expectation came from, which is the part worth keeping.** 21 `decision → prd` edges DO exist in the database — 14 `promoted` and 7 `informs` — **and every one of them is demo seed**. `supabase/migrations/20260725130000_helio_demo_seed_rich.sql` opens its lineage block with the comment `theme -> opportunity -> decision -> prd -> changeset -> deployment`, and then inserts that chain. That comment is a narrative of how product work feels, not a description of this product's model, and it is the source of the row this audit filed.

**So the seed fabricated this hop exactly as it fabricated `mission → changeset` and `changeset → deployment`, and the right answer is the opposite one.** Those two were capabilities with no writer and were built (`8996b895`). This one is a shape the product deliberately does not have, and building it would have added a second spec origin nobody asked for. **A demo-seeded hop is evidence that somebody imagined it, never that it ought to exist** — the seed has to be checked against the schema and the doors before it is treated as a specification.

**Nothing was changed in `src/`.** The only code-shaped observation worth carrying forward is an adjacent one, and it is not this row: `decisions.prd_id` and `decisions.mission_id` — the directions the schema *does* model — have no lineage writer either. 105 real decisions stand against a mission and 0 against a spec, and none of them leaves an edge. That is a separate finding about `prd → decision` and `mission → decision`, and it is listed below rather than fixed here.

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
| **P0** | ~~mission → changeset → deployment: 0 real edges against 228 missions~~ | **CLOSED `8996b895`.** The cause was not a broken edge: **no code path in `src/` had ever written `child_kind: "changeset"` or `child_kind: "deployment"`.** The 21 + 14 edges in production are demo seed, each stamped with a plausible `created_by_agent` so they read as real agent writes. Both are now written, plus a third (`prd → learning`) that the same guard found unprompted. |
| **P0** | theme → opportunity: 83 of 86 real themes dead-end | **Reframed, and my first reading was wrong.** Promotion is *deliberately* rare (the Sentry/Linear triage model, documented 2026-08-01): most themes should be dismissed or merged. The real finding is that **zero real themes have ever been dismissed or merged**, and 48 of 87 sit untriaged at `new`. The decline verb exists and has a door; nothing records *why* a theme stopped. |
| **P1** | `themes.status` holds two vocabularies | Triage writes `new`/`dismissed`/`merged`/`promoted`; real data also holds `active`/`at_risk`/`confirmed`/`investigating`. The column has no CHECK constraint, so both coexist silently. |
| ~~**P1**~~ | ~~decision → prd: 0 real edges~~ | **STRUCK 2026-08-10, and the audit was wrong rather than the code.** The door does not exist and none is missing: `prds` has no decision reference, `decisions.prd_id` points the other way, both spec-creating paths take a bet or a brief, and all 21 edges of this shape in the database are demo seed. Full reasoning in "The row that was struck" above. **No code changed.** |
| **P1** (new, from the same investigation) | `prd → decision` and `mission → decision`: the directions the schema DOES model have no lineage writer | `createDecision` writes `decisions.prd_id` / `decisions.mission_id` and no edge; `handoff.server.ts` files 84 auto-origin mission receipts and no edge. So 105 real decisions stand against a mission with nothing in the graph saying so, and Decide's real inbound is under-measured by every reading in this document. **Not fixed in this pass** — it is a writer gap, not a doctrine error, and it wants the same chain guard treatment as the three hops closed in `8996b895`. |
| **P1** | Design and Ship carry no real edges | Do not present them as required steps to a first-timer. **The two zeros have different causes and neither is the `decision → prd` one.** *Ship:* the writers did not exist until today (`registry.server.ts:1742`, `deployments.functions.ts:969`, both from `8996b895`), so the zero is now "awaiting real traffic", not "unwritable". *Design:* the writers already exist and always did (`recordScaffoldGrounding` and the `taught` back-edge in `design-memory.functions.ts`); the zero is that there are **0 real `design_memory` rows** in the entire database against 76 demo ones. There is nothing to draw an edge from. |
| **Confirmed healthy** | learning → decision (36) and learning → opportunity (4) | The Learn→Discover arrow is live. Say so, in the past tense that the data supports. |

### The generalizable lesson

Three of the hops above were not *broken*, they were **never built** — and looked built because the demo seed fabricated them with believable agent attribution. A per-edge test cannot catch that, because there is no code to test. Only a guard that starts from the **chain** and asks *who writes this hop* finds a hop nobody writes: [`the-ledger-chain-has-a-writer-for-every-hop`](../../../src/lib/__tests__/the-ledger-chain-has-a-writer-for-every-hop.test.ts). It was written expecting two failures and returned three.

**And the half of that lesson this audit had to learn the hard way**, added 2026-08-10 after the `decision → prd` row was struck: **a fabricated hop is evidence that somebody imagined it, never that it ought to exist.** The same seed file that hid three real gaps also invented one that is not a gap at all, and both came out of the same one-line comment sketching a chain.

**So before a zero is filed as a defect, ask two things of the hop, and both are cheap.** *Could the relation be held?* — is there a column or foreign key on the child pointing at that parent. *Could the parent be supplied?* — does any door that creates the child take that parent as an argument. `studio_changesets.mission_id` exists and the Studio stage call has the mission in hand, so `mission → changeset` was a real hop with no writer: a defect, and it was built. `prds` has no decision reference, the reference runs the other way as `decisions.prd_id`, and neither spec-creating door accepts a decision — so `decision → prd` fails both questions. It was never a hop. It was a drawing.

**The guard also has a known blind spot that this row sits squarely inside**, and it is worth stating where the guard is cited: it asserts only that *some* code writes each child kind. `opportunity → prd` satisfies its `prd` assertion, so the guard reads green whatever happens to the decision path. It is a test of child kinds, not of parent-child pairs, and it cannot adjudicate a row like this one. Reading the schema and the doors is what did.

---

## Method, so this can be re-run

Every figure is a query against `artifact_lineage`, `signals`, `opportunities`, `decisions`, `prds`, `missions`, `deployments` and `learnings`, filtered with:

```sql
workspace_id::text not like '_0000000-0000-4000-8000-000000000000'
```

which excludes the seven seeded `Helio Labs` workspaces. **Re-run with that filter or the chain reads healthy and is not.**
