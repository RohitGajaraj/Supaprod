# AI Rate Limiting

> 17 nodes · cohesion 0.20

## Key Concepts

- **decisions-ratelimit.server.ts** (11 connections) — `src/lib/decisions-ratelimit.server.ts`
- **ai-ratelimit.server.ts** (10 connections) — `src/lib/ai-ratelimit.server.ts`
- **ai-ratelimit.server.test.ts** (5 connections) — `src/lib/ai-ratelimit.server.test.ts`
- **checkPublicDecisionRateLimit()** (5 connections) — `src/lib/decisions-ratelimit.server.ts`
- **decidePublicReadRateLimit()** (5 connections) — `src/lib/decisions-ratelimit.server.ts`
- **decisions-ratelimit.test.ts** (5 connections) — `src/lib/decisions-ratelimit.test.ts`
- **decideUserAiRateLimit()** (4 connections) — `src/lib/ai-ratelimit.server.ts`
- **checkUserAiRateLimit()** (3 connections) — `src/lib/ai-ratelimit.server.ts`
- **AI_LIMIT_PER_WINDOW** (2 connections) — `src/lib/ai-ratelimit.server.ts`
- **AI_WINDOW_DURATION_MS** (2 connections) — `src/lib/ai-ratelimit.server.ts`
- **LIMIT_PER_WINDOW** (2 connections) — `src/lib/decisions-ratelimit.server.ts`
- **RateLimitDecision** (2 connections) — `src/lib/decisions-ratelimit.server.ts`
- **WINDOW_DURATION_MS** (2 connections) — `src/lib/decisions-ratelimit.server.ts`
- **RateLimitRow** (1 connections) — `src/lib/ai-ratelimit.server.ts`
- **NOW** (1 connections) — `src/lib/ai-ratelimit.server.test.ts`
- **RateLimitRow** (1 connections) — `src/lib/decisions-ratelimit.server.ts`
- **iso()** (1 connections) — `src/lib/decisions-ratelimit.test.ts`

## Relationships

- [LLM Provider Routing](LLM_Provider_Routing.md) (2 shared connections)
- [Public Decision Sharing](Public_Decision_Sharing.md) (2 shared connections)
- [Opportunity Sharing and Permissions](Opportunity_Sharing_and_Permissions.md) (2 shared connections)
- [Teardown Receipt UI](Teardown_Receipt_UI.md) (2 shared connections)

## Source Files

- `src/lib/ai-ratelimit.server.test.ts`
- `src/lib/ai-ratelimit.server.ts`
- `src/lib/decisions-ratelimit.server.ts`
- `src/lib/decisions-ratelimit.test.ts`

## Audit Trail

- EXTRACTED: 62 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*