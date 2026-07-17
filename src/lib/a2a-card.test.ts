import { describe, it, expect } from "bun:test";
import {
  buildAgentCard,
  buildOAuthProtectedResourceMetadata,
  AGENT_CARD_CORS_HEADERS,
  AGENT_CARD_VERSION,
  AGENT_CARD_SCHEMA_VERSION,
} from "./a2a-card";

// buildAgentCard is the machine-readable A2A/MCP contract published at
// /.well-known/agent.json AND served from src/server.ts's well-known handler
// (comment: "Shared between the card route AND the server.ts well-known
// handler so the two representations never drift"). Anything wrong here is a
// silent breakage for every peer agent that discovers Supaprod, so the tests
// pin the shape, not just "it returns an object".

describe("buildAgentCard", () => {
  const origin = "https://app.example.com";
  const card = buildAgentCard(origin);

  it("stamps the fixed identity fields", () => {
    expect(card.name).toBe("Supaprod");
    expect(card.slug).toBe("supaprod");
    expect(card.version).toBe(AGENT_CARD_VERSION);
    expect((card.provider as Record<string, unknown>).organization).toBe("Supaprod");
  });

  it("derives every endpoint from the given origin, never hardcoding a host", () => {
    const endpoints = card.endpoints as Record<string, string>;
    for (const url of Object.values(endpoints)) {
      expect(url.startsWith(origin)).toBe(true);
    }
    expect(endpoints.message_send).toBe(`${origin}/api/public/a2a/message/send`);
    expect(endpoints.mcp).toBe(`${origin}/api/mcp`);
  });

  it("exposes the write tool with its required scope, and only that scope", () => {
    const mcp = card.mcp as { write_tools: Array<{ name: string; required_scope: string }> };
    expect(mcp.write_tools).toEqual([{ name: "ingest_signal", required_scope: "write:signal" }]);
  });

  it("declares the read tools as a flat list of strings", () => {
    const mcp = card.mcp as { read_tools: string[] };
    expect(Array.isArray(mcp.read_tools)).toBe(true);
    expect(mcp.read_tools).toContain("search_signals");
    expect(mcp.read_tools.every((t) => typeof t === "string")).toBe(true);
  });

  it("requires approval for destructive actions and filters PII on egress", () => {
    const policies = card.policies as Record<string, unknown>;
    expect(policies.destructive_actions_require_approval).toBe(true);
    expect(policies.pii_egress_filtered).toBe(true);
    expect(policies.writes_require_scope_and_gate).toBe(true);
  });

  it("uses the same schema_version constant the module exports", () => {
    expect(card.schema_version).toBe(AGENT_CARD_SCHEMA_VERSION);
  });

  it("handles an origin with no trailing slash consistently (no double slashes)", () => {
    const endpoints = buildAgentCard("http://localhost:3000").endpoints as Record<string, string>;
    expect(endpoints.tasks).not.toContain("//api");
  });

  it("handles an empty origin without throwing (endpoints degrade to root-relative paths)", () => {
    expect(() => buildAgentCard("")).not.toThrow();
    const endpoints = buildAgentCard("").endpoints as Record<string, string>;
    expect(endpoints.mcp).toBe("/api/mcp");
  });
});

describe("buildOAuthProtectedResourceMetadata", () => {
  it("echoes the origin as the resource identifier", () => {
    const meta = buildOAuthProtectedResourceMetadata("https://app.example.com");
    expect(meta.resource).toBe("https://app.example.com");
  });

  it("advertises bearer-header auth and the two supported scopes", () => {
    const meta = buildOAuthProtectedResourceMetadata("https://app.example.com");
    expect(meta.bearer_methods_supported).toEqual(["header"]);
    expect(meta.scopes_supported).toEqual(["read", "write:signal"]);
  });

  it("declares no authorization servers (this resource issues no tokens itself)", () => {
    const meta = buildOAuthProtectedResourceMetadata("https://app.example.com");
    expect(meta.authorization_servers).toEqual([]);
  });
});

describe("AGENT_CARD_CORS_HEADERS", () => {
  it("is publicly readable JSON with a short cache window", () => {
    expect(AGENT_CARD_CORS_HEADERS["Content-Type"]).toBe("application/json");
    expect(AGENT_CARD_CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
    expect(AGENT_CARD_CORS_HEADERS["Cache-Control"]).toContain("max-age=300");
  });
});
