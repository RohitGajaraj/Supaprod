# MCP Client Server

> 32 nodes · cohesion 0.12

## Key Concepts

- **ingest.server.ts** (30 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **mcp/client.server.ts** (17 connections) — `src/lib/connectors/mcp/client.server.ts`
- **callMcpTool()** (10 connections) — `src/lib/connectors/mcp/client.server.ts`
- **ingestMcpSignals()** (10 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **mcp/types.ts** (6 connections) — `src/lib/connectors/mcp/types.ts`
- **client.test.ts** (4 connections) — `src/lib/connectors/mcp/client.test.ts`
- **blocksToCandidates()** (4 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **mcp/registry.ts** (4 connections) — `src/lib/connectors/mcp/registry.ts`
- **extractTextBlocks()** (3 connections) — `src/lib/connectors/mcp/client.server.ts`
- **isMcpEnvelope()** (3 connections) — `src/lib/connectors/mcp/client.server.ts`
- **lastEnvelope()** (3 connections) — `src/lib/connectors/mcp/client.server.ts`
- **mcpHeaders()** (3 connections) — `src/lib/connectors/mcp/client.server.ts`
- **parseSseFrames()** (3 connections) — `src/lib/connectors/mcp/client.server.ts`
- **tryInitialize()** (3 connections) — `src/lib/connectors/mcp/client.server.ts`
- **hashText()** (3 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **lookupTier()** (3 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **ingest.test.ts** (3 connections) — `src/lib/connectors/mcp/ingest.test.ts`
- **McpContentBlock** (3 connections) — `src/lib/connectors/mcp/types.ts`
- **MAX_CONTENT_BLOCKS** (2 connections) — `src/lib/connectors/mcp/client.server.ts`
- **parseArgsEnv()** (2 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **readRateState()** (2 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **recordCall()** (2 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **MCP_SERVER_REGISTRY** (2 connections) — `src/lib/connectors/mcp/registry.ts`
- **McpServerId** (2 connections) — `src/lib/connectors/mcp/types.ts`
- **McpServerSpec** (2 connections) — `src/lib/connectors/mcp/types.ts`
- *... and 7 more nodes in this community*

## Relationships

- [Canny Integration Service](Canny_Integration_Service.md) (5 shared connections)
- [Usage and Billing Metrics](Usage_and_Billing_Metrics.md) (4 shared connections)
- [Platform Provider Configuration](Platform_Provider_Configuration.md) (3 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (2 shared connections)
- [Memory Recall System](Memory_Recall_System.md) (2 shared connections)
- [Ingest Guardrails Rate-limiting](Ingest_Guardrails_Rate-limiting.md) (2 shared connections)

## Source Files

- `src/lib/connectors/mcp/client.server.ts`
- `src/lib/connectors/mcp/client.test.ts`
- `src/lib/connectors/mcp/ingest.server.ts`
- `src/lib/connectors/mcp/ingest.test.ts`
- `src/lib/connectors/mcp/registry.ts`
- `src/lib/connectors/mcp/types.ts`

## Audit Trail

- EXTRACTED: 136 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*