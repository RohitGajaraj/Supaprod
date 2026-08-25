# UNIT L0-067 — standing work: the studio workbench announces its async writes

**Lane:** LANE 0 · **Standing work (R-19, poller triage 3 of 11)** · **Date:** 2026-08-25

## What changed

- **`PreviewPanel`**: the standalone-page frame is a polite status region —
  Build staging or editing the page while someone watches is announced instead
  of silently repainting. Idle builds poll never, so finished pages are quiet.
- **`ChangesPanel`**: the changed-file list is polite — files Build stages
  during a run arrive as announcements; identical 30s polls say nothing.

## Triage verdicts for the remaining silent pollers (recorded so the next
session does not re-litigate)

| File | Verdict |
| --- | --- |
| `MissionOrchestratorDetail` (2.5s + conditional) | Needs a TARGETED region on the run-status line only — blanket-wrapping a page this size would chatter. Next unit. |
| `HeldClaims` (15s) | Queue-count change deserves one polite line. Queued. |
| `AgentRosterPanel`, `ControlsPanel`, `LivePulse`, `AskRunCard`, `AgentRelay` | **No announcement**: roster/pulse surfaces whose changes have no actor verb yet, and pulses are already carried by their own sr-only text or visual state. Revisit if any grows a tracked fact. |

## Gates

`tsc` 0 · full suite **10,947 pass / 0 fail** · eslint 0 errors · no dev server.

Still owed on MAIN: WorkGlyph artifact kinds (adoption ready), next deploy
(items 24/28/34 UI + review card + runway line go live), Discover window tune.
