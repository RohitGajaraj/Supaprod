// Q1-MCP Phase 4a - native MCP (Model Context Protocol) transport layer.
//
// Pure JSON-RPC 2.0 + MCP wire-protocol helpers. The `/api/mcp` route stays the
// I/O boundary (bearer auth, Supabase, rate-limit, audit); this module owns the
// PROTOCOL: method classification, the handshake (`initialize`/`ping`), tool
// discovery (`tools/list`), the `tools/call` content envelope, and notification
// detection. Everything here is pure (no network, no DB, no clock), so the wire
// protocol is fully unit-testable offline.
//
// Back-compat is a hard constraint: the legacy flat READ methods
// (`search_signals` / `search_opportunities` / `get_prd`) and the legacy
// `tools` / `resources` discovery are classified as `legacy` and dispatched
// through the route's unchanged code path, so existing curl/HTTP callers are
// byte-identical. The new standard methods are added alongside.
//
// The server is READ-ONLY. The earlier `append_decision` write tool was removed
// (2026-06-24): it inserted columns/`decision_queue` rows that do not exist in
// the live schema, so it could never succeed, and the write half belongs to the
// founder-gated Phase 4b below. We advertise only what we actually serve.
//
// Phase 4b (OAuth client registration + full write CRUD with per-lane scope)
// stays founder-gated; this slice closes only the transport-handshake gap that
// blocked standards-compliant MCP clients (e.g. Claude Desktop) from connecting.
// Spec: https://modelcontextprotocol.io/specification

export const MCP_SERVER_NAME = "supaprod";
export const MCP_SERVER_VERSION = "1.0.0";

// MCP spec revisions this server understands; index 0 is the latest/preferred.
// `initialize` echoes the client's requested version when supported, else this.
export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"] as const;
export const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

