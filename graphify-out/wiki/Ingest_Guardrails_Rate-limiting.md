# Ingest Guardrails Rate-limiting

> 45 nodes · cohesion 0.08

## Key Concepts

- **sense-tick.ts** (25 connections) — `src/routes/api/public/hooks/sense-tick.ts`
- **normalize.ts** (20 connections) — `src/lib/sensing/normalize.ts`
- **prepare.ts** (13 connections) — `src/lib/sources/prepare.ts`
- **ingest-guardrails.ts** (11 connections) — `src/lib/ingest-guardrails.ts`
- **ingest-signals.ts** (11 connections) — `src/routes/api/public/ingest-signals.ts`
- **autoTag()** (10 connections) — `src/lib/sensing/normalize.ts`
- **screenIngestText()** (8 connections) — `src/lib/ingest-guardrails.ts`
- **inferSentiment()** (8 connections) — `src/lib/sensing/normalize.ts`
- **INGEST_REVIEW_TAG** (7 connections) — `src/lib/ingest-guardrails.ts`
- **tagSignalUpdate()** (7 connections) — `src/lib/sensing/normalize.ts`
- **normalize.test.ts** (7 connections) — `src/lib/sensing/normalize.test.ts`
- **prepareSignalRows()** (7 connections) — `src/lib/sources/prepare.ts`
- **prepare.test.ts** (7 connections) — `src/lib/sources/prepare.test.ts`
- **normalizeSignal()** (6 connections) — `src/lib/sensing/normalize.ts`
- **normalizeSource()** (4 connections) — `src/lib/sensing/normalize.ts`
- **topUpDemoFeed()** (4 connections) — `src/routes/api/public/hooks/sense-tick.ts`
- **ingest-guardrails.test.ts** (3 connections) — `src/lib/ingest-guardrails.test.ts`
- **ingest-ratelimit.server.ts** (3 connections) — `src/lib/ingest-ratelimit.server.ts`
- **checkIngestRateLimit()** (3 connections) — `src/lib/ingest-ratelimit.server.ts`
- **ingest-ratelimit.test.ts** (3 connections) — `src/lib/ingest-ratelimit.test.ts`
- **containsKeyword()** (3 connections) — `src/lib/sensing/normalize.ts`
- **DEMO_FEED** (3 connections) — `src/lib/sensing/normalize.ts`
- **isSentiment()** (3 connections) — `src/lib/sensing/normalize.ts`
- **isWordChar()** (2 connections) — `src/lib/sensing/normalize.ts`
- **Sentiment** (2 connections) — `src/lib/sensing/normalize.ts`
- *... and 20 more nodes in this community*

## Relationships

- [Canny Integration Service](Canny_Integration_Service.md) (10 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (8 shared connections)
- [Decision and Design Context](Decision_and_Design_Context.md) (5 shared connections)
- [Guardrail Injection Security](Guardrail_Injection_Security.md) (3 shared connections)
- [Product Analytics Ingestion](Product_Analytics_Ingestion.md) (2 shared connections)
- [MCP Client Server](MCP_Client_Server.md) (2 shared connections)
- [GitHub Signal Ingestion](GitHub_Signal_Ingestion.md) (2 shared connections)
- [A2A Task Protocol](A2A_Task_Protocol.md) (1 shared connections)
- [Vault and OAuth Connections](Vault_and_OAuth_Connections.md) (1 shared connections)

## Source Files

- `src/lib/ingest-guardrails.test.ts`
- `src/lib/ingest-guardrails.ts`
- `src/lib/ingest-ratelimit.server.ts`
- `src/lib/ingest-ratelimit.test.ts`
- `src/lib/sensing/normalize.test.ts`
- `src/lib/sensing/normalize.ts`
- `src/lib/sources/prepare.test.ts`
- `src/lib/sources/prepare.ts`
- `src/routes/api/public/hooks/sense-tick.ts`
- `src/routes/api/public/ingest-signals.ts`

## Audit Trail

- EXTRACTED: 202 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*