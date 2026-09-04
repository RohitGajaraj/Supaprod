# Depth A - The Universal Provenance Layer

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> _Written 2026-07-28 · angle A of the three-way depth design for the rebuilt authenticated app._
> _Owns: "why did we decide this". Hands off to B (agentic Ask) and C (analytics)._
>
> **Every claim below was checked against the code in this session.** Where the briefing
> document I was given was wrong, I say so and cite the file and line. Where the founder's
> stated assumption is wrong, I say so plainly. Nothing here is aspirational: each item is
> tagged **EXISTS** / **WIRING** / **BUILD**.

---

## 0. The one-paragraph verdict

Supaprod does not have a provenance problem. It has a **vocabulary problem that presents as a
provenance problem**. Eleven separate hand-maintained maps in eleven files each decide,
independently, what kinds of thing exist in this product. They disagree. `audit-id.ts` knows
twelve kinds. `lineage.functions.ts` knows thirteen - a different thirteen. `knowledge-graph-view.ts`
knows ten. Two of them call the same table by different names (`spec` vs `prd`). None of them
knows what a changeset, a deployment, a learning, or a memory is. So the moment work crosses from
Plan into Build, the product stops being able to name what it is looking at, and everything
downstream - the graph, the audit sheet, the "why", the Ask answer - goes quiet. It is not that
the back half writes no provenance. It is that **the back half writes provenance about entities
the reader vocabulary cannot see.**

The fix is one registry, twenty-one entity kinds, sixteen new `recordLineage` call sites, one
gesture, and one CI test. It is roughly a two-week build and it is the highest-leverage thing in
this rebuild, because Depth B (agentic Ask) and Depth C (analytics) both consume the vocabulary
this document defines.

---

## 1. Corrections to the ground truth I was handed

I was asked to verify rather than trust. Six things were wrong or incomplete.

### 1.1 `recordLineage` is not the only writer. There are twelve more, and they bypass the contract.

The brief lists nine `recordLineage` call sites and concludes lineage writing is confined to them.
It is not. Twelve modules write to `artifact_lineage` **directly**, with no type checking against
`ARTIFACT_KINDS` at all:

| File | Line | What it writes |
| --- | --- | --- |
| `src/lib/ai/cluster.server.ts` | 210 | `signal --promoted--> theme` (batch) |
| `src/lib/ai/edge-extractor.server.ts` | 23 | `prd --validates\|contradicts--> opportunity` |
| `src/lib/ai/supersession.server.ts` | 130, 139 | typed supersession edges + bi-temporal retirement |
| `src/lib/contradiction-auditor.functions.ts` | 77 | contradiction edges |
| `src/lib/decisions.functions.ts` | 321 | decision revision edges |
| `src/lib/design-memory.functions.ts` | 304 | design-memory edges (batch) |
| `src/lib/design-parity.functions.ts` | 190 | design → build parity edge |
| `src/lib/design-scaffold.functions.ts` | 199 | prd → design scaffold |
| `src/lib/flows.functions.ts` | 158 | prd → flow |
| `src/lib/house-rules.functions.ts` | 241 | house-rule edges |
| `src/lib/lineage.functions.ts` | 368 | `prd --promoted--> task[]` (batch, inside `promotePrdToTasks`) |
| `src/lib/test-station.functions.ts` | 238 | `mission --test_verdict--> decision` |

Consequence: `ARTIFACT_KINDS` is not a contract. It is a suggestion that nine call sites happen to
honour. Any CI gate built only around `recordLineage` would pass while twelve writers freely
insert whatever they like. **The gate has to be on the table, not on the helper.**

### 1.2 Ship and Learn are not lineage-free. They write edges about the *wrong nodes*.

The brief says "Ship and Learn write no lineage at all". Checked: false, and the truth is more
interesting.

- `recordOutcome` (`src/lib/outcome.functions.ts:365`) calls `inferDirectEdge`, which writes
  `prd --validates--> opportunity` (`src/lib/ai/edge-extractor.server.ts:23`). Real edge, ships today.
- `recordOutcome:344` calls `inferSupersession`, which writes typed `supersedes` / `contradicts`
  edges with bi-temporal `valid_to` retirement (`src/lib/ai/supersession.server.ts:130`). Real,
  but flag-gated on `DECISION_BRAIN_SUPERSESSION` and dormant by default.
- `recordTestStationVerdict` (`src/lib/test-station.functions.ts:238`) writes
  `mission --test_verdict--> decision`.

So the back half is not silent. It writes edges **between front-half nodes**. The `learnings` row
that was just inserted at `outcome.functions.ts:275` never becomes a node. The `agent_memory` row
distilled at `:297` never becomes a node. The `studio_changesets` row that carried the code never
becomes a node. The `deployments` row that put it in front of users never becomes a node.

That is a sharper and more damning statement than "no writes". The loop is drawn as a closed
circle in every strategy doc, and in the data it is a circle whose right-hand half is rendered as
a single arc from `prd` back to `opportunity`, with the four entities that actually did the work
erased. A user asking "why did we decide this" gets an answer that stops at the spec. A user
asking "what did this decision actually cause" gets nothing, because causation lives in nodes that
do not exist.

### 1.3 There is a dead lineage call site that has never once written a row.

`src/lib/capabilities.functions.ts:665`:

```ts
await recordLineageSafe(supabase, userId, {
  parent_kind: "capability_change",
  parent_id: changeId,
  child_kind: "decision",
  child_id: agentSlug,          // <- an agent slug, e.g. "builder"
  relation: "documents",
  rationale: description,
});
```

`agentSlug` is typed `string` at `capabilities.functions.ts:610` and carries values like
`"builder"`. `artifact_lineage.child_id` is `UUID NOT NULL`
(`supabase/migrations/20260602205139_5f25aeb6-a127-4db9-8df5-d331dbbe5e25.sql:384`). Every call
raises Postgres `22P02 invalid input syntax for type uuid`, which `recordLineageSafe` catches and
discards by design (`lineage.functions.ts:70`). This call site has produced zero rows since it was
written, and the fail-soft wrapper guaranteed nobody would ever find out. The comment on the line
even admits it: `// Use agent slug as the artifact id (non-standard but acceptable)`. It is not
acceptable; it does not work.

This is the strongest possible argument for the CI gate in §7: fail-soft provenance without a
compile-time or test-time contract is provenance that silently does not exist.

### 1.4 There are two parallel provenance systems that can disagree with each other.

`src/lib/trust-chain.functions.ts` (461 lines) reconstructs the canonical nine-link chain - signal, decision, contract, design, build, test, merge, deploy, outcome - **entirely from foreign
keys**, not from `artifact_lineage`. It walks `decisions.mission_id`,
`studio_changesets.mission_id`, `prds.opportunity_id`, `opportunities.theme_id`,
`deployments.changeset_id`, `learnings.mission_id`. It never reads a lineage edge.

`src/lib/lineage.functions.ts` `getProvenance` walks the same conceptual chain **entirely from
`artifact_lineage`**, and never reads a foreign key.

Both are mounted. `AuditLineageSheet.tsx:73` renders the FK-walked `MissionChain` *underneath* the
lineage-walked steps in the same sheet. Two answers to the same question, side by side, computed
from different substrates, with nothing reconciling them. Today they mostly agree because the FK
walk is more complete; the moment lineage improves, they will visibly diverge in one sheet.

Design ruling below (§2.3): **the FK walk is the ground truth for the nine links; lineage is the
ground truth for everything else.** Do not merge them into one query. Do reconcile them into one
sentence stream, and make disagreement a visible, named state rather than two silent columns.

### 1.5 The audit-id resolver has two defects that will bite before launch.

`src/lib/audit-lineage.functions.ts:106`:

```ts
const res = await db.from(meta.table).select("*").limit(2000);
const rows = (res.data ?? []) as Array<Record<string, unknown>>;
const row = rows.find((r) => typeof r.id === "string" && auditShort(r.id as string) === short);
```

**Defect one, correctness.** Clicking any audit tag pulls **every column of up to 2,000 rows** of
that table across the wire and scans them in the Worker. At 2,001 rows the entity you clicked may
simply not be in the window, and the sheet says "No record found for MIS·7E7D59 in this workspace" - which reads to the user as "this id is fake". A trace tag that lies about its own existence is
worse than no trace tag.

**Defect two, ambiguity.** `auditShort` (`audit-id.ts:69`) takes the first six alphanumerics of
the uuid - 24 bits. Within one table, the probability of at least one colliding pair is
approximately `n² / 2^25`: about 0.3% at 1,000 rows, **37% at 5,000 rows**, near-certain at
20,000. `rows.find` returns the *first* match. So at real scale a click on one signal opens a
different signal's record, confidently, with no error. The id is the product's promise of
verifiability. It must not be able to resolve to the wrong thing.