// Standard JSON-RPC 2.0 error codes (https://www.jsonrpc.org/specification).
export const JSONRPC_PARSE_ERROR = -32700;
export const JSONRPC_INVALID_REQUEST = -32600;
export const JSONRPC_METHOD_NOT_FOUND = -32601;
export const JSONRPC_INVALID_PARAMS = -32602;
export const JSONRPC_INTERNAL_ERROR = -32603;

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// The canonical tool catalog. Single source of truth for BOTH the standard
// `tools/list` and the legacy `tools` discovery, so the two can never drift.
export const MCP_TOOLS: McpTool[] = [
  {
    name: "search_signals",
    description: "Search discovery signals by keyword, theme, or product",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", default: 20 },
        offset: { type: "number", default: 0 },
      },
    },
  },
  {
    name: "search_opportunities",
    description: "Search opportunities by title/problem or ICE score",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        min_ice: { type: "number", default: 0 },
        limit: { type: "number", default: 20 },
        offset: { type: "number", default: 0 },
      },
    },
  },
  {
    name: "search_decisions",
    description:
      "Search the decision memory: decisions by keyword, each tagged with its outcome history (still stands vs superseded). Answers 'what did this team decide, and did it hold up?'",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", default: 20 },
        offset: { type: "number", default: 0 },
      },
    },
  },
  {
    name: "search_prds",
    description:
      "Search specs (PRDs) by keyword (title or body) and/or status (draft/review/approved/shipped). Discover specs without knowing their id · the find half of get_prd.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        status: { type: "string" },
        limit: { type: "number", default: 20 },
        offset: { type: "number", default: 0 },
      },
    },
  },
  {
    name: "get_prd",
    description: "Fetch a specific spec with cited signals and requirements",
    inputSchema: {
      type: "object",
      properties: { prd_id: { type: "string" } },
      required: ["prd_id"],
    },
  },
  {
    name: "get_ard",
    description:
      "Fetch a spec's Outcome Contract as a portable, versioned ARD (Agent Requirements Document): intent, success metrics each tagged with their proof oracle, non-goals, and budget. This is the structured acceptance contract an external coding agent should receive on dispatch instead of re-parsing the spec's prose. Schema: /api/public/ard/schema.",
    inputSchema: {
      type: "object",
      properties: { prd_id: { type: "string" } },
      required: ["prd_id"],
    },
  },
  {
    name: "get_roadmap",
    description:
      "Fetch the workspace roadmap: opportunities arranged into now / next / later buckets (plus unbucketed), highest ICE first.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 200 },
      },
    },
  },
  {
    name: "export_skillpack",
    description:
      "Export a versioned, content-hashed bundle of this workspace's decision lessons (outcomes that validated, missed, or revised a decision) for an external agent to load as context",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 200 },
      },
    },
  },
  {
    name: "outcome_history",
    description:
      "Given an initiative (an opportunity's name or a keyword), return its recorded outcome history: every learning tied to a matching opportunity, newest first. Answers 'has a bet like this one turned out well before?' An empty initiative returns the workspace's most recent outcomes overall.",
    inputSchema: {
      type: "object",
      properties: {
        initiative: { type: "string" },
        limit: { type: "number", default: 20 },
      },
    },
  },
  {
    name: "get_governing_decision",
    description:
      "Given a topic, return the CURRENT governing decisions: decisions that have not been superseded or contradicted. Stale decisions are flagged and their replacement is named, so an agent always cites the live belief, not an overturned one.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        limit: { type: "number", default: 10 },
      },
      required: ["topic"],
    },
  },
  {
    name: "get_contradiction_history",
    description:
      "Given a topic, return the contradiction and supersession history of related decisions. Shows what was believed, what outcome invalidated it, and when, so an agent can ask 'has a bet like this ever been contradicted?' before committing.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        limit: { type: "number", default: 10 },
      },
      required: ["topic"],
    },
  },
  {
    // FC-01. A settle tool with no way to find what needs settling is a tool
    // nobody can use: an agent cannot discover that a forecast exists, let alone
    // that one came due, from any other read here. list_decisions and
    // search_decisions both select a fixed column list that omits every forecast
    // column, so before this the moat was invisible to the agent surface as well
    // as unwritable by it.
    //
    // A READ, so no scope and no write gate. Knowing which of your own calls are
    // overdue is not a privileged action, and gating it would mean a token that
    // may settle a forecast still could not tell you which ones are waiting.
    name: "list_due_forecasts",
    description:
      "List forecasts whose horizon has passed and which nobody has settled yet, oldest first. Each carries what was expected, the observable chosen to settle it, how many days late it is, and any verdict an agent has drafted. This is the queue behind settle_forecast.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 20 },
      },
    },
  },
];

export const MCP_READ_TOOL_NAMES: readonly string[] = MCP_TOOLS.map((t) => t.name);

// ───────────────────────────────────────────────────────────────────────────
// INTEROP-V11 · Q2 — the GOVERNED WRITE tools.
//
// Write tools are NOT in the default catalog. Each declares the capability scope
// a token must carry (mcp_tokens.scopes), and every write additionally requires
// the global `interop_write_enabled()` gate (default off). `tools/list` only
// surfaces a write tool when BOTH locks are open for the calling token, so a
// read-only token never even discovers it. The route re-checks both locks at
// `tools/call` time (defence in depth) and audits every attempt. The one write
// tool reuses the live `signals` insert path + the ingest injection screen, so
// it cannot repeat the append_decision schema-drift bug.
// ───────────────────────────────────────────────────────────────────────────

/** The capability scope each write tool requires. The single source of truth. */
export const WRITE_SCOPE_BY_TOOL: Readonly<Record<string, string>> = {
  ingest_signal: "write:signal",
  // Founder ruling 2026-08-10: the agent surface read eleven things and wrote
  // one, into station 01, so an agent could hand us a signal and could not do
  // any of the work. These three are the rest of the loop. Each carries its
  // OWN scope rather than sharing one, so a token can be granted "may record a
  // decision" without also being granted "may settle an outcome" -- the two
  // are not remotely the same permission, and a single write:all would make
  // the narrower grant impossible to express.
  record_decision: "write:decision",
  draft_spec: "write:spec",
  settle_outcome: "write:outcome",
  // FC-01, 2026-08-14. The forecast is the one artifact the positioning calls
  // unrebuildable, and it was the only station with NO agent surface at all:
  // not one of the fifteen tools touched a forecast column, so the moat was
  // reachable exclusively through one collapsed form on one route. That is
  // backwards for a product whose decisions are mostly captured by agents.
  //
  // TWO SCOPES, NOT ONE, for the same reason record_decision and settle_outcome
  // are separate. Recording what you expect and grading whether it happened are
  // different permissions, and a token that may state a belief must not thereby
  // be able to mark that belief correct.
  record_forecast: "write:forecast",
  settle_forecast: "write:forecast_resolution",
};

