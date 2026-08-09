# Evaluation and Regression Testing

> 100 nodes · cohesion 0.02

## Key Concepts

- **registry.server.ts** (172 connections) — `src/lib/ai/tools/registry.server.ts`
- **orchestrator.server.ts** (32 connections) — `src/lib/ai/tools/orchestrator.server.ts`
- **learning-record-memory-failure.test.ts** (7 connections) — `src/lib/ai/tools/learning-record-memory-failure.test.ts`
- **eval-gate.ts** (4 connections) — `src/lib/ai/eval-gate.ts`
- **studio-branch.ts** (4 connections) — `src/lib/ai/studio-branch.ts`
- **studioBranchName()** (4 connections) — `src/lib/ai/studio-branch.ts`
- **ToolDef** (4 connections) — `src/lib/ai/tools/registry.server.ts`
- **ToolCtx** (3 connections) — `src/lib/ai/tools/registry.server.ts`
- **evalRegressionReadiness()** (2 connections) — `src/lib/ai/eval-gate.ts`
- **SuiteScorePair** (2 connections) — `src/lib/ai/eval-gate.ts`
- **hexSlug()** (2 connections) — `src/lib/ai/studio-branch.ts`
- **studio-branch.test.ts** (2 connections) — `src/lib/ai/studio-branch.test.ts`
- **missionDispatch** (2 connections) — `src/lib/ai/tools/orchestrator.server.ts`
- **missionFinalize** (2 connections) — `src/lib/ai/tools/orchestrator.server.ts`
- **missionObserve** (2 connections) — `src/lib/ai/tools/orchestrator.server.ts`
- **missionPlan** (2 connections) — `src/lib/ai/tools/orchestrator.server.ts`
- **assertStudioPathAllowed()** (2 connections) — `src/lib/ai/tools/registry.server.ts`
- **changesetRef()** (2 connections) — `src/lib/ai/tools/registry.server.ts`
- **getDefaultBranch()** (2 connections) — `src/lib/ai/tools/registry.server.ts`
- **STUDIO_FORBIDDEN_PREFIXES** (2 connections) — `src/lib/ai/tools/registry.server.ts`
- **EVAL_REGRESSION_THRESHOLD_PTS** (1 connections) — `src/lib/ai/eval-gate.ts`
- **fakeDb()** (1 connections) — `src/lib/ai/tools/learning-record-memory-failure.test.ts`
- **learningRecord** (1 connections) — `src/lib/ai/tools/learning-record-memory-failure.test.ts`
- **recorded** (1 connections) — `src/lib/ai/tools/learning-record-memory-failure.test.ts`
- **RememberResult** (1 connections) — `src/lib/ai/tools/learning-record-memory-failure.test.ts`
- *... and 75 more nodes in this community*

## Relationships

- [Agent Loop Functions](Agent_Loop_Functions.md) (12 shared connections)
- [Decision Fanout Planning](Decision_Fanout_Planning.md) (11 shared connections)
- [CI Logs and Preview](CI_Logs_and_Preview.md) (11 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (6 shared connections)
- [Model Cache Management](Model_Cache_Management.md) (5 shared connections)
- [Research and RAG Services](Research_and_RAG_Services.md) (5 shared connections)
- [Vault and OAuth Connections](Vault_and_OAuth_Connections.md) (5 shared connections)
- [Contradiction History Critic](Contradiction_History_Critic.md) (4 shared connections)
- [Agent Delegation Server](Agent_Delegation_Server.md) (4 shared connections)
- [Agent Relay Components](Agent_Relay_Components.md) (3 shared connections)
- [Mission Execution Engine](Mission_Execution_Engine.md) (3 shared connections)
- [Crew Execution Methods](Crew_Execution_Methods.md) (3 shared connections)

## Source Files

- `src/lib/ai/eval-gate.ts`
- `src/lib/ai/studio-branch.test.ts`
- `src/lib/ai/studio-branch.ts`
- `src/lib/ai/tools/learning-record-memory-failure.test.ts`
- `src/lib/ai/tools/orchestrator.server.ts`
- `src/lib/ai/tools/registry.server.ts`

## Audit Trail

- EXTRACTED: 334 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*