# Model Cache Management

> 79 nodes · cohesion 0.06

## Key Concepts

- **runtime.server.ts** (156 connections) — `src/lib/ai/runtime.server.ts`
- **callModel()** (120 connections) — `src/lib/ai/runtime.server.ts`
- **callModelStream()** (31 connections) — `src/lib/ai/runtime.server.ts`
- **routing.ts** (13 connections) — `src/lib/ai/routing.ts`
- **assertAccountCredits()** (13 connections) — `src/lib/ai/runtime.server.ts`
- **retrieve()** (11 connections) — `src/lib/rag/retriever.server.ts`
- **costRoutedModel()** (10 connections) — `src/lib/ai/routing.ts`
- **noteGate()** (10 connections) — `src/lib/observability/gates.ts`
- **cache.server.ts** (9 connections) — `src/lib/ai/cache.server.ts`
- **cheapestLiveModel()** (8 connections) — `src/lib/ai/routing.ts`
- **resolveCallKey()** (7 connections) — `src/lib/ai/runtime.server.ts`
- **resolveCreditAccountId()** (7 connections) — `src/lib/ai/runtime.server.ts`
- **assumptions.server.ts** (6 connections) — `src/lib/ai/assumptions.server.ts`
- **prompts.server.ts** (6 connections) — `src/lib/ai/prompts.server.ts`
- **callGateway()** (6 connections) — `src/lib/ai/runtime.server.ts`
- **debitAccountCredits()** (6 connections) — `src/lib/ai/runtime.server.ts`
- **logAiEvent()** (6 connections) — `src/lib/ai/runtime.server.ts`
- **cache.test.ts** (5 connections) — `src/lib/ai/cache.test.ts`
- **resolveFallbackChain()** (5 connections) — `src/lib/ai/fallback.ts`
- **blendedPrice()** (5 connections) — `src/lib/ai/routing.ts`
- **routing.test.ts** (5 connections) — `src/lib/ai/routing.test.ts`
- **byokAllowedForCall()** (5 connections) — `src/lib/ai/runtime.server.ts`
- **callOpenAICompat()** (5 connections) — `src/lib/ai/runtime.server.ts`
- **cacheTtlSeconds()** (4 connections) — `src/lib/ai/cache.server.ts`
- **formatCachedResponse()** (4 connections) — `src/lib/ai/cache.server.ts`
- *... and 54 more nodes in this community*

## Relationships

- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (20 shared connections)
- [Model Capability Detection](Model_Capability_Detection.md) (15 shared connections)
- [Credit Cost Policy](Credit_Cost_Policy.md) (14 shared connections)
- [LLM Provider Routing](LLM_Provider_Routing.md) (12 shared connections)
- [Action Pricing Logic](Action_Pricing_Logic.md) (11 shared connections)
- [Platform Provider Configuration](Platform_Provider_Configuration.md) (11 shared connections)
- [Agent Loop Functions](Agent_Loop_Functions.md) (10 shared connections)
- [Guardrail Rule Engine](Guardrail_Rule_Engine.md) (8 shared connections)
- [Credit Attribution and Billing](Credit_Attribution_and_Billing.md) (8 shared connections)
- [Guardrail Injection Security](Guardrail_Injection_Security.md) (6 shared connections)
- [Insight Calibration Server](Insight_Calibration_Server.md) (6 shared connections)
- [Insight Derivation Engine](Insight_Derivation_Engine.md) (6 shared connections)

## Source Files

- `src/lib/ai/assumptions.server.ts`
- `src/lib/ai/cache.server.ts`
- `src/lib/ai/cache.test.ts`
- `src/lib/ai/fallback.test.ts`
- `src/lib/ai/fallback.ts`
- `src/lib/ai/humanize.ts`
- `src/lib/ai/models.ts`
- `src/lib/ai/prompts.server.ts`
- `src/lib/ai/routing.test.ts`
- `src/lib/ai/routing.ts`
- `src/lib/ai/runtime.server.ts`
- `src/lib/ai/tool-calling-wire-format.test.ts`
- `src/lib/observability/gates.ts`
- `src/lib/rag/retriever.server.ts`
- `src/routes/api/public/hooks/eval-tick.ts`
- `src/routes/api/public/hooks/fanout-reconcile-tick.ts`

## Audit Trail

- EXTRACTED: 616 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*