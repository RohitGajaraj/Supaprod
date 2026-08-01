# Scout & Snapshot Pipeline

> 81 nodes · cohesion 0.05

## Key Concepts

- **scout-tick.ts** (32 connections) — `src/routes/api/public/hooks/scout-tick.ts`
- **firecrawl.server.ts** (18 connections) — `src/lib/ai/tools/firecrawl.server.ts`
- **snapshot.server.ts** (18 connections) — `src/lib/scout/snapshot.server.ts`
- **strategy-registry.functions.ts** (17 connections) — `src/lib/strategy-registry.functions.ts`
- **scout/kinds.ts** (16 connections) — `src/lib/scout/kinds.ts`
- **diff.ts** (15 connections) — `src/lib/scout/diff.ts`
- **web-search-fallback.ts** (14 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **targets.server.ts** (14 connections) — `src/lib/scout/targets.server.ts`
- **seed.server.ts** (12 connections) — `src/lib/scout/seed.server.ts`
- **webSearch()** (10 connections) — `src/lib/ai/tools/firecrawl.server.ts`
- **processTarget()** (9 connections) — `src/routes/api/public/hooks/scout-tick.ts`
- **diff.test.ts** (8 connections) — `src/lib/scout/diff.test.ts`
- **selectWebBackend()** (7 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **WatchKind** (7 connections) — `src/lib/scout/kinds.ts`
- **searxng.server.ts** (6 connections) — `src/lib/ai/tools/searxng.server.ts`
- **normalizeSearxngResults()** (6 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **web-search-fallback.test.ts** (6 connections) — `src/lib/ai/tools/web-search-fallback.test.ts`
- **autoquery.ts** (6 connections) — `src/lib/scout/autoquery.ts`
- **autoquery.test.ts** (6 connections) — `src/lib/scout/autoquery.test.ts`
- **hashContent()** (6 connections) — `src/lib/scout/diff.ts`
- **ScoutTargetRow** (6 connections) — `src/lib/scout/targets.server.ts`
- **webFetch()** (5 connections) — `src/lib/ai/tools/firecrawl.server.ts`
- **searxngSearch()** (5 connections) — `src/lib/ai/tools/searxng.server.ts`
- **buildSearxngQueryUrl()** (5 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **backoffNext()** (5 connections) — `src/lib/scout/diff.ts`
- *... and 56 more nodes in this community*

## Relationships

- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (18 shared connections)
- [Signal Ingestion & Provider Auth](Signal_Ingestion_%26_Provider_Auth.md) (12 shared connections)
- [src/lib - chat.ts](src-lib_-_chat.ts.md) (7 shared connections)
- [Agent Tool Registry](Agent_Tool_Registry.md) (5 shared connections)
- [supabase/migrations - key()](supabase-migrations_-_key%28%29.md) (2 shared connections)
- [Auth Middleware & Server Functions](Auth_Middleware_%26_Server_Functions.md) (2 shared connections)

## Source Files

- `src/lib/ai/tools/firecrawl.server.ts`
- `src/lib/ai/tools/searxng.server.ts`
- `src/lib/ai/tools/web-search-fallback.test.ts`
- `src/lib/ai/tools/web-search-fallback.ts`
- `src/lib/scout/autoquery.test.ts`
- `src/lib/scout/autoquery.ts`
- `src/lib/scout/diff.test.ts`
- `src/lib/scout/diff.ts`
- `src/lib/scout/kinds.ts`
- `src/lib/scout/seed.server.ts`
- `src/lib/scout/snapshot.server.ts`
- `src/lib/scout/targets.server.ts`
- `src/lib/strategy-registry.functions.ts`
- `src/routes/api/public/hooks/scout-tick.ts`

## Audit Trail

- EXTRACTED: 372 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*