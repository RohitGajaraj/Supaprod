# FINAL - The Depth Contract

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> _Written 2026-07-28. Merges depth-a (provenance), depth-b (agentic Ask), depth-c (telemetry)
> into one binding contract. Where the three disagreed, this document rules and says why._
>
> **Authority.** The founder granted authority to override his own prior rulings where they are
> wrong. Section 2 uses it. Every other section is tagged **EXISTS** / **WIRE** / **BUILD** / **FIX**
> with a file and a line, under the standing rule that a claim never outruns the wiring.
>
> **Supersedes** the three depth proposals wherever they conflict with this. They remain valid as
> the detailed reference for their own angle.

---

## 0. The verdict, in one page

The three angles are not three features. They are one loop seen from three sides, and each one is
blocked by the same thing: **the product cannot name the back half of its own work.**

- Provenance fails after Build because `ARTIFACT_KINDS` (`src/lib/lineage.functions.ts:7`) has no
  token for a changeset, a deployment, a learning, a belief, or an approval. Verified:
  `grep -c recordLineage` returns **0** in `deployments.functions.ts`, `outcome.functions.ts`, and
  `missions.functions.ts`.
- Ask fails to act because `src/routes/api/chat.ts` contains **zero** references to
  `agent_approvals` (verified by grep) and closes its stream before the loop takes a step. The
  inline approval UI was built (`src/components/obsidian/ask-canvas.tsx`) and then **unmounted**
  (`src/routes/_authenticated.tsx:201-208`).
- Telemetry fails to learn because the one place a vendor already feeds the product loop feeds it
  **other tenants' data** (`src/lib/analytics-ingest.server.ts:54-70`, no workspace predicate,
  labelled with the caller's workspace at `:98`).

And underneath all three sits the single most severe defect any of the three angles found, which
none of the other two knew about:

> **Agent resume has been amnesiac since 2026-07-23.** `checkpoint()` at
> `src/lib/ai/loop.server.ts:827-867` no longer writes `conv` or `steps`. Its justifying comment
> at `:832` cites `agent_run_steps` and `agent_run_messages` - **neither table exists**; grep
> across `src/`, `supabase/migrations/`, and `types.ts` returns exactly one hit, the comment
> itself. `resumeAgentLoop` gates rehydration on `cp.state.conv` (`:1411`), which is now always
> undefined, so every resumed run rebuilds a fresh prompt with `steps = []` and continues from
> `startStep`. **The agent wakes at step 4 of 6 with no memory of steps 0 to 3.**

That is precisely the path the founder's demo walks: propose → approve → the run continues. It is
broken today, it is roughly thirty lines to fix, and it outranks everything else in this document.

**Against the six tests:** the why test fails outright on 6 entity kinds and partially on 9 more
(§9.1). The agency test fails completely - there is no path from a consequential ask to an inline
grant. The one-queue test fails on the write side: two decide functions with divergent writes
(§7.1). The honesty test flags three items across the proposals (§10). The buildability test
passes for all three proposals; they are unusually concrete. The two-day test is where the merge
does real work: five items are genuinely demo-critical, everything else is right and can follow
(§11).

---

## 1. Verification log - what I checked myself this session

I did not take the three proposals on trust. Load-bearing claims, re-verified:

| Claim | Verdict | Evidence |
| --- | --- | --- |
| `checkpoint()` drops `conv`/`steps`; resume gates on `cp.state.conv` | **CONFIRMED** | `loop.server.ts:827-867`, `:1411` |
| `agent_run_steps` / `agent_run_messages` do not exist | **CONFIRMED** | one grep hit, the comment at `:832` |
| `chat.ts` has zero `agent_approvals` references | **CONFIRMED** | `grep -c` → 0 |
| `AskPanel` / `ask-canvas` are unmounted dead code | **CONFIRMED** | `_authenticated.tsx:204` |
| The live Ask renders `ThreadMessage`, never `Thread`, off `/m/*` | **CONFIRMED** | `GlobalComposer.tsx:30,139` |
| Two decide paths with divergent writes | **CONFIRMED** | `governance.functions.ts:384` sets `escalation_state`, never calls `recordGateSignalCore`; `agent_loop.functions.ts:74` calls it but never sets `escalation_state` and takes no reason |
| Only four tools pause the run | **CONFIRMED** | `loop.server.ts:74-79` |
| `useApprovalPush` invalidates only the two dead-panel keys | **CONFIRMED** | `use-approval-push.ts:24-27` |
| Zero `recordLineage` in deployments / outcome / missions | **CONFIRMED** | `grep -c` → 0, 0, 0 |
| `ARTIFACT_KINDS` = 13, no back-half kinds | **CONFIRMED** | `lineage.functions.ts:7-20` |
| Many raw `artifact_lineage` writers bypass the helper | **CONFIRMED, and worse than depth-a said** | `studio.functions.ts:494,920,1205`, `flows:158`, `design-scaffold:199`, `contradiction-auditor:77`, `decisions:321`, and more |
| Audit resolver pulls `select("*").limit(2000)` and scans in the Worker | **CONFIRMED** | `audit-lineage.functions.ts:106` |
| `AUDIT_KINDS` = 12, token is `spec` not `prd` | **CONFIRMED** | `audit-id.ts:44-63` |
| PostHog HogQL has no workspace predicate, rows labelled with the caller's workspace | **CONFIRMED** | `analytics-ingest.server.ts:57-70`, `:98` |

One correction to depth-a I make on my own reading: its §4.2 fix (a `GENERATED ALWAYS` column plus
an index on 21 tables) is **unnecessary**. See ruling R-9.

---

## 2. Founder corrections - stated plainly

The mandate asked for the right call, not obedience. Six places where the stated premise is wrong.

### 2.1 ZeroEntropy is not in this product. It is on your laptop.

`grep -rin "zeroentropy\|zembed" src/` returns **zero hits**. The only occurrence anywhere in the
repo is `ZEROENTROPY_API_KEY` in the git-ignored `.env`, and that key belongs to **gbrain**, your
local developer knowledge brain (PGLite at `~/.gbrain/brain.pglite`, `zembed-1` embeddings,
documented in your own user-level `CLAUDE.md`). It indexes your Mac. It has never been called from
Supaprod's runtime and it cannot be - the product runs in a Cloudflare Worker with no line to a
local PGLite file.

Supaprod's own embeddings run through `src/lib/rag/embed.server.ts` (Cohere `embed-v4.0`, or
OpenAI `text-embedding-3-small` via the Lovable gateway, per the BYO-key chain). **And the graph is
not vector-backed at all** - it is a bounded breadth-first walk over Postgres rows in
`artifact_lineage` (`knowledge-graph-view.functions.ts:141`). "ZeroEntropy for graph" describes
nothing that exists.

**Binding: ZeroEntropy appears in no architecture diagram, no investor material, and no
sub-processor disclosure.** `src/lib/compliance/subprocessors.ts` derives that list from the live
model catalog precisely so this class of drift cannot happen; adding it by hand would break the
invariant.

### 2.2 Sentry has never received a single event. Neither has PostHog. And the fix is not an SDK.

Both halves of the common assumption are wrong in opposite directions.

- **The code exists and is good.** `src/lib/observability/errors.ts` (177 lines, unit-tested) posts
  to Sentry's envelope HTTP API directly, deliberately, so a heavyweight SDK never enters the
  Worker bundle - its own header comment says so. `analytics.ts:55` does the same for PostHog.
  `jobs.ts` is wired into **37 cron routes**. This is not a facade; it is a correct Workers
  architecture.
