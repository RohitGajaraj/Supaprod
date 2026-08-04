# Knowledge-Graph Explorer (O1 / DBR-1 v1)

> _Created: 2026-06-20 · Last updated: 2026-07-07._ The first lane-built increment of the Decision Brain (H1): a typed, navigable knowledge-graph explorer over the provenance the product already records. Strategic home: [`decision-brain.md`](./decision-brain.md) (the DBR-1 step). Built in the `parallel/knowledge` lane, founder-enriched + approved 2026-06-20 ("B+" scope).

## What this is (v1, the "B+" cut)

A typed `{ nodes, edges }` view of the product's own decision lineage, rendered as a bounded, Obsidian-style visual graph at `/knowledge?tab=graph`. Every signal / opportunity / theme / PRD / decision / task / mission is a typed, color-coded node; every recorded lineage relation is an edge; click any node to read its story (where it came from, what it led to, the root signals it rests on). A truthful time axis (every edge's real `created_at`) answers "what did the graph look like as of `<date>`".

It is derived **deterministically from the existing `artifact_lineage` table**. No LLM extraction, no new write-tables, migration-free, fail-safe.

## Why it is built this way (the spec's own guardrails, honored)

The Decision Brain spec sets three hard guardrails. This v1 satisfies all three precisely because it is a read-only projection:

1. **Hybrid, never graph-only.** This adds a graph _read surface_ over data we already keep relationally; vector recall is untouched. No cost or latency regression on normal recall.
2. **Auto-extract, never manual.** `artifact_lineage` is already auto-written by `recordLineage` on every promotion (`promotePrdToTasks`, discovery -> opportunity, etc.). The graph builds itself from work the user already does. There is no second job.
3. **Claim never outruns wiring.** v1 only renders edges that **already exist**. It never fabricates a `contradicts` / `supersedes` edge. The bi-temporal supersession _engine_ (which would infer those edges) is deferred, because inferring them needs an AI write-path (recurring spend, the AI chokepoint), which is a different lane and a founder gate.

This is a deliberate simplification of the original `O1` scope (which assumed new `kg_nodes` / `kg_edges` tables): deriving from `artifact_lineage` is leaner, deterministic, and removes the migration entirely for v1.

## Architecture

### Read model (pure, TDD) - `src/lib/knowledge-graph-explorer.ts`

A pure, server-free module so it is unit-testable in isolation (`bun:test`).

- **Types:** `GraphNodeKind` (the artifact kinds), `GraphRelation` (`cites | derived-from | promoted | depends-on | supersedes | contradicts | ...`), `GraphNode`, `GraphEdge`, `KnowledgeGraph`.
- `projectGraph(rawEdges, titleMap, focusKey, bounds)` -> `KnowledgeGraph`:
  - Typed nodes (kind from the artifact kind), `influence` = node degree, deduped.
  - Typed edges; `validFrom = created_at`; `validTo = null` (the seam).
  - Bounded by `MAX_NODES` / `MAX_DEPTH` (mirrors `getProvenance`), with a `truncated` flag.
  - Deterministic layout positions (no randomness): concentric rings by graph distance from the focus node, angular spread by stable index, so the same graph always renders the same and the layout is testable.
  - Fail-safe: empty / malformed input yields an empty graph, never throws.
- `filterByTime(graph, asOf)` -> `KnowledgeGraph`: keep only nodes/edges with `validFrom <= asOf` (and `validTo` null-or-after), the truthful time axis.

### Server - `src/lib/knowledge-graph-explorer.functions.ts`

