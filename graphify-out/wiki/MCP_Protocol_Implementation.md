# MCP Protocol Implementation

> 45 nodes · cohesion 0.08

## Key Concepts

- **mcp-protocol.ts** (39 connections) — `src/lib/mcp-protocol.ts`
- **api/mcp.ts** (37 connections) — `src/routes/api/mcp.ts`
- **mcp-protocol.test.ts** (22 connections) — `src/lib/mcp-protocol.test.ts`
- **classifyMcpRequest()** (7 connections) — `src/lib/mcp-protocol.ts`
- **canCallWriteTool()** (6 connections) — `src/lib/mcp-protocol.ts`
- **buildToolsListResult()** (5 connections) — `src/lib/mcp-protocol.ts`
- **isWriteTool()** (5 connections) — `src/lib/mcp-protocol.ts`
- **MCP_TOOL_NAMES** (5 connections) — `src/lib/mcp-protocol.ts`
- **logMCPCall()** (4 connections) — `src/lib/mcp.functions.ts`
- **buildInitializeResult()** (3 connections) — `src/lib/mcp-protocol.ts`
- **buildToolCallResult()** (3 connections) — `src/lib/mcp-protocol.ts`
- **isNotification()** (3 connections) — `src/lib/mcp-protocol.ts`
- **jsonRpcError** (3 connections) — `src/lib/mcp-protocol.ts`
- **jsonRpcResult()** (3 connections) — `src/lib/mcp-protocol.ts`
- **MCP_WRITE_TOOL_NAMES** (3 connections) — `src/lib/mcp-protocol.ts`
- **negotiateProtocolVersion()** (3 connections) — `src/lib/mcp-protocol.ts`
- **SUPPORTED_PROTOCOL_VERSIONS** (3 connections) — `src/lib/mcp-protocol.ts`
- **toolsForScopes()** (3 connections) — `src/lib/mcp-protocol.ts`
- **JSONRPC_INVALID_PARAMS** (2 connections) — `src/lib/mcp-protocol.ts`
- **JSONRPC_INVALID_REQUEST** (2 connections) — `src/lib/mcp-protocol.ts`
- **JSONRPC_METHOD_NOT_FOUND** (2 connections) — `src/lib/mcp-protocol.ts`
- **LATEST_PROTOCOL_VERSION** (2 connections) — `src/lib/mcp-protocol.ts`
- **LEGACY_DISCOVERY_METHODS** (2 connections) — `src/lib/mcp-protocol.ts`
- **MCP_READ_TOOL_NAMES** (2 connections) — `src/lib/mcp-protocol.ts`
- **MCP_SERVER_NAME** (2 connections) — `src/lib/mcp-protocol.ts`
- *... and 20 more nodes in this community*

## Relationships

- [Decision and Design Context](Decision_and_Design_Context.md) (18 shared connections)
- [A2A Task Protocol](A2A_Task_Protocol.md) (8 shared connections)
- [Governing Decision Resolution](Governing_Decision_Resolution.md) (3 shared connections)
- [Skillpack Export Logic](Skillpack_Export_Logic.md) (1 shared connections)
- [Manual Edit State Management](Manual_Edit_State_Management.md) (1 shared connections)

## Source Files

- `src/lib/mcp-protocol.test.ts`
- `src/lib/mcp-protocol.ts`
- `src/lib/mcp.functions.ts`
- `src/routes/api/mcp.ts`

## Audit Trail

- EXTRACTED: 192 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*