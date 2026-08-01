# src/lib - teardown.ts

> 24 nodes · cohesion 0.13

## Key Concepts

- **teardown.ts** (12 connections) — `src/routes/api/public/teardown.ts`
- **decisions-ratelimit.server.ts** (11 connections) — `src/lib/decisions-ratelimit.server.ts`
- **ai-ratelimit.server.ts** (10 connections) — `src/lib/ai-ratelimit.server.ts`
- **ai-ratelimit.server.test.ts** (5 connections) — `src/lib/ai-ratelimit.server.test.ts`
- **checkPublicDecisionRateLimit()** (5 connections) — `src/lib/decisions-ratelimit.server.ts`
- **decidePublicReadRateLimit()** (5 connections) — `src/lib/decisions-ratelimit.server.ts`
- **decisions-ratelimit.test.ts** (5 connections) — `src/lib/decisions-ratelimit.test.ts`
- **decideUserAiRateLimit()** (4 connections) — `src/lib/ai-ratelimit.server.ts`
- **checkUserAiRateLimit()** (3 connections) — `src/lib/ai-ratelimit.server.ts`
- **TEARDOWN_MAX_INPUT_CHARS** (2 connections) — `src/lib/ai/public-teardown.server.ts`
- **AI_LIMIT_PER_WINDOW** (2 connections) — `src/lib/ai-ratelimit.server.ts`
- **AI_WINDOW_DURATION_MS** (2 connections) — `src/lib/ai-ratelimit.server.ts`
- **LIMIT_PER_WINDOW** (2 connections) — `src/lib/decisions-ratelimit.server.ts`
- **RateLimitDecision** (2 connections) — `src/lib/decisions-ratelimit.server.ts`
- **WINDOW_DURATION_MS** (2 connections) — `src/lib/decisions-ratelimit.server.ts`
- **RateLimitRow** (1 connections) — `src/lib/ai-ratelimit.server.ts`
- **NOW** (1 connections) — `src/lib/ai-ratelimit.server.test.ts`
- **RateLimitRow** (1 connections) — `src/lib/decisions-ratelimit.server.ts`
- **iso()** (1 connections) — `src/lib/decisions-ratelimit.test.ts`
- **bodySchema** (1 connections) — `src/routes/api/public/teardown.ts`
- **clientIp()** (1 connections) — `src/routes/api/public/teardown.ts`
- **CORS** (1 connections) — `src/routes/api/public/teardown.ts`
- **json()** (1 connections) — `src/routes/api/public/teardown.ts`
- **Route** (1 connections) — `src/routes/api/public/teardown.ts`

## Relationships

- [src/lib - public-teardown.server.ts](src-lib_-_public-teardown.server.ts.md) (3 shared connections)
- [src/lib - chat.ts](src-lib_-_chat.ts.md) (2 shared connections)
- [src/lib - decisions-share.functions.ts](src-lib_-_decisions-share.functions.ts.md) (2 shared connections)
- [src/lib - opportunities-share.functions.ts](src-lib_-_opportunities-share.functions.ts.md) (2 shared connections)
- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (2 shared connections)

## Source Files

- `src/lib/ai-ratelimit.server.test.ts`
- `src/lib/ai-ratelimit.server.ts`
- `src/lib/ai/public-teardown.server.ts`
- `src/lib/decisions-ratelimit.server.ts`
- `src/lib/decisions-ratelimit.test.ts`
- `src/routes/api/public/teardown.ts`

## Audit Trail

- EXTRACTED: 81 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*