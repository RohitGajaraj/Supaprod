# AI Runtime Tests

> 80 nodes · cohesion 0.03

## Key Concepts

- **runtime.server.test.ts** (79 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Mock provider to error midstream** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Mock provider to stream very slowly** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Create cache: const cache = new KeyResolutionCache()** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Call resolveCreditAccountId(supabase, userId, wsId, cache)** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Call again with same params** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Create cache, mock vault queries** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Call resolveCreditAccountId twice (same user/ws)** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Test two concurrent agent loops** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Pass different cache instances to each callModel** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Test callModel without opts.keyResolutionCache** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Create cache with partial data** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Call resolveCreditAccountId for a key not in cache** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Simulate 6-step agent loop with cache** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Each step calls resolveCreditAccountId(cache=same instance)** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Create two caches: cache1, cache2** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Call with user U in cache1 and user U in cache2** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Create cache with ttl/duration** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Call resolveCreditAccountId, wait for duration, call again** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: (if TTL implemented; otherwise test long-lived cache)** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Mock workspace.ai_provider_key_id pointing to user's key** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Mock vault to return encrypted key** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Mock workspace without BYOK** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Create cache, test BYOK workspace** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- **TODO: Call callModel twice with same cache** (1 connections) — `src/lib/ai/runtime.server.test.ts`
- *... and 55 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `src/lib/ai/runtime.server.test.ts`

## Audit Trail

- EXTRACTED: 158 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*