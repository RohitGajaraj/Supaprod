# src/lib - ingest.server.ts

> 33 nodes · cohesion 0.12

## Key Concepts

- **ingest.server.ts** (30 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **mcp/client.server.ts** (17 connections) — `src/lib/connectors/mcp/client.server.ts`
- **callMcpTool()** (10 connections) — `src/lib/connectors/mcp/client.server.ts`
- **ingestMcpSignals()** (10 connections) — `src/lib/connectors/mcp/ingest.server.ts`
- **mcp/types.ts** (6 connections) — `src/lib/connectors/mcp/types.ts`
- **assertConnectorCapability()** (6 connections) — `src/lib/entitlements.ts`
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
- *... and 8 more nodes in this community*

## Relationships

- [Signal Ingestion & Provider Auth](Signal_Ingestion_%26_Provider_Auth.md) (7 shared connections)
- [src/lib - entitlements.ts](src-lib_-_entitlements.ts.md) (5 shared connections)
- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (4 shared connections)
- [src/lib - byokeys.functions.ts](src-lib_-_byokeys.functions.ts.md) (3 shared connections)
- [src/lib - loop.server.ts](src-lib_-_loop.server.ts.md) (1 shared connections)

## Source Files

- `src/lib/connectors/mcp/client.server.ts`
- `src/lib/connectors/mcp/client.test.ts`
- `src/lib/connectors/mcp/ingest.server.ts`
- `src/lib/connectors/mcp/ingest.test.ts`
- `src/lib/connectors/mcp/registry.ts`
- `src/lib/connectors/mcp/types.ts`
- `src/lib/entitlements.ts`

## Audit Trail

- EXTRACTED: 142 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*