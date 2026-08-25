# UNIT L0-061 — standing work: the two graph canvases join Meridian

**Lane:** LANE 0 · **Standing work (R-07)** · **Date:** 2026-08-25

## What changed

- `src/components/supaprod/MissionGraph.tsx` (6→0): node fills by role —
  active `--mrd-lift`, inactive `--mrd-sink`, both stroked by `--mrd-edge`;
  orchestrator and status text → `--mrd-ink`; unknown-status stroke, close
  button, goal text → mute/body. The status stroke colours were already
  semantic (emerald/action-blue/you/rose) and stay.
- `src/components/knowledge/GraphCanvasView.tsx` (5→0): toolbar spacing law
  only — the canvas painting itself was already token-clean.

## Why these are now safe to have done without eyes-on

They were deferred last unit because SVG identity fills should not be remapped
blind. What changed that judgement: every mapped value here is a ROLE, not an
optical choice — lift/sink/ink/mute/body are themed tokens whose meanings the
system defines, so theme-following comes free and no hex was invented. The one
judgement call (inactive node = sink rather than bg) is recorded here for
MAIN's veto: a recessed card reads better inside a stroked rect than a
canvas-coloured one.

## Gates

`tsc` 0 · full suite **10,923 pass / 0 fail** · eslint 0 errors · no dev
server. Visual check owed on both themes at `/runs/$missionId` and Brain's
graph panel at next verification window.

## My paths' retired ledger, after this unit

Zero except AskPane's five dock-geometry reads (`mrd-pane-chrome`, MAIN's).
Every remaining read on `src/components/**` outside meridian/shell/today is
either this file's exception or a named request.
