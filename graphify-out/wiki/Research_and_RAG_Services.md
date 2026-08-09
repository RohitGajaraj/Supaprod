# Research and RAG Services

> 40 nodes · cohesion 0.10

## Key Concepts

- **research.server.ts** (27 connections) — `src/lib/ai/research.server.ts`
- **firecrawl.server.ts** (18 connections) — `src/lib/ai/tools/firecrawl.server.ts`
- **web-search-fallback.ts** (14 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **webSearch()** (10 connections) — `src/lib/ai/tools/firecrawl.server.ts`
- **runResearch()** (7 connections) — `src/lib/ai/research.server.ts`
- **selectWebBackend()** (7 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **searxng.server.ts** (6 connections) — `src/lib/ai/tools/searxng.server.ts`
- **normalizeSearxngResults()** (6 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **web-search-fallback.test.ts** (6 connections) — `src/lib/ai/tools/web-search-fallback.test.ts`
- **webFetch()** (5 connections) — `src/lib/ai/tools/firecrawl.server.ts`
- **searxngSearch()** (5 connections) — `src/lib/ai/tools/searxng.server.ts`
- **buildSearxngQueryUrl()** (5 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **buildWebBlock()** (4 connections) — `src/lib/ai/research.server.ts`
- **gatherWeb()** (4 connections) — `src/lib/ai/research.server.ts`
- **clip()** (4 connections) — `src/lib/ai/tools/firecrawl.server.ts`
- **WebSearchHit** (4 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **buildWorkspaceBlock()** (3 connections) — `src/lib/ai/research.server.ts`
- **gatherInternal()** (3 connections) — `src/lib/ai/research.server.ts`
- **xmlEscape()** (3 connections) — `src/lib/ai/research.server.ts`
- **webCrawl()** (3 connections) — `src/lib/ai/tools/firecrawl.server.ts`
- **clampLimit()** (3 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **mapRecencyToTimeRange()** (3 connections) — `src/lib/ai/tools/web-search-fallback.ts`
- **domainOf()** (2 connections) — `src/lib/ai/research.server.ts`
- **ResearchMode** (2 connections) — `src/lib/ai/research.server.ts`
- **ResearchSource** (2 connections) — `src/lib/ai/research.server.ts`
- *... and 15 more nodes in this community*

## Relationships

- [Evaluation and Regression Testing](Evaluation_and_Regression_Testing.md) (5 shared connections)
- [Autoquery and Diffing](Autoquery_and_Diffing.md) (5 shared connections)
- [LLM Provider Routing](LLM_Provider_Routing.md) (4 shared connections)
- [Database Type Definitions](Database_Type_Definitions.md) (2 shared connections)
- [Model Cache Management](Model_Cache_Management.md) (2 shared connections)
- [Database Schema and Prompts](Database_Schema_and_Prompts.md) (2 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (2 shared connections)
- [Guardrail Injection Security](Guardrail_Injection_Security.md) (1 shared connections)
- [Screenshot Library](Screenshot_Library.md) (1 shared connections)

## Source Files

- `src/lib/ai/research.server.ts`
- `src/lib/ai/tools/firecrawl.server.ts`
- `src/lib/ai/tools/searxng.server.ts`
- `src/lib/ai/tools/web-search-fallback.test.ts`
- `src/lib/ai/tools/web-search-fallback.ts`

## Audit Trail

- EXTRACTED: 173 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*