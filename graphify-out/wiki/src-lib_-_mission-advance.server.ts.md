# src/lib - mission-advance.server.ts

> 26 nodes · cohesion 0.16

## Key Concepts

- **mission-advance.server.ts** (32 connections) — `src/lib/ai/mission-advance.server.ts`
- **advanceMissionCore()** (10 connections) — `src/lib/ai/mission-advance.server.ts`
- **dispatchReadySteps()** (8 connections) — `src/lib/ai/mission-advance.server.ts`
- **retry.ts** (8 connections) — `src/lib/ai/retry.ts`
- **reflectStepStatusFromRuns()** (7 connections) — `src/lib/ai/mission-advance.server.ts`
- **failOrRequeueStep()** (6 connections) — `src/lib/ai/mission-advance.server.ts`
- **mission-advance.test.ts** (6 connections) — `src/lib/ai/mission-advance.test.ts`
- **nextRetryAtIso()** (5 connections) — `src/lib/ai/retry.ts`
- **retry.test.ts** (5 connections) — `src/lib/ai/retry.test.ts`
- **recordPlaybookRunInternal()** (5 connections) — `src/lib/playbooks.functions.ts`
- **shouldRetryStep()** (4 connections) — `src/lib/ai/retry.ts`
- **cascadeSkipFailedDependents()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **computePoisonedSteps()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **hasRetryColumns()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **isLostQueuedRun()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **selectDispatchBatch()** (3 connections) — `src/lib/ai/mission-advance.server.ts`
- **backoffMs()** (3 connections) — `src/lib/ai/retry.ts`
- **DEFAULT_MAX_ATTEMPTS** (3 connections) — `src/lib/ai/retry.ts`
- **sweepStaleUnconsumedMessages()** (2 connections) — `src/lib/ai/mission-advance.server.ts`
- **DISPATCH_CAP** (1 connections) — `src/lib/ai/mission-advance.server.ts`
- **MissionStepRow** (1 connections) — `src/lib/ai/mission-advance.server.ts`
- **SenderCtx** (1 connections) — `src/lib/ai/mission-advance.server.ts`
- **mockRpc()** (1 connections) — `src/lib/ai/mission-advance.test.ts`
- **S** (1 connections) — `src/lib/ai/mission-advance.test.ts`
- **RETRY_BASE_MS** (1 connections) — `src/lib/ai/retry.ts`
- *... and 1 more nodes in this community*

## Relationships

- [src/lib - handoff.server.ts](src-lib_-_handoff.server.ts.md) (6 shared connections)
- [src/lib - loop.server.ts](src-lib_-_loop.server.ts.md) (5 shared connections)
- [src/lib - orchestrator.functions.ts](src-lib_-_orchestrator.functions.ts.md) (3 shared connections)
- [src/lib - capabilities.functions.ts](src-lib_-_capabilities.functions.ts.md) (3 shared connections)
- [Agent Tool Registry](Agent_Tool_Registry.md) (3 shared connections)
- [src/lib - chat.ts](src-lib_-_chat.ts.md) (2 shared connections)
- [src/lib - resume-runs.ts](src-lib_-_resume-runs.ts.md) (2 shared connections)

## Source Files

- `src/lib/ai/mission-advance.server.ts`
- `src/lib/ai/mission-advance.test.ts`
- `src/lib/ai/retry.test.ts`
- `src/lib/ai/retry.ts`
- `src/lib/playbooks.functions.ts`

## Audit Trail

- EXTRACTED: 126 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*