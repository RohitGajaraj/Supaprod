# UNIT L0-059 — standing work: seven more files to zero retired reads

**Lane:** LANE 0 · **Standing work (R-07)** · **Date:** 2026-08-25

## What changed

Eleven live retired reads across seven files, each mapped by role:

- `knowledge/DocsPanel.tsx`, `DecisionsPanel.tsx` (2 each), `governance/BudgetsPanel.tsx` (2): spacing law, s3/s4.
- `observe/EvalScoreChips.tsx`: the `watch` verdict wore raw `--sp-warn`; it now wears **`--mrd-hold`** — Meridian's amber, whose own definition ("stopped, and not on you") is exactly what a watch score says. The file's comment already claimed "a verdict IS an outcome"; now the third verdict uses a real token.
- `supaprod/Sketch.tsx` (2) + `onboarding/ArrivalButterfly.tsx`: retired ds motion curve → `--mrd-ease`; the butterfly's raw 0.3s rise → `--mrd-d-enter`; its ink → `--mrd-ink`.
- `supaprod/AuthScaffold.tsx`: canvas `--ds-background-100` → `--mrd-bg`.

Ratchet re-frozen: **seven files to zero** (BudgetsPanel 2→0, DecisionsPanel 2→0, DocsPanel 2→0, EvalScoreChips 1→0, ArrivalButterfly 2→0, AuthScaffold 1→0, Sketch 3→0).

## Deliberately not done

MissionGraph (6) and GraphCanvasView (5) remain: their ds fills paint SVG graph nodes — identity, not chrome — and I will not remap them without seeing the rendered graph on both grounds. Queued under verification conditions.

## Gates

`tsc` 0 · full suite **10,923 pass / 0 fail** · eslint: 0 errors on all seven
files (two pre-existing react-refresh warnings elsewhere in the set) · no dev
server.
