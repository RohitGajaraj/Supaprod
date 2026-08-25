# UNIT L0-071 — standing work: mission graph transitions are announced

**Lane:** LANE 0 · **Standing work (R-19, poller triage complete)** · **Date:** 2026-08-25

`MissionOrchestratorDetail`: the execution graph sits in a polite live region —
node transitions (`planned → running → done`) are said, and identical 2.5s polls
render identical SVG text so nothing chatters.

## Poller triage ledger — CLOSED

All eleven silent pollers found in L0-065's sweep are now either announcing
(Consent arrivals, pane body, preview frame, changed-file list, runs-board
counts, held-claims count, mission-graph transitions) or carry a recorded
no-announcement verdict with its reason (roster/pulse surfaces whose changes
have no tracked fact yet).

Note: `MissionOrchestratorDetail.tsx` carries sixteen PRE-EXISTING prettier
errors from the repo-wide backlog (lines 250–773, none near this unit's hunk).
Deferred per AGENTS.md; not widened by this unit.

## Gates

`tsc` 0 · full suite **10,947 pass / 0 fail** · eslint: no NEW errors · no dev
server.
