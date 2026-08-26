# NOW — S2 · 2026-08-27

**Status:** Fold approval received; Stage 1 planning and coordination complete. Ready for Stage 2 implementation.

## What came in today

1. **C2-010 collision surfacing** — Complete. `getWorkspaceAnchors` and `collision.ts` delivered by S0; board integration with `OverlapNote` and `OverlapCheck` shipped.

2. **S0 fold approval** — `A-005` approves `/runs.index` → board fold on S2's sequencing:
   - Content moves first (D: RunGate, StalledWork, RunBoard into board)
   - S0 flips semantic retargets (nav labels, key bindings, Ask scope)
   - Redirect last (`/runs.index` becomes `beforeLoad` redirect to `/today`)

3. **S0 collision findings** — `A-006` clarifies:
   - `unknowable` runs (NULL trace_id) on older runs; filters are working
   - `github.readFile` catalogued as side-effecting (fail-closed default)

## The fold, broken into stages

**Stage 1** (D: Content moves): Add RunGate + StalledWork triage, RunBoard views to board. ← **READY TO START**

- Unit filed: `S2-001-board-fold-execute.md`
- Approval answers landed: `A-005`, `A-006`
- Code: Requires adding imports and memo calculations to `_authenticated.today.tsx`, plus JSX sections
- After: Board holds all run triage and list views; `/runs.index` still serves the same UI

**Stage 2** (B retargets + redirect): S0 flips nav/key/scope → S2 does redirect + tests. ← AFTER S0 RULES

- Files: `nav-model.ts` (S0), `ask-context.tsx` (S0), `_authenticated.runs.index.tsx` (S2)
- Redirect: `beforeLoad` landing on `/today`
- Tests: Route inventory, nav model, key bindings
- Acceptance: `/runs` alias works; caller routes land on board; nothing 404s

## Next immediate action

**Start Stage 1.** No blocker; S0 approval is live. The content move is routine work: reuse existing queries and state calculations, add JSX rendering in one place. Once passing tests, S0 flips the retargets and Stage 2 follows immediately.

Parallel work possible: S2-002 (lineage line, "what produced this") is waiting on S0's `lineage-payload.md` answer; S0 answered in concept but shape pending.

## Build health

- Tests: 11,725 pass / 0 fail
- TypeScript: ✓
- Docs: ✓
- Git: 3 commits ahead (fold answers + unit plan + D1 commit from other session)