- `getKnowledgeGraph({ focusKind?, focusId? })`: walks `artifact_lineage` **both** directions from the focus (bounded), hydrates artifact titles (reuses the `hydrateTitles` shape from `lineage.functions.ts`), and returns `projectGraph(...)`. **RLS-scoped** via the authed Supabase client (only the caller's edges + artifacts). **Fail-safe**: returns an empty graph on any error, never throws to the UI.
  - **Auto-focus**: with no explicit `focusId`, the focus defaults to the caller's most recent decision -> opportunity -> prd (the "why is this decision here" framing).
  - **Lineage-anchored fallback** (O1 close, 2026-06-22): a workspace's lineage often lives entirely off its newest decision (e.g. early `signal->theme` promotions with no decision attached). When the auto-focus has **zero** incident edges, `getKnowledgeGraph` re-anchors on the child of the most recent `artifact_lineage` row (`resolveLineageFocus` -> pure `pickLineageFocus`) and re-runs the BFS, so a workspace that HAS edges never renders the empty state just because its newest decision is disconnected. An **explicit** focus the user clicked is always respected (the fallback is gated on `!focusId`), even when it stands alone.
- Node "story" reuses the existing `getLineage` (immediate parents/children) + `getProvenance` (root signals). No redundant fetch path.

### UI - `/knowledge?tab=graph`

A new `graph` tab on the existing `_authenticated.knowledge.tsx` (`validateSearch` + `TabRow` + panel-per-tab pattern; add `?focusKind` / `?focusId`).

- `GraphPanel.tsx`: focus picker (default = a recent decision/opportunity), the canvas, the node-story side-panel, the time filter, the truncation notice, and Ember loading / empty / error states.
- `GraphExplorer.tsx`: the dependency-free **SVG canvas** (deterministic layout, color-by-type, size-by-influence, pan/zoom, click-to-select). All rendered titles are user data, so they are escaped (React text nodes, never `dangerouslySetInnerHTML`).
- `GraphNodeStory.tsx`: the selected node's provenance + descendants, reusing `getLineage` / `getProvenance`.

## The supersession seam (write-path SHIPPED as DBR-1.5, dormant)

`GraphEdge.relation` already includes `supersedes | contradicts`; `GraphEdge.validTo: string | null`. The renderer styles `supersedes` / `contradicts` edges distinctly (e.g. dashed / madder). The read v1 never emits them itself; the **write-path** that does now exists: **DBR-1.5** (`src/lib/ai/supersession.server.ts`) infers `supersedes`/`contradicts` edges from recorded outcomes and stamps `valid_to`/`invalidated_by`/`inference` on `artifact_lineage` (migration `20260621030000`). It is **flag-gated OFF** (`DECISION_BRAIN_SUPERSESSION`), so the seam stays empty until the founder activates it. Because the engine writes real `relation` values into the same table this surface reads (and the explorer selects an explicit column list that excludes the 3 new bi-temporal columns), the edges render with **zero UI change** the day the flag flips. The graph is bi-temporal-shaped from night one. Spec: [`../planning/initiatives/supersession-engine-plan.md`](../planning/initiatives/supersession-engine-plan.md).

### Supersession legibility (read-side, F-IA-BRAIN-GRAPH, SHIPPED ◐)

Styling the supersession edges distinctly is not the same as making them _legible_: a madder dashed line does not tell a PM "this decision was reversed by a later outcome." This slice puts the mechanic into words, derived from the `relation` field `getLineage` already returns, plus the bi-temporal `valid_to` stamp it returns via its `*` select (regression-safe: the column is simply absent until the DBR-1.5 migration applies, so a retired assertion just reads as current pre-migration). Additive, fail-safe, and it never touches the canvas's explicit column list (so no 42703 on the live DB).

- **Pure core** (`src/lib/knowledge-graph-view.ts`): `buildSupersessionStory(ancestors, descendants)` reads each node's incident `supersedes` / `contradicts` edges and phrases them from that node's point of view. Direction follows the parent-to-child edge convention: an **ancestor** edge (this node is the child) means it **was superseded / contradicted by** the parent (its belief was revised); a **descendant** edge means this node **supersedes / contradicts** the child. `isSupersessionRelation` is the shared predicate. **Bi-temporal:** an edge whose `valid_to` is stamped is a _retired_ assertion (invalidate-don't-delete, the moat's distinguishing property) — it carries `retired` + `retiredAt`, sorts after current links, and is EXCLUDED from `revised` (a reversed revision no longer means the belief is currently revised). Self-revised links sort first; dedup by edge id; fail-safe on null/malformed/blank input. Unit-tested (`buildSupersessionStory` + `isSupersessionRelation`, 10 cases incl. the bi-temporal paths).
- **Node-story panel** (`GraphNodeStory.tsx`): a "decision history" section renders the story (madder-accented, links recenter the graph on the counterpart), with a one-line banner when this node's belief is _currently_ revised. Retired assertions stay visible as history but are de-emphasized (dimmed, label struck, a "no longer current · <date>" marker, date-guarded so a malformed stamp never renders "Invalid Date"). The generic "came from" / "led to" lists now exclude supersession edges, so the mechanic reads once in its own section, not as a cryptic `supersedes` tag.
- **Canvas summary** (`GraphCanvasView.tsx`): two graph-level lines, both honoring the "as of" time axis. One reads "N links here mark a belief a recorded outcome later revised" (current revisions); the other "M revisions were themselves later reversed, kept as faded history" (retired). The counts split on the bi-temporal state, so a reversed revision is never double-counted as a current one.
- **Canvas edge styling** (`GraphExplorer.tsx` + the pure core): the SVG now renders a _retired_ supersession edge as faded, finely-dotted history (lower opacity, denser dash) versus a current revision's bolder madder dash. `projectGraph` derives `GraphEdge.retired` (set only on a supersession edge with a stamped `valid_to`), and `filterByTime` recomputes it against the "as of" instant, so an assertion reversed _after_ that instant still reads current then (true bi-temporal honesty), and retired edges are kept on the canvas, never dropped (invalidate-don't-delete).

