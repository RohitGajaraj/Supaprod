import { MCP_ERROR_CODES } from "@/lib/mcp-protocol";
import { checkRateLimit } from "@/lib/mcp-auth.server";
import { withIdempotency } from "@/lib/runtime/idempotency.server";
import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  searchSignals,
  searchOpportunities,
  searchDecisions,
  searchPRDs,
  getPRD,
  getArdDocument,
  getRoadmap,
  exportSkillpack,
  outcomeHistory,
  ingestSignal,
  recordDecision,
  draftSpec,
  settleOutcome,
  recordForecast,
  settleForecastViaMcp,
  listDueForecastsForAgent,
  logMCPCall,
  classifyWriteAudit,
} from "@/lib/mcp.functions";
import { getGoverningDecision, getContradictionHistory } from "@/lib/ai/mcp-brain.server";
import {
  buildInitializeResult,
  buildToolCallResult,
  buildToolsListResult,
  canCallWriteTool,
  classifyMcpRequest,
  isWriteTool,
  jsonRpcError,
  jsonRpcResult,
  JSONRPC_INVALID_REQUEST,
  SUPPORTED_PROTOCOL_VERSIONS,
} from "@/lib/mcp-protocol";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
} as const;

/**
 * Q1-MCP · Model Context Protocol (MCP) server — Phase 2.
 *
 * External agents (Claude with MCP, other AI frameworks) call Supaprod to:
 * - Read signals / opportunities / decisions (search)
 * - Read a PRD (fetch) and the roadmap
 * - Export a versioned decision-lessons skill pack
 *
 * The server is READ-ONLY; the decision-WRITE half is founder-gated (Phase 4b).
 * All calls are authenticated via bearer token, rate-limited, and audited.
 *
 * Spec: https://modelcontextprotocol.io/specification
 */

interface MCPRequest {
  jsonrpc: string;
  method: string;
  params?: Record<string, unknown>;
  id?: string | number;
}

interface MCPResponse {
  jsonrpc: string;
  result?: unknown;
  error?: { code: number; message: string };
  id?: string | number;
}

interface TokenRow {
  id: string;
  workspace_id: string;
  user_id: string;
  rate_limit_per_min: number;
  revoked_at: string | null;
  scopes: string[] | null;
}

interface TokenValidationResult {
  valid: boolean;
  token_id?: string;
  workspace_id?: string;
  user_id?: string;
  rate_limit_per_min?: number;
  scopes?: string[];
  error?: string;
}

/**
 * Validate an MCP bearer token against the mcp_tokens table.
 * Returns token_id, workspace_id, and rate limit if valid.
 */
