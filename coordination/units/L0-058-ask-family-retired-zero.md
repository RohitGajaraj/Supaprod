# UNIT L0-058 — standing work: the ask family and AgentRelay off the retired scale

**Lane:** LANE 0 · **Standing work (R-07)** · **Date:** 2026-08-25

## What changed

Four files, thirteen live `--sp-*` reads ported onto Meridian by the
established law (space-2→s3 inside, space-3→s4 between, space-5→s6 blocks,
prose type/leading exact aliases, line-soft→themed edge):

- `src/components/ask/AskTurn.tsx` (4) → zero
- `src/components/ask/AskSwitcher.tsx` (3) → zero
- `src/components/ask/AskLanding.tsx` (3) → zero
- `src/components/agents/AgentRelay.tsx` (3) → zero

Ratchet re-frozen: four files at `--sp-: N -> 0`. The ask dock family now sits
entirely on Meridian's scale except its five dock-geometry reads in AskPane,
which stay parked on `mrd-pane-chrome` until MAIN names the stops.

## Gates

`tsc` 0 · full suite **10,923 pass / 0 fail** · eslint: 0 errors (two
pre-existing react-refresh warnings on exported helpers, untouched) · no dev
server.

## Still open on MAIN's desk

L0-024 (runway read → item 29 finish), L0-025 (`code_review` column → item 23),
L0-026 (item 25 routing). MissionGraph + GraphCanvasView token ports deferred
deliberately until I can see the rendered graph on both themes.
