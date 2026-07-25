// The anti-rot gate on the room's URL shape.
//
// The workspace slug is the FIRST segment of /$workspaceSlug/$productSlug, so
// it shares a namespace with every public page, every authenticated surface,
// and every file served out of public/. TanStack Router scores a static first
// segment above a dynamic one, so an existing URL can never break; the failure
// runs the other way. A workspace slugged "login" or "fonts" would still exist,
// still hold data, and simply be UNREACHABLE, with no error anywhere.
//
// public.reserved_workspace_slugs is where that is enforced (it holds for SQL
// seeds and the console too, not just this app). A list is only as good as the
// thing that keeps it honest: this test derives the live namespace from the
// GENERATED route tree and from public/ on disk, and fails the build the moment
// someone adds a surface without reserving its name. That is the difference
// between a durable answer and a snapshot of one afternoon.
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..", "..");

/** Every first URL segment the router can serve today. */
function routeFirstSegments(): string[] {
  const tree = readFileSync(join(repoRoot, "src", "routeTree.gen.ts"), "utf8");
  const segments = new Set<string>();
  for (const match of tree.matchAll(/fullPath: '([^']*)'/g)) {
    const path = match[1];
    if (!path.startsWith("/")) continue;
    const first = path.split("/")[1];
    // A dynamic first segment IS the workspace slug, not a competitor for it.
    if (!first || first.startsWith("$")) continue;
    segments.add(first);
  }
  return [...segments].sort();
}

/** Everything served from public/, which no route table knows about. */
function staticRootEntries(): string[] {
  return readdirSync(join(repoRoot, "public")).sort();
}

/** The reserved set as the database holds it, read from the migrations that
 * seed it so this test and production cannot disagree. */
function reservedSlugs(): Set<string> {
  const dir = join(repoRoot, "supabase", "migrations");
  const reserved = new Set<string>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".sql")) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    if (!sql.includes("reserved_workspace_slugs")) continue;
    for (const match of sql.matchAll(/\(\s*'([^']+)'\s*,\s*'[^']*'\s*\)/g)) {
      reserved.add(match[1]);
    }
  }
  return reserved;
}

describe("reserved workspace slugs cover the whole root namespace", () => {
  test("the migrations actually seed a list", () => {
    expect(reservedSlugs().size).toBeGreaterThan(100);
  });

  test("every route's first segment is reserved", () => {
    const reserved = reservedSlugs();
    const unreserved = routeFirstSegments().filter((segment) => !reserved.has(segment));
    // Reserve it in a new migration (insert into public.reserved_workspace_slugs)
    // in the same commit that adds the surface.
    expect(unreserved).toEqual([]);
  });

  test("every file served at the root is reserved", () => {
    const reserved = reservedSlugs();
    const unreserved = staticRootEntries().filter((entry) => !reserved.has(entry));
    expect(unreserved).toEqual([]);
  });
});
