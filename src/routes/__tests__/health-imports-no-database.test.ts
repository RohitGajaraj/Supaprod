/**
 * P-58 (A-QUEUE.md). `/health` exists to be pinged every four minutes purely
 * to keep the Worker's isolate warm, and the whole point is that it costs
 * nothing beyond CPU: a database round trip on every ping would spend real
 * DB load fixing a cold-start problem. `@/routes/api/public/health.ts` is
 * the READINESS check and is deliberately not this route -- see this file's
 * own header for why the two must not merge.
 *
 * This reads the route's own SOURCE rather than trusting a runtime probe,
 * because the failure mode is a future edit adding "just one more read" to
 * the handler: a passing response does not prove the import list stayed
 * clean, and the import list is the actual guarantee this route makes.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { Route } from "../health";

const SRC = readFileSync("src/routes/health.ts", "utf8");

/** Every module this file imports from, ignoring the comment prose that
 *  names other files by path (the header above names both health routes). */
function importPaths(src: string): string[] {
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
  return [...stripped.matchAll(/^import\s.*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
}

describe("/health imports nothing that reaches a database", () => {
  const imports = importPaths(SRC);

  it("imports only the router, nothing from integrations, lib functions, or Supabase", () => {
    expect(imports.length).toBeGreaterThan(0);
    for (const path of imports) {
      expect(path).not.toMatch(/supabase/i);
      expect(path).not.toContain("integrations");
      expect(path).not.toMatch(/\.functions/);
      expect(path).not.toContain("/lib/");
    }
  });

  it("names its sibling readiness route rather than reusing its probes", () => {
    // The guard against merging the two: this route's own header must keep
    // naming the readiness check as the reason it stays separate, so a future
    // edit that quietly imports its probes cannot slip past a reader either.
    expect(SRC).toContain("api/public/health.ts");
    expect(SRC).not.toContain("probeDatabase");
    expect(SRC).not.toContain("probeCronPulse");
  });
});

describe("/health answers ok with the deployed version, nothing else", () => {
  it("returns 200, ok:true, and the version id when the env carries one", async () => {
    process.env.CF_VERSION_METADATA_ID = "test-sha-123";
    try {
      const handler = Route.options.server?.handlers as { GET: () => Promise<Response> };
      const res = await handler.GET();
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean; sha: string | null };
      expect(body).toEqual({ ok: true, sha: "test-sha-123" });
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    } finally {
      delete process.env.CF_VERSION_METADATA_ID;
    }
  });

  it("answers sha:null rather than throwing when the env carries none", async () => {
    delete process.env.CF_VERSION_METADATA_ID;
    const handler = Route.options.server?.handlers as { GET: () => Promise<Response> };
    const res = await handler.GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; sha: string | null };
    expect(body).toEqual({ ok: true, sha: null });
  });
});