**Built migration-tolerantly so it ships before the column is live.** The canvas BFS still uses an explicit column list (it can't `*`-select like the node-story path without pulling every column), so it would `42703` the whole graph to empty if it named `valid_to` before the migration applied. Instead `getKnowledgeGraph` runs one cheap probe (`resolveLineageCols`) that prefers the bi-temporal columns and falls back to the base set when `valid_to` is absent, so the canvas reads `valid_to` the moment it goes live and degrades silently before then. Combined with the outer `try/catch -> emptyGraph`, there is no failure path that blanks the graph.

Dormant-safe by construction: with zero supersession edges (the current state until the founder publishes + flips the flag) every surface renders nothing new, and pre-migration the probe falls back so behavior is byte-identical. So this stays `◐` until live-verify on a workspace with seeded outcome-driven edges (the founder's publish applies migration `20260621030000` + flips `DECISION_BRAIN_SUPERSESSION=1`).

## Deferred -> the next DBR increment (AI / attended lane)

- ~~The contradiction / supersession **write engine**~~ — SHIPPED as DBR-1.5 (flag-gated OFF). Remaining: the Critic reasoning over the written edges multi-hop (DBR-2), which is the read-side AI spend, founder-gated.
- A materialized `kg_nodes` / `kg_edges` store (only needed once we persist _inferred_ edges).
- Whole-product mega-graph + clustering + level-of-detail.
- Entity resolution ("the checkout redesign" == "Project Swift").

## Testing

- **Unit (`bun:test`) on the pure core:** node typing, degree/influence, bounding (`MAX_NODES` / `MAX_DEPTH` + `truncated`), the time filter, supersession-edge classification, the supersession-story builder (direction + ordering + dedup + fail-safe), deterministic layout, and the fail-safe empties.
- **Server fn + UI:** `tsc --noEmit` + `bun run build` green; live-verify on publish (so the row lands `partial`).

## BRN-01: the operable brain (shipped 2026-07-02, lane3)

> Note: the live graph pair (`GraphCanvasView.tsx` and friends) reads from `src/lib/knowledge-graph-view.ts` / `.functions.ts`, a later module the sections above still name `knowledge-graph-explorer.*` (a separate, older pair that still exists in the repo). Not reconciled here; out of scope for this slice.

Per [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §5.2: the graph rendered but did not operate. BRN-01 makes it operable, additive on the existing surface, no new nav, no schema change.

- **Object-card actions** (`GraphNodeActions.tsx`, wired into `GraphNodeStory.tsx` below "Center the graph here"): one-click buttons that dispatch real work through the existing loop, kind-gated:
  - `decision`: **Reopen** (`updateDecision` status -> `pending`) and **Share receipt** (reuses `getDecisionShareState` / `setDecisionShared`, the same public `/d/$slug` mechanism as `DecisionDetail.tsx`).
  - `opportunity` / `prd`: **Run the Critic** (`runCriticReview`), toasts the verdict.
  - every kind: **Start a mission from this** (`startOrchestratedMission`, goal seeded from the node's title), then deep-links to `/build?mission=<id>`.
  - `watch this assumption` (FS-02) is intentionally not built: FS-02 shipped concurrently (lane4, same session) but its assumptions are their own typed rows extracted at decision time, not graph nodes, and `assumption` is not one of `GRAPH_NODE_KINDS` in `knowledge-graph-view.ts` (9 kinds: signal/theme/opportunity/prd/roadmap_item/task/meeting/decision/mission, none of them `assumption`/`outcome`/`learning`/`precedent`/`design token`). Wiring a "watch this" button needs the assumption graph exposed on this surface first, a real ontology change, not a button; flagged as a follow-up, not silently faked.
- **Contradiction hotspots overlay** (`GraphExplorer.tsx`): reuses the already-computed `computeContradictionDrift(graph).driftedKeys` (no new query) as a `hotKeys` prop; a small madder dot badges a node whose newest edge just revised it.
- **The compounding metrics strip + growth read** (`GraphCompoundingStrip.tsx`, rendered above the canvas): composes `getMemoryCompounding` + `getMemoryLift` (both already shipped, Gauntlet) with the canvas's own `revisedCount` (supersessions caught, zero new query) and a new `getForecastCalibration` read (`src/lib/brain-insights.functions.ts`, a thin wrapper over FS-01's `summarizeCalibration` that FS-01 shipped without a read-side server fn). A weekly node-growth mini-bar is computed client-side from the already-fetched `graph.nodes[].createdAt`, no new query.
- **Recall warmth overlay: not built.** Honest gap, not a scope cut hidden in the code: "which memories actually get recalled" needs a `last_used_at`-style counter per graph node, and today's graph nodes are `artifact_lineage` rows (signal/theme/opportunity/prd/...), not `agent_memory` rows, so there is no recall-frequency signal to read yet. Faking one (e.g. reusing edge count as a warmth proxy) would be exactly the invented number the humanized-output convention bans. Follow-up: instrument recall on the artifact kinds the graph shows, then wire the overlay for real.
- **`getForecastCalibration` also retroactively fixes PRF-01**: the proof surface's FS-01 hit-rate card originally probed a guessed `predictions` table (FS-01 was mid-build when PRF-01 shipped); now that FS-01's real shape is known (`insights.resolution`), `proof-surface.functions.ts`'s `computePredictionHitRate` reads the real column directly (workspace-wide via `supabaseAdmin`, matching that file's other two metrics) rather than duplicating `getForecastCalibration`'s per-workspace scope.

Gate: `tsc --noEmit` 0, `bun test` 2017 pass, lint clean on every touched file. No migration.

## Brain object details on the shared DetailKit (dim 17, 2026-07-07, `brain_surface`)

A deep functional + design pass that brings the whole Brain record surface to the consumer/enterprise bar of Discover, Decide, and Today: every object on Brain is now a first-class, auditable, click-to-open thing on one shared anatomy, not a bespoke parchment-era drill.

- **`LearningDetail` + `DecisionDetail` rebuilt on the shared `DetailKit`** (`src/components/discover/DetailKit.tsx`), so a learning and a decision read identically to a Discover signal, a Decide opportunity, and a Today call: `DetailHeader` (title, state chips, present-tone time, copyable faint trace ref) -> a calm **glacier** summary band that leads with the value first (a learning leads with what memory re-ranked and by how much ICE; a decision leads with the call + rationale) -> a compact `StatStrip` (a learning: Prior ICE / New ICE / Change, tone-tiered via `toneForScore`; a decision: Source / Decided by / Age) -> consistent `DetailSection`s (what happened / why, the metric, where it points/came from, activity) -> an actions footer. The old `DrillHeader` + `.bento` + `--ink-*` parchment layout is gone; semantic tokens only, no hex, ember reserved for Capture (never used here).
- **Trace refs on every object, via the shared `traceRef()`** (never a bespoke formatter): `LRN·XXXXXX` on learnings, and a newly **registered `DEC` prefix** on decisions (added to both [`../conventions/design-anatomy.md`](../conventions/design-anatomy.md) §4 and `docs/design/archive/loom-v4.md` dim 17 registry, ASCII only, DESIGN-LOOM em/en-dash count unchanged). The ref renders quiet (`--text-faint`); the full id is copyable in each detail header; timestamps carry more presence (`--text-subtle`) via `relTimeCaps`. The refs also ride the **list rows** (`DecisionsPanel` decision rows, `CompoundingPanel` learning rows) as a faint tail, and the **graph node story** header (`GraphNodeStory.tsx`) via a new `kindTracePrefix(kind)` helper in `graph-visual.ts` (shared prefixes for the registered kinds; a stable local 3-letter code for the graph-only kinds so no node is untraceable; unit-tested).
- **Click-to-open on graph nodes (dim 17).** A single click on a node in BOTH the 3D Universe (`GraphUniverseCanvas.tsx`) and the 2D Force (`GraphForceCanvas.tsx`) canvas now opens its detail (the story panel) and focuses its neighborhood, instead of only highlighting and hiding the detail behind a double-click. Drag-to-orbit / pan and scroll-to-zoom are unchanged (the existing `moved` + `< 500ms` gate distinguishes a click from a drag); double-click is retained as a harmless redundant path. The canvas help text now reads "click a node to open it". No dead affordance.
- **Provenance links back up the loop, reusing the lineage/graph view.** A learning links to the priority it re-ranked (recentres the knowledge graph on that opportunity) and to the spec it graded (`/plan/spec/$id`); a decision opens its source (mission / spec / meeting via `SourceLink`) and offers "Trace it in the graph", which recentres the graph on the decision node where its supersession history (what it revised, and whether a later outcome revised it) is read. Nothing is orphaned from its source.
- **Real data only, honest states.** Every field maps to a real DB column (`learnings`, `decisions`); an absent metric, ICE pair, rationale, or source renders nothing, never a fabricated value. Both details now carry a proper loading (`PanelSkeleton`), error (named cause + Retry), and not-found state; the `DecisionDetail` verdict picker keeps the production `updateDecision` mutation, and the share control keeps `getDecisionShareState` / `setDecisionShared` (restyled onto the Obsidian `Button`).
- **No migration needed.** Everything reads existing columns; the ICE strip coerces the PostgREST `numeric`-as-string exactly as `CompoundingPanel`/`moat-vis` do, so the feed and the detail never disagree.

> **FLAGGED (no fabrication, would need a migration to enrich, deliberately not built):** a decision detail has no cited **alternatives-considered**, no **"cited by agents N times"** recall counter, and no per-transition **stage history** (the honest floor is `created_at`); a learning detail has no **"written by the Historian after mission X"** attribution (production learnings carry no mission id) and no **cited-by** table. Each needs a real column or events table before it can render truthfully; surfacing any of them today would be an invented number. Same class of gap as the graph's recall-warmth overlay above.

Gate: `npx tsc --noEmit` 0, `bun run build` green, `bun test` 2369 pass / only the 3 known `resolveEmbedRoute` fails (4 new `kindTracePrefix` tests pass). No migration.

## Gate

`bunx tsc --noEmit` + `bun run build` + the projector tests, all green -> adversarial self-review (RLS scope, SVG title-escaping, fail-safe paths) -> doc-loop -> commit explicit paths with a WHY -> fast-forward push.

## Related — the audit id / one-click lineage

A graph node's trace chip is now a clickable **audit tag** wherever the node maps to a standalone entity (signal / opportunity / spec / meeting / decision / mission): clicking it opens that entity's verifiable lineage in the global sheet. Node kinds with no standalone audit entity (theme / roadmap_item / task / design_memory) stay plain, non-clickable refs. See [`audit-id-lineage.md`](./audit-id-lineage.md).
