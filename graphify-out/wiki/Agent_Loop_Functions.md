# Agent Loop Functions

> 79 nodes · cohesion 0.05

## Key Concepts

- **loop.server.ts** (108 connections) — `src/lib/ai/loop.server.ts`
- **runAgentLoop()** (31 connections) — `src/lib/ai/loop.server.ts`
- **agent_loop.functions.ts** (30 connections) — `src/lib/agent_loop.functions.ts`
- **resumeAgentLoop()** (19 connections) — `src/lib/ai/loop.server.ts`
- **executeLoop()** (16 connections) — `src/lib/ai/loop.server.ts`
- **reflection.server.ts** (16 connections) — `src/lib/ai/reflection.server.ts`
- **defaults.ts** (14 connections) — `src/lib/ai/tools/defaults.ts`
- **access.server.ts** (11 connections) — `src/lib/ai/tools/access.server.ts`
- **resolveToolAccess()** (11 connections) — `src/lib/ai/tools/defaults.ts`
- **maybeCompleteMission()** (10 connections) — `src/lib/ai/handoff.server.ts`
- **autoReflect()** (9 connections) — `src/lib/ai/reflection.server.ts`
- **tool-schemas.server.ts** (8 connections) — `src/lib/ai/tool-schemas.server.ts`
- **TOOL_REGISTRY** (8 connections) — `src/lib/ai/tools/registry.server.ts`
- **getActiveHouseRulesForWorkspace()** (8 connections) — `src/lib/house-rules.functions.ts`
- **getWorkspaceContext()** (7 connections) — `src/lib/ai/loop.server.ts`
- **TOOL_DEFAULTS** (7 connections) — `src/lib/ai/tools/defaults.ts`
- **executeApproval()** (6 connections) — `src/lib/ai/loop.server.ts`
- **resolveBestAgentModelForUser()** (6 connections) — `src/lib/ai/platform-keys.server.ts`
- **renderHouseRulesBlock()** (6 connections) — `src/lib/house-rules.functions.ts`
- **consumeInboundHandoff()** (5 connections) — `src/lib/ai/handoff.server.ts`
- **loadVoiceAnchorBlock()** (5 connections) — `src/lib/ai/loop.server.ts`
- **logMemoryRecall()** (5 connections) — `src/lib/ai/memory.server.ts`
- **maybeAutoAdvanceArc()** (5 connections) — `src/lib/ai/reflection.server.ts`
- **buildNativeToolDefs()** (5 connections) — `src/lib/ai/tool-schemas.server.ts`
- **tool-schemas.server.test.ts** (5 connections) — `src/lib/ai/tool-schemas.server.test.ts`
- *... and 54 more nodes in this community*

## Relationships

- [Agent Tool Capping](Agent_Tool_Capping.md) (23 shared connections)
- [Evaluation and Regression Testing](Evaluation_and_Regression_Testing.md) (12 shared connections)
- [Decision Fanout Planning](Decision_Fanout_Planning.md) (10 shared connections)
- [Model Cache Management](Model_Cache_Management.md) (10 shared connections)
- [Mission Canvas UI Blocks](Mission_Canvas_UI_Blocks.md) (9 shared connections)
- [Trust and Roster Panels](Trust_and_Roster_Panels.md) (8 shared connections)
- [Agent Capability Management](Agent_Capability_Management.md) (8 shared connections)
- [Brief Formation Flow](Brief_Formation_Flow.md) (7 shared connections)
- [Memory Recall System](Memory_Recall_System.md) (6 shared connections)
- [House Rule Management](House_Rule_Management.md) (6 shared connections)
- [React Execution State](React_Execution_State.md) (5 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (5 shared connections)

## Source Files

- `src/lib/agent_loop.functions.ts`
- `src/lib/ai/action-envelope.test.ts`
- `src/lib/ai/handoff.server.ts`
- `src/lib/ai/loop.server.ts`
- `src/lib/ai/memory.server.ts`
- `src/lib/ai/platform-keys.server.ts`
- `src/lib/ai/reflection.server.ts`
- `src/lib/ai/resolve-model-action.test.ts`
- `src/lib/ai/runtime.server.ts`
- `src/lib/ai/tool-schemas.server.test.ts`
- `src/lib/ai/tool-schemas.server.ts`
- `src/lib/ai/tools/access.server.ts`
- `src/lib/ai/tools/defaults.test.ts`
- `src/lib/ai/tools/defaults.ts`
- `src/lib/ai/tools/registry.server.ts`
- `src/lib/ai/trust.server.ts`
- `src/lib/briefs.functions.ts`
- `src/lib/house-rules.functions.ts`
- `src/lib/runtime/idempotency.server.ts`

## Audit Trail

- EXTRACTED: 483 (100%)
- INFERRED: 2 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*