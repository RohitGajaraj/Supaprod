/**
 * THE COPY-PASTE SAMPLE TAUGHT A PROTOCOL NO OTHER SERVER ACCEPTS (2026-09-01).
 *
 * Photographed on Settings -> Outside access. The paragraph over the block:
 *
 *     It speaks the native MCP handshake (initialize, tools/list, tools/call)
 *     over JSON-RPC 2.0, so a standards client connects with a pasted bearer
 *     header.
 *
 * The curl printed directly beneath it sent `"method":"search_opportunities"`,
 * which is none of those three.
 *
 * IT WORKED, and that is the whole reason it mattered. `api/mcp.ts` dispatches
 * bare tool names as methods alongside the standard shape, so a developer who
 * pasted it got a 200 and a page of results, concluded the sample was right,
 * and wrote their client against a dialect this server alone speaks. A wrong
 * example that ERRORS costs five minutes. A wrong example that SUCCEEDS costs a
 * rewrite, and nothing in the product would have told them.
 *
 * ── WHAT THIS GUARD PINS, AND WHY IT IS NOT THE STRING ────────────────────
 * Asserting the sample equals a literal would fail the next time the copy
 * improves and pass if somebody swapped the method back to a legacy one. So it
 * parses the JSON body the page actually hands out and runs it through the SAME
 * classifier the endpoint uses, then requires the answer to be one of the three
 * kinds the sentence above it promises. The claim is checked, not the wording.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { classifyMcpRequest } from "@/lib/mcp-protocol";

const SRC = readFileSync(fileURLToPath(new URL("./IntegrationsTab.tsx", import.meta.url)), "utf8");

/** The three the "How to connect" sub-line promises a standards client can use. */
const PROMISED = ["initialize", "tools/list", "tools/call"];

function sampleBody(): Record<string, unknown> {
  // The `-d '...'` line of the curl the page renders and offers a Copy button for.
  const m = SRC.match(/-d '(\{.*?\})'/s);
  if (!m) throw new Error("No JSON body found in the curl sample");
  return JSON.parse(m[1]) as Record<string, unknown>;
}

describe("the sample on Outside access", () => {
  it("is a request the endpoint's own classifier recognises as standard", () => {
    const body = sampleBody();
    const kind = classifyMcpRequest(body as never).kind;
    expect(PROMISED).toContain(kind);
  });

  it("names each of the three methods it promises, so the sentence stays true", () => {
    for (const method of PROMISED) {
      expect(SRC).toContain(method);
    }
  });

  it("carries an id, so the server is required to answer it", () => {
    // Without `id` the request is a NOTIFICATION and the spec forbids a
    // response body. A first curl that correctly returns nothing at all reads
    // exactly like a broken endpoint.
    expect(sampleBody().id).toBeDefined();
  });
});
