# DSN-04 — The design contract rides into Build

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Shipped 2026-07-03 · Route(s): none (dispatch-time + return-time only) · Owner agent(s): the Studio agent (`builder`)

## What it does

When a PRD is dispatched into Build (Studio's agent door, `dispatchStudioSession`), the workspace's standing design language (DSN-01's design memory) and the PRD's own flow graph (DSN-03) now travel into the mission goal alongside the spec body — the building agent sees the same design contract a human reviewer would, not just prose. When the mission's changeset comes back with a PR, `checkDesignParity` records a lightweight signal on whether the returning work actually mentioned the tokens or flow states it was handed, as a real `artifact_lineage` receipt.

## Why it exists

v12 §6: design intent dies at the codegen handoff in every AI pipeline today. DSN-01 (design memory) and DSN-03 (flow graphs) both already exist as structured artifacts a spec carries — this is where they survive the one step that actually matters, the handoff into the agent doing the building. Build log: [`../../plan.md`](../../plan.md) §4 (search "DSN-04").

## Where to find it

- No new route or panel. `dispatchStudioSession` (`src/lib/studio.functions.ts`) composes the goal automatically whenever a PRD is dispatched with design memory or a flow graph present.
- `checkDesignParity` / `getDesignParity` (`src/lib/design-parity.functions.ts`) are callable server functions; wiring a UI trigger into an existing panel (e.g. the Build mission slide-over, alongside JNY-03's test station) is a natural follow-up, not built tonight to avoid touching a file under another lane's active claim.

## Demo script (≤ 90s)

N/A as a live click-through — this ships dispatch-time and return-time behavior with no UI surface yet (see "Where to find it"). The closest thing to a demo is code-level:

1. Dispatch a PRD with approved design memory and a generated flow into Studio; open the resulting mission's `agent_runs.input` (or its goal in the mission detail) and point out the design-memory block and numbered flow steps riding alongside the PRD body.
2. Once that mission's changeset has a `pr_url`, call `checkDesignParity({ missionId })` (e.g. via a script or the Supabase MCP) and show the new `artifact_lineage` row (`relation: "design_parity"`) it records — visible on the Trust Ledger like any other receipt.

## How it works

- `formatDesignMemoryContext` (DSN-01, unchanged) + a new `formatFlowContext` (`design-parity.functions.ts`, pure, unit-tested) render the workspace's design memory and the PRD's `prd_flows` row as text blocks.
- `dispatchStudioSession` fetches both alongside the existing PRD lookup and pushes non-empty blocks into the same `sections[]` array that already carries the PRD body and the linked GitHub issue — one goal, one AI call, no new call surface.
- `checkDesignParity` resolves the mission back to its PRD via the same `studio_changesets.mission_id -> prd_id` join JNY-03's test station and BYO-P3's `outcome.functions.ts` already rely on, re-fetches the design memory + flow, and runs the pure `computeDesignParity(changesetText, expected)`: how many of the expected design-memory categories / flow-step labels appear (case-insensitive) in the changeset's own recorded title + summary.
- Records one `artifact_lineage` edge per mission (`parent_kind: "mission"`, `child_kind: "prd"`, `relation: "design_parity"`, idempotent — checked before insert, no migration since `relation` already accepts arbitrary values, same idiom as `test_verdict`).

## Governance & guardrails

- Zero new writes on the dispatch side — this only reads already-shipped tables (`design_memory`, `prd_flows`) and folds text into an existing AI call, no new `CallSurface`.
- The parity check is read-then-one-idempotent-insert, no chokepoint touch, no destructive action.
- Workspace-scoped throughout: design memory is fetched via the PRD's own `workspace_id`, never a caller-supplied one.

## Verification checklist

- [ ] `bun test src/lib/design-parity.functions.test.ts` — `formatFlowContext`/`computeDesignParity` pure-function tests pass.
- [ ] Dispatch a PRD that has both approved design memory and a generated flow into Studio; confirm the mission's `goal` (visible in the mission detail / `agent_runs.input`) contains both the design-language block and the numbered flow steps.
- [ ] Dispatch a PRD with neither — confirm the goal is unchanged (no empty section, no crash).
- [ ] Call `checkDesignParity({ missionId })` for a mission whose changeset has a `pr_url` — confirm one `artifact_lineage` row lands with `relation: "design_parity"`, and calling it again does not duplicate the row.

## Known limits / out of scope

- **Genuinely "lightweight," not a diff check.** This reads the changeset's own recorded title/summary text, not the actual PR diff — Cadence has no mechanism today to fetch and grade a diff against the design contract (that is `BuildDriver`'s job, `docs/strategy/build-driver-and-dispatch.md`, founder-gated and not started). A changeset with an accurate title/summary but a design-blind diff (or vice versa) is not caught. Documented honestly, not oversold.
- No UI surfaces the parity signal yet (the underlying `artifact_lineage` edge is visible on the Trust Ledger like any other, but no panel calls out "design parity: aligned/unverified" the way JNY-03's test station panel calls out test verdicts). Left as a real follow-up since the natural home (the Build mission slide-over) was under another lane's active claim this session.
- DSN-03's own "scaffold derives from flow" gap (no scaffold ever persists anywhere) is unrelated and untouched by this ticket.
- **The idempotency check is mission-scoped, not changeset-scoped.** If a mission's changeset is abandoned and restaged (a real path: `studio.stage` opens a fresh `studio_changesets` row when the active one is abandoned), a `design_parity` edge already recorded for the mission suppresses recording a fresh signal for the new changeset — the receipt goes stale rather than duplicating. Accepted for now (the same shape JNY-03's `test_verdict` uses, though that verdict is genuinely per-mission-spec rather than per-changeset-text, so the fit is closer there than here); revisit if the abandon-and-restage path turns out to be common.

## Related

- [`design-memory.md`](./design-memory.md) — DSN-01, the design language this composes.
- [`flow-before-screens.md`](./flow-before-screens.md) — DSN-03, the flow graph this composes.
- [`test-station.md`](./test-station.md) — JNY-03, the sibling "verdict recorded as a lineage receipt" pattern this mirrors.
- [`../strategy/build-driver-and-dispatch.md`](../strategy/build-driver-and-dispatch.md) — the founder-gated `BuildSpec`/`BuildDriver` seam this row's title references; not implemented, not required for this ticket's scope.
