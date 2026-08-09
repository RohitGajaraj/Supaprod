# Mission Execution Engine

> 28 nodes · cohesion 0.15

## Key Concepts

- **mission-advance.server.ts** (39 connections) — `src/lib/ai/mission-advance.server.ts`
- **reflectStepStatusFromRuns()** (11 connections) — `src/lib/ai/mission-advance.server.ts`
- **advanceMissionCore()** (10 connections) — `src/lib/ai/mission-advance.server.ts`
- **dispatchReadySteps()** (8 connections) — `src/lib/ai/mission-advance.server.ts`
- **retry.ts** (8 connections) — `src/lib/ai/retry.ts`
- **failOrRequeueStep()** (6 connections) — `src/lib/ai/mission-advance.server.ts`
- **mission-advance.test.ts** (6 connections) — `src/lib/ai/mission-advance.test.ts`
- **recordPlaybookAttempt()** (5 connections) — `src/lib/ai/mission-advance.server.ts`
- **nextRetryAtIso()** (5 connections) — `src/lib/ai/retry.ts`
- **retry.test.ts** (5 connections) — `src/lib/ai/retry.test.ts`
- **computePoisonedSteps()** (4 connections) — `src/lib/ai/mission-advance.server.ts`
- **shouldRetryStep()** (4 connections) — `src/lib/ai/retry.ts`
- **cascadeSkipFailedDependents()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **hasRetryColumns()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **isLostQueuedRun()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **selectDispatchBatch()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **backoffMs()** (3 connections) — `src/lib/ai/retry.ts`
- **DEFAULT_MAX_ATTEMPTS** (3 connections) — `src/lib/ai/retry.ts`
- **RUN_IN_FLIGHT_STATUSES** (2 connections) — `src/lib/ai/mission-advance.server.ts`
- **RUN_SUCCESS_STATUSES** (2 connections) — `src/lib/ai/mission-advance.server.ts`
- **sweepStaleUnconsumedMessages()** (2 connections) — `src/lib/ai/mission-advance.server.ts`
- **DISPATCH_CAP** (1 connections) — `src/lib/ai/mission-advance.server.ts`
- **MissionStepRow** (1 connections) — `src/lib/ai/mission-advance.server.ts`
- **SenderCtx** (1 connections) — `src/lib/ai/mission-advance.server.ts`
- **mockRpc()** (1 connections) — `src/lib/ai/mission-advance.test.ts`
- *... and 3 more nodes in this community*

## Relationships

- [Crew Execution Methods](Crew_Execution_Methods.md) (10 shared connections)
- [Decision Fanout Planning](Decision_Fanout_Planning.md) (6 shared connections)
- [Memory Recall System](Memory_Recall_System.md) (3 shared connections)
- [Mission Gate Classification](Mission_Gate_Classification.md) (3 shared connections)
- [Evaluation and Regression Testing](Evaluation_and_Regression_Testing.md) (3 shared connections)
- [Agent Loop Functions](Agent_Loop_Functions.md) (2 shared connections)
- [Task Orchestration and Linear](Task_Orchestration_and_Linear.md) (2 shared connections)
- [LLM Provider Routing](LLM_Provider_Routing.md) (2 shared connections)
- [Task Graph Generation](Task_Graph_Generation.md) (1 shared connections)

## Source Files

- `src/lib/ai/mission-advance.server.ts`
- `src/lib/ai/mission-advance.test.ts`
- `src/lib/ai/retry.test.ts`
- `src/lib/ai/retry.ts`

## Audit Trail

- EXTRACTED: 141 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*