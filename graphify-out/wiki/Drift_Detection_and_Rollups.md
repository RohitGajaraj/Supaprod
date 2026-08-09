# Drift Detection and Rollups

> 27 nodes · cohesion 0.12

## Key Concepts

- **drift.functions.ts** (18 connections) — `src/lib/drift.functions.ts`
- **drift.server.ts** (17 connections) — `src/lib/ai/drift.server.ts`
- **drift.functions.test.ts** (7 connections) — `src/lib/drift.functions.test.ts`
- **rollupSnapshots()** (6 connections) — `src/lib/ai/drift.server.ts`
- **runDriftForUser()** (6 connections) — `src/lib/ai/drift.server.ts`
- **drift.server.test.ts** (6 connections) — `src/lib/ai/drift.server.test.ts`
- **detectIncidents()** (5 connections) — `src/lib/ai/drift.server.ts`
- **avg()** (2 connections) — `src/lib/ai/drift.server.ts`
- **dayKey()** (2 connections) — `src/lib/ai/drift.server.ts`
- **p95()** (2 connections) — `src/lib/ai/drift.server.ts`
- **pctDelta()** (2 connections) — `src/lib/ai/drift.server.ts`
- **BaselineSchema** (2 connections) — `src/lib/drift.functions.ts`
- **getDriftOverviewImpl()** (2 connections) — `src/lib/drift.functions.ts`
- **reopenDriftIncident** (2 connections) — `src/lib/drift.functions.ts`
- **reopenDriftIncidentImpl()** (2 connections) — `src/lib/drift.functions.ts`
- **resolveDriftIncident** (2 connections) — `src/lib/drift.functions.ts`
- **resolveDriftIncidentImpl()** (2 connections) — `src/lib/drift.functions.ts`
- **updateDriftBaseline** (2 connections) — `src/lib/drift.functions.ts`
- **updateDriftBaselineImpl()** (2 connections) — `src/lib/drift.functions.ts`
- **Bucket** (1 connections) — `src/lib/ai/drift.server.ts`
- **DEFAULTS** (1 connections) — `src/lib/ai/drift.server.ts`
- **EvalResult** (1 connections) — `src/lib/ai/drift.server.ts`
- **EventRow** (1 connections) — `src/lib/ai/drift.server.ts`
- **PromptRun** (1 connections) — `src/lib/ai/drift.server.ts`
- **mockSupabaseForDetect()** (1 connections) — `src/lib/ai/drift.server.test.ts`
- *... and 2 more nodes in this community*

## Relationships

- [Budgets and Alerts Panel](Budgets_and_Alerts_Panel.md) (7 shared connections)
- [Slack Digest Notifications](Slack_Digest_Notifications.md) (3 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (2 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (2 shared connections)
- [Engine Room UI](Engine_Room_UI.md) (1 shared connections)

## Source Files

- `src/lib/ai/drift.server.test.ts`
- `src/lib/ai/drift.server.ts`
- `src/lib/drift.functions.test.ts`
- `src/lib/drift.functions.ts`

## Audit Trail

- EXTRACTED: 97 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*