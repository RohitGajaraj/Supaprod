/**
 * A retried write does not become a second write.
 *
 * WHY THIS EXISTS. Not one of the six governed write tools was idempotent, so
 * `record_decision` called twice made two decisions, `draft_spec` twice made two
 * specs, and `settle_outcome` twice settled twice. An agent retries on a timeout,
 * and a timeout is precisely the case where it cannot know whether the first call
 * landed, so the retry is correct behaviour and the duplicate was ours.
 *
 * `withIdempotency` had existed for months and was used on nine INTERNAL tool
 * paths. No external write ever reached it. That is the reachability shape again:
 * the helper is right, the helper is tested, and the surface that most needed it
 * never called it.
 *
 * WHAT IS PINNED HERE. The parameter is discoverable, because an agent cannot use
 * one it cannot see in `tools/list`. The key is scoped so it cannot collide
 * across tools or leak across workspaces. A refusal is not cached, because
 * caching one turns a transient failure into a permanent one for that key. And
 * the replay is reported, in the reply and in the audit trail.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MCP_WRITE_TOOLS, MCP_WRITE_TOOL_NAMES, WRITE_SCOPE_BY_TOOL } from "./mcp-protocol";

const ROUTE = readFileSync(join(import.meta.dir, "..", "routes", "api", "mcp.ts"), "utf8");

describe("every governed write can be made safe to retry", () => {
  it("offers the key on every write tool, with no exceptions", () => {
    // Applied to the SET rather than by hand six times, because a hand-kept
    // second list in this very file fell a founder ruling behind and left three
    // built write tools impossible to authorize.
    expect(MCP_WRITE_TOOLS.length).toBeGreaterThan(0);
    for (const tool of MCP_WRITE_TOOLS) {
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props.idempotency_key).toBeTruthy();
    }
  });

  it("covers every tool the scope map governs, so a seventh cannot slip through", () => {
    // The two lists must agree. If a write tool exists in one and not the other,
    // something is either unauthorizable or unprotected.
    expect([...MCP_WRITE_TOOL_NAMES].sort()).toEqual(Object.keys(WRITE_SCOPE_BY_TOOL).sort());
  });

  it("describes it as optional, and says what repeating a call does", () => {
    // A parameter an agent cannot understand from `tools/list` alone is one it
    // will not use. Requiring it would break every existing caller.
    const props = MCP_WRITE_TOOLS[0].inputSchema.properties as Record<
      string,
      { description?: string }
    >;
    const d = props.idempotency_key.description ?? "";
    expect(d.toLowerCase()).toContain("optional");
    expect(d).toContain("idempotent_replay");
    for (const tool of MCP_WRITE_TOOLS) {
      // And it is never required, on any of them.
      expect(tool.inputSchema.required ?? []).not.toContain("idempotency_key");
    }
  });

  it("leaves the read tools alone", () => {
    // A read is already repeatable. Adding the parameter there would be noise in
    // a catalogue an agent has to read on every session.
    const { MCP_TOOLS } = require("./mcp-protocol") as typeof import("./mcp-protocol");
    for (const tool of MCP_TOOLS) {
      const props = (tool.inputSchema.properties ?? {}) as Record<string, unknown>;
      expect(props.idempotency_key).toBeUndefined();
    }
  });
});

describe("how the key is scoped, which is where the leaks would be", () => {
  it("scopes by tool, so one request id across two tools is two writes", () => {
    // Without the tool in the scope, an agent reusing one request id for
    // record_decision and then draft_spec would get the decision's stored result
    // back from the spec call.
    expect(ROUTE).toContain("`mcp:${toolName}`");
  });

  it("scopes by workspace, so a key can never return another tenant's payload", () => {
    // This is the one that matters most. A shared key namespace would be a
    // cross-tenant read through a cache rather than through a query, which no RLS
    // policy would catch.
    expect(ROUTE).toContain("`${workspace_id}:${key}`");
  });

  it("bounds the key, because it becomes half a unique index entry", () => {
    expect(ROUTE).toContain("rawKey.slice(0, 200)");
  });

  it("behaves exactly as before when no key is given", () => {
    // Absent must mean "today's behaviour", not "an empty-string key shared by
    // every caller who omitted it", which would make unrelated writes collide.
    expect(ROUTE).toContain("if (!key) return runWriteTool(");
  });
});

describe("what is remembered, and what deliberately is not", () => {
  it("never caches a refusal", () => {
    // withIdempotency stores whatever its callback returns. Returning a failure
    // through it would cache the failure, so the retry the caller is entitled to
    // would replay the same error forever. Throwing means nothing is stored.
    expect(ROUTE).toContain("if (!r.success) throw new Error(");
  });

  it("converts that throw back into a refusal rather than a crash", () => {
    const wrapper = ROUTE.slice(
      ROUTE.indexOf("async function dispatchWriteTool"),
      ROUTE.indexOf("async function runWriteTool"),
    );
    expect(wrapper).toContain("catch (err)");
    expect(wrapper).toContain("success: false");
  });

  it("tells the caller it was a replay", () => {
    expect(ROUTE).toContain("idempotent_replay: true");
    expect(ROUTE).toContain("cached ? { ...result, idempotent_replay: true } : result");
  });

  it("tells the audit trail too, so one write is not logged as two", () => {
    // Without this a retried call logs a second successful write and anybody
    // counting agent activity off api_calls counts the retry as work.
    // Anchored on the WRITE log specifically. The first `tool_name:
    // dispatch.toolName` in this route belongs to the permission-denied log,
    // which is a different call and must not carry a replay flag.
    const anchor = ROUTE.indexOf('result: writeResult.success ? "success" : "error"');
    expect(anchor).toBeGreaterThan(-1);
    expect(ROUTE.slice(anchor, anchor + 1200)).toContain("writeResult.idempotent_replay ? { idempotent_replay: true }");
  });
});