/**
 * Every capability scope a token may be granted, DERIVED from the tool map above
 * rather than written out a second time.
 *
 * The mint path used to carry its own hand-kept allow-list, and it had fallen a
 * founder ruling behind: it accepted `write:signal` alone, so `record_decision`,
 * `draft_spec` and `settle_outcome` were catalogued, dispatched, tested, and
 * impossible to authorize through the product. Three built write tools were
 * unreachable because one enum in a different file was never widened alongside
 * them. Deriving it here means adding a write tool makes it mintable the same
 * day, and the two lists cannot drift apart again.
 */
export const MCP_WRITE_SCOPES: readonly string[] = [
  ...new Set(Object.values(WRITE_SCOPE_BY_TOOL)),
].sort();

export const MCP_WRITE_TOOLS: McpTool[] = [
  {
    name: "ingest_signal",
    description:
      "Contribute a discovery signal into this workspace (governed write). Requires the write:signal scope and the workspace's outward-write gate. The text is injection-screened before storage; a structural prompt-injection is rejected, a borderline one is stored flagged for review.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        source: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "record_decision",
    description:
      "Record a decision in this workspace's audit trail (governed write). Requires the write:decision scope and the workspace's outward-write gate. Lands at status 'pending' for a human to approve; an agent never lands a decision already approved. Text is injection-screened before storage.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        rationale: { type: "string" },
        agent_slug: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "draft_spec",
    description:
      "Draft a spec against an opportunity (governed write). Requires the write:spec scope and the workspace's outward-write gate. Lands at status 'draft', never 'approved' or 'shipped'. Text is injection-screened before storage.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body_md: { type: "string" },
        opportunity_id: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "settle_outcome",
    description:
      "Record what actually happened to a shipped spec (governed write). Requires the write:outcome scope and the workspace's outward-write gate. Refuses to overwrite a verdict already on the record: disagreeing with a settled outcome is a person's move.",
    inputSchema: {
      type: "object",
      properties: {
        prd_id: { type: "string" },
        verdict: { type: "string", enum: ["validated", "missed", "mixed"] },
        summary: { type: "string" },
        metric_label: { type: "string" },
        metric_value: { type: "string" },
        agent_slug: { type: "string" },
      },
      required: ["prd_id", "verdict", "summary"],
    },
  },
];

const FORECAST_WRITE_TOOLS: McpTool[] = [
  {
    name: "record_forecast",
    description:
      "Attach a forecast to a decision that does not carry one (governed write). Requires the write:forecast scope and the workspace's outward-write gate. All three parts are required together: what you expect, the observable that will settle it, and the horizon date. SET ONCE and never editable afterwards, because a forecast you can revise once the outcome is known is a retrospective. The horizon must still be in the future.",
    inputSchema: {
      type: "object",
      properties: {
        decision_id: { type: "string" },
        claim: { type: "string", description: "What you expect to happen." },
        how_we_will_know: {
          type: "string",
          description: "The observable that will settle this, chosen before the answer is known.",
        },
        horizon_date: {
          type: "string",
          description: "ISO 8601 timestamp with offset. Must be in the future.",
        },
      },
      required: ["decision_id", "claim", "how_we_will_know", "horizon_date"],
    },
  },
  {
    name: "settle_forecast",
    description:
      "Record whether a forecast came true, once its horizon has passed (governed write). Requires the write:forecast_resolution scope and the workspace's outward-write gate. Refuses to overwrite a verdict already on the record: disagreeing with a settled forecast is a person's move. Use inconclusive only when the stated observable arrived and did not settle the claim.",
    inputSchema: {
      type: "object",
      properties: {
        decision_id: { type: "string" },
        resolution: { type: "string", enum: ["hit", "miss", "inconclusive"] },
        rationale: { type: "string", description: "The one fact that decided it." },
        agent_slug: { type: "string" },
      },
      required: ["decision_id", "resolution", "rationale"],
    },
  },
];