- **The keys do not exist.** No `SENTRY_DSN`, no `POSTHOG_API_KEY`, no
  `POSTHOG_PERSONAL_API_KEY`, no `POSTHOG_PROJECT_ID` in `.env`. Every vendor call therefore
  returns `false` on its first line (`analytics.ts:39`, `errors.ts:112`).

So: **no error has ever reached Sentry and no usage event has ever reached PostHog.** What *is*
working is the first-party floor - `recordErrorEvent` writes `error_events` unconditionally,
before the gate, and `withJobRun` writes `job_runs` unconditionally. You can see cron failures and
server errors today. You can see nothing about product usage.

**Binding: install zero vendor SDKs.** Adding `@sentry/*` or `posthog-js` would be a regression, not
a fix. Add the two keys only after ruling R-11 lands.

### 2.3 "Everything should have an Audit ID and a Trace ID" is one word too many, and building it literally makes the product worse.

An audit id is an **identity** - this thing, one id, from creation to deletion. A trace id is an
**episode** - one burst of machine work, and many of them touch the same entity over its life. A
spec drafted by one agent, critiqued by a second, revised by a third, and dispatched by a human has
**one** audit id and **four** trace ids.

Stamping a `trace_id` column on `prds` would silently mean "the last run that touched this", which
is the least useful of the four and looks authoritative. **Ruling: one audit id per entity, many
runs per entity, joined by a first-class relation, not a column** (R-6). The user never meets the
distinction; they read "5 machine runs touched this" and can open any of them.

### 2.4 The Ask engine you asked for already exists. What is missing is the wire, and it is smaller than you think.

`resolveToolMode` (`loop.server.ts:153-211`) already classifies all 50 registry tools as
`auto`/`confirm`/`off`, `toolRisk` already forces high-risk tools to `confirm` regardless of trust,
the run already writes `agent_approvals` and parks at `waiting_approval`, and the `resume-runs`
cron already compare-and-swaps so a checkpoint can never be double-spent. **That is the hard part
and it is done.**

But two things you would not expect. First, **only four tools actually pause the run**
(`studio.commit`, `studio.pr.open`, `studio.pr.merge`, `delegate.openhands` - `loop.server.ts:74-79`). Every other confirm gate queues an approval and the loop *keeps going*
with "Do not retry. Continue planning or finalize." So "the machine waits for me" is true for
shipping code and false for everything else. Second, **the inline approval UI was already built** - `ask-canvas.tsx` renders progress, gates with inline Approve/Reject, and a pending strip - and
then it was unmounted when the Ask surface was replaced. The work is orphaned, not missing.

### 2.5 The product currently tells the user a lie, in its own voice.

`chat.ts:568` says: *"You can track the progress of the specialist agents and approve their
decisions inline below."* Off `/m/*`, `GlobalComposer` renders `ThreadMessage` directly and shows
**no gates at all**. Nothing appears below. That sentence must be deleted today, in the same commit
as anything else, whether or not the rest of this plan ships. A product that narrates a capability
it does not have is the exact failure the standing rule exists to prevent.

### 2.6 One tenant's usage can silently reprioritize another tenant's roadmap.

This is dormant only because the PostHog keys are absent, and it is the single worst latent bug in
the codebase for a product whose pitch is a trustworthy decision record.

`analytics-ingest.server.ts:57-70` builds a HogQL query with **no workspace predicate**, then
labels the global result with the caller's workspace at `:98`. `sense-tick.ts:134` calls it once
per workspace. The result propagates: `product_analytics` → `insertSpikeSignals` writes a
**`signals` row** into each workspace derived from other tenants' usage → `cluster-tick` clusters
them into themes and opportunities → `autoAdjustIce` **rewrites the opportunity's Impact and
Confidence** and records provenance in `ice_adjustments` claiming the number came from this
workspace.

**A provenance trail that lies about where a number came from.** Binding: R-11 deletes this path
before any key is added, and deletion loses nothing - depth-c verified that 8 of the 10 events the
query asks for are never emitted by the app anyway.

---

## 3. The one promise, and the three substrates beneath it

There are three systems. **The user must never learn that.**

| | **The chain** (lineage) | **The run** (trace) | **The ref** (audit id) |
| --- | --- | --- | --- |
| Question | What caused what | What the machine did | How you refer to it |
| Substrate | `artifact_lineage` | `ai_events` + `tool_calls` + `guardrail_hits` + `ai_evals`, keyed on `trace_id` | prefix + first 6 alphanumerics of the uuid |
| Time model | Bi-temporal; edges retire via `valid_to`, never delete | Immutable, append-only, per-episode | Immutable, permanent |
| Lifetime | The life of the product | Seconds | The life of the entity |

**The promise, in the founder's words: point at anything, ask why, get the truth.**

Exactly three words appear in the UI: **record**, **run**, **why**. Not lineage. Not trace. Not
audit id. Not provenance. Not graph node kind. The word "provenance" appears once, as a folder
name in the code.

**The one place the seam is allowed to show** is governance. On `/trust-ledger` and in an export, an
auditor needs to know the causal graph and the machine record are separately written substrates - that is what makes the record credible:

```
PRD·4A5B6C - "Self-serve onboarding"
  Causal chain    11 links, 0 gaps, bi-temporal, last edge Jul 7
  Machine record  5 runs, 55 hops, 3 guardrail hits, 1 human approval
  Reconciliation  chain and machine record agree on all 11 links
```

That last line matters more than it looks. Two provenance systems exist today and can disagree:
`trust-chain.functions.ts` (461 lines) reconstructs the nine-link chain **entirely from foreign
keys** and never reads a lineage edge, while `lineage.functions.ts:getProvenance` walks the same
chain **entirely from `artifact_lineage`** and never reads a foreign key. `AuditLineageSheet.tsx:73`
renders both in the same sheet with nothing reconciling them. Ruling R-8 makes the disagreement a
named, checkable state instead of a silent bug.

---

## 4. The rulings

Numbered, binding, each resolving a real conflict between the three proposals.

### R-1 · The lineage vocabulary is one registry, and the CI gate is on the table, not the helper.
Adopt depth-a's `src/lib/provenance/kinds.ts` as the single source for the eleven hand-maintained
kind maps that have already drifted (two of them, `GraphNodeStory.tsx:26` and
`CallDetailSheet.tsx:106`, exist *only* to translate between two of the others - the drift made
visible; both get deleted).

But depth-a's coverage gate must be tightened. It proposed gating `recordLineage` call sites. I
verified there are **far more raw writers** than depth-a listed - `studio.functions.ts` alone has
three (`:494`, `:920`, `:1205`), plus `flows:158`, `design-scaffold:199`,
`contradiction-auditor:77`, `decisions:321`. A gate on the helper passes while a dozen writers
insert whatever they like. **The gate is the grep for `from("artifact_lineage").{insert,upsert}`
outside the helper modules**, landed with a `KNOWN_DIRECT_WRITERS` allowlist whose length is
asserted monotonically decreasing - the same ratchet `surface-registry.test.ts:52-66` already uses
for `PLACEHOLDER_DOMAINS`. New violations fail CI; existing ones are counted and cannot grow.