async function validateToken(
  supabase: any,
  slug: string,
  secretHash: string,
): Promise<TokenValidationResult> {
  // INTEROP-V11 Q2: `scopes` is the only column added by migration 20260625140000.
  // The select MUST degrade gracefully — in the Lovable/Workers split-deploy model
  // the worker can land before the migration applies, and an unconditional select
  // of a missing column would error and 401 ALL MCP traffic (every READ tool, not
  // just writes). So if `scopes` is absent we re-select without it and default the
  // token to read-only (scopes = []); reads keep working, writes stay impossible.
  const selectToken = (cols: string) =>
    supabase
      .from("mcp_tokens")
      .select(cols)
      .eq("slug", slug)
      .eq("secret_hash", secretHash)
      .is("revoked_at", null)
      .maybeSingle();
  try {
    let { data: token, error } = await selectToken(
      "id, workspace_id, user_id, rate_limit_per_min, revoked_at, scopes",
    );

    if (
      error &&
      (error.code === "42703" || /scopes/i.test(error.message ?? "")) // undefined_column
    ) {
      ({ data: token, error } = await selectToken(
        "id, workspace_id, user_id, rate_limit_per_min, revoked_at",
      ));
    }

    if (error) {
      return { valid: false, error: "Token lookup failed" };
    }

    const tokenRow = token as TokenRow | null;
    if (!tokenRow) {
      return { valid: false, error: "Invalid token" };
    }

    return {
      valid: true,
      token_id: tokenRow.id,
      workspace_id: tokenRow.workspace_id,
      user_id: tokenRow.user_id,
      rate_limit_per_min: tokenRow.rate_limit_per_min,
      scopes: Array.isArray(tokenRow.scopes) ? tokenRow.scopes : [],
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/*
 * checkRateLimit LIVED HERE, AS A SECOND COPY, and that is why it is gone.
 *
 * This file carried a private, byte-for-byte duplicate of
 * `checkRateLimit` from lib/mcp-auth.server.ts, and because the local one
 * shadowed the import-able one, the route used the copy. So a fix applied to the
 * shared implementation changed nothing on the live path: adding an accurate
 * Retry-After hint to the shared function was dead code until this duplicate was
 * removed. Two implementations of one security control is the shape this repo
 * keeps paying for, and a rate limiter is a bad place to keep it.
 *
 * STILL DUPLICATED, and named so the next person can finish it: `validateToken`
 * exists twice as well, here and in lib/mcp-auth.server.ts, where the A2A routes
 * use the shared one. Collapsing that is an auth change and wants its own pass
 * rather than riding along with this one.
 */

/**
 * Dispatch an MCP tool call based on the method name.
 */
async function dispatchTool(
  supabase: any,
  method: string,
  workspace_id: string,
  params: Record<string, unknown>,
  user_id = "",
  origin = "",
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    switch (method) {
      case "search_signals": {
        const query = (params.query as string) || "";
        const limit = Math.min((params.limit as number) || 20, 100);
        const offset = (params.offset as number) || 0;

        const data = await searchSignals(supabase, workspace_id, query, limit, offset);
        return { success: true, data };
      }

      case "search_opportunities": {
        const query = (params.query as string) || "";
        const min_ice = (params.min_ice as number) || 0;
        const limit = Math.min((params.limit as number) || 20, 100);
        const offset = (params.offset as number) || 0;

        const data = await searchOpportunities(
          supabase,
          workspace_id,
          query,
          min_ice,
          limit,
          offset,
        );
        return { success: true, data };
      }

      case "search_decisions": {
        const query = (params.query as string) || "";
        const limit = Math.min((params.limit as number) || 20, 100);
        const offset = (params.offset as number) || 0;

        const data = await searchDecisions(supabase, workspace_id, query, limit, offset);
        return { success: true, data };
      }

      case "search_prds": {
        const query = (params.query as string) || "";
        const status = (params.status as string) || "";
        const limit = Math.min((params.limit as number) || 20, 100);
        const offset = (params.offset as number) || 0;

        const data = await searchPRDs(supabase, workspace_id, query, status, limit, offset);
        return { success: true, data };
      }

      case "get_prd": {
        const prd_id = params.prd_id as string;
        if (!prd_id) {
          return { success: false, error: "Missing required parameter: prd_id" };
        }

        const data = await getPRD(supabase, workspace_id, prd_id);
        return { success: true, data };
      }

      case "get_ard": {
        const prd_id = params.prd_id as string;
        if (!prd_id) {
          return { success: false, error: "Missing required parameter: prd_id" };
        }

        const data = await getArdDocument(supabase, workspace_id, prd_id, origin);
        return { success: true, data };
      }

      case "get_roadmap": {
        const limit = typeof params.limit === "number" ? params.limit : undefined;
        const data = await getRoadmap(supabase, workspace_id, limit);
        return { success: true, data };
      }

      case "export_skillpack": {
        // Optional `limit`; exportSkillpack clamps it into [1, 500].
        const limit = typeof params.limit === "number" ? params.limit : undefined;
        const data = await exportSkillpack(supabase, workspace_id, limit);
        return { success: true, data };
      }

      case "outcome_history": {
        const initiative = (params.initiative as string) || "";
        const limit = Math.min((params.limit as number) || 20, 100);
        const data = await outcomeHistory(supabase, workspace_id, initiative, limit);
        return { success: true, data };
      }

      case "get_governing_decision": {
        const topic = params.topic as string;
        if (!topic) return { success: false, error: "Missing required parameter: topic" };
        const limit = Math.min((params.limit as number) || 10, 50);
        const data = await getGoverningDecision(supabase, workspace_id, user_id, topic, limit);
        return { success: true, data };
      }

      case "get_contradiction_history": {
        const topic = params.topic as string;
        if (!topic) return { success: false, error: "Missing required parameter: topic" };
        const limit = Math.min((params.limit as number) || 10, 50);
        const data = await getContradictionHistory(supabase, workspace_id, user_id, topic, limit);
        return { success: true, data };
      }

      // FC-01. A read, so it sits here with the other reads and needs no scope:
      // seeing which of your own calls are overdue is not a privileged action,
      // and gating it would leave a token that may settle a forecast unable to
      // discover which ones are waiting.
      case "list_due_forecasts": {
        const data = await listDueForecastsForAgent(supabase, workspace_id, params);
        return { success: true, data };
      }

      case "tools":
      case "resources":
        // Legacy discovery aliases. The tool catalog lives in mcp-protocol.ts
        // so legacy discovery and the standard tools/list never drift.
        return { success: true, data: buildToolsListResult() };

      default:
        return { success: false, error: `Unknown method: ${method}` };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error };
  }
}

/**
 * Resolve the global outward-write gate (`interop_write_enabled()`). Fails CLOSED:
 * any error returns false, so a DB hiccup can never accidentally open writes.
 */
async function resolveWriteEnabled(supabase: any): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("interop_write_enabled");
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Dispatch a GOVERNED WRITE tool, at most once per idempotency key.
 *
 * WHY THIS WRAPPER EXISTS. Not one write tool was idempotent, so `record_decision`
 * twice made two decisions and `settle_outcome` twice settled twice. An agent
 * retries on a timeout, and a timeout is precisely the case where it cannot know
 * whether the first call landed, so the retry is correct behaviour and the
 * duplicate was ours. `withIdempotency` has existed for months and was used by
 * the INTERNAL tool registry on nine paths; no external write ever reached it.
 *
 * THE KEY IS SCOPED TO THE TOOL AND THE WORKSPACE, and both halves are
 * load-bearing. Tool-scoping means an agent reusing one request id across
 * `record_decision` and `draft_spec` gets two writes rather than the second
 * silently returning the first's result. Workspace-scoping means a key from one
 * workspace can never return another workspace's stored payload, which would be
 * a cross-tenant read through a cache rather than through a query.
 *
 * ONLY SUCCESS IS REMEMBERED. `withIdempotency` stores whatever its callback
 * returns, so returning a failure through it would cache the failure and make a
 * transient error permanent for that key: the retry the caller is entitled to
 * would replay the error forever. So a refusal THROWS inside the callback,
 * nothing is stored, and it is converted back to a refusal outside. A caller that
 * retries after a genuine failure genuinely retries.
 */
async function dispatchWriteTool(
  supabase: any,
  toolName: string,
  workspace_id: string,
  user_id: string,
  params: Record<string, unknown>,
): Promise<{ success: boolean; data?: unknown; error?: string; idempotent_replay?: boolean }> {
  const rawKey = typeof params.idempotency_key === "string" ? params.idempotency_key.trim() : "";
  // Bounded, because it becomes half a UNIQUE index entry. Long enough for a
  // uuid or a hash, short enough that a pathological caller cannot bloat the
  // table one row at a time.
  const key = rawKey.slice(0, 200);
  if (!key) return runWriteTool(supabase, toolName, workspace_id, user_id, params);

  try {
    const { result, cached } = await withIdempotency(
      supabase,
      `mcp:${toolName}`,
      `${workspace_id}:${key}`,
      user_id,
      null,
      async () => {
        const r = await runWriteTool(supabase, toolName, workspace_id, user_id, params);
        // Never cache a refusal. See the header.
        if (!r.success) throw new Error(r.error ?? "write refused");
        return r;
      },
    );
    // SAID OUT LOUD, because "I already did this" and "I just did this" are
    // different facts and an agent deciding what to do next needs to tell them
    // apart. A machine surface that answers identically to both is asking the
    // caller to guess.
    return cached ? { ...result, idempotent_replay: true } : result;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function runWriteTool(
  supabase: any,
  toolName: string,
  workspace_id: string,
  user_id: string,
  params: Record<string, unknown>,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    switch (toolName) {
      case "ingest_signal": {
        const data = await ingestSignal(supabase, workspace_id, user_id, params);
        return { success: true, data };
      }
      // Founder ruling 2026-08-10. Each is scope-gated separately in
      // WRITE_SCOPE_BY_TOOL, re-checked at dispatch by canCallWriteTool, and
      // audited into api_calls with its real tool name.
      case "record_decision": {
        const data = await recordDecision(supabase, workspace_id, user_id, params);
        return { success: true, data };
      }
      case "draft_spec": {
        const data = await draftSpec(supabase, workspace_id, user_id, params);
        return { success: true, data };
      }
      case "settle_outcome": {
        const data = await settleOutcome(supabase, workspace_id, user_id, params);
        return { success: true, data };
      }
      // FC-01, 2026-08-14. Two scopes rather than one: stating a belief and
      // grading it are different permissions, and a token that may do the first
      // must not thereby be able to mark its own prediction correct.
      case "record_forecast": {
        const data = await recordForecast(supabase, workspace_id, user_id, params);
        return { success: true, data };
      }
      case "settle_forecast": {
        const data = await settleForecastViaMcp(supabase, workspace_id, user_id, params);
        return { success: true, data };
      }
      default:
        return { success: false, error: `Unknown write tool: ${toolName}` };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startTime = Date.now();
        let mcpReq: MCPRequest = { jsonrpc: "2.0", method: "unknown" };
        let token_id: string | undefined;
        let workspace_id: string | undefined;

        try {
          // 1. Parse the MCP request
          const body = await request.json().catch(() => ({}));
          mcpReq = {
            jsonrpc: (body as any).jsonrpc || "2.0",
            method: (body as any).method || "unknown",
            params: (body as any).params,
            id: (body as any).id,
          };

          // 1b. Classify the request (pure; no auth/DB). MCP notifications
          //     (e.g. notifications/initialized) carry no id and MUST get no
          //     response body, so acknowledge with 202 before any auth/DB work.
          const dispatch = classifyMcpRequest(mcpReq);
          if (dispatch.kind === "notification") {
            return new Response(null, {
              status: 202,
              headers: { "Access-Control-Allow-Origin": "*" },
            });
          }

          // 1c. Transport: reject a pinned MCP-Protocol-Version we cannot speak
          //     (Streamable HTTP MUST). Absent is lenient (negotiated at
          //     initialize); a well-behaved client only ever pins a version we
          //     returned, so this fires only for a broken client.
          const pinnedVersion = request.headers.get("mcp-protocol-version");
          if (
            pinnedVersion &&
            !(SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(pinnedVersion)
          ) {
            return new Response(
              JSON.stringify(
                jsonRpcError(
                  mcpReq.id,
                  JSONRPC_INVALID_REQUEST,
                  `Unsupported MCP-Protocol-Version: ${pinnedVersion}`,
                ),
              ),
              { status: 400, headers: JSON_HEADERS },
            );
          }

          // 2. Extract and validate bearer token
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32003, message: "Missing bearer token" },
                id: mcpReq.id,
              } as MCPResponse),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          const token = authHeader.slice(7); // "Bearer " prefix
          const [slug, secret] = token.split(":");
          if (!slug || !secret) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32003, message: "Invalid token format" },
                id: mcpReq.id,
              } as MCPResponse),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          // 3. Hash the secret and validate token
          const secretHash = crypto.createHash("sha256").update(secret).digest("hex");

          // Create service-role client to validate token (no user context)
          const supabase = createClient(
            process.env.SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            { auth: { persistSession: false } },
          ) as any;

          const validation = await validateToken(supabase, slug, secretHash);
          if (!validation.valid) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32003,
                  message: validation.error || "Invalid token",
                },
                id: mcpReq.id,
              } as MCPResponse),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          token_id = validation.token_id;
          workspace_id = validation.workspace_id;

          if (!token_id || !workspace_id) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32003, message: "Token validation failed" },
                id: mcpReq.id,
              } as MCPResponse),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          // INTEROP-V11 Q2: the token's capability scopes + owner, and a LAZY
          // resolver for the global write gate (one DB call, only when a write
          // tool or tools/list actually needs it, memoized per request).
          const scopes = validation.scopes ?? [];
          const tokenUserId = validation.user_id ?? "";
          let writeEnabledCache: boolean | undefined;
          const getWriteEnabled = async (): Promise<boolean> => {
            if (writeEnabledCache === undefined) {
              writeEnabledCache = await resolveWriteEnabled(supabase);
            }
            return writeEnabledCache;
          };

          // 4. Check rate limit
          const rateLimitResult = await checkRateLimit(
            supabase,
            token_id,
            validation.rate_limit_per_min || 60,
          );

          if (!rateLimitResult.allowed) {
            // Log the rate-limit rejection. For a standard tools/call, audit the
            // REAL tool name (e.g. ingest_signal) + a write flag, not the literal
            // "tools/call" method, so a throttled write flood is attributable.
            const throttledTool =
              dispatch.kind === "tools/call" ? dispatch.toolName : mcpReq.method;
            await logMCPCall(
              {
                token_id,
                workspace_id,
                tool_name: throttledTool,
                result: "rate_limit",
                metadata:
                  dispatch.kind === "tools/call" && isWriteTool(dispatch.toolName)
                    ? { write: true }
                    : undefined,
              },
              supabase,
            );

            /**
             * A REFUSAL AN AGENT CAN ACT ON, rather than a sentence it has to
             * parse.
             *
             * This answered 429 with the prose "Rate limit exceeded" and no
             * Retry-After header at all, so a caller had two options: guess a
             * backoff, or read English. Both are what a machine surface exists to
             * remove, and guessing is the one that turns one throttled agent into
             * a retry storm.
             *
             * THREE THINGS ARE NOW TRUE AT ONCE. The HTTP header carries the wait,
             * because that is what every HTTP client and proxy already knows how
             * to honour without reading a body. `error.data.code` carries a STABLE
             * STRING, because the numeric JSON-RPC code is about transport and
             * -32002 is the same for several conditions, so branching on it is
             * branching on the wrong fact. And the wait is repeated inside the
             * body, since an MCP client that only ever parses JSON-RPC never sees
             * a header.
             *
             * The number is measured, not a constant: it is the time until the
             * oldest call in the sliding window ages out. See checkRateLimit.
             */
            const retryAfter = rateLimitResult.retryAfterSeconds;
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32002,
                  message: `Rate limit exceeded. Retry in ${retryAfter}s.`,
                  data: { code: MCP_ERROR_CODES.rateLimited, retry_after_seconds: retryAfter },
                },
                id: mcpReq.id,
              } as MCPResponse),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Retry-After": String(retryAfter),
                },
              },
            );
          }

          // 5a. Standard MCP methods get spec-correct handlers. Legacy flat
          //     methods (search_signals, etc.) and the legacy tools/resources
          //     discovery fall through to the unchanged block below, so every
          //     existing HTTP caller stays byte-identical.
          if (
            dispatch.kind === "initialize" ||
            dispatch.kind === "ping" ||
            dispatch.kind === "tools/list" ||
            dispatch.kind === "resources/list" ||
            dispatch.kind === "prompts/list"
          ) {
            const result =
              dispatch.kind === "initialize"
                ? buildInitializeResult(dispatch.protocolVersion)
                : dispatch.kind === "tools/list"
                  ? buildToolsListResult(scopes, await getWriteEnabled())
                  : dispatch.kind === "resources/list"
                    ? { resources: [] }
                    : dispatch.kind === "prompts/list"
                      ? { prompts: [] }
                      : {}; // ping
            await logMCPCall(
              {
                token_id,
                workspace_id,
                tool_name: dispatch.kind,
                result: "success",
                metadata: { elapsed_ms: Date.now() - startTime },
              },
              supabase,
            );
            return new Response(JSON.stringify(jsonRpcResult(mcpReq.id, result)), {
              status: 200,
              headers: JSON_HEADERS,
            });
          }

          // 5b. Classification-level errors (unknown method / unknown or
          //     missing tool name). Reported as a JSON-RPC error over HTTP 200
          //     per the MCP-over-HTTP transport (clients read the body).
          if (dispatch.kind === "error") {
            // For a tools/call rejection the method is "tools/call"; record the
            // attempted tool name so the audit trail shows what was probed.
            const attemptedTool =
              typeof mcpReq.params?.name === "string" ? mcpReq.params.name : undefined;
            await logMCPCall(
              {
                token_id,
                workspace_id,
                tool_name: mcpReq.method,
                result: "error",
                error_message: dispatch.error.message,
                metadata: { elapsed_ms: Date.now() - startTime, attempted_tool: attemptedTool },
              },
              supabase,
            );
            return new Response(
              JSON.stringify(jsonRpcError(mcpReq.id, dispatch.error.code, dispatch.error.message)),
              { status: 200, headers: JSON_HEADERS },
            );
          }

          // 5c. Standard tools/call: dispatch the named tool, then wrap the
          //     output in the MCP content envelope. Tool EXECUTION errors are
          //     reported in the result (isError) so a calling model sees them,
          //     not as a JSON-RPC protocol error.
          if (dispatch.kind === "tools/call") {
            // INTEROP-V11 Q2: a GOVERNED WRITE tool needs BOTH the global gate ON
            // and the token's required scope. Re-checked here at call time (not
            // just hidden from tools/list) so a token that guesses the name is
            // still refused. Every denial is audited as permission_denied.
            if (isWriteTool(dispatch.toolName)) {
              const authz = canCallWriteTool(dispatch.toolName, scopes, await getWriteEnabled());
              if (!authz.allowed) {
                await logMCPCall(
                  {
                    token_id,
                    workspace_id,
                    tool_name: dispatch.toolName,
                    result: "permission_denied",
                    error_message: authz.reason,
                    metadata: { elapsed_ms: Date.now() - startTime, write: true },
                  },
                  supabase,
                );
                // Typed alongside the sentence, for the same reason as the 429
                // above: a caller deciding whether to ask a human for a wider
                // scope, or to stop trying, must not have to read English to tell
                // which refusal this is.
                const denied = buildToolCallResult(
                  {
                    code: MCP_ERROR_CODES.permissionDenied,
                    message: authz.reason ?? "Permission denied",
                  },
                  true,
                );
                return new Response(JSON.stringify(jsonRpcResult(mcpReq.id, denied)), {
                  status: 200,
                  headers: JSON_HEADERS,
                });
              }
              const writeResult = await dispatchWriteTool(
                supabase,
                dispatch.toolName,
                workspace_id,
                tokenUserId,
                dispatch.args,
              );
              // THE PAYLOAD DECIDES WHAT THE TRAIL SAYS, not the absence of a
              // throw. This line used to be `writeResult.success ? "success" :
              // "error"`, and `runWriteTool` returns `success: true` for any
              // non-throwing tool -- including the seven refusals that report
              // themselves in the payload instead. Measured in production:
              // api_calls e8cf280c, 2026-08-10 15:15:01, `record_decision /
              // success / error_message null / write: true`, against 0 rows in
              // `decisions where source_kind = 'mcp'`. The only governed write
              // this surface has ever logged as a success wrote nothing, and the
              // row was identical in every audited field to one that had.
              // classifyWriteAudit owns the rules and the reasoning.
              const writeAudit = classifyWriteAudit(writeResult);
              await logMCPCall(
                {
                  token_id,
                  workspace_id,
                  tool_name: dispatch.toolName,
                  result: writeAudit.result,
                  // A thrown refusal already carries its own sentence; a returned
                  // one gets the classifier's. Never both, and never neither.
                  error_message: writeResult.error ?? writeAudit.reason ?? undefined,
                  // THE TRAIL HAS TO KNOW IT WAS A REPLAY. Without this a
                  // retried call logs a second successful write, so the audit
                  // record shows two writes where one happened, and anybody
                  // counting agent activity off api_calls counts the retry as
                  // work. The flag is the difference between "it did this twice"
                  // and "it asked twice and we did it once".
                  //
                  // `write: true` MEANS "THIS WAS A WRITE TOOL", which is a fact
                  // about the catalogue and not about what happened, so it could
                  // not be reused to answer the only question that matters here.
                  // `wrote` is the answer: did a row change on this call.
                  // `row_id` is what changed, so the claim can be checked rather
                  // than believed.
                  metadata: {
                    elapsed_ms: Date.now() - startTime,
                    write: true,
                    wrote: writeAudit.wrote,
                    ...(writeAudit.status ? { tool_status: writeAudit.status } : {}),
                    ...(writeAudit.id ? { row_id: writeAudit.id } : {}),
                    ...(writeResult.idempotent_replay ? { idempotent_replay: true } : {}),
                  },
                },
                supabase,
              );
              // THE CALLER IS TOLD, in the payload it already parses. An agent
              // that cannot tell "I already did this" from "I just did this" has
              // to guess, and the guess is what a machine surface exists to
              // remove. Merged into the object when it is one, so an existing
              // caller reading named fields is unaffected; carried beside the
              // value when it is not, rather than being dropped.
              const writeData =
                writeResult.idempotent_replay && writeResult.success
                  ? writeResult.data && typeof writeResult.data === "object" && !Array.isArray(writeResult.data)
                    ? { ...(writeResult.data as Record<string, unknown>), idempotent_replay: true }
                    : { result: writeResult.data, idempotent_replay: true }
                  : writeResult.data;
              const writeEnvelope = buildToolCallResult(
                writeResult.success ? writeData : (writeResult.error ?? "Tool execution failed"),
                !writeResult.success,
              );
              return new Response(JSON.stringify(jsonRpcResult(mcpReq.id, writeEnvelope)), {
                status: 200,
                headers: JSON_HEADERS,
              });
            }

            const callResult = await dispatchTool(
              supabase,
              dispatch.toolName,
              workspace_id,
              dispatch.args,
              tokenUserId,
              new URL(request.url).origin,
            );
            await logMCPCall(
              {
                token_id,
                workspace_id,
                tool_name: dispatch.toolName,
                result: callResult.success ? "success" : "error",
                error_message: callResult.error,
                metadata: { elapsed_ms: Date.now() - startTime },
              },
              supabase,
            );
            const envelope = buildToolCallResult(
              callResult.success ? callResult.data : (callResult.error ?? "Tool execution failed"),
              !callResult.success,
            );
            return new Response(JSON.stringify(jsonRpcResult(mcpReq.id, envelope)), {
              status: 200,
              headers: JSON_HEADERS,
            });
          }

          // 5. Dispatch the tool (legacy flat-method path, unchanged)
          const toolResult = await dispatchTool(
            supabase,
            mcpReq.method,
            workspace_id,
            mcpReq.params || {},
            tokenUserId,
            new URL(request.url).origin,
          );

          // 6. Log the call (success or failure)
          const elapsedMs = Date.now() - startTime;
          await logMCPCall(
            {
              token_id,
              workspace_id,
              tool_name: mcpReq.method,
              result: toolResult.success ? "success" : "error",
              error_message: toolResult.error,
              metadata: {
                elapsed_ms: elapsedMs,
              },
            },
            supabase,
          );

          if (!toolResult.success) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32603,
                  message: toolResult.error || "Tool execution failed",
                },
                id: mcpReq.id,
              } as MCPResponse),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          // 7. Return success response
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              result: toolResult.data,
              id: mcpReq.id,
            } as MCPResponse),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            },
          );
        } catch (err) {
          const internalError = err instanceof Error ? err.message : "Unknown error";
          console.error("[mcp]", internalError);
          const error = "internal error";

          // Attempt to log the error
          if (token_id && workspace_id) {
            const supabase = createClient(
              process.env.SUPABASE_URL || "",
              process.env.SUPABASE_SERVICE_ROLE_KEY || "",
              { auth: { persistSession: false } },
            ) as any;
            await logMCPCall(
              {
                token_id,
                workspace_id,
                tool_name: mcpReq.method,
                result: "error",
                error_message: internalError,
              },
              supabase,
            );
          }

          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32603, message: error },
              id: mcpReq.id,
            } as MCPResponse),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },

      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
          },
        }),
    },
  },
});