Both are fixed in §4.2 with a generated column and a unique index, not with a longer string.

### 1.6 Three of the thirteen artifact kinds render as untitled ghosts in the graph.

`ARTIFACT_KINDS` (13) ⊃ `GRAPH_NODE_KINDS` (10). The extras are `prototype`, `house_rule`,
`capability_change`. `hydrateTitles` in `knowledge-graph-view.functions.ts:206` does
`const spec = TITLE_TABLE[kind]; if (!spec) continue;` - so those three nodes are drawn with an
empty title. And `KindSchema = z.enum(GRAPH_NODE_KINDS)` at `knowledge-graph-view.functions.ts:23`
means focusing the graph on one of them throws inside the handler, is swallowed by the
`catch { return emptyGraph(); }` at `:310`, and the user sees an empty canvas rather than an error.
Two silent failures stacked on one vocabulary mismatch.

---

## 2. Where the founder is factually wrong, and what is right instead

The mandate grants authority to override. Three overrides.

### 2.1 ZeroEntropy is not a product dependency. Do not plan around it.

The founder's mandate says "We have PostHog, ZeroEntropy for graph, and I believe we are using
Sentry for error catching."

`grep -rin "zeroentropy\|zembed" src/` returns **zero hits**. The only occurrence in the whole
repository is `ZEROENTROPY_API_KEY` in the git-ignored `.env`. That key belongs to the founder's
**local developer knowledge brain** (gbrain, PGLite at `~/.gbrain/brain.pglite`, `zembed-1`
embeddings, documented in the user-level `CLAUDE.md`). It is a tool that indexes his Mac. It has
never been called from Supaprod's runtime and it cannot be - the product runs in a Cloudflare
Worker with no line to a local PGLite file.

The product's own embeddings run through `src/lib/rag/embed.server.ts`, which routes to the
Lovable AI gateway, direct OpenAI, or Cohere `embed-v4.0` depending on the BYO-key chain
(`embed.server.ts:22-27, 101-123`). The graph is not vector-backed at all: it is a bounded BFS
over Postgres rows in `artifact_lineage` (`knowledge-graph-view.functions.ts:141`).

**Ruling: no ZeroEntropy anywhere in this design.** If someone reads "ZeroEntropy for graph" in a
plan and wires it, they will add a vendor dependency, a per-call cost, and a second embedding
space that disagrees with the first, to solve a problem that is a `JOIN`.

### 2.2 Sentry is half-right, and the half we have is the better half.

There is no `@sentry/*` package in `package.json` - correct, as the brief says. But
`src/lib/observability/errors.ts` is not a stub. It posts to Sentry's **envelope HTTP API
directly**, deliberately, so that a heavyweight SDK never enters the Workers bundle (its own
header comment says exactly this). Underneath it there is an always-on, vendor-free floor:
`recordErrorEvent` writes every capture into the `error_events` table with a per-isolate storm
guard (`errors.ts:31-40`), which works with zero keys and the gate off.

**Ruling: do not install `@sentry/*`.** The envelope client is the right architecture for a
Workers runtime and the first-party `error_events` floor is the thing that actually guarantees the
founder can always see failures. What is missing is not the SDK, it is the **keys** and the
**provenance link** - an error should be reachable from the trace and the entity that produced it.
That link is designed in §5.4 and costs nothing.

PostHog is similar but inverted: there is no `posthog-js` outbound SDK, and there *is* a real
inbound integration (`src/lib/analytics-ingest.server.ts`) that pulls product-usage cohorts *from*
PostHog using `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID`, surfaced in
`src/components/product/ProductAnalyticsPanel.tsx`. That is Depth C's territory; I flag it here
only so nobody "adds PostHog" and duplicates an integration that exists.

### 2.3 "Everything should have an Audit ID and a Trace ID" is one word too many.

The founder asked for both ids on every section. Taken literally that is wrong, and building it
literally would make the product worse.

An **Audit ID** is an identity: this thing, forever, one id, stable from creation to deletion. A
**Trace ID** is an episode: one burst of machine work, many of which touch the same entity over
its life. A spec written by an agent, revised twice by a second agent, critiqued by a third, and
dispatched by a human has **one** audit id and **four** trace ids. Stamping a single `trace_id`
column on the `prds` table would silently mean "the last trace that touched this", which is the
least useful of the four and looks authoritative.

**Ruling: one audit id per entity (identity), many traces per entity (episodes), joined by a
first-class relation - not a column.** The join table is specified in §5.1. The user never sees
the distinction; they see "5 machine runs touched this" and can open any of them. Depth B's chat
surface consumes the same relation.

---

## 3. The three systems, and the one promise

There are three systems. The user must never learn that.

| | **Lineage** | **Trace** | **Audit ID** |
| --- | --- | --- | --- |
| Question it answers | What caused what | What the machine did | How you refer to it |
| Substrate | `artifact_lineage` (edges between entities) | `ai_events` + `tool_calls` + `guardrail_hits` + `ai_evals`, keyed by `trace_id` | `AUDIT_KINDS` prefix + first 6 alphanumerics of the uuid |
| Shape | A directed, bi-temporal graph | A time-ordered waterfall of spans | A short string, `MIS·7E7D59` |
| Time model | Bi-temporal - an edge can be retired (`valid_to`) without deletion | Immutable, append-only, per-episode | Immutable, permanent |
| Lifetime | The life of the product | The seconds of one run | The life of the entity |
| Who wrote it | An agent or a human promoting an artifact | The AI chokepoint, `runtime.server.ts` | Nobody - derived from the uuid |
| Reader today | `getLineage`, `getProvenance`, `getKnowledgeGraph`, `getMissionChain` | `listTraces`, `getTrace` | `getEntityLineage` |

**The promise, in the user's words:** *point at anything, ask why, get the truth.*

The user's mental model must be a single one: **the record**. The record has a name (the audit id),
it knows what led to it and what it led to (lineage), and it can show you exactly what the machine
did at each step (trace). Three nouns collapse into one gesture (§6) and one sentence grammar
(§6.2). If a user ever has to know that "lineage" and "trace" are different subsystems in order to
find something, this layer has failed.

---

## 4. Part A - the completed vocabulary, and the registry that ends the drift

### 4.1 Kill eleven maps, ship one registry - **BUILD**

New file: **`src/lib/provenance/kinds.ts`** (pure, no server import, unit-tested - the same
constraint `audit-id.ts` already holds).

These eleven hand-maintained maps all encode overlapping facts about the same entity kinds, and
they have already drifted:

| # | File | Line | Map |
| --- | --- | --- | --- |
| 1 | `src/lib/audit-id.ts` | 44 | `AUDIT_KINDS` (kind, prefix, table, label, stage) |
| 2 | `src/lib/lineage.functions.ts` | 7 | `ARTIFACT_KINDS` |
| 3 | `src/lib/lineage.functions.ts` | 93 | `TITLE_COLUMN` |
| 4 | `src/lib/lineage.functions.ts` | 109 | `TABLE` |
| 5 | `src/lib/knowledge-graph-view.ts` | 18 | `GRAPH_NODE_KINDS` |
| 6 | `src/lib/knowledge-graph-view.functions.ts` | 41 | `TITLE_TABLE` |
| 7 | `src/components/supaprod/LineageDrawer.tsx` | 14 | `ROUTES` |
| 8 | `src/components/supaprod/LineageDrawer.tsx` | 28 | `KIND_LABEL` |
| 9 | `src/components/knowledge/GraphNodeStory.tsx` | 26 | `GRAPH_AUDIT_KIND` |
| 10 | `src/components/today/CallDetailSheet.tsx` | 106 | `CALL_AUDIT_KIND` |
| 11 | `src/lib/audit-lineage.functions.ts` | 64 | `LINK_COLS` |

Maps 9 and 10 exist *only* to translate between maps 1 and 2 because they use different tokens for
the same thing. That is the drift made visible.

