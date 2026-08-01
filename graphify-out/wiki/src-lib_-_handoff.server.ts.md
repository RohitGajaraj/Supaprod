# src/lib - handoff.server.ts

> 52 nodes · cohesion 0.07

## Key Concepts

- **handoff.server.ts** (36 connections) — `src/lib/ai/handoff.server.ts`
- **fanout.ts** (13 connections) — `src/lib/ai/fanout.ts`
- **handoff.test.ts** (13 connections) — `src/lib/ai/handoff.test.ts`
- **fanout.functions.ts** (13 connections) — `src/lib/fanout.functions.ts`
- **fanout.server.ts** (12 connections) — `src/lib/ai/fanout.server.ts`
- **enqueueHandoff()** (11 connections) — `src/lib/ai/handoff.server.ts`
- **createMission()** (10 connections) — `src/lib/ai/handoff.server.ts`
- **fanout.server.test.ts** (8 connections) — `src/lib/ai/fanout.server.test.ts`
- **enqueueFanout()** (7 connections) — `src/lib/ai/fanout.server.ts`
- **fanout.test.ts** (7 connections) — `src/lib/ai/fanout.test.ts`
- **resolveAgent()** (6 connections) — `src/lib/ai/handoff.server.ts`
- **resolveMissionSpendCap()** (6 connections) — `src/lib/ai/mission-caps.server.ts`
- **decision-alternatives.ts** (5 connections) — `src/lib/ai/decision-alternatives.ts`
- **extractRejectedAlternatives()** (5 connections) — `src/lib/ai/decision-alternatives.ts`
- **mission-caps.server.ts** (5 connections) — `src/lib/ai/mission-caps.server.ts`
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
- *... and 27 more nodes in this community*

## Relationships

- [Agent Tool Registry](Agent_Tool_Registry.md) (11 shared connections)
- [src/lib - loop.server.ts](src-lib_-_loop.server.ts.md) (10 shared connections)
- [src/lib - mission-advance.server.ts](src-lib_-_mission-advance.server.ts.md) (6 shared connections)
- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (5 shared connections)
- [src/lib - runtime.server.ts](src-lib_-_runtime.server.ts.md) (3 shared connections)
- [Stage Events & Cron Ticks](Stage_Events_%26_Cron_Ticks.md) (3 shared connections)
- [src/lib - reactor.functions.ts](src-lib_-_reactor.functions.ts.md) (3 shared connections)
- [src/lib - build.functions.ts](src-lib_-_build.functions.ts.md) (2 shared connections)
- [src/lib - orchestrator.functions.ts](src-lib_-_orchestrator.functions.ts.md) (2 shared connections)
- [src/lib - chat.ts](src-lib_-_chat.ts.md) (2 shared connections)
- [Auth Middleware & Server Functions](Auth_Middleware_%26_Server_Functions.md) (2 shared connections)
- [src/lib - ai/verify-green.server.ts](src-lib_-_ai-verify-green.server.ts.md) (1 shared connections)

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

- EXTRACTED: 232 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*