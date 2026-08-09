# Mission Gate Classification

> 33 nodes · cohesion 0.10

## Key Concepts

- **resume-runs.ts** (25 connections) — `src/routes/api/public/hooks/resume-runs.ts`
- **gate-state.ts** (13 connections) — `src/lib/reliability/gate-state.ts`
- **stuck-runs.ts** (9 connections) — `src/lib/reliability/stuck-runs.ts`
- **stuck-runs.test.ts** (9 connections) — `src/lib/reliability/stuck-runs.test.ts`
- **gate-state.test.ts** (8 connections) — `src/lib/reliability/gate-state.test.ts`
- **needsEscalationResolve()** (6 connections) — `src/lib/reliability/gate-state.ts`
- **isRunStuck()** (5 connections) — `src/lib/reliability/stuck-runs.ts`
- **stuckReason()** (5 connections) — `src/lib/reliability/stuck-runs.ts`
- **MissionLite** (4 connections) — `src/lib/ai/mission-advance.server.ts`
- **classifyMissionGate()** (4 connections) — `src/lib/reliability/gate-state.ts`
- **silentFor()** (4 connections) — `src/lib/reliability/stuck-runs.ts`
- **norm()** (3 connections) — `src/lib/reliability/gate-state.ts`
- **DEFAULT_STUCK_MS** (3 connections) — `src/lib/reliability/stuck-runs.ts`
- **ACTIVE_RUN_STATUSES** (2 connections) — `src/lib/reliability/gate-state.ts`
- **ApprovalEscalationInput** (2 connections) — `src/lib/reliability/gate-state.ts`
- **DECIDED_APPROVAL_STATUSES** (2 connections) — `src/lib/reliability/gate-state.ts`
- **FLAGGED_ESCALATION_STATES** (2 connections) — `src/lib/reliability/gate-state.ts`
- **MissionGateInput** (2 connections) — `src/lib/reliability/gate-state.ts`
- **hoursSilent()** (2 connections) — `src/lib/reliability/stuck-runs.ts`
- **IN_FLIGHT** (2 connections) — `src/lib/reliability/stuck-runs.ts`
- **StuckCandidate** (2 connections) — `src/lib/reliability/stuck-runs.ts`
- **ago()** (2 connections) — `src/lib/reliability/stuck-runs.test.ts`
- **run()** (2 connections) — `src/lib/reliability/stuck-runs.test.ts`
- **GateAction** (1 connections) — `src/lib/reliability/gate-state.ts`
- **RUNNING_STATUSES** (1 connections) — `src/lib/reliability/gate-state.ts`
- *... and 8 more nodes in this community*

## Relationships

- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (8 shared connections)
- [Mission Execution Engine](Mission_Execution_Engine.md) (3 shared connections)
- [Agent Loop Functions](Agent_Loop_Functions.md) (3 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (2 shared connections)
- [Evaluation and Regression Testing](Evaluation_and_Regression_Testing.md) (1 shared connections)
- [Task Orchestration and Linear](Task_Orchestration_and_Linear.md) (1 shared connections)

## Source Files

- `src/lib/ai/mission-advance.server.ts`
- `src/lib/reliability/gate-state.test.ts`
- `src/lib/reliability/gate-state.ts`
- `src/lib/reliability/stuck-runs.test.ts`
- `src/lib/reliability/stuck-runs.ts`
- `src/routes/api/public/hooks/resume-runs.ts`

## Audit Trail

- EXTRACTED: 128 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*