```ts
// src/lib/provenance/kinds.ts
// THE registry. Every other kind vocabulary in the product derives from this
// array. Adding a traceable entity to Supaprod = adding one row here.
// PURE: no server import, no DB. Unit-tested in kinds.test.ts.

export type LoopStage =
  | "Discover" | "Decide" | "Plan" | "Design"
  | "Build" | "Ship" | "Learn" | "Brain" | "Govern";

export type EntityKindMeta = {
  /** The canonical token. This is what lands in artifact_lineage.parent_kind /
   *  child_kind and what the graph keys on. NEVER renamed once rows exist. */
  kind: string;
  /** Uppercase audit prefix the user sees: MIS, PRD, DEP... Unique. */
  prefix: string;
  table: string;
  titleColumn: string;
  /** The user-facing noun. May differ from `kind` (kind 'prd', label 'Spec') - *  the LOOM W2 convention, already honoured in LineageDrawer.tsx:31. */
  label: string;
  stage: LoopStage;
  /** Participates in artifact_lineage. */
  lineage: boolean;
  /** Renders as a node on the knowledge graph. */
  graph: boolean;
  /** Gets a clickable AuditTag on its cards and detail views. */
  audit: boolean;
  /** Deep link to the entity's own surface. Null = no dedicated surface yet;
   *  the Record sheet is then the terminal view (honest, not a dead link). */
  route: ((id: string) => { to: string; params?: Record<string, string> }) | null;
  /** One line, second person, present tense, for the Record sheet header. */
  gloss: string;
};

export const ENTITY_KINDS: readonly EntityKindMeta[] = [ /* §4.3 table */ ];
```

Then, in the same file, the derived exports that let every existing consumer keep compiling:

```ts
export const ARTIFACT_KINDS = ENTITY_KINDS.filter(k => k.lineage).map(k => k.kind);
export const GRAPH_NODE_KINDS = ENTITY_KINDS.filter(k => k.graph).map(k => k.kind);
export const AUDIT_KINDS      = ENTITY_KINDS.filter(k => k.audit);
export const TITLE_COLUMN = Object.fromEntries(ENTITY_KINDS.map(k => [k.kind, k.titleColumn]));
export const TABLE        = Object.fromEntries(ENTITY_KINDS.map(k => [k.kind, k.table]));
export const byPrefix = new Map(ENTITY_KINDS.map(k => [k.prefix, k]));
export const byKind   = new Map(ENTITY_KINDS.map(k => [k.kind, k]));
```

**Migration path - WIRING, zero behaviour change, ships in one PR:**

- `src/lib/audit-id.ts` keeps `formatAuditId` / `parseAuditId` / `findAuditIds` / `auditShort`
  (they are correct and well-tested) but re-exports `AUDIT_KINDS` from the registry and keeps
  `export type AuditKind` as a union derived from it. The one alias to preserve: today's
  `AuditKind = "spec"` maps to registry `kind: "prd"`. Keep `"spec"` accepted as an input alias in
  `parseAuditId` and in `AuditTag`'s prop type for one release; the registry token is `"prd"`
  because thousands of `artifact_lineage` rows and the DB trigger in
  `supabase/migrations/20260629120100_byo_p3_changeset_prd_join.sql:27` hardcode `'prd'`. Renaming
  the stored token is not worth a data migration for a word the user never sees.
- `src/lib/lineage.functions.ts:7,93,109` - delete, import from the registry.
- `src/lib/knowledge-graph-view.ts:18` and `knowledge-graph-view.functions.ts:41` - delete,
  import. This alone fixes §1.6: `prototype`, `house_rule`, `capability_change` stop being ghosts.
- `src/components/supaprod/LineageDrawer.tsx:14,28` - delete, read `meta.route` and `meta.label`.
- `src/components/knowledge/GraphNodeStory.tsx:26` and
  `src/components/today/CallDetailSheet.tsx:106` - **delete outright.** Once one vocabulary exists
  these translation maps have nothing to translate.
- `src/lib/audit-lineage.functions.ts:64` `LINK_COLS` - replaced by the registry's FK declaration
  in §5.2.

### 4.2 Fix the resolver while the registry is open - **BUILD**

New migration `supabase/migrations/<ts>_audit_short_index.sql`. For every table in the registry:

```sql
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS audit_short TEXT
  GENERATED ALWAYS AS (upper(substring(replace(id::text, '-', '') from 1 for 6))) STORED;

CREATE INDEX IF NOT EXISTS idx_missions_audit_short ON public.missions (audit_short);
```

