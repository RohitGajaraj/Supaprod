/**
 * P-82: `@lovable.dev/mcp-js`'s own Vite plugin (`mcpPlugin`, `vite.config.ts`)
 * regenerates four route files on every `configResolved`/`buildStart`
 * (`src/routes/mcp.ts`, `[.mcp]/list-tools.ts`, `[.mcp]/invoke-tool/$tool.ts`,
 * `[.well-known]/oauth-protected-resource.ts`), always to ONE canonical
 * single-line form. Prettier's `printWidth` (100) used to reformat that line
 * to multi-line on every `bun run format`/`lint --fix` (and whatever
 * reformats a file inside the Lovable editor), so every local build rewrote
 * them back and the diff kept getting requoted -- days of it, per A1's own
 * account in the queue. `.prettierignore` now excludes the four (same
 * precedent as `routeTree.gen.ts` just above them there: the generator is the
 * sole source of truth for a file's exact bytes, so nothing else should
 * reformat it).
 *
 * THIS IS THE CHECK MODE THE PACKET ASKS FOR. The plugin exports no dry-run
 * -- `buildRouteSource`/`writeIfChanged`/`regenerate` are internal to its
 * compiled module, not in its public `export {}` list. So this runs the REAL
 * plugin, for real, against a throwaway temp `projectRoot` (never the repo's
 * own tree -- a check must not be able to write to what it is checking) and
 * diffs what it generates there against the tracked file actually committed.
 * A drift here means either the plugin's own output changed (a dependency
 * bump) or something reformatted a tracked file after the last `bun run
 * build` and forgot to run it again -- both are exactly the case this guard
 * exists to catch before it becomes another multi-day requote war.
 */
import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mcpPlugin from "@lovable.dev/mcp-js/stacks/tanstack/vite";

const REPO_ROOT = join(import.meta.dir, "..", "..");

const TRACKED_FILES = [
  "src/routes/mcp.ts",
  join("src", "routes", "[.mcp]", "list-tools.ts"),
  join("src", "routes", "[.mcp]", "invoke-tool", "$tool.ts"),
  join("src", "routes", "[.well-known]", "oauth-protected-resource.ts"),
] as const;

describe("the four MCP-generated route files match what the generator would write today", () => {
  it("a fresh run of the real plugin, against a throwaway root, produces byte-identical files", () => {
    // A throwaway root, never the repo's own -- `configResolved` calls the
    // plugin's real `regenerate()`, which WRITES. Pointing it at the repo
    // would make a "check" a mutation.
    const tempRoot = mkdtempSync(join(tmpdir(), "mcp-route-check-"));
    try {
      // `mcpEntry` only has to EXIST (the plugin's own `mcpEntryExists` gate) --
      // its content never reaches the generated route files' text, only the
      // import path does, and that path is the same relative shape here as in
      // the real tree.
      mkdirSync(join(tempRoot, "src", "lib", "mcp"), { recursive: true });
      writeFileSync(
        join(tempRoot, "src", "lib", "mcp", "index.ts"),
        "export default {} as never;\n",
      );

      const plugin = mcpPlugin();
      if (typeof plugin.configResolved !== "function") {
        throw new Error(
          "mcpPlugin()'s configResolved hook is not a function (package shape changed)",
        );
      }
      // The hook only reads `config.root`; a bare object is enough to drive it
      // without spinning up a real Vite instance.
      (plugin.configResolved as (config: { root: string }) => void)({ root: tempRoot });

      for (const relPath of TRACKED_FILES) {
        const generated = readFileSync(join(tempRoot, relPath), "utf8");
        const tracked = readFileSync(join(REPO_ROOT, relPath), "utf8");
        expect(generated).toBe(tracked);
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("stays out of .prettierignore's blind spot: every tracked file is actually listed there", () => {
    const ignore = readFileSync(join(REPO_ROOT, ".prettierignore"), "utf8");
    // Prettier's own ignore syntax treats a literal `[` as a glob character
    // class, so the entry has to escape it (`\[.mcp\]`) or it silently
    // matches nothing and the requote war comes back. Checked as text rather
    // than by re-running prettier here, so this test explains WHY it failed
    // rather than just reporting a prettier diff.
    expect(ignore).toContain("src/routes/mcp.ts");
    expect(ignore).toContain(String.raw`src/routes/\[.mcp\]/list-tools.ts`);
    expect(ignore).toContain(String.raw`src/routes/\[.mcp\]/invoke-tool/$tool.ts`);
    expect(ignore).toContain(String.raw`src/routes/\[.well-known\]/oauth-protected-resource.ts`);
  });
});
