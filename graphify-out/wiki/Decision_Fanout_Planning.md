# Decision Fanout Planning

> 51 nodes · cohesion 0.07

## Key Concepts

- **handoff.server.ts** (36 connections) — `src/lib/ai/handoff.server.ts`
- **fanout.server.ts** (14 connections) — `src/lib/ai/fanout.server.ts`
- **fanout.ts** (13 connections) — `src/lib/ai/fanout.ts`
- **handoff.test.ts** (13 connections) — `src/lib/ai/handoff.test.ts`
- **fanout.functions.ts** (13 connections) — `src/lib/fanout.functions.ts`
- **enqueueHandoff()** (11 connections) — `src/lib/ai/handoff.server.ts`
- **fanout.server.test.ts** (9 connections) — `src/lib/ai/fanout.server.test.ts`
- **enqueueFanout()** (8 connections) — `src/lib/ai/fanout.server.ts`
- **resolveMissionSpendCap()** (8 connections) — `src/lib/ai/mission-caps.server.ts`
- **fanout.test.ts** (7 connections) — `src/lib/ai/fanout.test.ts`
- **resolveAgent()** (6 connections) — `src/lib/ai/handoff.server.ts`
- **mission-caps.server.ts** (6 connections) — `src/lib/ai/mission-caps.server.ts`
- **decision-alternatives.ts** (5 connections) — `src/lib/ai/decision-alternatives.ts`
- **extractRejectedAlternatives()** (5 connections) — `src/lib/ai/decision-alternatives.ts`
- **FANOUT_MAX_CHILDREN** (4 connections) — `src/lib/ai/fanout.ts`
- **planFanout()** (4 connections) — `src/lib/ai/fanout.ts`
- **fanoutEnabled()** (4 connections) — `src/lib/ai/fanout.server.ts`
- **HandoffPayload** (4 connections) — `src/lib/ai/handoff.server.ts`
- **normalizeEvidence()** (4 connections) — `src/lib/ai/handoff.server.ts`
- **validateHandoff()** (4 connections) — `src/lib/ai/handoff.server.ts`
- **mission-caps.test.ts** (4 connections) — `src/lib/ai/mission-caps.test.ts`
- **canSpawnAtDepth()** (3 connections) — `src/lib/ai/fanout.ts`
- **fanoutDepthOf()** (3 connections) — `src/lib/ai/fanout.ts`
- **FanoutItem** (3 connections) — `src/lib/ai/fanout.ts`
- **handoffEvidenceGateEnforced()** (3 connections) — `src/lib/ai/handoff.server.ts`
- *... and 26 more nodes in this community*

## Relationships

- [Evaluation and Regression Testing](Evaluation_and_Regression_Testing.md) (11 shared connections)
- [Agent Loop Functions](Agent_Loop_Functions.md) (10 shared connections)
- [Mission Execution Engine](Mission_Execution_Engine.md) (6 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (4 shared connections)
- [Mission Creation and Dispatch](Mission_Creation_and_Dispatch.md) (4 shared connections)
- [Model Cache Management](Model_Cache_Management.md) (2 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (2 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (2 shared connections)
- [Test Station Panel](Test_Station_Panel.md) (1 shared connections)
- [Task Orchestration and Linear](Task_Orchestration_and_Linear.md) (1 shared connections)
- [Attachment and Lineage Tracking](Attachment_and_Lineage_Tracking.md) (1 shared connections)
- [LLM Provider Routing](LLM_Provider_Routing.md) (1 shared connections)

## Source Files

- `src/lib/ai/decision-alternatives.test.ts`
- `src/lib/ai/decision-alternatives.ts`
- `src/lib/ai/fanout.server.test.ts`
- `src/lib/ai/fanout.server.ts`
- `src/lib/ai/fanout.test.ts`
- `src/lib/ai/fanout.ts`
- `src/lib/ai/handoff.server.ts`
- `src/lib/ai/handoff.test.ts`
- `src/lib/ai/mission-caps.server.ts`
- `src/lib/ai/mission-caps.test.ts`
- `src/lib/fanout.functions.ts`

## Audit Trail

- EXTRACTED: 227 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*