The expression is the exact SQL twin of `auditShort` (`audit-id.ts:69`): strip non-alphanumerics
(a uuid's only non-alphanumerics are hyphens), take six, uppercase. Add a parity test in the
established `*-sql-parity.test.ts` shape (`src/lib/credit-grant-sql-parity.test.ts`,
`src/lib/entitlements-sql-parity.test.ts`) asserting the TS function and the SQL expression agree
on a fixed corpus of uuids.

Then `audit-lineage.functions.ts:106` becomes:

```ts
const { data: rows } = await db.from(meta.table)
  .select(SELECT_FOR_KIND[meta.kind])   // named columns, never select("*")
  .eq("audit_short", short)
  .limit(2);
```

Two rows requested, not one. **If two come back, that is a collision and the sheet must say so**:
"Two records share the ref `SIG·A1B2C3`. Pick one." with both titles and timestamps. That is the
honest surface. Silently picking the first (today's behaviour) is the failure mode that destroys
trust in the id system the first time it happens in a demo.

Cost: from up to 2,000 full rows per click to one indexed lookup. Correctness: from "wrong at 5k
rows" to "never wrong, occasionally asks".

### 4.3 The completed `ENTITY_KINDS` - twenty-one rows

Legend: **E** = exists in some vocabulary today · **N** = new.

#### Front half (Discover → Design) - mostly present, three corrections

| # | kind | prefix | table | label | stage | lineage | graph | audit | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `signal` | SIG | `signals` | Signal | Discover | ✓ | ✓ | ✓ | E |
| 2 | `theme` | THM | `themes` | Theme | Discover | ✓ | ✓ | ✓ **new** | E, audit added |
| 3 | `opportunity` | OPP | `opportunities` | Opportunity | Decide | ✓ | ✓ | ✓ | E |
| 4 | `decision` | DEC | `decisions` | Decision | Decide | ✓ | ✓ | ✓ | E |
| 5 | `assumption` | ASM | `assumptions` | Assumption | Decide | ✓ **new** | ✓ **new** | ✓ **new** | N |
| 6 | `prd` | PRD | `prds` | Spec | Plan | ✓ | ✓ | ✓ | E |
| 7 | `goal` | GOL | `goals` | Goal | Plan | ✓ **new** | ✓ **new** | ✓ | E, lineage added |
| 8 | `roadmap_item` | RDM | `roadmap_items` | Roadmap item | Plan | ✓ | ✓ | ✓ **new** | E |
| 9 | `task` | TSK | `tasks` | Task | Plan | ✓ | ✓ | ✓ **new** | E |
| 10 | `meeting` | MTG | `meetings` | Meeting | Discover | ✓ | ✓ | ✓ | E |
| 11 | `prototype` | PRO | `prototypes` | Prototype | Design | ✓ | ✓ **fix** | ✓ **new** | E, ghost fixed |
| 12 | `design_memory` | DSM | `design_memory` | Design memory | Design | ✓ | ✓ | ✓ **new** | E |

**Ruling on `assumption`.** `assumptions` already exists with `statement`, `status`,
`decision_id`, `prd_id`, `last_watched_at` (types.ts:1553) and is written by the assumption-watch
cron. Today an assumption is invisible to provenance. It is the single most valuable *front-half*
node for "why did we decide this", because a decision's assumptions are literally the reasons.
Promote it.

#### Back half (Build → Learn) - **this is the hole**

| # | kind | prefix | table | label | stage | lineage | graph | audit | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13 | `mission` | MIS | `missions` | Build session | Build | ✓ | ✓ | ✓ | E |
| 14 | `changeset` | CHG | `studio_changesets` | Change | Build | ✓ **new** | ✓ **new** | ✓ **new** | **N** |
| 15 | `approval` | APR | `agent_approvals` | Approval | Govern | ✓ **new** | ✓ **new** | ✓ **new** | **N** |
| 16 | `deployment` | DEP | `deployments` | Deploy | Ship | ✓ **new** | ✓ **new** | ✓ **new** | **N** |
| 17 | `release` | REL | `changelog_entries` | Release | Ship | ✓ **new** | ✓ **new** | ✓ | E, lineage added |
| 18 | `learning` | LRN | `learnings` | Learning | Learn | ✓ **new** | ✓ **new** | ✓ | E, lineage added |
| 19 | `insight` | INS | `insights` | Belief | Learn | ✓ **new** | ✓ **new** | ✓ **new** | **N** |
| 20 | `memory` | MEM | `agent_memory` | Memory | Brain | ✓ **new** | ✓ **new** | ✓ | E, lineage added |
| 21 | `house_rule` | RUL | `house_rules` | House rule | Brain | ✓ | ✓ **fix** | ✓ **new** | E, ghost fixed |

Two kinds deliberately **excluded**, with reasons, because a vocabulary is defined as much by what
it refuses:

- **`capability_change`** stays in `ARTIFACT_KINDS` for back-compat but gets `lineage: false`. Its
  only write site is the dead one from §1.3. When agents become first-class nodes (out of scope
  here), re-enable it with a real uuid on both ends. Leaving a kind whose only writer is broken is
  how §1.3 happened.
- **`doc`** (`docs` table) is `audit: true, lineage: false, graph: false`. Docs are referenced by
  the RAG retriever, not caused by anything. Making them lineage nodes would flood the graph with
  leaves that explain nothing. If a doc is genuinely evidence for a decision, that is a
  `cites` relation from the *trace*, not a lineage edge - see §5.3.

**Ruling on "belief".** The founder asked for beliefs. Do not create a `beliefs` table. `insights`
already **is** the belief table: it carries `claim`, `confidence`, `horizon_date`, `resolution`,
`resolved_at`, and `brier_score` (types.ts:4098-4125) - a falsifiable claim with a calibration
record. That is the definition of a belief the product can be held to. The registry token is
`insight` (matching the table, so no migration); the **label the user reads is "Belief"**. One
row, two names, zero forks.

#### `GRAPH_RELATIONS` - confirmed complete, extended by four

`knowledge-graph-view.ts:32` already ships `promoted, cites, derived-from, depends-on, validates,
supersedes, contradicts`. The brief is right that relations are the healthy half. Four back-half
verbs are needed and they are additive (the column is free-text `TEXT NOT NULL DEFAULT
'promoted'`, so no migration):

| relation | meaning | written by |
| --- | --- | --- |
| `produced` | this entity was materially created by that one | mission → changeset, changeset → deployment |
| `gated-by` | this could not proceed until that was decided by a human | changeset → approval, deployment → approval |
| `measured-by` | this bet was scored by that outcome | prd → learning, mission → learning |
| `distilled-into` | this became durable, reusable knowledge | learning → memory, learning → house_rule |

Four verbs, chosen so that **the loop reads as an English sentence in one direction**:
*a signal promoted a theme, which promoted an opportunity, which promoted a spec, which dispatched
a mission, which produced a change, gated by an approval, deployed as a deploy, shipped as a
release, measured by a learning, distilled into a memory, which validates the opportunity.* That
sentence is the product. It has never once been renderable.

---

## 5. Part A continued - the exact `recordLineage` call sites to add

Sixteen sites. File, line, edge, and why. All use `recordLineageSafe` (fail-soft) **except** the
two marked hard, where a missing edge is a correctness bug and should surface.

Order matters: every stamp runs **after** the primary write succeeds, per the existing convention
documented at `lineage.functions.ts:56-62`.

### 5.1 Build → the changeset (the first missing link, and the worst one)

**Site 1 - `src/lib/ai/tools/registry.server.ts:1470`**, inside `studio.stage`, immediately after
`changeset = created as ChangesetRow;`:

```ts
await recordLineageSafe(supabase, userId, {
  parent_kind: "mission", parent_id: missionId,
  child_kind: "changeset", child_id: changeset.id,
  relation: "produced",
  rationale: a.title ?? "Staged the first change of this session",
  created_by_agent: agentSlug ?? "builder",
});
```

This single edge is the reason the loop feels disconnected. Today the *only* path from a mission to
its code is the `studio_changesets.mission_id` foreign key, which `trust-chain.functions.ts:211`
reads and the graph cannot. With this edge, the graph crosses from Plan to Build for the first time.

**Site 2 - `src/lib/ai/tools/registry.server.ts:2067`**, inside `studio.pr.merge`, after the
`status: "merged"` update:

```ts
await recordLineageSafe(supabase, userId, {
  parent_kind: "changeset", parent_id: changeset.id,
  child_kind: "decision", child_id: <the merge approval's decision id, when present>,
  relation: "gated-by", ...
});
```

Only when a `deploy.promote` / merge approval exists. If there is none, write nothing - an absent
gate must render as absent, never as fabricated. See the honesty rule in §6.3.

### 5.2 Ship → the deployment and the release

**Site 3 - `src/lib/deployments.functions.ts:95`**, in `captureDeployments`, after the successful
upsert and before `return { captured: rows.length }`. The upsert is `onConflict:
"changeset_id,environment,commit_sha"` so re-select the rows to get their ids, then one edge per
deployment:

```ts
changeset --produced--> deployment   // relation 'produced', created_by_agent null (CI-observed)
```

**Site 4 - `src/lib/deployments.functions.ts:212`**, in `promoteToProduction`, after the production
`deployments` upsert. Same edge, plus:

**Site 5 - `src/lib/deployments.functions.ts:243`**, immediately after the promote-receipt
`agent_approvals` insert at `:229`:

```ts
deployment --gated-by--> approval
```

This is the single most under-rated edge in the product. It is the machine-readable proof that a
**human** cleared production. The Trust Ledger asserts this; nothing links it. **Hard, not
fail-soft** - if we cannot record who authorised a production deploy, the promote should not
report success quietly.

**Site 6 - `src/lib/outcome.functions.ts:335`**, after the `changelog_entries` upsert:

```ts
deployment --shipped-as--> release
```

Use `relation: "promoted"` for consistency with the existing vocabulary rather than inventing
`shipped-as`; the label is rendered from the kinds, not the verb.

### 5.3 Learn → the learning, the belief, the memory

**Site 7 - `src/lib/outcome.functions.ts:283`**, immediately after the `learnings` insert returns:

```ts
prd --measured-by--> learning
```

**Site 8 - same block, conditional.** `learnings` carries `mission_id` (types.ts, `learnings.Row`),
and `trust-chain.functions.ts:283` already prefers it over `prd_id`. When present:

```ts
mission --measured-by--> learning
```

**Site 9 - `src/lib/outcome.functions.ts:312`**, after `rememberOutcome` returns a memory row:

```ts
learning --distilled-into--> memory
```

This is the edge that makes the founder's "the brain compounds, it is never storage" claim
verifiable rather than asserted. Right now `agent_memory` rows exist with no recorded parentage;
the memory looks like storage because in the graph it *is* storage.

**Site 10 - `src/lib/ai/edge-extractor.server.ts:23`**, change `inferDirectEdge` to emit **two**
edges instead of one. Keep `prd --validates--> opportunity` for back-compat (existing rows and the
supersession walk depend on it) and add:

```ts
learning --validates|contradicts--> opportunity
```

`inferDirectEdge`'s signature gains `learningId: string | null`; `recordOutcome:365` already has it
in scope from the insert at `:275`. The unique key includes `parent_kind`+`parent_id`, so the two
edges never conflict. This is what closes the circle **through** the learning node rather than
around it.

**Site 11 - `src/lib/self-improve.functions.ts`**, at the Brier-calibration write. When an
insight's `resolution` / `brier_score` is stamped:

```ts
learning --validates|contradicts--> insight
```

This is the product grading its own predictions with a receipt. It is the single most defensible
"company brain" claim in the deck and it is currently unwritten.

**Site 12 - `src/lib/house-rules.functions.ts:241`**. A house rule already writes edges here, but
via a raw upsert. Route it through `recordLineageSafe` and, where the rule was born from an
outcome, stamp `learning --distilled-into--> house_rule`.

### 5.4 The Ask → the mission (the edge Depth B needs from us)

**Site 13 - `src/routes/api/chat.ts:530`**, immediately after `createMission` returns at `:503`.

Today chat classifies a prompt as mission-class, calls `createMission`
(`src/lib/ai/handoff.server.ts:228`), fires `runAgentLoop` fire-and-forget at `:563`, and returns a
bare `mission_id`. **No lineage edge is written.** So a mission born in conversation has no parent
at all - not the spec it was about, not the decision that prompted it, not even the thread.

`chat.ts` already resolves `AnswerBlock`s and `ChunkRef`s through
`resolveAnswerBlocks` (`src/lib/ask-blocks.server.ts`, imported at `chat.ts:12`) - it *knows* which
entities the conversation was grounded in. Stamp one edge per grounding entity:

```ts
<grounding entity> --dispatched--> mission   // relation 'dispatched', matching studio.functions.ts:354
```

This is the handoff to Depth B. When the chat can render "this run came from OPP·005C82", the
conversation stops losing the thread of its own work at the data layer, which is a precondition for
fixing it at the UI layer.

**Site 14 - `src/lib/ai/loop.server.ts:1152`**, after the `agent_approvals` insert:

```ts
mission --gated-by--> approval
```

`agent_approvals` already carries `trace_id`, `run_id`, `mission_id`, `agent_slug`
(`loop.server.ts:1138-1149`) - everything needed. This makes every human gate a node, which is what
turns the Trust Ledger from a list into a graph.

### 5.5 Two corrections, not additions

**Site 15 - `src/lib/capabilities.functions.ts:665`.** Delete the broken call from §1.3. Do not
"fix" it by finding an agent uuid; `capability_change` is `lineage: false` in the registry until
agents are real nodes. Removing a call site that has never produced a row is not a regression.

**Site 16 - `src/lib/ai/cluster.server.ts:210`, `src/lib/lineage.functions.ts:368`,
`src/lib/design-memory.functions.ts:304`** (the three batch raw upserts). Add
`recordLineageBatch(supabase, userId, edges[])` to `lineage.functions.ts` - same upsert, same
`onConflict`, kind-checked at the type level - and route all three through it. The other nine raw
writers from §1.1 convert to `recordLineageSafe` one at a time; the CI gate in §7 makes the
remainder visible rather than requiring a big-bang refactor.

### 5.6 The resulting chain, end to end

```
signal ──promoted──▶ theme ──promoted──▶ opportunity ──promoted──▶ prd
                                              ▲                     │
                                              │                     ├──promoted──▶ task
                                       validates│                   │
                                              │              dispatched
                                              │                     ▼
                                         learning ◀──measured-by── mission ──gated-by──▶ approval
                                            │  ▲                     │
                              distilled-into│  │measured-by          │produced
                                            ▼  │                     ▼
                                        memory  └──────────── changeset ──produced──▶ deployment
                                                                                          │
                                                                                    promoted
                                                                                          ▼
                                                                                      release
```

Sixteen call sites. Every arrow above that is not currently drawn becomes drawable.

---

## 6. Part B - the audit-id coverage audit

### 6.1 What is stamped today, verified by grep

`AuditTag` (`src/components/supaprod/AuditTag.tsx`, 98 lines) is imported in 20 files. Of those, 3
are tests and 1 is the global sheet mount (`AppShell.tsx:1030`), leaving **16 real render sites**.

Kinds actually rendered:

| kind | rendered? | where |
| --- | --- | --- |
| `signal` | ✅ | `SignalCard.tsx:233`, `SignalRecord.tsx:271` |
| `opportunity` | ✅ | `OpportunityRow.tsx:161`, `OpportunityDetailSheet.tsx:422`, `BetCard.tsx:363`, `ask-blocks.tsx:110` |
| `spec` (`prd`) | ✅ | `SpecList.tsx:328`, `SpecDetail.tsx:252`, `CallDetailSheet.tsx` map |
| `decision` | ✅ | `DecisionsPanel.tsx:316`, `DecisionDetail.tsx:328`, `ask-blocks.tsx:97` |
| `mission` | ✅ | `MissionSlideOver.tsx:56`, `ask-blocks.tsx:126`, `CallDetailSheet.tsx` map |
| `learning` | ✅ | `CompoundingPanel.tsx:208`, `LearningDetail.tsx:213` |
| `meeting` | ⚠️ | only reachable through `GraphNodeStory.tsx:30`'s translation map - **never on a meeting card or `/meetings/$id`** |
| `goal` | ❌ | zero render sites |
| `prototype` | ❌ | zero render sites |
| `release` | ❌ | zero render sites |
| `memory` | ❌ | zero render sites |
| `doc` | ❌ | zero render sites |

**Five of twelve declared kinds have never been rendered anywhere.** The founder's 2026-07-13
ruling ("everything should have a traceable audit id") was implemented as a *mechanism* and
delivered as *six-twelfths of a surface*. That is the honest reading, and it is exactly the
claim-outrunning-wiring pattern the standing rule exists to prevent.

### 6.2 Entities with no audit id at all

Beyond the declared-but-unrendered, these entities have **no kind, no prefix, no tag, and no way to
be referred to** - and every one of them is something a user will point at and ask about:

| entity | table | why it needs an id |
| --- | --- | --- |
| changeset | `studio_changesets` | "what code shipped for this?" is unanswerable without a name for the code |
| deployment | `deployments` | "when did this go live, and where?" |
| approval | `agent_approvals` | **"who allowed this?"** - the single most important governance question |
| insight / belief | `insights` | "we predicted X" needs a citable id or it is not a prediction |
| assumption | `assumptions` | a decision's assumptions are its reasons |
| theme | `themes` | a real cluster node in the graph with no name |
| task | `tasks` | the unit of work |
| roadmap item | `roadmap_items` | the unit of commitment |
| house rule | `house_rules` | the unit of learned policy |
| design memory | `design_memory` | the unit of learned taste |
| trace | `ai_events.trace_id` | **see §6.4** |

### 6.3 What the id looks like to a user, and the rules that make it feel designed

The format is already good and should not change: `MIS·7E7D59` - a three-letter stage code, a
middot, six uppercase alphanumerics, rendered in `var(--font-mono)` at `letterSpacing: 0.06em`
(`AuditTag.tsx:59-61`). It is short enough to say out loud, long enough to be unambiguous in a
workspace, and it survives copy-paste into Slack, a commit message, or the Ask box (which already
recognises it - `findAuditIds`, `audit-id.ts:107`).

Five standing rules for the rebuild, so ids read as one system rather than twelve decorations:

1. **One id per record, everywhere that record appears.** A spec's id is identical on the card, in
   the detail header, in an Ask answer, in the graph, in a trace, and in an exported PDF. Today it
   is: `SpecList.tsx:328` renders it non-copyable, `SpecDetail.tsx:252` renders it copyable. That
   difference is correct (copy belongs where you linger) and should be the *only* variation.
2. **Prefix is the stage, and the stage is the colour.** `SIG` is Discover, `DEP` is Ship. The
   audit tag inherits the stage's role colour at low emphasis (`--text-faint` today, which flattens
   all twelve into one grey). Per the Tempo contract's restraint budget, tint on hover only - the
   id should be legible-but-quiet at rest and become a stage-coloured affordance under the cursor.
3. **Every id is clickable, and click always means the same thing.** One gesture (§7), one target
   (the Record sheet), no exceptions. `AuditTag` already does this correctly with
   `role="button"` + keyboard handling + `stopPropagation` so it nests safely inside clickable
   rows. That component is well built; it just is not everywhere.
4. **Never fabricate an id for something that does not have a row.** If a chain link is absent,
   render the absence (`trust-chain.functions.ts` already models `present / skipped / missing /
   pending` - the best piece of honesty engineering in the codebase). Never a placeholder tag.
5. **Collisions are shown, not resolved.** Per §4.2.

### 6.4 The trace needs an id the user can say

`trace_id` is a raw uuid. It is rendered as a uuid at `_authenticated.traces.$traceId.tsx` and
linked as a uuid from `MissionOrchestratorDetail.tsx:462`. Nobody can read it, say it, or recognise
it twice.

**BUILD: `RUN·` as a thirteenth prefix**, `AuditKind: "run"`, resolving through `ai_events.trace_id`
rather than a table's `id` column. `RUN·8F21C4` is the name of an episode. It appears in the Record
sheet's trace list, on the trace page header, in Ask answers ("I did this in RUN·8F21C4"), and in
the `#trace` line of a copied provenance block. `parseAuditId` needs no change - `RUN` is just
another prefix - but `getEntityLineage` needs a branch for the trace kind, since traces live in a
column not a primary key. Small, and it is the difference between traces being an engineer surface
and a product surface.

---

## 7. Part C - the one gesture

### 7.1 There are five provenance surfaces today. There should be one.

Verified, all mounted, all reachable, all different:

1. `AuditLineageSheet.tsx` (239 lines) - global, opened by `openLineage(ref)`. Shows generic record
   steps + `MissionChain` for missions.
2. `LineageDrawer.tsx` - a *different* sheet, imported by `SpecDetail.tsx:435`, `SpecList.tsx:427`,
   `OpportunityQueue.tsx:497`. Shows `getLineage` ancestors/descendants + `getProvenance` root signals.
3. `GraphPanel.tsx` + `GraphNodeStory.tsx` - the canvas.
4. `_authenticated.traces.$traceId.tsx` (861 lines) - the waterfall.
5. `SpecDetail.tsx:147` + `_authenticated.plan.spec.$id.tsx:990` - an inline "Why this spec ·
   source evidence" block that calls `getProvenance` a third time.

A user who clicks an audit tag on a spec card gets surface 1. A user who clicks "lineage" on the
same spec's detail page gets surface 2. They render different data from different queries in
different components with different visual grammar. Neither shows the trace. Neither shows the
graph. This is the actual reason the product does not feel like one thing.

### 7.2 The gesture

**Hold `⌥` (Alt) and click anything. Or press `?` with something focused. Or click its audit id.
All three open the same thing: the Record.**

Why alt-click: it is the one modifier with no existing meaning in this app, it composes with every
element without needing a per-component affordance, and it is discoverable through one persistent
hint in the status bar (`Alt-click anything to ask why`) plus a one-time coach mark. The audit tag
stays the visible affordance for people who never learn the modifier. `Cmd+K` already exists
(`CommandPalette.tsx:91`) and already routes; typing an id there routes into the same Record, so
that is a fourth door to the same room, not a fifth room.

**BUILD** - new `src/components/provenance/RecordSheet.tsx`, replacing `AuditLineageSheet.tsx` and
`LineageDrawer.tsx`. Global mount stays where it is (`AppShell.tsx:1030`), the event stays
`supaprod:open-lineage` (renamed `supaprod:open-record`, with the old name kept as an alias for one
release so the 17 existing `AuditTag` call sites need no change on day one).

New server function `getRecord` in **`src/lib/provenance/record.functions.ts`**, one round trip,
composing what today takes four:

```ts
type Record = {
  ref: string;                    // "MIS·7E7D59"
  kind: string; label: string; stage: LoopStage;
  title: string; status: string | null; createdAt: string;
  route: { to: string; params?: Record<string,string> } | null;

  chain: ChainSentence[];         // §7.3 - the readable sentences
  actor: Actor;                   // §7.4 - who is responsible
  evidence: EvidenceItem[];       // §7.5 - what it acted on
  runs: RunSummary[];             // §7.6 - the traces
  graph: { focusKey: string; nodeCount: number; edgeCount: number };  // §7.7
  gaps: Gap[];                    // §7.8 - what is honestly missing
};
```

### 7.3 What it reveals, one: the chain as readable sentences

Not a node list. Not a timeline. **Sentences**, in the order they happened, each with a clickable
id and a real timestamp.

```
Someone at Northwind said onboarding "took three days" - SIG·A1B2C3 · Jul 2
Discovery Scout clustered that with 6 other signals into
  "Onboarding friction" - THM·9D0E1F · Jul 2
You promoted it to an opportunity, ICE 7.3 - OPP·005C82 · Jul 4
You decided to build it, over "Improve docs" - DEC·77B310 · Jul 4
  assuming self-serve setup is what they want - ASM·2C4D6E · still unresolved
PRD Writer drafted the spec - PRD·4A5B6C · Jul 5
You dispatched it to Build - MIS·7E7D59 · Jul 6
Builder produced 11 file changes - CHG·8F90A1 · Jul 6
  you approved the merge - APR·B2C3D4 · Jul 6, 4:12pm
It deployed to production - DEP·E5F607 · Jul 6, 4:31pm
Shipped as "Faster onboarding" - REL·182930 · Jul 7
30 days later: validated. Setup time fell 71%. - LRN·A1B2C3 · Aug 6
That became a memory the agents now recall - MEM·C4D5E6
  and it confirmed the belief we recorded on Jul 4 - INS·F70819 · Brier 0.09
```

Composition rules, so this never reads like a machine log:

- **One clause per edge**, in the past tense, with a real subject. The subject is
  `created_by_agent` if set, else `"You"`, else the workspace member's name. Never "The system".
  Never a passive voice sentence with no agent - that is the AI-fingerprint failure mode the
  humanized-output convention exists to prevent.
- The verb comes from the relation, mapped once in the registry (`promoted` → "promoted it to",
  `dispatched` → "dispatched it to", `produced` → "produced", `gated-by` → "you approved",
  `measured-by` → "30 days later:", `distilled-into` → "that became"). One map, not per-surface
  strings.
- **Assumptions and beliefs render as sub-clauses**, indented, because they are the *reasons* and
  reasons belong to the sentence they qualify, not to the timeline.
- Numbers are rendered through `PixelStat` (blue data, per the 2026-07-13 applied ruling), the ids
  through `AuditTag`. No other emphasis. The restraint budget is spent on the ids.
- **Truncation is honest**: "3 more signals fed this theme - show all" rather than silently
  dropping. `getProvenance` already returns `truncated` and `node_count`
  (`lineage.functions.ts:265-269`); surface them.

### 7.4 What it reveals, two: the responsible agent

One line, always present, never fudged:

```
Built by Builder · trust arc: auto for reversible tools, confirm for merges
Its last 30 runs: 27 clean, 2 rolled back, 1 rejected by you
Rolled back once for this workspace - REL·5A6B7C, Jun 28
```

Sources that already exist: `artifact_lineage.created_by_agent` (the edge's author),
`agent_approvals.agent_slug` + `decided_by` (`loop.server.ts:1141`), `agents` for the trust arc,
`src/lib/agent-scorecard.functions.ts:40` for the record, `src/lib/gauntlet.functions.ts` for the
acceptance rate and autonomy ratio. Nothing new is computed; it is assembled.

When `created_by_agent` is null the line is **"You did this, on Jul 4"** - not "Unknown". A human
action is a first-class answer, not a missing value.

### 7.5 What it reveals, three: the evidence it acted on

The distinction that makes this layer worth building: **lineage says what caused this; evidence
says what the agent was looking at when it decided.** They are different and both matter.

```
When PRD Writer drafted this spec it had in front of it:
  · 7 signals from the theme                          SIG·A1B2C3 +6
  · the decision and its rationale                    DEC·77B310
  · a memory from Mar: "we shipped self-serve setup
    for Acme and it missed"                           MEM·9F8E7D   ← recalled, then contradicted
  · house rule: "never ship onboarding changes
    in the last week of a quarter"                    RUL·1A2B3C
  · 3 doc chunks from your engineering handbook
```

Every one of these is already recorded and none is currently shown next to the artifact:

| evidence type | where it lives today |
| --- | --- |
| recalled memories | `memory_recall_log` (has `trace_id`, `memory_id`, `outcome`), written at `src/lib/ai/memory.server.ts:193` |
| cited learnings | `learning_citations` (has `trace_id`, `learning_id`, `cited_by`), written at `src/lib/decision-judgment.functions.ts:302` |
| RAG chunks | `resolveAnswerBlocks` / `ChunkRef` (`src/lib/ask-blocks.server.ts`), consumed at `chat.ts:12` but not persisted per artifact |
| guardrail interventions | `guardrail_hits` (has `event_id`) |
| the prompt itself | `ai_events.input_preview` / `system_preview` |

`memory_recall_log.outcome` is the sleeper feature here. It records whether a recalled memory
helped. Rendering **"recalled, then contradicted"** next to a memory is the product visibly
learning in front of the user, from a column that already exists and is written today.

**WIRING, not BUILD**, except the RAG chunk persistence, which needs a small
`artifact_evidence` insert at the point `resolveAnswerBlocks` returns.

### 7.6 What it reveals, four: the trace of the model calls

Not the waterfall - a **summary with a door**:

```
5 machine runs touched this record
  RUN·8F21C4  drafted the spec       12 hops · 47s · $0.11 · clean
  RUN·A3B7D9  critiqued it            4 hops · 11s · $0.02 · 1 guardrail hit
  RUN·C1E5F2  revised after feedback  6 hops · 19s · $0.04 · clean
  RUN·D8A0B3  built it               31 hops · 6m  · $0.94 · 1 approval
  RUN·E2F4A6  wrote the release note  2 hops · 4s  · $0.01 · clean
```

Each row opens `/traces/$traceId`, which is already an excellent 861-line surface. The Record sheet
does not reimplement it; it makes it **reachable from the thing it produced**, which is exactly
what §8 says does not exist today.

Numbers come straight from `listTraces`' existing aggregates (`traces.functions.ts:60-100`) - spans,
tokens, cost, latency, errors. The only new thing is the reverse index (§8.1).

### 7.7 What it reveals, five: the graph

A small canvas at the bottom of the sheet, focused on this node, two rings, no interaction beyond
"Open the full graph". `getKnowledgeGraph` already accepts a focus and returns a deterministic
layout (`knowledge-graph-view.ts:180`, `projectGraph`). With the registry fix from §4.1 it renders
back-half nodes for the first time.

The graph is deliberately **last** in the sheet and small. The sentences are the answer; the graph
is the proof. Leading with a node-link diagram is the mistake every provenance product makes: it
looks impressive in a screenshot and answers nothing.

### 7.8 What it reveals, six: what is honestly missing

```
Two links are absent:
  · No design gate - the Design stage is off for this workspace
  · No test receipt - the changeset merged without a PR, so CI never ran
```

`trust-chain.functions.ts:99-127` already computes this distinction correctly:
`present / skipped / missing / pending`, with `missing` meaning "a LATER link exists, so a receipt
that should exist does not". That is a genuinely rigorous piece of modelling, it is unit-tested, and
it is currently visible only inside a mission's chain. Promote it to every record.

**This section is the credibility of the whole feature.** A provenance surface that only shows what
it has is marketing. One that names its own holes is a system of record.

---

## 8. Part D - entity ⟷ trace, in both directions

Today this is a one-way street with a locked gate. Four surfaces link *out* to a trace
(`MessageMeta.tsx:387`, `MissionOrchestratorDetail.tsx:462,1148`, `TracesPanel.tsx:146`,
`RecordRoom.tsx:83`, `IncidentsPanel.tsx:33`) and every one of them already had the `trace_id` in
hand. There is **no way to stand on an entity and find the runs that made it** unless that entity
is a mission - and even the mission path is a three-hop reverse lookup:
`agent_run_checkpoints.state->>'traceId'` → `agent_runs.mission_id` → `missions`
(`traces.functions.ts:203-228`), on an **unindexed JSONB expression**, with a `.limit(1)` and a code
comment admitting it will need an index.

### 8.1 The mechanical reason: `surface_ref` has no schema

The join is supposed to be `ai_events.surface_ref`. Collected from every call site in `src/lib`, its
actual values are:

- bare uuids - `prd.id`, `decision.id`, `opp.id`, `c.id`, `ctx.missionId`
- an **agent slug** - `agent.slug`
- namespaced - `critic:${target.kind}:${target.id}`, `prd:${prd.id}:tasks`, `meeting:${m.id}`,
  `historian:outcome:${prd.id}`, `self-improve:${data.kind}:${data.subjectRef}`
- bare literals with no id at all - `"title"`, `"focus_next"`, `"cluster_signals"`,
  `"verify_until_green"`, `"orchestrator:plan"`

Roughly forty distinct shapes. You cannot write "give me the traces for this spec" against that. It
is not a missing feature; it is a missing convention, and every new AI surface adds another shape.

### 8.2 The fix: a typed reference, not a string

**BUILD.** In `src/lib/ai/runtime.server.ts`, alongside the existing `surface_ref?: string | null`
on `CallOpts` (`:334`), add:

```ts
/** The entity this call is ABOUT. Typed, so the reverse index is queryable.
 *  surface_ref stays for free-text context; this is the join key. */
subject?: { kind: EntityKind; id: string } | null;
```

`runtime.server.ts` is a genuine chokepoint - every AI call passes through `callModel` or
`callModelStream`, and the `CallSurface` union at `:313` already proves the pattern of forcing new
surfaces to declare themselves. Adding a typed optional field there propagates to all 5 write points
(`:270`, `:897`, `:1015`, `:1817`, `:2454`).

New table, one migration:

```sql
CREATE TABLE public.artifact_traces (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  entity_kind  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  trace_id     UUID NOT NULL,
  /* 'produced' | 'revised' | 'evaluated' | 'referenced' - what the run did to it */
  role         TEXT NOT NULL DEFAULT 'referenced',
  first_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_kind, entity_id, trace_id, role)
);
CREATE INDEX idx_artifact_traces_entity ON public.artifact_traces (user_id, entity_kind, entity_id);
CREATE INDEX idx_artifact_traces_trace  ON public.artifact_traces (user_id, trace_id);
ALTER TABLE public.artifact_traces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own artifact_traces all" ON public.artifact_traces
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

Written from one place: `runtime.server.ts`, whenever `opts.subject` and `opts.traceId` are both
present. Upsert on the unique key, so a 31-hop build run writes one row per entity it touched, not
31. Fail-soft, same convention as everything else.

This is the concrete answer to "everything should have a Trace ID" that does not lie: **the entity
does not have *a* trace id, it has a queryable list of the runs that touched it, and each one says
what it did.**

### 8.3 Both directions, then

**Entity → trace.** `getRecord.runs` selects from `artifact_traces` by `(entity_kind, entity_id)`,
then batches into `listTraces`' existing aggregation. Renders as §7.6.

**Trace → entity.** `getTrace` (`traces.functions.ts:186`) gains a fifth parallel query alongside
`hitsRes / evalRes / toolRes / mission`: select from `artifact_traces` by `trace_id`, hydrate
titles through the registry, return `subjects`. The trace page header stops saying only
"Trace · 12 hops" and starts saying **"This run drafted PRD·4A5B6C and revised OPP·005C82"**, each
an `AuditTag` back into the Record. The existing three-hop JSONB mission lookup at
`traces.functions.ts:203` becomes a fallback for pre-migration traces and can be deleted after the
backfill.

**Backfill.** A one-shot cron under `src/routes/api/public/hooks/` parsing the ~40 known
`surface_ref` shapes into typed rows. Bare-uuid refs resolve by probing the registry's tables in
stage order; namespaced refs parse directly; bare literals with no id are skipped and counted. The
job reports coverage ("recovered 8,412 of 11,027 historical traces") rather than pretending to be
complete.

### 8.4 The gesture in the other direction

From any trace hop, alt-click → the Record for the entity that hop touched. From any Record,
click a run → the trace. **The loop closes as a UI loop, not just a data loop.** A user can walk
from a signal to the model call that turned it into a theme, read the actual prompt, see the
guardrail that fired, and walk back out to the spec that resulted - without ever knowing that four
tables were involved.

---

## 9. Part E - why the user must never know these are three systems

### 9.1 The failure mode this prevents

Every observability product ever built has shipped exactly the surfaces Supaprod already has:
a lineage graph, a trace viewer, an id scheme. And every one of them is used by two engineers and
nobody else, because using them requires the user to first know **which of the three systems holds
the answer to the question they have**. That is a taxonomy quiz standing between a person and their
own work.

The founder's phrasing is the correct product spec and should be treated as binding: *"if I have
something like 'why did we decide this', it should pull up the traces and show me the lineage links,
graph, everything."* One question. All three substrates. No choice about where to look.

### 9.2 The collapse, concretely

| The user does | The system does | The user never learns |
| --- | --- | --- |
| Alt-clicks a roadmap row | resolves the element to `(kind, id)`, opens the Record | that "kind" is a vocabulary |
| Reads the sentences | walked `artifact_lineage` both directions, bounded, hydrated titles | the word "lineage" |
| Clicks an id in a sentence | re-focuses the Record on that entity | that ids are derived from uuids |
| Clicks a run | opens `/traces/$traceId` | that traces are a different table |
| Asks "why did we decide this" in chat | `findAuditIds` on the prompt + `getRecord` on the hits, rendered inline | that Ask and the Record share a function |
| Copies the record | one markdown block: sentences, ids, runs, gaps | that it was assembled from six tables |

Three vocabulary words appear in the UI: **record**, **run**, **why**. Not lineage. Not trace. Not
audit id. Not provenance. Not graph node kind.

- "Lineage" becomes **the chain**, and the chain is rendered as sentences, so it usually needs no
  noun at all.
- "Trace" becomes **a run** - "5 runs touched this" - which is what it is, and is a word a PM
  already owns.
- "Audit id" becomes **the ref**, and mostly it is not named, it is just the little mono string
  everyone learns to click within an hour.

The word "provenance" appears exactly once, in the code, as a folder name.

### 9.3 The one place the seam should show

Governance. On `/trust-ledger` and in an export, an auditor genuinely needs to know that the causal
graph and the machine record are separate, independently-written substrates - that is precisely what
makes the record credible. So the export block, and only the export block, is explicit:

```
PRD·4A5B6C - "Self-serve onboarding"
  Causal chain    11 links, 0 gaps, bi-temporal, last edge Jul 7
  Machine record  5 runs, 55 hops, 3 guardrail hits, 1 human approval
  Reconciliation  chain and machine record agree on all 11 links
```

That last line is the reconciliation between the two provenance systems from §1.4, promoted from a
hidden inconsistency to a stated, checkable property. When they disagree, it says so, names the
link, and that is a real finding rather than a silent bug.

---

## 10. The CI gate

`.github/workflows/ci.yml` runs exactly two gates: `bunx tsc --noEmit` and `bun test`. So the test
must be a `bun test` file, and fs-scanning tests are established precedent
(`src/lib/__tests__/surface-registry.test.ts`, `src/lib/__tests__/route-inventory.test.ts`,
`src/__tests__/design-tempo-font-guard.test.ts`).

Two suites. The first is static and catches new code. The second is a type-level fact and catches
vocabulary drift.

### 10.1 `src/lib/provenance/__tests__/lineage-coverage.test.ts` - **the gate that fails CI**

The rule: **for every entity kind marked `lineage: true` in the registry, there must exist at least
one code path that writes a lineage edge with that kind, and every write to `artifact_lineage` must
go through the typed helpers.**

```ts
// Provenance coverage gate. An entity kind that can be CREATED but never
// LINKED is an orphan: it exists in the product and cannot answer "why".
// This suite fails CI when that happens. Deliberately fs-based and
// synchronous, same shape as surface-registry.test.ts.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ENTITY_KINDS } from "../kinds";

const SRC = join(import.meta.dir, "..", "..", "..");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== "node_modules") sourceFiles(p, out); }
    else if (/\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}
