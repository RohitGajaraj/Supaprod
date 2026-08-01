# src/lib - runtime.server.ts

> 75 nodes · cohesion 0.06

## Key Concepts

- **runtime.server.ts** (149 connections) — `src/lib/ai/runtime.server.ts`
- **callModel()** (119 connections) — `src/lib/ai/runtime.server.ts`
- **callModelStream()** (30 connections) — `src/lib/ai/runtime.server.ts`
- **retriever.server.ts** (15 connections) — `src/lib/rag/retriever.server.ts`
- **assertAccountCredits()** (13 connections) — `src/lib/ai/runtime.server.ts`
- **retrieve()** (11 connections) — `src/lib/rag/retriever.server.ts`
- **cache.server.ts** (9 connections) — `src/lib/ai/cache.server.ts`
- **resolveCallKey()** (7 connections) — `src/lib/ai/runtime.server.ts`
- **resolveCreditAccountId()** (7 connections) — `src/lib/ai/runtime.server.ts`
- **assumptions.server.ts** (6 connections) — `src/lib/ai/assumptions.server.ts`
- **prompts.server.ts** (6 connections) — `src/lib/ai/prompts.server.ts`
- **callGateway()** (6 connections) — `src/lib/ai/runtime.server.ts`
- **debitAccountCredits()** (6 connections) — `src/lib/ai/runtime.server.ts`
- **formatContextBlock()** (6 connections) — `src/lib/rag/retriever.server.ts`
- **cache.test.ts** (5 connections) — `src/lib/ai/cache.test.ts`
- **resolveFallbackChain()** (5 connections) — `src/lib/ai/fallback.ts`
- **byokAllowedForCall()** (5 connections) — `src/lib/ai/runtime.server.ts`
- **callOpenAICompat()** (5 connections) — `src/lib/ai/runtime.server.ts`
- **logAiEvent()** (5 connections) — `src/lib/ai/runtime.server.ts`
- **cacheTtlSeconds()** (4 connections) — `src/lib/ai/cache.server.ts`
- **formatCachedResponse()** (4 connections) — `src/lib/ai/cache.server.ts`
- **generateCacheKey()** (4 connections) — `src/lib/ai/cache.server.ts`
- **shouldCacheCall()** (4 connections) — `src/lib/ai/cache.server.ts`
- **writeCache()** (4 connections) — `src/lib/ai/cache.server.ts`
- **resolvePrompt()** (4 connections) — `src/lib/ai/prompts.server.ts`
- *... and 50 more nodes in this community*

## Relationships

- [src/lib - chat.ts](src-lib_-_chat.ts.md) (15 shared connections)
- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (14 shared connections)
- [src/lib - routing-console.functions.ts](src-lib_-_routing-console.functions.ts.md) (14 shared connections)
- [src/lib - credit-policy.ts](src-lib_-_credit-policy.ts.md) (14 shared connections)
- [src/lib - loop.server.ts](src-lib_-_loop.server.ts.md) (14 shared connections)
- [src/lib - byokeys.functions.ts](src-lib_-_byokeys.functions.ts.md) (11 shared connections)
- [src/lib - pricing.ts](src-lib_-_pricing.ts.md) (8 shared connections)
- [src/lib - credits.functions.ts](src-lib_-_credits.functions.ts.md) (8 shared connections)
- [src/lib - launch-plan.functions.ts](src-lib_-_launch-plan.functions.ts.md) (7 shared connections)
- [src/lib - loops.functions.ts](src-lib_-_loops.functions.ts.md) (6 shared connections)
- [Agent Tool Registry](Agent_Tool_Registry.md) (6 shared connections)
- [src/lib - derive-insights.server.ts](src-lib_-_derive-insights.server.ts.md) (6 shared connections)

## Source Files

- `src/lib/ai/assumptions.server.ts`
- `src/lib/ai/cache.server.ts`
- `src/lib/ai/cache.test.ts`
- `src/lib/ai/fallback.test.ts`
- `src/lib/ai/fallback.ts`
- `src/lib/ai/humanize.ts`
- `src/lib/ai/prompts.server.ts`
- `src/lib/ai/runtime.server.ts`
- `src/lib/ai/tool-calling-wire-format.test.ts`
- `src/lib/rag/retriever.server.ts`
- `src/routes/api/public/hooks/eval-tick.ts`

## Audit Trail

- EXTRACTED: 567 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*