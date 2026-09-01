/**
 * A refusal an agent can act on, without reading English.
 *
 * WHY THIS EXISTS. The machine surface answered 429 with the prose "Rate limit
 * exceeded" and no `Retry-After` header at all, so a caller had two options:
 * guess a backoff, or parse a sentence. Both are what a machine surface exists to
 * remove, and guessing is the one that turns a single throttled agent into a retry
 * storm.
 *
 * AND THE FIX WAS DEAD CODE FOR ONE COMMIT. `src/routes/api/mcp.ts` carried a
 * private, byte-for-byte duplicate of `checkRateLimit`, which shadowed the
 * importable one, so improving the shared implementation changed nothing on the
 * live path. Two implementations of one security control, and the live route used
 * the copy. The last block below is the guard against that returning.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MCP_ERROR_CODES } from "./mcp-protocol";

const LIB = import.meta.dir;
const ROUTE = readFileSync(join(LIB, "..", "routes", "api", "mcp.ts"), "utf8");
const AUTH = readFileSync(join(LIB, "mcp-auth.server.ts"), "utf8");

/**
 * `expect(bigFile).toContain(x)` prints the WHOLE FILE when it fails, and these
 * files run to two thousand lines, so a single red assertion buries the run in
 * unreadable output. Learned the hard way while proving this file red. These
 * helpers assert a boolean and carry the explanation themselves.
 */
const has = (hay: string, needle: string, what: string) =>
  expect(hay.includes(needle), `expected to find ${what}`).toBe(true);
const lacks = (hay: string, needle: string, what: string) =>
  expect(hay.includes(needle), `expected NOT to find ${what}`).toBe(false);

describe("the wait is measured, not guessed", () => {
  it("derives the hint from the oldest call in the sliding window", () => {
    // A flat "wait 60 seconds" would be wrong almost always and wrong in the
    // expensive direction: an agent told to wait a minute when a slot frees in
    // three seconds sits idle for fifty-seven.
    has(AUTH, "secondsUntilCapacity", "secondsUntilCapacity");
    has(
      AUTH,
      '.order("created_at", { ascending: true })',
      '.order("created_at", { ascending: true })',
    );
    has(AUTH, "RATE_WINDOW_MS - agedMs", "RATE_WINDOW_MS - agedMs");
  });

  it("never says zero, and never says longer than the window", () => {
    // Retry-After 0 is an invitation to retry inside the same window and be
    // refused again. Nothing in a sliding window takes longer than the window.
    has(
      AUTH,
      "Math.min(fullWindow, Math.max(1, remaining))",
      "Math.min(fullWindow, Math.max(1, remaining))",
    );
  });

  it("keeps the full window when the check itself failed", () => {
    // Fail-closed denies the request, and must not then imply we measured
    // something. Two paths: the query errored, and the whole thing threw.
    const fn = AUTH.slice(AUTH.indexOf("export async function checkRateLimit"));
    const body = fn.slice(0, fn.indexOf("async function secondsUntilCapacity"));
    expect(body.match(/retryAfterSeconds: fullWindow/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("keeps one definition of the window, so the count and the hint agree", () => {
    // A second copy of 60_000 is how a limiter starts counting one window and
    // advising another.
    has(AUTH, "const RATE_WINDOW_MS = 60_000;", "const RATE_WINDOW_MS = 60_000;");
    has(AUTH, "Math.ceil(RATE_WINDOW_MS / 1000)", "Math.ceil(RATE_WINDOW_MS / 1000)");
  });
});

describe("the refusal is typed in every place a caller might read", () => {
  it("sets the Retry-After header, which clients and proxies already honour", () => {
    has(ROUTE, '"Retry-After": String(retryAfter)', '"Retry-After": String(retryAfter)');
  });

  it("repeats the wait in the body, for a client that only parses JSON-RPC", () => {
    has(ROUTE, "retry_after_seconds: retryAfter", "retry_after_seconds: retryAfter");
  });

  it("carries a stable string code, not only the numeric transport code", () => {
    // -32002 is shared by several unrelated conditions, so branching on it is
    // branching on the wrong fact.
    has(ROUTE, "MCP_ERROR_CODES.rateLimited", "MCP_ERROR_CODES.rateLimited");
    has(ROUTE, "MCP_ERROR_CODES.permissionDenied", "MCP_ERROR_CODES.permissionDenied");
  });

  it("keeps those codes in one place, because the value is a contract", () => {
    // A caller writes `=== "rate_limited"` into its own retry logic, so renaming
    // one breaks somebody's client. Add a code, never rename one.
    expect(MCP_ERROR_CODES.rateLimited).toBe("rate_limited");
    expect(MCP_ERROR_CODES.permissionDenied).toBe("permission_denied");
  });

  it("still answers 429 rather than dressing a refusal as success", () => {
    has(ROUTE, "status: 429", "status: 429");
  });
});

describe("one rate limiter, and only one", () => {
  it("the route does not define its own", () => {
    // THE DEFECT THIS PINS. The local copy shadowed the shared one, so the live
    // path used the duplicate and a fix to the shared function was inert.
    lacks(ROUTE, "async function checkRateLimit(", "async function checkRateLimit(");
  });

  it("the route imports the shared one", () => {
    has(
      ROUTE,
      'import { checkRateLimit } from "@/lib/mcp-auth.server"',
      'import { checkRateLimit } from "@/lib/mcp-auth.server"',
    );
  });

  it("the shared one is the only definition anywhere", () => {
    has(AUTH, "export async function checkRateLimit(", "export async function checkRateLimit(");
  });

  it("records the duplication that is still open", () => {
    // validateToken exists twice as well, here and in mcp-auth.server.ts, where
    // the A2A routes use the shared one. Collapsing it is an auth change and
    // wants its own pass; leaving it unnamed is how it survives another audit.
    has(ROUTE, "STILL DUPLICATED", "STILL DUPLICATED");
    has(ROUTE, "validateToken", "validateToken");
  });
});