### R-2 · Twenty-one entity kinds. Adopt depth-a's table, with three amendments.
Accept depth-a §4.3 in full, plus:

- **`incident` joins as a 22nd row** (depth-c T-13): `prefix: "INC"`, `table: "error_events"`,
  `stage: "Operate"`, `lineage: false`, `graph: false`, `audit: true`. Because `formatAuditId` /
  `parseAuditId` / `findAuditIds` are pure and prefix-driven, and `AuditTag` is already mounted
  globally, **an incident becomes clickable and Ask-parseable for the cost of one array element.**
  This is the highest depth-per-line item anywhere in the three documents.
- **`run` (RUN) is a registry row with a null table**, resolved through `ai_events.trace_id` rather
  than a primary key. `getEntityLineage` needs one branch. A raw uuid is not a name anyone can say
  twice; `RUN·8F21C4` is.
- **The approval's prefix is `APR`, not `GATE`** (depth-b proposed `GATE`). The entity is
  `agent_approvals` and its label is "Approval". "Gate" is the UI word for the *moment*; the
  *record* is an approval. One noun per row.

Keep `spec` as an accepted input alias for `prd` in `parseAuditId` and `AuditTag`'s prop type for
one release. The stored token stays `prd` - thousands of `artifact_lineage` rows and a DB trigger
(`20260629120100_byo_p3_changeset_prd_join.sql:27`) hardcode it, and it is a word the user never
sees.

### R-3 · `usage_event` is NOT a graph node kind. Overriding depth-c.
Depth-c asked depth-a to add `usage_event` to `GRAPH_NODE_KINDS` so attention renders as a dimmed
layer. **Rejected.** Attention is not causation. The knowledge graph answers "what caused what";
flooding it with view events makes it the thing depth-a correctly warned against - a node-link
diagram that looks impressive in a screenshot and answers nothing. Depth-a applied exactly this
reasoning to exclude `doc`, and the same reasoning binds here.

`usage_events` keeps `audit_kind` + `audit_id`, and the Record sheet may render **one line**
("12 people asked why about this in the last 30 days"). A line, not a node.

### R-4 · `artifact_traces` and `usage_events` are different tables and must never merge.
`artifact_traces` (depth-a §8.2) indexes *which machine runs touched this entity*.
`usage_events` (depth-c §3.1) records *what a human did and whether the product could answer*.
Both carry `trace_id` and an entity reference, which makes them look mergeable. They are not: one
is machine provenance, the other is behavioral telemetry with a different retention policy (90-day
raw, rolled up) and a different consent basis (§8.3).

**Binding: `getRecord.runs` reads only `artifact_traces`.** A usage event must never appear in the
run list. Duplicating a fact into two ledgers guarantees they disagree.

### R-5 · The empty answer must be typed. This is the join between depth-a and depth-c.
Depth-c's most valuable event, `evidence_dead_end`, can only fire from a resolver that knows it
found nothing. **An empty array is indistinguishable from a real absence.**

Binding: `getRecord` returns `gaps: Gap[]`, and `Gap` carries the fields depth-c needs to group on:

```ts
type Gap = {
  stage: LoopStage;
  missing_relation: string | null;   // e.g. "mission→changeset"
  reason: "skipped" | "missing" | "pending";  // trust-chain.functions.ts:99-127 semantics
  because: string;                   // one plain sentence for the user
};
```

`trust-chain.functions.ts:99-127` already computes this distinction correctly and it is unit-tested - `missing` specifically means "a LATER link exists, so a receipt that should be here is not". That
is a genuinely rigorous piece of modelling currently visible only inside a mission's chain. Promote
it to every record, and let depth-c's rule U-1 group on `(audit_kind, missing_relation)`.

**This closes the loop on itself: the product detects its own provenance holes and files them into
the self-improvement queue it already runs 37 crons to fill.** That is the demo for the whole
depth layer.

### R-6 · One audit id per entity. Many runs per entity. Joined by a relation, not a column.
Per §2.3. `artifact_traces` is that relation, written from the single AI chokepoint
`runtime.server.ts` whenever `opts.subject` and `opts.traceId` are both present, upserted on the
unique key so a 31-hop run writes one row per entity touched, not 31.

This also fixes a real mess: `ai_events.surface_ref` has roughly forty distinct shapes today - bare uuids, agent slugs, namespaced strings like `critic:${kind}:${id}`, and bare literals with no
id at all (`"title"`, `"focus_next"`). You cannot query "the traces for this spec" against that. It
is not a missing feature, it is a missing convention, and every new AI surface adds another shape.
`CallOpts.subject?: { kind: EntityKind; id: string }` is the typed join key; `surface_ref` stays
for free-text context.

### R-7 · Ask becomes the primary surface - but not this week. Overriding depth-b's sequencing, not its direction.
Depth-b is right that a 420px panel is the problem and not the polish. The evidence is mechanical:
`ProgressBlock` truncates to the last five steps and `stepDescription` truncates each to 140 chars - that is not restraint, that is a component apologizing for its container. It is also right that
the Engine-Room doctrine was misapplied: **an agent doing work on your behalf is not machinery, it
is the work.** Hiding it produces exactly the complaint that started this.

**But depth-b's §2 is the largest single change in the rebuild** - it touches `_authenticated.tsx`,
`MissionShell.tsx`, `GlobalComposer.tsx`, and every route's assumption about its own chrome, three
days before a demo re-record. Depth-b says so itself and offers the phasing: §§3-5 are independent
of the surface change.

**Ruling: adopt the two-column conversation+canvas as the target architecture, schedule it for
after the demo, and ship the inline gate inside the existing composer now.** The demo does not need
a new layout. It needs the gate to appear in the turn that produced it, with legible arguments, and
to be decidable there. That is achievable inside `ThreadMessage` (R-10).

### R-8 · The two provenance systems stay separate and are reconciled in one visible line.
Do not merge the FK walk and the lineage walk into one query. **The FK walk is ground truth for the
nine canonical links; lineage is ground truth for everything else.** Reconcile them into one
sentence stream, and render disagreement as a named state (§3). Today they mostly agree only
because the FK walk is more complete; the moment lineage improves they will visibly diverge inside
a single sheet.

### R-9 · No generated column, no 21-table migration. Overriding depth-a §4.2.
Depth-a proposed `ALTER TABLE ... ADD COLUMN audit_short GENERATED ALWAYS AS (...) STORED` plus an
index, on every registry table, to fix the `select("*").limit(2000)` resolver. That is 21 ALTERs
with table rewrites on a live Lovable-managed database, and it is unnecessary.

`auditShort` (`audit-id.ts:71`) strips non-alphanumerics and takes six characters. A canonical uuid
has its first hyphen at index 8, so **the first six alphanumerics are always the first six
characters of the uuid string**. Therefore the lookup is a prefix range on the primary key itself:

```ts
const s = short.toLowerCase();
const { data: rows } = await db.from(meta.table)
  .select(SELECT_FOR_KIND[meta.kind])          // named columns, never select("*")
  .gte("id", `${s}00-0000-0000-0000-000000000000`)
  .lte("id", `${s}ff-ffff-ffff-ffff-ffffffffffff`)
  .limit(2);
```

Both bounds are valid uuids, uuid comparison in Postgres is bytewise, and the range uses the
existing primary-key index. **Zero migrations, zero new columns, one query.** Cost drops from up to
2,000 full rows per tag click to one indexed lookup.

