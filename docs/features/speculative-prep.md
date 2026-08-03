# AGT-03 — Speculative reversible prep

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Shipped 2026-07-03 · Route(s) `/prds/$id` (Design mockup panel) · Owner: Foundational (`src/lib/design-scaffold.functions.ts`)

## What it does

The moment CNV-04 drafts a full Outcome Contract from a one-line intent, the agent also kicks off
a background job that pre-stages a design scaffold for the new spec, fire-and-forget, never
blocking the response. By the time the operator finishes reading the drafted contract and opens
the Design mockup panel, a mockup is often already sitting there, labeled "Pre-staged while you
reviewed," instead of a fresh generation call only starting once they click.

## Why it exists

The founder's latency ask (v12 §7.3): review latency and execution latency should overlap instead
of stacking. This is the literal example the spec names ("the agent pre-fetches evidence,
pre-binds context, pre-stages scaffolds; zero side effects until consent"). See
[`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §7.3 (AGT-03).

## Where to find it

`/prds/$id`, the Design mockup panel (below Design Readiness). Nothing to trigger manually: the
prep fires automatically whenever a contract is drafted via CNV-04's one-line-intent flow.

## Demo script

1. Use CNV-04's one-line intent composer (Plan's Specs panel) to draft a new spec.
2. Immediately navigate to the new spec's page and open the Design mockup panel before clicking
   "Generate mockup."
3. If the background prep finished by the time the panel loads, the mockup is already rendered
   with a "Pre-staged while you reviewed" badge next to the panel title, no wait.
4. Click "Regenerate": the badge disappears (a manually-triggered generation always overwrites the
   cache with `source: 'manual'`).

## How it works

- **Persistence, the real prerequisite** — `generateDesignScaffold` was purely ephemeral before
  this ticket (DSN-03 documented this directly: no scaffold row existed for a lineage edge to
  point at). `buildDesignScaffoldHtml` is now the shared core generation call, and both
  `generateDesignScaffold` (human-triggered) and `prepareScaffoldSpeculative` (speculative)
  persist through it into a new `prd_scaffolds` table (migration
  `20260703050000_agt03_scaffold_persistence.sql`), one row per PRD, `source` tagged
  `'manual'`/`'speculative'`, regenerate upserts in place — the same idiom `prd_flows`/
  `launch_plans` established earlier this session.
- **The speculative trigger** — `draftContractFromIntent` (CNV-04, `discovery.functions.ts`) calls
  `void prepareScaffoldSpeculative(...).catch(() => {})` right after the PRD row is created and
  the Critic has run, never awaited, never lets a prep failure touch the drafting response the
  operator is waiting on.
- **The read side** — `getPersistedScaffold` lets `DesignScaffoldPanel.tsx` check for an existing
  scaffold on mount and populate immediately, tagging `prestaged` from the row's `source` so the UI
  can say honestly whether this is a fresh click or work the agent already did.

## Governance & guardrails

- Zero side effects beyond the idempotent `prd_scaffolds` upsert: no tool call, no external write,
  no email, nothing the operator has not implicitly consented to just by drafting a spec.
- The chokepoint (`loop.server.ts`, the pinned AI core) is untouched: this is a same-request
  background job fired from an existing server function, not a change to the agent execution loop
  or its approval semantics.
- A manual "Regenerate" always overwrites the speculative cache, so a stale or low-quality
  pre-staged draft is never sticky.

## Verification checklist

- [x] `tsc --noEmit` clean.
- [x] `bun test` full suite green (2184 pass / 0 fail), including 2 new
      `design-scaffold.functions.test.ts` cases pinning `buildSystemPrompt`'s design-memory branch.
- [x] `bunx eslint` clean on every touched/new file (0 errors).
- [x] `bun scripts/lint-migrations.ts` — 0 apply-fatal errors on the new migration.
- [ ] Live-browser walk of the demo script above (deferred to the primary checkout before publish,
      this worktree's `bun run dev`/`build` hits the pre-existing node20-vs-ESM `lovable-tagger`
      failure).

## Known limits / out of scope

- **Only the design-scaffold prep is built.** The spec also names "pre-fetches evidence" and
  "pre-binds context" as candidate speculative work; scaffold pre-staging was the one with a
  concrete, safe, already-scoped target (CNV-04's contract-review window) and the clearest payoff
  (the founder's own "pre-stages scaffolds" example). Precedent pre-fetching and context pre-
  binding for other review windows are real, well-scoped follow-up work, not silently dropped.
- **Removes DSN-04's documented blocker, does not close DSN-04 itself.** DSN-03's row explicitly
  flagged that "scaffold derives from flow" had no persisted scaffold row to anchor a lineage edge
  to. That is no longer true after this ticket, but DSN-04's own remaining scope (wiring the
  lineage edge, the BuildSpec parity check) was not built here — this ticket only builds the
  prerequisite honestly, as a byproduct of solving AGT-03's own problem, not as a shortcut to
  claim DSN-04 done.
- **Not yet live.** The migration is code-complete and gate-verified but not yet applied to the
  live database; it lands on the founder's next publish, same as the other migrations shipped this
  session.

## Related

- [`docs/planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (2026-07-03 entry)
- [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §7.3
- Siblings this reuses the idiom of: DSN-03/JNY-04 (the `prd_flows`/`launch_plans` one-row-per-PRD
  upsert pattern); unblocks a future DSN-04 pick
