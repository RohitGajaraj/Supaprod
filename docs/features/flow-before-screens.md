# DSN-03 — Flow before screens

> Status · Shipped 2026-07-03 (partial, see Known limits) · Route(s) `/prds/$id` (Flow tab) · Owner: Define (`src/lib/flows.functions.ts`)

## What it does

A new "Flow" tab on a spec's detail page (`/prds/$id`, alongside Edit / Preview / Contract)
extracts the user flow a PRD's own body implies: the steps, decision points, and end states a
user moves through, before anyone draws a screen. One click generates a typed step/decision/state
graph from the PRD's title + body via AI, stores it, and renders it as a simple vertical timeline
with each node's outgoing branches listed underneath it.

## Why it exists

The artifact designers actually start with is a flow, not a screen. One-shot screen generation
(DEF-04) ships a "beautiful screen, broken journey" failure constantly because nothing upstream
ever made the journey explicit. See [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md)
§6 (DSN-03).

## Where to find it

`/prds/$id`, the "Flow" tab (an icon in the same sticky actions bar as Edit/Preview/Contract).

## Demo script

1. Open any spec with a real narrative (Edit or Preview tab has real body content).
2. Click the Flow tab, then "Generate flow."
3. A typed step/decision/state graph renders: each node shows its kind, its label, and its
   outgoing edges (with a branch label for decision nodes with more than one path).
4. A spec with no real user-facing flow (a pure backend/infra spec) returns "No user flow found
   in this spec's body yet" rather than inventing one.
5. Click "Regenerate" after editing the PRD's body: the flow is replaced in place (one flow per
   PRD, not versioned), and the `artifact_lineage` edge (`prd` derived-from `prd_flow`) is
   re-upserted.

## How it works

- **Schema** — `prd_flows` (migration `20260703030000_dsn03_flow_before_screens.sql`): one row per
  PRD (`UNIQUE(prd_id)`), `steps`/`edges` as jsonb. Regenerating is an upsert on `prd_id`, the same
  "PRD stays authoritative, this is a derived structured view" dual-projection idiom CNV-01 used
  for `contract` jsonb, just as its own table instead of a column on `prds` (kept independent of
  the heavily-shared `prds` table and `discovery.functions.ts`, which this ticket does not
  otherwise touch).
- **Generation** — `generateFlow` (`flows.functions.ts`) calls the model with the PRD's title +
  body, then validates the raw JSON through `parseGeneratedFlow` (pure, unit-tested): every step
  needs a unique id/kind/label, every edge must reference two ids that were actually accepted as
  steps, malformed entries are dropped rather than trusted, same discipline as CNV-02's
  `deriveOracleClassifications` and FS-02's `deriveWatchVerdict`. An empty steps array is a valid,
  expected result for a spec with no real user flow, never invented.
- **Receipt** — on a successful generation, a real `artifact_lineage` edge is written
  (`parent_kind: "prd"`, `child_kind: "prd_flow"`, `relation: "derived-from"`, the same direction
  convention `competitor-tick.ts`'s signal-to-brief edges use), so the Brain graph can walk from a
  spec to its flow like any other derived artifact.
- **Rendering** — `FlowDiagram.tsx` (`src/components/product/`, matching its siblings
  `OutcomeContractPanel`/`DesignScaffoldPanel`, the parchment Ember Editorial surface `/prds/$id`
  still uses per OBS-10's documented fold boundary) renders nodes as a vertical timeline rather
  than a full graph-layout diagram: simplest thing that is still honest about branches, since a
  real auto-layout engine is a new dependency this ticket does not introduce.

## Governance & guardrails

- Workspace-scoped RLS on `prd_flows` (`is_workspace_member`), matching the rest of the register.
- The AI call is read-only over the PRD's own text; it never writes back to `prds` itself.
- `artifact_lineage` write is wrapped in its own try/catch, non-fatal: a lineage-write failure
  never blocks the flow itself from being generated and returned to the user.

## Verification checklist

- [x] `tsc --noEmit` clean.
- [x] `bun test` full suite green (2132 pass / 0 fail), including 8 new
      `flows.functions.test.ts` cases pinning `parseGeneratedFlow`'s validation rules.
- [x] `bunx eslint` clean on every touched/new file (0 errors; 1 pre-existing unrelated warning in
      `_authenticated.prds.$id.tsx`).
- [x] `bun scripts/lint-migrations.ts` — 0 apply-fatal errors on the new migration.
- [ ] Live-browser walk of the demo script above (deferred to the primary checkout before publish,
      this worktree's `bun run dev`/`build` hits the pre-existing node20-vs-ESM `lovable-tagger`
      failure).

## Known limits / out of scope

- **"Scaffold derives from flow" is not built, and needs a real prerequisite first.** The spec
  calls for a second lineage edge fired when a scaffold (DEF-04) is generated FROM a flow.
  `design-scaffold.functions.ts`/`DesignScaffoldPanel.tsx` were DSN-01's actively-claimed files
  when this shipped; once DSN-01 released them mid-session, checked whether the edge was a quick
  close and found it is not: `generateDesignScaffold` never persists a scaffold anywhere (it
  returns raw HTML the client renders and discards on navigation), so there is no scaffold row
  with an `id` for a lineage edge to point at. Wiring this for real needs scaffold persistence to
  exist first, a genuine DEF-04-scope prerequisite this ticket should not improvise into the
  schema. Real follow-up, not silently dropped.
- **No auto-layout diagram.** The timeline rendering is a deliberately simple vertical list with
  branch lines underneath each node, not a real graph-layout diagram (no new charting/diagramming
  dependency was introduced for this). It is honest about every step and edge, just not spatially
  laid out.
- **Not yet live.** The migration is code-complete and gate-verified but not yet applied to the
  live database; it lands on the founder's next publish, same as the other migrations shipped this
  session.

## Related

- [`plan.md`](../../plan.md) §4 (2026-07-03 entry)
- [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §6
- Siblings this reuses the idiom of: CNV-01 (dual projection), CNV-02 (`deriveOracleClassifications`
  validation discipline), JNY-01's `competitor-tick.ts` (`derived-from` lineage direction)