Depth-a's collision handling is kept and is the important half: request **two** rows. Six
alphanumerics is 24 bits, so within one table the odds of at least one colliding pair are about
0.3% at 1,000 rows and roughly 37% at 5,000. `rows.find` returns the first match, so at real scale
a click on one signal silently opens a different signal's record. **If two rows come back, the sheet
says so** - "Two records share the ref `SIG·A1B2C3`", both titles, both timestamps, pick one.
Silently picking the first is the failure mode that destroys trust in the id system the first time
it happens on camera.

### R-10 · The demo's inline gate rides the realtime channel that already exists.
Depth-b's `run_events` table plus SSE tail plus `run-tail.server.ts` is the right long-term
architecture - it gives live narration, reload replay, and resume rehydration from one source. It
is not a two-day change.

But **`agent_approvals` is already in the realtime publication** (migration `20260716120000`) and
`src/hooks/use-approval-push.ts` already subscribes to it, filtered by `user_id`, with a
reconnect-refetch. It invalidates only `["ask-pending-approvals"]` and `["ask-mission-canvas"]` - the two query keys owned by the **unmounted** panel.

**Ruling for the demo: repoint that hook at the live surface's keys and render a mission-scoped
gate card in `ThreadMessage`.** The gate appears in the turn within one round trip of the run
reaching it. No new table, no SSE contract change, no risk to `parseSseLine`. `run_events` and the
five new frames follow in August as the upgrade, not the prerequisite.

### R-11 · Delete the cross-tenant analytics path now. Do not fix it.
Depth-c proposed fixing or retiring the HogQL query. **Retire it, this week, in a three-line
change:** delete `ingestPostHogAnalytics` and `insertSpikeSignals`
(`analytics-ingest.server.ts:119-158`) and the call at `sense-tick.ts:134`.

Fixing costs more and buys nothing, because depth-c verified that 8 of the 10 events the query
asks for are never emitted anywhere in the app. Even fully keyed and correctly scoped, it would
return near-nothing forever. Deleting removes a landmine that would be a catastrophic finding in
technical diligence and loses zero working behavior. `autoAdjustIce` is repointed at first-party
rollups in August (depth-c T-31); until then `getProductAnalytics` honestly reports "not measured
yet", which `ingestGated` already models.

### R-12 · `human_gate_events.surface` is owned by `decideGate`, not by the telemetry angle.
Depth-b asked depth-c to own the column; depth-c asked depth-b to wire it. Classic ownership gap.
**It lands as a required parameter of the merged `decideGate` function, in the same PR that merges
the two decide paths.** One owner, one write, no coordination.

Without it, "do people decide inline or bounce to the queue" is unanswerable, which means the
entire agentic-Ask investment is unmeasurable. Wire it **before** the inline card ships so a real
baseline exists.

### R-13 · The trust arc may propose its own loosening. It may never apply it.
Depth-c's U-2 asymmetry is correct and I am making it binding: **a usage rule may auto-apply a
demotion (tightening on evidence of harm) and may only propose a promotion (loosening on evidence
of comfort).** A loop that silently grants itself more autonomy because people kept saying yes is
precisely the failure this product exists to prevent, and shipping it would be indefensible however
well it worked.

Corollary on copy, and this is an honesty fix depth-b missed: its gate card says *"Build has run
this clean 3 times. 2 more and I stop asking."* Under R-13 that is a promise the product does not
keep - graduation requires a human. The honest sentence is **"2 more clean runs and I'll ask you to
let me stop asking."**

### R-14 · Better Stack is cut. Uptime is never published from `uptime-tick`.
`src/routes/api/public/hooks/uptime-tick.ts` fetches the app's own health endpoint **from inside
the same Cloudflare Worker platform**. When the platform is down the tick does not run, so the
sample is missing exactly when it matters and the computed uptime rounds *up* toward 100%. A number
that is highest when the outage is worst is worse than no number.

The cron watchdog in `observability.functions.ts:113-133` already detects that silence via
`EXPECTED_JOBS`. Adding Better Stack buys a vendor, a key, a DPA entry, and a sub-processor
disclosure for a signal we compute. **Cut it, keep `heartbeat()` as a permanent no-op seam, publish
incident counts from `error_events` instead** - honestly floor-biased rather than dishonestly
ceiling-biased.

---

## 5. The lineage fix - the exact vocabulary and the exact call sites

This is the mechanical answer to "why did we decide this" and no front-end work substitutes for it.

### 5.1 The vocabulary hole, precisely

`ARTIFACT_KINDS` (13, verified) covers the front half and `mission`. Missing entirely:
**`changeset`, `deployment`, `approval`, `learning`, `insight`, `memory`, `assumption`.**
`GRAPH_NODE_KINDS` (10) is shorter still, so `prototype`, `house_rule`, and `capability_change`
render as untitled ghosts - `hydrateTitles` does `if (!spec) continue;`
(`knowledge-graph-view.functions.ts:206`) and focusing the graph on one throws inside the handler,
gets swallowed by `catch { return emptyGraph(); }` at `:310`, and shows an empty canvas. Two silent
failures stacked on one vocabulary mismatch.

`GRAPH_RELATIONS` is the healthy half and needs four additive verbs (the column is free-text
`TEXT NOT NULL DEFAULT 'promoted'`, so no migration):

| relation | meaning | written by |
| --- | --- | --- |
| `produced` | materially created by | mission → changeset, changeset → deployment |
| `gated-by` | could not proceed until a human decided | changeset → approval, deployment → approval |
| `measured-by` | this bet was scored by that outcome | prd → learning, mission → learning |
| `distilled-into` | became durable, reusable knowledge | learning → memory, learning → house_rule |

Chosen so the loop reads as one English sentence in one direction:

> *a signal promoted a theme, which promoted an opportunity, which promoted a spec, which dispatched
> a mission, which produced a change, gated by an approval, deployed as a deploy, shipped as a
> release, measured by a learning, distilled into a memory, which validates the opportunity.*

That sentence is the product. It has never once been renderable.

### 5.2 The call sites, ranked

**Demo-critical six** (these six make the chain cross Plan → Build → Ship → Learn once):

| # | File:line | Edge | Note |
| --- | --- | --- | --- |
| 1 | `ai/tools/registry.server.ts:1470` (`studio.stage`, after `changeset = created`) | `mission --produced--> changeset` | The single edge whose absence makes the loop feel disconnected. Today the only path from a mission to its code is an FK the graph cannot read. |
| 2 | `deployments.functions.ts:95` (`captureDeployments`, after upsert; re-select for ids) | `changeset --produced--> deployment` | |
| 3 | `deployments.functions.ts:243` (after the promote-receipt `agent_approvals` insert at `:229`) | `deployment --gated-by--> approval` | **Hard, not fail-soft.** Machine-readable proof a human cleared production. If we cannot record who authorised a prod deploy, the promote must not report success quietly. |
| 4 | `outcome.functions.ts:283` (after the `learnings` insert) | `prd --measured-by--> learning` | |
| 5 | `outcome.functions.ts:312` (after `rememberOutcome` returns) | `learning --distilled-into--> memory` | This is what makes "the brain compounds, it is never storage" verifiable rather than asserted. Right now `agent_memory` rows have no recorded parentage, so in the graph the memory literally *is* storage. |
| 6 | `api/chat.ts:530` (after `createMission` at `:503`) | `<grounding entity> --dispatched--> mission` | `chat.ts` already resolves `AnswerBlock`s through `resolveAnswerBlocks` - it knows what the conversation was grounded in. Without this, a mission born in conversation has no parent at all. |