// Appended rather than inlined so the forecast pair reads as one addition with
// one rationale above it, instead of two entries buried in a list of four.
MCP_WRITE_TOOLS.push(...FORECAST_WRITE_TOOLS);

export const MCP_WRITE_TOOL_NAMES: readonly string[] = MCP_WRITE_TOOLS.map((t) => t.name);

// Classification recognizes BOTH read and write tool names as known tools (so a
// write tool is never a spurious "method not found"); the route enforces the
// scope + gate authorization at dispatch time.
export const MCP_TOOL_NAMES: readonly string[] = [...MCP_READ_TOOL_NAMES, ...MCP_WRITE_TOOL_NAMES];

/** Is `name` one of the governed write tools? Pure. */
export function isWriteTool(name: string): boolean {
  return MCP_WRITE_TOOL_NAMES.includes(name);
}

/**
 * PURE. The tool catalog a token may SEE, given its scopes and the global write
 * gate. Read tools are always included; a write tool appears only when the gate
 * is on AND the token holds the tool's required scope. Defaults (no scopes, gate
 * off) yield the read-only catalog, so every existing caller is unchanged.
 */
export function toolsForScopes(scopes: readonly string[] = [], writeEnabled = false): McpTool[] {
  if (!writeEnabled) return [...MCP_TOOLS];
  const writable = MCP_WRITE_TOOLS.filter((t) => scopes.includes(WRITE_SCOPE_BY_TOOL[t.name]));
  return [...MCP_TOOLS, ...writable];
}

export type WriteAuthz = { allowed: boolean; reason?: string };

/**
 * PURE. May this token call `toolName`? Non-write tools are always allowed here
 * (read authorization is the workspace scope on the token itself). A write tool
 * needs BOTH the global gate ON and the token's required scope present; the
 * order (gate first) means a probe without the scope still learns only that
 * writes are disabled, not which scope it lacks, until the gate is opened.
 */
export function canCallWriteTool(
  toolName: string,
  scopes: readonly string[] = [],
  writeEnabled = false,
): WriteAuthz {
  if (!isWriteTool(toolName)) return { allowed: true };
  if (!writeEnabled) {
    return { allowed: false, reason: "Outward write is disabled for this Supaprod server" };
  }
  const required = WRITE_SCOPE_BY_TOOL[toolName];
  if (!scopes.includes(required)) {
    return { allowed: false, reason: `Token is missing the required scope: ${required}` };
  }
  return { allowed: true };
}

// The legacy discovery aliases that pre-date the standard methods.
const LEGACY_DISCOVERY_METHODS = new Set(["tools", "resources"]);

export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc?: string;
  method?: string;
  params?: Record<string, unknown>;
  id?: JsonRpcId;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: JsonRpcError;
}

// The classified intent of an inbound request. The route switches on `kind`:
// standard kinds get spec-correct handlers; `legacy` falls through to the
// existing dispatch (byte-identical); `notification` gets no response body.
export type McpDispatch =
  | { kind: "initialize"; protocolVersion: string }
  | { kind: "ping" }
  | { kind: "tools/list" }
  | { kind: "resources/list" }
  | { kind: "prompts/list" }
  | { kind: "tools/call"; toolName: string; args: Record<string, unknown> }
  | { kind: "notification" }
  | { kind: "legacy"; method: string }
  | { kind: "error"; error: JsonRpcError };

/**
 * A JSON-RPC request is a NOTIFICATION when it carries no `id` member, OR when
 * its method is in the `notifications/*` namespace (e.g.
 * `notifications/initialized`). Notifications MUST receive no response at all.
 */
export function isNotification(req: JsonRpcRequest | null | undefined): boolean {
  if (!req) return true;
  if (typeof req.method === "string" && req.method.startsWith("notifications/")) {
    return true;
  }
  return req.id === undefined || req.id === null;
}

