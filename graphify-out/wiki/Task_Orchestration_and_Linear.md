# Task Orchestration and Linear

> 21 nodes · cohesion 0.15

## Key Concepts

- **orchestrator.functions.ts** (33 connections) — `src/lib/orchestrator.functions.ts`
- **orchestrator.ts** (10 connections) — `src/lib/orchestrator.ts`
- **orchestrator.test.ts** (8 connections) — `src/lib/orchestrator.test.ts`
- **DispatchableTask** (3 connections) — `src/lib/orchestrator.ts`
- **findDanglingDeps()** (3 connections) — `src/lib/orchestrator.ts`
- **toLinearPriority()** (3 connections) — `src/lib/orchestrator.ts`
- **topologicalOrder()** (3 connections) — `src/lib/orchestrator.ts`
- **validateDispatch()** (3 connections) — `src/lib/orchestrator.ts`
- **isLinearConfigured()** (2 connections) — `src/lib/linear.functions.ts`
- **DispatchResult** (2 connections) — `src/lib/orchestrator.ts`
- **advanceMission** (2 connections) — `src/lib/orchestrator.functions.ts`
- **listMissionSteps** (2 connections) — `src/lib/orchestrator.functions.ts`
- **summarizeDispatch()** (2 connections) — `src/lib/orchestrator.ts`
- **DispatchValidation** (1 connections) — `src/lib/orchestrator.ts`
- **AdvanceSchema** (1 connections) — `src/lib/orchestrator.functions.ts`
- **dispatchPRDToLinear** (1 connections) — `src/lib/orchestrator.functions.ts`
- **ensureOrchestrator** (1 connections) — `src/lib/orchestrator.functions.ts`
- **linearGql()** (1 connections) — `src/lib/orchestrator.functions.ts`
- **ListStepsSchema** (1 connections) — `src/lib/orchestrator.functions.ts`
- **StartSchema** (1 connections) — `src/lib/orchestrator.functions.ts`
- **task()** (1 connections) — `src/lib/orchestrator.test.ts`

## Relationships

- [Receipts and Attribution](Receipts_and_Attribution.md) (3 shared connections)
- [Linear Integration Service](Linear_Integration_Service.md) (2 shared connections)
- [Decision Detail View](Decision_Detail_View.md) (2 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (2 shared connections)
- [Agent Loop Functions](Agent_Loop_Functions.md) (2 shared connections)
- [Mission Execution Engine](Mission_Execution_Engine.md) (2 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (2 shared connections)
- [Artifact Lineage View](Artifact_Lineage_View.md) (1 shared connections)
- [Decision Fanout Planning](Decision_Fanout_Planning.md) (1 shared connections)
- [Mission Creation and Dispatch](Mission_Creation_and_Dispatch.md) (1 shared connections)
- [Mission Gate Classification](Mission_Gate_Classification.md) (1 shared connections)
- [React Execution State](React_Execution_State.md) (1 shared connections)

## Source Files

- `src/lib/linear.functions.ts`
- `src/lib/orchestrator.functions.ts`
- `src/lib/orchestrator.test.ts`
- `src/lib/orchestrator.ts`

## Audit Trail

- EXTRACTED: 84 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*