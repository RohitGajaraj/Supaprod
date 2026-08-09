# A2A Task Protocol

> 44 nodes · cohesion 0.10

## Key Concepts

- **a2a.message.stream.ts** (27 connections) — `src/routes/api/public/a2a.message.stream.ts`
- **a2a.message.send.ts** (26 connections) — `src/routes/api/public/a2a.message.send.ts`
- **a2a-protocol.ts** (24 connections) — `src/lib/a2a-protocol.ts`
- **a2a-protocol.test.ts** (13 connections) — `src/lib/a2a-protocol.test.ts`
- **ingestSignal()** (9 connections) — `src/lib/mcp.functions.ts`
- **buildToolParams()** (8 connections) — `src/lib/a2a-protocol.ts`
- **mcp-auth.server.ts** (8 connections) — `src/lib/mcp-auth.server.ts`
- **isWriteSkill()** (5 connections) — `src/lib/a2a-protocol.ts`
- **SKILL_TO_TOOL** (5 connections) — `src/lib/a2a-protocol.ts`
- **dispatchSkill()** (5 connections) — `src/routes/api/public/a2a.message.send.ts`
- **dispatchSkill()** (5 connections) — `src/routes/api/public/a2a.message.stream.ts`
- **a2aError()** (4 connections) — `src/lib/a2a-protocol.ts`
- **A2AMessage** (4 connections) — `src/lib/a2a-protocol.ts`
- **a2aTaskFailed()** (4 connections) — `src/lib/a2a-protocol.ts`
- **skillExists()** (4 connections) — `src/lib/a2a-protocol.ts`
- **checkRateLimit()** (4 connections) — `src/lib/mcp-auth.server.ts`
- **a2a.tasks.ts** (4 connections) — `src/routes/api/public/a2a.tasks.ts`
- **a2aResult()** (3 connections) — `src/lib/a2a-protocol.ts`
- **a2aTaskCompleted()** (3 connections) — `src/lib/a2a-protocol.ts`
- **extractDataFromMessage()** (3 connections) — `src/lib/a2a-protocol.ts`
- **extractTextFromMessage()** (3 connections) — `src/lib/a2a-protocol.ts`
- **sseEvent()** (3 connections) — `src/lib/a2a-protocol.ts`
- **parseBearerToken()** (3 connections) — `src/lib/mcp-auth.server.ts`
- **resolveWriteEnabled()** (3 connections) — `src/lib/mcp-auth.server.ts`
- **validateToken()** (3 connections) — `src/lib/mcp-auth.server.ts`
- *... and 19 more nodes in this community*

## Relationships

- [Decision and Design Context](Decision_and_Design_Context.md) (9 shared connections)
- [MCP Protocol Implementation](MCP_Protocol_Implementation.md) (8 shared connections)
- [Skillpack Export Logic](Skillpack_Export_Logic.md) (4 shared connections)
- [Manual Edit State Management](Manual_Edit_State_Management.md) (1 shared connections)
- [Ingest Guardrails Rate-limiting](Ingest_Guardrails_Rate-limiting.md) (1 shared connections)

## Source Files

- `src/lib/a2a-protocol.test.ts`
- `src/lib/a2a-protocol.ts`
- `src/lib/mcp-auth.server.ts`
- `src/lib/mcp.functions.ts`
- `src/routes/api/mcp.ts`
- `src/routes/api/public/a2a.message.send.ts`
- `src/routes/api/public/a2a.message.stream.ts`
- `src/routes/api/public/a2a.tasks.ts`

## Audit Trail

- EXTRACTED: 206 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*