**Follow-on ten:** `studio.pr.merge` gating edge, `promoteToProduction`, `deployment --promoted-->
release` (`outcome.functions.ts:335`), `mission --measured-by--> learning` (conditional on
`learnings.mission_id`), `learning --validates|contradicts--> opportunity` (extend
`inferDirectEdge` at `edge-extractor.server.ts:23` to emit two edges - this closes the circle
*through* the learning rather than around it), `learning --validates|contradicts--> insight` at the
Brier-calibration write in `self-improve.functions.ts` (the product grading its own predictions
with a receipt - the most defensible "company brain" claim in the deck, currently unwritten),
`learning --distilled-into--> house_rule`, `mission --gated-by--> approval`
(`loop.server.ts:1152`), plus `recordLineageBatch` for the three raw batch upserts.

**One deletion.** `capabilities.functions.ts:665` passes an agent *slug* (`"builder"`) as
`child_id`, which is `UUID NOT NULL`. Every call raises Postgres `22P02` and `recordLineageSafe`
catches and discards it by design (`lineage.functions.ts:70`). **This call site has produced zero
rows since it was written and the fail-soft wrapper guaranteed nobody would find out.** Delete it,
and set `capability_change` to `lineage: false` until agents are real nodes with real uuids.

That defect is the strongest possible argument for R-1's gate: fail-soft provenance without a
test-time contract is provenance that silently does not exist.

**One correction to a shared assumption.** It is not true that Ship and Learn write *no* lineage.
`recordOutcome` calls `inferDirectEdge` (writes `prd --validates--> opportunity`) and
`inferSupersession` (typed `supersedes`/`contradicts` with bi-temporal retirement, flag-gated on
`DECISION_BRAIN_SUPERSESSION` and dormant by default). `recordTestStationVerdict` writes
`mission --test_verdict--> decision`. So the back half writes edges - **between front-half nodes.**
The `learnings` row, the `agent_memory` row, the `studio_changesets` row, the `deployments` row are
all erased from the graph. That is a sharper and more damning statement than "no writes": the loop
is drawn as a closed circle in every strategy doc, and in the data it is a circle whose right half
is one arc from `prd` back to `opportunity`, with the four entities that actually did the work
missing.

---

## 6. The one gesture

### 6.1 There are five provenance surfaces today. There should be one.

All mounted, all reachable, all different, all rendering different data from different queries:

1. `AuditLineageSheet.tsx` (239 lines) - global, opened by `openLineage(ref)`.
2. `LineageDrawer.tsx` - a *different* sheet, from `SpecDetail.tsx:435`, `SpecList.tsx:427`,
   `OpportunityQueue.tsx:497`.
3. `GraphPanel.tsx` + `GraphNodeStory.tsx` - the canvas.
4. `_authenticated.traces.$traceId.tsx` (861 lines) - the waterfall.
5. `SpecDetail.tsx:147` - an inline "Why this spec" block calling `getProvenance` a third time.

Click the audit tag on a spec card and you get surface 1. Click "lineage" on the same spec's detail
page and you get surface 2. **This is the actual reason the product does not feel like one thing.**

### 6.2 The gesture

**Hold `⌥` and click anything. Or click its audit id. Or type the ref into `⌘K`.** All three open
the same thing: **the Record.**

Alt-click is the one modifier with no existing meaning in this app, it composes with every element
without a per-component affordance, and it is discoverable through one persistent status-bar hint
plus a one-time coach mark. The audit tag stays the visible affordance for people who never learn
the modifier.

`getRecord(ref)` in `src/lib/provenance/record.functions.ts`, one round trip, composing what today
takes four, and it is the single function depth-b's chat calls when `findAuditIds`
(`audit-id.ts:107`, already built and tested) matches a prompt. **There is one provenance renderer
in the product.**

### 6.3 What it reveals, in order

**One - the chain, as sentences.** Not a node list, not a timeline. One clause per edge, past
tense, with a real subject (`created_by_agent`, else "You", else the member's name - never "The
system", never agentless passive voice, which is the AI-fingerprint failure the humanized-output
convention exists to prevent). Assumptions and beliefs render as indented sub-clauses because they
are the *reasons*, and reasons belong to the sentence they qualify. Numbers through `PixelStat`,
ids through `AuditTag`, no other emphasis - the restraint budget is spent on the ids. Truncation is
honest ("3 more signals fed this theme - show all"); `getProvenance` already returns `truncated` and
`node_count`.

**Two - the responsible agent.** One line, never fudged, assembled from what already exists
(`artifact_lineage.created_by_agent`, `agent_approvals.decided_by`, `agent-scorecard.functions.ts`,
`gauntlet.functions.ts`). When `created_by_agent` is null the line is **"You did this, on Jul 4"** - a human action is a first-class answer, not a missing value.

