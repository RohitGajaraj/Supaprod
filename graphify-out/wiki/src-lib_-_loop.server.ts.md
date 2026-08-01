# src/lib - loop.server.ts

> 68 nodes · cohesion 0.06

## Key Concepts

- **loop.server.ts** (101 connections) — `src/lib/ai/loop.server.ts`
- **agent_loop.functions.ts** (27 connections) — `src/lib/agent_loop.functions.ts`
- **runAgentLoop()** (26 connections) — `src/lib/ai/loop.server.ts`
- **resumeAgentLoop()** (18 connections) — `src/lib/ai/loop.server.ts`
- **memory.server.ts** (18 connections) — `src/lib/ai/memory.server.ts`
- **embedOne()** (18 connections) — `src/lib/rag/embed.server.ts`
- **executeLoop()** (16 connections) — `src/lib/ai/loop.server.ts`
- **entitlementsFor()** (16 connections) — `src/lib/entitlements.ts`
- **reflection.server.ts** (13 connections) — `src/lib/ai/reflection.server.ts`
- **maybeCompleteMission()** (10 connections) — `src/lib/ai/handoff.server.ts`
- **recallMemoryRefs()** (9 connections) — `src/lib/ai/memory.server.ts`
- **autoReflect()** (9 connections) — `src/lib/ai/reflection.server.ts`
- **memory.server.test.ts** (8 connections) — `src/lib/ai/memory.server.test.ts`
- **getActiveHouseRulesForWorkspace()** (8 connections) — `src/lib/house-rules.functions.ts`
- **getWorkspaceContext()** (7 connections) — `src/lib/ai/loop.server.ts`
- **executeApproval()** (6 connections) — `src/lib/ai/loop.server.ts`
- **resolveBestAgentModelForUser()** (6 connections) — `src/lib/ai/platform-keys.server.ts`
- **renderHouseRulesBlock()** (6 connections) — `src/lib/house-rules.functions.ts`
- **consumeInboundHandoff()** (5 connections) — `src/lib/ai/handoff.server.ts`
- **loadVoiceAnchorBlock()** (5 connections) — `src/lib/ai/loop.server.ts`
- **logMemoryRecall()** (5 connections) — `src/lib/ai/memory.server.ts`
- **maybeAutoAdvanceArc()** (5 connections) — `src/lib/ai/reflection.server.ts`
- **renderBriefBlock()** (5 connections) — `src/lib/briefs.functions.ts`
- **renderBriefItemsBlock()** (5 connections) — `src/lib/briefs.functions.ts`
- **renderHandoffBlock()** (4 connections) — `src/lib/ai/handoff.server.ts`
- *... and 43 more nodes in this community*

## Relationships

- [src/lib - runtime.server.ts](src-lib_-_runtime.server.ts.md) (14 shared connections)
- [src/lib - tool-consequences.ts](src-lib_-_tool-consequences.ts.md) (12 shared connections)
- [Agent Tool Registry](Agent_Tool_Registry.md) (12 shared connections)
- [src/components - ask-canvas.tsx](src-components_-_ask-canvas.tsx.md) (10 shared connections)
- [src/lib - handoff.server.ts](src-lib_-_handoff.server.ts.md) (10 shared connections)
- [src/lib - crew.functions.ts](src-lib_-_crew.functions.ts.md) (9 shared connections)
- [src/lib - entitlements.ts](src-lib_-_entitlements.ts.md) (9 shared connections)
- [src/lib - capabilities.functions.ts](src-lib_-_capabilities.functions.ts.md) (8 shared connections)
- [Shell Primitives & Panels](Shell_Primitives_%26_Panels.md) (7 shared connections)
- [src/lib - briefs.functions.ts](src-lib_-_briefs.functions.ts.md) (7 shared connections)
- [src/lib - house-rules.functions.ts](src-lib_-_house-rules.functions.ts.md) (6 shared connections)
- [Stage Events & Cron Ticks](Stage_Events_%26_Cron_Ticks.md) (5 shared connections)

## Source Files

- `src/lib/agent_loop.functions.ts`
- `src/lib/ai/handoff.server.ts`
- `src/lib/ai/loop.server.ts`
- `src/lib/ai/memory.server.test.ts`
- `src/lib/ai/memory.server.ts`
- `src/lib/ai/platform-keys.server.ts`
- `src/lib/ai/reflection.server.ts`
- `src/lib/ai/resolve-model-action.test.ts`
- `src/lib/ai/runtime.server.ts`
- `src/lib/ai/tools/registry.server.ts`
- `src/lib/ai/trust.server.ts`
- `src/lib/briefs.functions.ts`
- `src/lib/entitlements.ts`
- `src/lib/house-rules.functions.ts`
- `src/lib/rag/embed.server.ts`
- `src/lib/runtime/idempotency.server.ts`

## Audit Trail

- EXTRACTED: 446 (100%)
- INFERRED: 2 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*