const FILES = sourceFiles(SRC).map((f) => ({ path: f, body: readFileSync(f, "utf8") }));

// Modules allowed to touch artifact_lineage directly (they ARE the helpers).
const HELPER_MODULES = [
  "lib/provenance/record.functions.ts",
  "lib/lineage.functions.ts",
  "lib/knowledge-graph-view.functions.ts",
  "lib/knowledge-graph-explorer.functions.ts",
  "lib/audit-lineage.functions.ts",
];
// Reader modules: SELECT-only. Enumerated so a new reader is a conscious choice.
const READ_ONLY = [ /* trust-ledger, moat, pm-impact, stakeholder-pack, proof-surface, ... */ ];

describe("provenance coverage", () => {
  test("every lineage kind is written somewhere", () => {
    const written = new Set<string>();
    const re = /(?:parent_kind|child_kind):\s*"([a-z_]+)"/g;
    for (const f of FILES) for (const m of f.body.matchAll(re)) written.add(m[1]);
    const orphans = ENTITY_KINDS.filter(k => k.lineage && !written.has(k.kind)).map(k => k.kind);
    expect(
      orphans,
      `Entity kinds that can be created but never linked (add a recordLineage call site, ` +
      `or set lineage:false in kinds.ts and say why): ${orphans.join(", ")}`,
    ).toEqual([]);
  });

  test("no kind is written that the registry does not declare", () => {
    const declared = new Set(ENTITY_KINDS.filter(k => k.lineage).map(k => k.kind));
    const rogue: string[] = [];
    const re = /(?:parent_kind|child_kind):\s*"([a-z_]+)"/g;
    for (const f of FILES) for (const m of f.body.matchAll(re))
      if (!declared.has(m[1])) rogue.push(`${m[1]} in ${f.path}`);
    expect(rogue, `Lineage kinds not in ENTITY_KINDS: ${rogue.join(", ")}`).toEqual([]);
  });

  test("no module writes artifact_lineage outside the typed helpers", () => {
    const violations = FILES
      .filter(f => !HELPER_MODULES.some(h => f.path.endsWith(h)))
      .filter(f => /from\(["']artifact_lineage["']\)\s*\.\s*(insert|upsert|update)/.test(f.body))
      .map(f => f.path.replace(SRC, "src"));
    expect(
      violations,
      `Direct artifact_lineage writes bypass the kind contract. Use recordLineageSafe / ` +
      `recordLineageBatch: ${violations.join(", ")}`,
    ).toEqual([]);
  });

  test("every lineage relation is in GRAPH_RELATIONS", () => {
    // A relation the graph cannot render is an edge nobody will ever see.
  });

  test("the back half of the loop is reachable from the front", () => {
    // The regression this whole document exists to prevent: assert that a path
    // of declared (parentKind, relation, childKind) triples exists from
    // 'signal' to 'memory'. Built from the writes found above, so it breaks
    // the moment someone deletes a call site.
    const REQUIRED_PATH = [
      ["signal", "theme"], ["theme", "opportunity"], ["opportunity", "prd"],
      ["prd", "mission"], ["mission", "changeset"], ["changeset", "deployment"],
      ["deployment", "release"], ["prd", "learning"], ["learning", "memory"],
    ] as const;
    // ... assert each pair appears as a co-located parent_kind/child_kind literal
  });
});
```

**Note on suite 3.** Run today it fails immediately with the twelve raw writers from §1.1. That is
correct and intended: land it with those twelve in an explicit `KNOWN_DIRECT_WRITERS` allowlist
whose length is asserted to be **monotonically decreasing** (the same trick `PLACEHOLDER_DOMAINS`
uses in `surface-registry.test.ts:52-66`). New violations fail; existing ones are visible, counted,
and cannot grow. That converts a big-bang refactor into a ratchet.

### 10.2 `src/lib/provenance/__tests__/kinds.test.ts` - the registry's own integrity

```
✓ prefixes are unique and 3 uppercase letters
✓ kinds are unique, lowercase snake_case
✓ every table named exists in Database["public"]["Tables"] (type-level, so tsc catches renames)
✓ every graph:true kind is also lineage:true      (you cannot draw what you do not record)
✓ every audit:true kind has a route or an explicit null with a gloss
✓ ARTIFACT_KINDS / GRAPH_NODE_KINDS / AUDIT_KINDS derive without loss
✓ the audit_short SQL generated column matches auditShort() on a fixed uuid corpus
✓ every relation in GRAPH_RELATIONS has a sentence verb in the narration map
```

The table-existence check is the one that earns its keep: it is a compile-time assertion against
`src/integrations/supabase/types.ts`, so a table rename in Supabase breaks the build rather than
silently emptying a sheet - which is exactly the failure class of §1.3 and §1.6.

---

## 11. Build sequence

Ordered so each step is shippable and each unblocks the next. Two weeks of focused work.

| # | Work | Type | Files |
| --- | --- | --- | --- |
| 1 | `src/lib/provenance/kinds.ts` + `kinds.test.ts`, 21 rows, derived exports | BUILD | 1 new, 1 new test |
| 2 | Repoint the 11 maps; delete `GRAPH_AUDIT_KIND` and `CALL_AUDIT_KIND` | WIRING | 8 edits |
| 3 | `audit_short` generated column + index + SQL parity test; rewrite `audit-lineage.functions.ts:106`; collision UI | BUILD | 1 migration, 2 edits |
| 4 | Sixteen `recordLineage` call sites (§5), `recordLineageBatch`, delete the dead site | WIRING | 11 edits |
| 5 | Coverage gate with the decreasing allowlist | BUILD | 1 new test |
| 6 | `artifact_traces` + `CallOpts.subject`; write from `runtime.server.ts`; backfill cron | BUILD | 1 migration, 2 edits, 1 cron |
| 7 | `record.functions.ts` `getRecord`; sentence composer (pure, tested) | BUILD | 2 new |
| 8 | `RecordSheet.tsx`; retire `AuditLineageSheet` + `LineageDrawer`; alt-click handler | BUILD | 1 new, 4 edits |
| 9 | `AuditTag` on the 11 uncovered kinds; `RUN·` prefix | WIRING | ~14 edits |
| 10 | `getTrace.subjects`; trace-page back-links; drop the JSONB reverse lookup | WIRING | 2 edits |

Steps 1-5 are the load-bearing half and are worth doing even if 6-10 slip: they are what make the
data true. Steps 6-10 are what make it felt.

---

## 12. Handoff

**To Depth B (agentic Ask).** Three things are yours from here:

- `getRecord(ref)` is the function your chat calls when `findAuditIds` (`audit-id.ts:107`, already
  built and tested) matches a prompt. It returns the sentences, the actor, the evidence, the runs,
  and the gaps. Render it inline; do not build a second provenance renderer.
- **Site 13 (§5.4), `src/routes/api/chat.ts:530`, is the edge you need most.** Today
  `createMission` at `:503` writes no lineage, so the mission your chat spawns is an orphan. Once
  it is stamped, a chat answer can say "this came from OPP·005C82" and a mission can say "born in
  a conversation on Jul 6" - which is the data precondition for the conversation not losing the
  thread of its own work.
- **`approval` is now an entity kind with an audit id and a graph node** (§4.3 row 15). When you
  render `agent_approvals` inline in the chat - the thing `chat.ts` conspicuously does not do
  today, while `loop.server.ts:1137` writes them faithfully - each approval already has a name
  (`APR·B2C3D4`), a trace (`agent_approvals.trace_id`, `loop.server.ts:1141`), and an edge to its
  mission (Site 14). Your approve/deny UI writes provenance for free.

**To Depth C (analytics).** Two corrections and one gift:

- ZeroEntropy is not in this product (§2.1). Do not plan around it.
- Sentry has no SDK and should not get one (§2.2); the envelope client plus the `error_events`
  floor is the right Workers architecture. What is missing is keys and the provenance link.
- The gift: `artifact_traces` (§8.2) makes cost, latency, and failure **attributable to an
  entity** for the first time. "This spec cost $1.12 to produce across 5 runs" and "specs written
  by PRD Writer average $0.31 and 87% acceptance" become one query each. That is the product-usage
  question the founder asked for, answered from first-party data with no vendor at all.

**Standing constraint for all three angles.** The claim never outruns the wiring. Everything in
this document is tagged EXISTS, WIRING, or BUILD, and every EXISTS carries a file and a line so the
next person can check it in thirty seconds rather than trusting the prose.
