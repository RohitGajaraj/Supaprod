import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Source assertions for approvals.queue, the crew's read door into its own
 * pending gates. Same convention as the brain/prd/ship read-tool tests: the
 * registry's middleware'd defs are not invokable without a request context, so
 * what source assertions cannot prove at runtime is stated here rather than
 * claimed. The blast-radius tables are asserted live (they are plain objects).
 */
const SRC = readFileSync(join(import.meta.dir, "..", "registry.server.ts"), "utf8");

function toolBlock(name: string): string {
  const start = SRC.indexOf(`name: "${name}"`);
  expect(start).toBeGreaterThan(-1);
  const end = SRC.indexOf("});", start);
  expect(end).toBeGreaterThan(start);
  return SRC.slice(start, end);
}

describe("approvals.queue is a read, scoped from context", () => {
  const block = toolBlock("approvals.queue");

  test("registered as a read", () => {
    expect(block).toContain('category: "read"');
  });

  test("no write verb anywhere in its body", () => {
    expect(block).not.toMatch(/\.(insert|update|delete|upsert)\(/);
  });

  test("scopes by workspace from context and refuses without one", () => {
    expect(block).toContain("if (!workspaceId)");
    expect(block).toContain('.eq("workspace_id", workspaceId)');
    expect(block).not.toContain('eq("user_id"');
    expect(block).not.toContain("workspace_id: z");
  });

  test("pending by default, decided on request", () => {
    expect(block).toContain("include_decided");
    expect(block).toContain('.eq("status", "pending")');
  });

  test("carries the why: rationale and the person's decision reason", () => {
    expect(block).toContain("rationale");
    expect(block).toContain("decision_reason");
  });

  test("the defaults table knows it, or fail-closed demotes it", async () => {
    const mod = await import("../defaults");
    expect((mod.TOOL_DEFAULTS as Record<string, unknown>)["approvals.queue"]).toBeDefined();
  });
});