**Three - the evidence it acted on.** The distinction that makes this layer worth building:
**lineage says what caused this; evidence says what the agent was looking at when it decided.**
Every source already exists and none is shown next to the artifact: `memory_recall_log` (has
`trace_id`, `memory_id`, and an `outcome` of used/ignored/**contradicted**), `learning_citations`,
`guardrail_hits`, `ai_events.input_preview`. Rendering **"recalled, then contradicted"** next to a
memory is the product visibly learning in front of the user, from a column written today and read
by nothing.

**Four - the runs.** A summary with a door, not a second waterfall. Five rows, each opening
`/traces/$traceId`, which is already an excellent surface that nothing currently links to from an
entity. Numbers come straight from `listTraces`' existing aggregates.

**Five - the graph.** Small, focused, two rings, deliberately **last**. The sentences are the
answer; the graph is the proof. Leading with a node-link diagram is the mistake every provenance
product makes.

**Six - what is honestly missing.** Per R-5. *"No design gate - the Design stage is off for this
workspace. No test receipt - the changeset merged without a PR, so CI never ran."*
**This section is the credibility of the whole feature.** A provenance surface that shows only what
it has is marketing. One that names its own holes is a system of record.

### 6.4 Both directions

**Entity → run** via `artifact_traces`. **Run → entity** by adding a fifth parallel query to
`getTrace` (`traces.functions.ts:186`), so the trace header stops saying "Trace · 12 hops" and
starts saying **"This run drafted PRD·4A5B6C and revised OPP·005C82"**, each an `AuditTag` back
into the Record. The existing three-hop reverse lookup through
`agent_run_checkpoints.state->>'traceId'` - an **unindexed JSONB expression** with a `.limit(1)` and
a code comment admitting it needs an index (`traces.functions.ts:203-228`) - becomes a
pre-migration fallback and is then deleted.

---

## 7. The agentic turn

### 7.1 One decide path - FIX, and it lands regardless of everything else

Verified divergence:

| Surface | Function | `escalation_state` | `human_gate_events` | `decision_reason` |
| --- | --- | --- | --- | --- |
| `/approvals`, Mission Control | `resolveApproval` (`governance.functions.ts:384`) | ✅ `resolved` | ❌ **never** | ✅ |
| Ask canvas (unmounted) | `decideApproval` (`agent_loop.functions.ts:74`) | ❌ stays `pending` | ✅ | ❌ no param |

The permanent consequence: **every tool-call decision made on the primary queue surface produces no
`human_gate_events` row.** That is the correction signal - the single highest-value learning event
the product has, by its own documentation (`src/lib/gate-signals.ts:1-14`). The trust arc, the
per-agent correction rate, and every graduation proposal are blind to every decision made where
users actually decide. **This does not self-heal.** (The reverse divergence - Ask leaving
`escalation_state='pending'` - does self-heal via the `approvals-tick` cron within a minute.)

**Merge into one `decideGate` in `governance.functions.ts`** doing all five writes: read prior →
update status + `escalation_state` + `decided_by` + `decision_reason` → `recordGateSignalCore`
(only when `prior.status === 'pending'`, so a re-decide never injects a duplicate) → `injectSteer`
on a denial with guidance → `postGateReceipt`. Plus R-12's `surface` parameter. Then
`agent_loop.functions.ts:74` delegates, `approvals-queue.functions.ts:723` calls it,
`resolveApproval` is a one-release alias, and `deployments.functions.ts:237` (which writes
`escalation_state` directly) is audited in the same pass.

**Grep-enforceable afterwards:** `agent_approvals` + `.update({ status:` returns exactly one
non-test hit.

### 7.2 The turn anatomy

```
you  ──  Open a PR for the checkout-latency fix and merge it if CI is green.

Supaprod
  ▸ PLAN                                                    [MIS·7E7D59]
    Three steps. Open a draft PR from the staged changeset, wait for CI,
    merge if it comes back green.

  ▸ ran  read the changeset                                        0.4s ✓
         CHG·4A21B9 · 6 files · feat/checkout-latency

  ▸ WAITING ON YOU                                          expires in 7d
    ┌──────────────────────────────────────────────────────────────┐
    │  Open a draft pull request                                   │
    │  repo      RohitGajaraj/Supaprod                             │
    │  branch    feat/checkout-latency → main                      │
    │  files     6   src/lib/checkout/*.ts, src/routes/api/pay.ts  │
    │                                                              │
    │  Reversible · Close the PR. Nothing merges.                  │
    │                                                              │
    │  Why I'm asking: this writes to your repo, so it sits above  │
    │  the confirm line no matter how much I've earned.            │
    │  Build has run this clean 3 times. 2 more clean runs and     │
    │  I'll ask you to let me stop asking.                         │
    │                                                              │
    │   [ Approve ]   [ Deny ]   [ Change something ]              │
    │    runs it now   I stand down   tell me what to do instead   │
    └──────────────────────────────────────────────────────────────┘

  (you approve)

  ▸ ran  opened a draft pull request                               1.8s ✓
         PR #412 · APR·B2C3D4 · [you approved · 11:04] · RUN·8F21C4

  ▸ WORKING  waiting on CI                    started 11:04 · still going
    This keeps running whether or not you stay.  [ Watch ] [ Steer ]
```

Binding voice rules (`docs/conventions/ui-voice.md`, `engine-room-doctrine.md`): never "Reject" - **"Deny"**, because reject is what you do to a person's idea and deny is what you do to a request.
Never "Execute" - **"Approve · runs it now"**. The mechanism name (`studio.pr.open`) appears only in
the receipt's mono detail line, never as the card's title. Each button carries a consequence line.

**Legible arguments are the difference between an approval and a rubber stamp.** A raw JSON blob is
not consent. `src/lib/tool-args-legible.ts` (pure, client-safe, static map beside
`tool-consequences.ts`, conservative fallback to the top three scalar keys, **never model output**)
projects each tool's args into the two-to-four facts a human needs. Note the wasteful irony this
fixes: `getApprovalsQueue` already fetches `args` from `listGovernApprovals`
(`governance.functions.ts:236`) and **throws them away** when building the card
(`approvals-queue.functions.ts:362-390`). The arguments a user is being asked to authorize are
loaded into memory and discarded.

**Why it asked** comes from `explainToolMode` - a sibling of `resolveToolMode` in the same file so
the two can never drift, returning the branch taken rather than only the result. Five causes, five
plain sentences, first person, never the mechanism.

**A denial is guidance, not silence.** Today it is a bare toast, and `/approvals` says "Rejected.
Noted for next time." - a promise the product does not keep, because nothing is noted anywhere a
model will read. The third verb, **"Change something"**, routes the steer through `injectSteer`
(generalized from `studio.functions.ts:974-1005`, which today hardcodes `to_agent_slug: "builder"`).
The loop already consumes these: `loop.server.ts:876-922` reads unconsumed `kind='steer'` messages
at the top of every step and marks them consumed **only after** the checkpoint persists them, so a
steer can never be both consumed and lost. **That machinery is correct and has never had a UI.**

### 7.3 The behavior that separates an agent from a chatbot

A run that outlives the response finishes under the `resume-runs` cron and **posts its receipt back
into the conversation that asked for it** via `postGateReceipt`. The user returns to a thread where
the work completed itself, in sequence, with a receipt. That requires `agent_runs.conversation_id`
(one migration - the reverse of the existing `messages.mission_id`), and it requires resume to
actually work, which brings us to the thing that outranks all of it.

### 7.4 The resume fix - the highest-priority item in this document

Restore `conv` to the checkpoint (`loop.server.ts:827-867`). The O(n²) concern behind
commit `2d73a156` was real but misjudged: `maxSteps = 6` and each `conv` entry is capped at 2000
chars (`:1244`), so the worst case is roughly six upserts of a ~24KB jsonb. That is not the hot
path the optimization pass believed it was, and the premise it rested on - that
`agent_run_steps`/`agent_run_messages` held the history - was simply false.

Also restore `steps` (from `run_events` once that exists; from the checkpoint until then), because
`anyToolStepFailed(steps)` at `finalize()` (`:1536`) currently tells a resumed run's story wrong.

**Mandatory regression test.** `src/lib/ai/loop.server.test.ts` already has a
`describe("resumeAgentLoop")` block at line 193 with a TODO at line 394. Add: *a run checkpointed
at step 3 with a five-message `conv` resumes with that same `conv` and non-empty `steps`.* That one
assertion would have caught `2d73a156` on the day it landed.

---

## 8. One queue, two surfaces

### 8.1 The rule

> A gate is a row in `agent_approvals`. It has **exactly one write path**. Every surface is a view
> and every view calls the same function. A decision anywhere resolves it everywhere, in one round
> trip, with no cron in the loop.

| | The conversation (inline) | `/approvals` (the queue) |
| --- | --- | --- |
| Question | "This turn produced a gate. Decide it without leaving." | "What is waiting on me across everything?" |
| Scope | Gates whose run belongs to this thread | Workspace-wide, all 10 families |
| Shows | Full args, the why-chain, the streak, three verbs | Grouped by project, j/k nav, filters, batch |
| Write path | `decideGate` | `decideGate` |
| Read path | realtime on `agent_approvals` → `getConversationGates` | `getApprovalsQueue` |

They are not redundant: the inline gate is *decision at the point of context*, the queue is
*decision at the point of triage*. What must never happen is a gate appearing in one and not the
other, or clearing in one and not the other.

### 8.2 How they cannot disagree

Three mechanisms, all cheap:

1. **One write path** (§7.1). Grep-enforced.
2. **One invalidation set.** `useApprovalPush` mounted once at the shell, invalidating all five
   keys - `["approvals","queue"]`, `["conversation","gates"]`, `["needs-you"]`,
   `["mission-approvals"]`, `["spec-approvals"]`. Then delete the per-surface 4s and 30s polls; the
   4s poll against `getAskMissionCanvas` fires six queries per tick and is a real cost line.
   This finally honors the founder's 2026-07-18 "ONE COUNT ONE SOURCE" ruling already recorded in
   `MissionShell.tsx:5-7` - currently honored for the count and violated for the queue.
3. **One shape.** `getConversationGates` returns the **same `GateFrame` shape** the live path emits.
   The inline card must never have two code paths, one for live and one for reloaded.

One inconsistency to fix while in there: the `/approvals` risk chip derives from `agent_tools.mode`
(`governance.functions.ts:277-283`), not from `toolRisk()` in `tool-consequences.ts`. Two different
notions of "high risk" on two surfaces. `toolRisk` wins - it is the one the loop actually enforces.

---

## 9. Scoring against the six tests

### 9.1 The "why did we decide this" test - the honest count

Stand on an entity, ask why. Today:

**Passes end to end (6 of 22):** `signal`, `theme`, `opportunity`, `prd`, `decision`, `mission`.

**Fails completely - no kind, no id, no edge (6):** `changeset`, `deployment`, `approval`,
`insight`/belief, `assumption`, `incident`.

**Fails partially (10):**
- `learning`, `memory`, `release`, `goal` - audit kind declared, **zero lineage edges**, so "why"
  answers with nothing upstream. Three of them (`memory`, `release`, `goal`) additionally have
  **zero render sites** - the tag exists in the map and appears nowhere in the product.
- `task`, `roadmap_item`, `design_memory` - lineage yes, audit tag never rendered.
- `prototype`, `house_rule` - lineage yes, **graph ghosts** (untitled nodes; focusing throws and
  silently shows an empty canvas).
- `meeting` - reachable only through `GraphNodeStory.tsx:30`'s translation map, never on a meeting
  card or `/meetings/$id`.
- `run`/trace - a raw uuid nobody can say, read, or recognise twice.

**Five of twelve declared audit kinds have never been rendered anywhere.** The 2026-07-13 ruling
("everything should have a traceable audit id") was implemented as a *mechanism* and delivered as
six-twelfths of a *surface*. That is the honest reading and it is exactly the
claim-outrunning-wiring pattern the standing rule exists to prevent.

**After this contract:** 22 of 22 have a kind, an id, and at least one edge; the gaps that remain
are rendered as gaps (R-5) rather than as silence.

### 9.2 The agency test
**Fails today, completely.** `chat.ts` has zero `agent_approvals` references, the response closes
before the loop takes a step, and off `/m/*` the composer renders no gates at all - while the
assistant's own copy claims otherwise (§2.5). After §7: propose → grant → receipt, in one thread,
no context switch, and the receipt survives the user walking away.

### 9.3 The one-queue test
**Fails on the write side today** - two functions, divergent writes, permanent loss of the
correction signal from the surface where decisions actually happen. §7.1 + §8.2 reduce it to one
function, one invalidation set, one shape.

### 9.4 The honesty test
Three violations found across the proposals; all corrected. See §10.

### 9.5 The buildability test
All three proposals pass. Every item names a file and a line. I rejected only one item for
hand-waving: depth-a's §5.2 Site 2 (`changeset --gated-by--> decision` at `studio.pr.merge`) leaves
`<the merge approval's decision id, when present>` unresolved. Under R-2 the correct child is an
`approval`, not a `decision`, and the id is `agent_approvals.id`. Fixed by the vocabulary.

### 9.6 The two-day test
See §11. Five items are genuinely required; roughly thirty are right and can follow. I am not
promising the rest by Friday and neither should the plan.

---

## 10. The honesty register

Every place a proposal, or the product, claims something the wiring lacks.

| # | Claim | Reality | Ruling |
| --- | --- | --- | --- |
| H-1 | `chat.ts:568`: *"approve their decisions inline below"* | Nothing appears below, off `/m/*` | **Delete the sentence today**, in whatever commit ships first. This is live in production. |
| H-2 | `/approvals`: *"Rejected. Noted for next time."* | Nothing is noted anywhere a model reads | Either capture the reason and route it through `injectSteer`, or cut the second sentence. Not both ways. |
| H-3 | depth-b's gate copy: *"2 more and I stop asking"* | Under R-13 graduation needs a human | Rewrite: *"2 more clean runs and I'll ask you to let me stop asking."* |
| H-4 | depth-c's error page: *"Paste that reference into Ask and it will pull up exactly what happened"* | True only after T-15 wires the resolver | depth-c already gates this correctly. Keep the tripwire: the copy stops at sentence two until the chain is end-to-end. |
| H-5 | Investor canon: *"it warns before you repeat what was wrong"* | `memory_recall_log.outcome` has a `contradicted` value and **nothing reads it** | Do not use this line in external material until rule U-5 ships. |
| H-6 | *"Autonomy ratio"* | `gauntlet.functions.ts:126-132`'s own comment says a rising ratio means more *reversible* work ran inline, not less oversight | Rename to **"Work the loop carried"**. The honest sentence - *"the loop carried 68% of the reversible work; everything with a blast radius still came to you"* - is a **better** claim, because it is the trust story. |
| H-7 | Memory lift as a headline | `getMemoryLift` is the most intellectually honest function in the codebase - refuses causation, gates on a size floor, a depth-contrast guard, and a two-proportion 95% CI, and names its own confounders. All of that evaporates the moment a card says *"Memory made you 14% more accurate."* | **Keep internal** until there is a memory-off control cohort. Ship "Memory compounds" (stored / recalled / reuse) instead - counts cannot lie. |
| H-8 | Any uptime percentage | R-14 | Never publish from `uptime-tick`. Publish incident counts. |
| H-9 | *"It knows what to build"* on a product surface | Directional, not yet earned | On product surfaces the honest form today is "here is what changed and what it touches". The lineage work plus rule U-1 earn the stronger phrasing later. |
| H-10 | A number computed from a dormant source | `getProductAnalytics` already models this with `ingestGated`; `gauntlet.functions.ts` models it everywhere with `tableReady` and `rate: null` | **This is the house pattern.** Never `0`, never a styled dash. "Not measured yet." Every new surface copies it. |

**And the meta-violation:** `capabilities.functions.ts:665` is a lineage call that has never written
a row, wrapped in a fail-soft helper that guaranteed nobody would find out. Fail-soft provenance
without a test-time contract is provenance that silently does not exist. That is R-1's entire
justification.

---

## 11. What ships for the demo, and what does not

Today is 2026-07-28. The re-record is 2026-07-31. That is two working days plus a recording day.
I am separating what a credible demo requires from what is right, rather than promising both.

### 11.1 DEMO LANE - five items, must land by Jul 30 EOD

| # | Item | Why it is demo-critical | Size |
| --- | --- | --- | --- |
| **D1** | **Restore `conv` (and `steps`) to `checkpoint()`; add the resume regression test** | `loop.server.ts:827,1411`. The demo's central beat is approve-and-continue. Today the agent resumes amnesiac at step 4 of 6. On camera this looks like the agent forgetting what it was doing, because it is. | ~30 lines |
| **D2** | **One decide path: `decideGate` + the `surface` param; rewire all three callers** | Without it, deciding inline leaves the queue stale for up to a minute, and the correction signal is lost from the surface where decisions happen. Also a correctness fix that should land regardless of this plan. | ~90 lines |
| **D3** | **Inline gate in the live composer** - repoint `useApprovalPush` at the live keys, mount it at the shell, render a mission-scoped gate card in `ThreadMessage` with `legibleArgs` + the why-line + three verbs | The founder's loudest ask, and the agency test. Rides the realtime channel that already exists (R-10) - no `run_events`, no SSE change, no risk to `parseSseLine`. | ~250 lines |
| **D4** | **Six lineage edges + five audit kinds** (`changeset`, `deployment`, `approval`, `insight`, and `run`) + tags on the deploy and changeset surfaces | Makes the chain cross Plan → Build → Ship → Learn **once**, which is exactly what "why did we decide this" needs to answer on camera. The existing `LineageDrawer` walks `artifact_lineage`, so it gets better the moment the edges exist - no new sheet required for the demo. | ~120 lines |
| **D5** | **Delete `ingestPostHogAnalytics` + `insertSpikeSignals` + the `sense-tick.ts:134` call** | R-11. Three lines, zero risk, removes a cross-tenant landmine that would be a catastrophic finding if anyone technical looks. Not visible in the demo - do it because it is indefensible to leave. | ~3 lines |

Plus **H-1 today**: delete the sentence in `chat.ts:568`. It is a live lie and it costs one line.

**Also demo-adjacent, do only if D1-D5 land early:** R-9's resolver fix. The `select("*").limit(2000)`
scan is a visible latency hit on every tag click, and it is now a small change (a prefix range, no
migration). Collision risk at demo scale is near zero, so this is polish, not protection.

### 11.2 FOLLOW LANE - right, and it can wait

Ordered by dependency. Roughly three weeks.

**Week 1 - make the data true.**
1. `src/lib/provenance/kinds.ts`, 22 rows, derived exports, `kinds.test.ts`.
2. Repoint the eleven maps; delete `GRAPH_AUDIT_KIND` and `CALL_AUDIT_KIND` outright.
3. The remaining ten `recordLineage` sites + `recordLineageBatch`; delete the dead capabilities call.
4. The coverage gate with the monotonically-decreasing allowlist (R-1).
5. `run_events` + `emit()` at the eight loop call sites + the 90-day prune.

**Week 2 - make it felt.**
6. `artifact_traces` + `CallOpts.subject` + the backfill cron (which reports coverage - "recovered
   8,412 of 11,027 historical traces" - rather than pretending to be complete).
7. `getRecord` + the pure, tested sentence composer.
8. `RecordSheet.tsx`; retire `AuditLineageSheet` and `LineageDrawer`; the alt-click handler.
9. `AuditTag` on the remaining uncovered kinds; `getTrace.subjects` + trace-page back-links; drop the
   JSONB reverse lookup.
10. SSE frames + `run-tail.server.ts` + the `chat.ts` tail + `agent_runs.conversation_id`.

**Week 3 - make it learn, and make it honest.**
11. `usage_events` + `usage_rollup_daily` + `recordUsage` + the static per-kind prop schema.
12. The incident chain: `error_events` migration (`incident_ref`, `fingerprint`,
    `occurrence_count`, `trace_id`), upsert-on-fingerprint so the **storm guard counts instead of
    dropping** (today the worst incidents are the ones the store under-reports), pass the `traceId`
    that is already in scope at `runtime.server.ts:1901`, and `INC` in the registry.
13. Emit the taxonomy at the eighteen call sites, `evidence_dead_end` first.
14. `UsageSignal` + `usageProposal()` + rules U-1 (dead ends), U-3 (incomplete loop), U-5 (memories
    that keep being wrong), U-2 under R-13, U-4 (forecasts judged by arithmetic, not by a model
    grading a model).
15. Repoint `autoAdjustIce` at first-party rollups; `posthog_event` → `measure_event`.
16. The ESLint seam (`no-restricted-imports` for `posthog-js`, `posthog-node`, `@sentry/*`, excluding
    `src/lib/observability/**` - the one-way street is currently a convention held up by nothing),
    the PII scrubber on `stack`/`error_message`, `telemetry_mode`, `forget(userId)`,
    `/settings/telemetry`.
17. **Then, and only then:** add `POSTHOG_API_KEY` and `SENTRY_DSN`, flip
    `admin_set_observability_enabled(true)`.

**After that:** the two-column conversation surface (R-7), and delete `AskPanel.tsx`'s 1,438 lines
of dead fork once its blocks are ported.

---

## 12. The telemetry posture, in one section

Because it is the least understood of the three.

**First-party is the ledger. The vendor is a lens.** This inverts the AFD plan's framing, and the
inversion is the fix for §2.6: when the vendor is the ledger, the only way to read your own usage
back is a query you cannot make tenant-safe cheaply. Four reasons, in priority order: the loop has
to reason over usage inside an hourly cron and cannot make rate-limited HogQL round trips; tenancy
is only enforceable where RLS is; the data is the customers' own product decisions and they must be
able to see, export, and delete it; and vendor churn must be free.

**There is zero client-side telemetry today, and that is a feature.** No pageview hook, no
`posthog-js` bootstrap, no session replay, no heatmap. Do not treat it as a gap. Convert it to
doctrine: **session replay, autocapture, heatmaps, scroll depth, mouse movement, keystroke timing,
and form-field values are banned under every configuration and key.** A product that holds a PM's
strategy must not also film them writing it. This is not a privacy nicety - it is why the
authenticated app needs no cookie banner, which is free and is an enterprise sales asset. The one
exception to audit is `landing_events`' `session_key` (`landing.functions.ts:105`): if it persists
in browser storage it needs consent under ePrivacy. Make it per-request and non-persisted.

**The creepiness test, one rule, applied without argument:** *if we would not show a row to the
customer, we do not collect it.* `/settings/telemetry` enforces it by showing **the last 50 rows,
verbatim**, straight through the RLS SELECT policy. Not a summary - the actual JSON. Designing
every event against "would I be comfortable showing this row to the person it is about" is a far
better filter than any policy document, and it costs one route.

**At the vendor boundary, nothing is resolvable.** `distinct_id` is an HMAC of the *workspace*, not
the person, salted per workspace so the same entity in two tenants produces different refs. The
founder can count and cohort; he cannot look anything up. `TELEMETRY_SALT` is the panic button - rotating it severs all historical vendor correlation.

**And the retention line that must be explicit or a future cleanup deletes the moat:**
`usage_events` 90 days raw then rolled up, `error_events` 30 days then fingerprint+count,
`ai_events`/`tool_calls` 180 days - but `stage_events`, `learnings`, `insights`, `decisions` are
**never purged**. They are the customer's record, not telemetry.

---

## 13. What this contract makes true

When it lands, one sentence becomes renderable from real rows for the first time:

> A signal promoted a theme, which promoted an opportunity, which promoted a spec, which dispatched
> a mission from a conversation, which produced a change, gated by an approval you granted in that
> same conversation at 4:12pm, deployed to production at 4:31, shipped as a release, measured
> thirty days later by a learning that said setup time fell 71%, distilled into a memory the agents
> now recall - and it confirmed the belief we recorded on July 4th, Brier 0.09.

Every clause is a row. Every id is clickable. Every gap in it says so out loud.

That is the product.
