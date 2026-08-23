# UNIT L0-018: Zero shell imports on LANE 0 paths

**Lane:** LANE 0
**Completed:** 2026-08-24T02:45+05:30

## What this unit was

The last ten importing files (EvalsPanel, DetailKit, MissionChain,
CriticBadge, TrustDial, AgentInspector, AnalyticsPanel, EvalScoreChips,
AskComposer, ProductBindingsSection) migrated per COMPONENTS.md's
retired-name table: Cell/Grid/Input/Select/Value/Ctx-trio onto their
mapped Meridian homes, plus TrustDial's Block x3 / Loading / Failed /
ghost Button which took their mapped homes while the agent was in the
file.

Also lands MissionOrchestratorDetail's spacing-token pass: 28 inline
literals whose values exactly equal --mrd-s1..s5 swapped to tokens
(zero visual change); ~20 off-scale literals disclosed in place pending
nearest-stop judgments with eyes on the surface.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,492 / 197 | **2,447 / 189** | design:ratchet over merged disk |
| Shell import statements on LANE 0 paths | 10 files | **0** | grep |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Session total since L0-005

Shell/primitives retirement on LANE 0 paths: COMPLETE. Ratchet walked
2,721 -> 2,447 across 15 units. Remaining retired-layer work belongs to
LANE 1 (routes/styles) or awaits nothing - COMPONENTS.md maps every
symbol for whoever touches them next.
