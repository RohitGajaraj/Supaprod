// Route inventory (cleanup sweep 2026-07-11): every PUBLIC route must be
// reachable from somewhere inside the app. A public page nobody links to is
// either dead weight or a broken funnel (the /trust incident: a page that
// shipped and then silently fell out of every footer). This test statically
// greps the src tree and fails when a public route file has zero inbound
// references from any other src file.
//
// Deliberately grep-based and synchronous: no router import, no rendering,
// deterministic, and fast enough to run in every suite.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..");
const ROUTES_DIR = join(SRC, "routes");

// Public routes that legitimately have no inbound link, each with the reason.
// Add here ONLY with a reason; an empty reason should fail review.
const EXEMPT: Record<string, string> = {
  "/trust": "redirect-only stub (301 to /security); kept because URLs are forever",
  "/p/teardown": "no-signup public demo (RPT-03) linked via external marketing/discovery, not internal nav",
};

/** Top-level public route files: not _authenticated/_root, not api/, not
 *  index (the site entry), not bracket-escaped externally-entered routes
 *  (the Lovable OAuth consent screen), not .ts server routes (mcp). */
function publicRouteFiles(): string[] {
  return readdirSync(ROUTES_DIR).filter((f) => {
    if (!f.endsWith(".tsx")) return false;
    if (f.startsWith("_") || f.startsWith("[")) return false;
    if (f === "index.tsx" || f === "routeTree.gen.ts") return false;
    return statSync(join(ROUTES_DIR, f)).isFile();
  });
}

/** "checkout.return.tsx" -> "/checkout/return"; "p.$slug.tsx" -> "/p/$slug". */
function routePath(file: string): string {
  return (
    "/" +
    file
      .replace(/\.tsx$/, "")
      .split(".")
      .join("/")
  );
}

/** The strings whose presence in another file counts as an inbound link. */
function needles(path: string): string[] {
  const dollar = path.indexOf("$");
  if (dollar === -1) return [path];
  const prefix = path.slice(0, dollar);
  // to="/p/$slug" (router link) or `/p/${slug}` (built URL) both count.
  return [path, prefix + "${"];
}

/** True when `content` contains `needle` NOT followed by a route-ish char,
 *  so "/demo" never matches "/demos" or "/demo-x". Template needles end in
 *  "${" and are matched as plain substrings. */
function containsRef(content: string, needle: string): boolean {
  if (needle.endsWith("${")) return content.includes(needle);
  let from = 0;
  for (;;) {
    const i = content.indexOf(needle, from);
    if (i === -1) return false;
    const after = content[i + needle.length];
    if (after === undefined || !/[a-zA-Z0-9_-]/.test(after)) return true;
    from = i + 1;
  }
}

/** Every src .ts/.tsx file except generated output and the macOS " 2" dupes. */
function corpusFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.endsWith(" 2") || entry.name === "node_modules") continue;
      corpusFiles(full, out);
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      entry.name !== "routeTree.gen.ts"
    ) {
      out.push(full);
    }
  }
  return out;
}

describe("route inventory - every public route has an inbound link", () => {
  const files = publicRouteFiles();

  test("the inventory itself is non-trivial (the routes dir moved or emptied?)", () => {
    expect(files.length).toBeGreaterThan(5);
    // Canary peers named in the sweep order: these must exist as public routes.
    const paths = files.map(routePath);
    for (const p of ["/proof", "/security", "/privacy", "/subprocessors", "/demo"]) {
      expect(paths).toContain(p);
    }
  });

  const corpus = corpusFiles(SRC).map((f) => ({ file: f, content: readFileSync(f, "utf8") }));

  for (const file of files) {
    const path = routePath(file);
    if (EXEMPT[path]) continue;
    test(`${path} (${file}) is linked from at least one other src file`, () => {
      const own = join(ROUTES_DIR, file);
      const ns = needles(path);
      const hit = corpus.some((c) => c.file !== own && ns.some((n) => containsRef(c.content, n)));
      expect(hit).toBe(true);
    });
  }

  test("exempt routes still exist (delete the exemption when the route goes)", () => {
    const paths = files.map(routePath);
    for (const p of Object.keys(EXEMPT)) expect(paths).toContain(p);
  });
});
