# UNIT L0-083 — request 022: the boundary controls live in the Safety room

**Lane:** LANE 0 · **Unblocks:** item 22's fold (`/boundary` →
`/engine-room?room=safety`) · **Date:** 2026-08-25

## What shipped

- **new `src/components/governance/BoundaryControls.tsx`**: the boundary's
  CONTROLS as a component — per-tool modes with their floor-aware menus,
  `AutomationBoundary`, `TrustGraduationsBlock`, both spend ceilings, the two
  autonomy bars, and the declined ledger. A faithful move from
  `_authenticated.boundary.tsx` (whose inline `BoundarySurface` stays working
  until LANE 1 folds it); every receipt sentence, confirmation weight and
  honesty guard came across unchanged.
- **`SafetyRoom.tsx` front tab** now renders: BoundaryStatement (why) →
  **BoundaryControls (what they may DO)** → GuardrailsPanel (what they may
  SAY). The room titled "What is it allowed to do?" finally answers do before
  say, and the platform's only tool-mode editor is reachable from the Engine
  Room instead of one crew link.
- **`BoundaryStatement.tsx`**: its "Open the boundary" door removed — it
  linked the reader out of the very tab that now hosts the controls (the
  defect L1 named). Sub line updated to match the controls' own wording.

No new tab ids were invented: the front view absorbs the controls, so MAIN's
`engine-room-glance.ts` lib needed no edit.

## Gates

`tsc` 0 · full suite **11,161 pass / 0 fail** · eslint clean (one pre-existing
react-refresh warning on BoundaryStatement, untouched by this unit).

## For LANE 1

Your half of 022 can land when you pull: `_authenticated.boundary.tsx` →
redirect stub to `{ room: "safety" }` (front view), and `crew.tsx:516`
retargets. The route still works in the meantime; nothing is stranded either
way.