/**
 * Pick the protocol version to report from `initialize`. Echoes the client's
 * requested version when this server supports it, else falls back to the latest
 * supported version (per the MCP version-negotiation rule).
 */
export function negotiateProtocolVersion(requested?: unknown): string {
  if (
    typeof requested === "string" &&
    (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return LATEST_PROTOCOL_VERSION;
}

/**
 * Classify an inbound JSON-RPC request into a transport intent. Pure: no auth,
 * no DB. The route does auth/rate-limit/dispatch based on the returned `kind`.
 */
export function classifyMcpRequest(req: JsonRpcRequest): McpDispatch {
  // Notifications first: no id (or notifications/* method) => no response.
  if (isNotification(req)) return { kind: "notification" };

  const method = typeof req.method === "string" ? req.method : "";
  const params = (req.params ?? {}) as Record<string, unknown>;

  switch (method) {
    case "initialize":
      return {
        kind: "initialize",
        protocolVersion: negotiateProtocolVersion(params.protocolVersion),
      };
    case "ping":
      return { kind: "ping" };
    case "tools/list":
      return { kind: "tools/list" };
    case "resources/list":
      return { kind: "resources/list" };
    case "prompts/list":
      return { kind: "prompts/list" };
    case "tools/call": {
      const name = params.name;
      if (typeof name !== "string" || name.length === 0) {
        return {
          kind: "error",
          error: { code: JSONRPC_INVALID_PARAMS, message: "Missing tool name" },
        };
      }
      if (!MCP_TOOL_NAMES.includes(name)) {
        return {
          kind: "error",
          error: { code: JSONRPC_INVALID_PARAMS, message: `Unknown tool: ${name}` },
        };
      }
      const rawArgs = params.arguments;
      const args =
        rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)
          ? (rawArgs as Record<string, unknown>)
          : {};
      return { kind: "tools/call", toolName: name, args };
    }
    default:
      // Legacy flat tool methods + legacy discovery aliases route through the
      // route's unchanged dispatch path (back-compat, byte-identical).
      if (MCP_TOOL_NAMES.includes(method) || LEGACY_DISCOVERY_METHODS.has(method)) {
        return { kind: "legacy", method };
      }
      return {
        kind: "error",
        error: { code: JSONRPC_METHOD_NOT_FOUND, message: `Method not found: ${method}` },
      };
  }
}

/** The `initialize` result: capabilities + server identity + a usage hint. */
export function buildInitializeResult(protocolVersion: string) {
  return {
    protocolVersion,
    // Advertise only what we actually serve. resources/list and prompts/list
    // answer (empty) for client tolerance, but we do NOT advertise those
    // capabilities, so a conformant client never attempts resources/read etc.
    // (which would 404 with method-not-found). Phase 4b adds real resources.
    capabilities: {
      tools: { listChanged: false },
    },
    serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    instructions:
      "Supaprod exposes read access to product signals, opportunities, decisions, specs, and the roadmap, plus a versioned decision-lessons skill pack. Call tools/list to enumerate, then tools/call to invoke.",
  };
}

/**
 * The `tools/list` result. Scope-aware: pass the calling token's scopes + the
 * global write-gate state to additionally surface any write tool the token is
 * authorized for. With no arguments it returns the read-only catalog, so the
 * legacy discovery aliases and any existing caller are byte-identical.
 */
export function buildToolsListResult(
  scopes: readonly string[] = [],
  writeEnabled = false,
): { tools: McpTool[] } {
  return { tools: toolsForScopes(scopes, writeEnabled) };
}

/**
 * Wrap raw tool output in the MCP `tools/call` content envelope. Per the spec,
 * tool EXECUTION errors are reported in the result with `isError: true` (so a
 * calling model can see them), not as JSON-RPC protocol errors.
 */
export function buildToolCallResult(data: unknown, isError = false) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

/** Build a JSON-RPC success response. A null/absent id is reported as null. */
export function jsonRpcResult(id: JsonRpcId | undefined, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

/** Build a JSON-RPC error response. */
export function jsonRpcError(
  id: JsonRpcId | undefined,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  const error: JsonRpcError = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: "2.0", id: id ?? null, error };
}
