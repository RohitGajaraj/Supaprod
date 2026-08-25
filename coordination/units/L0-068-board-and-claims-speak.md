# UNIT L0-068 — standing work: the runs board and held claims speak their counts

**Lane:** LANE 0 · **Standing work (R-19, poller triage 4 of 11)** · **Date:** 2026-08-25

## What changed

- **`runs/RunBoard.tsx`**: a polite sr-only summary under the board head —
  "N runs are building · M runs need you" — recomputed from the same column
  data the sighted headings show. Identical polls render identical text and
  announce nothing; a run crossing into gate or finishing does.
- **`build/HeldClaims.tsx`**: the held-path count is a polite status line.

## Triage ledger after this unit

Remaining: `MissionOrchestratorDetail` (needs a targeted run-status region —
the page is too large for anything broader; queued), `AskRunCard`,
`AgentRelay`, `LivePulse`, `AgentRosterPanel`, `ControlsPanel` — triaged as no-
announcement-needed (pulses carry their own sr-only text; roster/control
changes have no tracked fact yet). Revisit if any grows one.

## Gates

`tsc` 0 · full suite **10,947 pass / 0 fail** · eslint clean on both files ·
no dev server.
