# UNIT L0-026: Brain strengthened through both lenses

**Lane:** LANE 0
**Completed:** 2026-08-24T06:20+05:30
**Commits:** 338a1ad6e (crew reads), a74d0934b (user lens)

## What this unit was

Founder directive: strengthen one station at a time through BOTH lenses -
the human user and the autonomous crew - starting with Brain. Research
input: full ChatPRD walkthrough transcript (logged in REFERENCE-PATTERNS.md).

Agent lens: five brain.* read tools registered (search_decisions,
outcome_history, get_decision, contradictions, due_forecasts), reusing
MCP handler queries so internal crew and external agents cannot drift.
Found and fixed a tenancy hole while wiring: listDueForecastsForAgent
ignored workspace scoping on the service-role route.

User lens: five previously unanswerable questions now answer on /brain -
wrong forecasts visible on decision rows (listDecisions finally selects
forecast_*), graded-decision attribution via the never-read decision_id,
overturn history, month strip (local bucketing - buildTimeline drags the
AI chokepoint into client bundles), copy-as-markdown export.

## Measured

| Metric | Before | After |
| --- | --- | --- |
| Crew Brain read tools | 0 | 5 (+ tests, blast-radius tables) |
| listDecisions forecast columns | none | 5 selected, chipped |
| learnings.decision_id readers | 0 | LearningDetail door |
| tsc / bun test | - | exit 0 / 10,714 pass, 0 fail |
| Ratchet | 2,211/177 | 2,119/176 |

## Handed forward

- OutcomeHistory.tsx remains built-but-unmounted: mounting needs a route
  edit (_authenticated.brain.tsx), LANE 1's file. REQ-L0-007 already
  carries the request; this unit adds nothing new except urgency.
- MCP external surface gains the same tenancy fix - flag to MAIN LANE
  that list_due_forecasts behaviour changed (correctly scoped now).
