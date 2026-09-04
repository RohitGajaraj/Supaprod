/**
 * ── F-192: `tsc` CANNOT CHECK A POSTGREST RELATION NAME ──────────────────
 *
 * `whyShipStopped` read `.from("changesets")`. There is no such table -- it is
 * `studio_changesets`, as four other reads in the same file already said. The
 * call typechecked, PostgREST answered 42P01 at runtime, the read threw, and
 * the Ship hold card fell back to a generic sentence while the record
 * underneath was perfectly intact.
 *
 * It shipped in P-59 and survived P-68 and P-68b, because all three verified
 * the code and not the served screen. A1 found it by reading the product.
 *
 * ── SO THE NAMES ARE CHECKED AGAINST THE GENERATED TYPES ─────────────────
 *
 * `src/integrations/supabase/types.ts` is generated from the live schema, so
 * its `Tables` and `Views` keys are the set of relations that actually exist.
 * Every literal handed to `.from()` in `src` must be one of them. This is the
 * cheapest possible version of the check and it would have caught the defect
 * the moment it was written.
 *
 * WHAT IT CANNOT CATCH, said plainly rather than implied: a name built at
 * runtime (`.from(table)`) is invisible to it, and so is a relation that exists
 * in the database but not yet in the regenerated types. Both are narrower
 * problems than the one this closes, and neither is a reason to skip it.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const TYPES = readFileSync("src/integrations/supabase/types.ts", "utf8");

/** Relation names from the generated `Tables:` and `Views:` blocks. */
function generatedRelations(): Set<string> {
  const out = new Set<string>();
  for (const block of ["Tables", "Views"]) {
    const at = TYPES.indexOf(`    ${block}: {`);
    if (at === -1) continue;
    /* Bounded at the next top-level key, never to end-of-file (F-191). */
    const end = TYPES.indexOf("\n    }\n", at);
    const body = TYPES.slice(at, end === -1 ? TYPES.length : end);
    for (const m of body.matchAll(/^ {6}([a-z][a-z0-9_]*): \{$/gm)) out.add(m[1]);
  }
  return out;
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sourceFiles(p, out);
    /*
     * TESTS ARE EXCLUDED, and the reason is not convenience: a test fake names
     * tables that deliberately do not exist (`fake-postgrest.test.ts` uses
     * `.from("t")`), and this file itself asserts on the string that caused the
     * defect. Scanning them would make the guard argue with its own fixtures.
     */
    else if (/\.(ts|tsx)$/.test(p) && !/\.gen\.|\.test\.|__tests__/.test(p)) out.push(p);
  }
  return out;
}

/**
 * Names that are not relations in this schema and are reached another way.
 * Each needs its reason, so an entry cannot become a place to hide a typo.
 */
const NOT_A_RELATION: Record<string, string> = {
  /*
   * A Supabase system table, present in `auth`, `realtime` and
   * `supabase_migrations` but not in `public`, so it is not in the generated
   * types and a PostgREST call for it from the app client cannot resolve it
   * either. The health read that names it is answered elsewhere.
   */
  schema_migrations:
    "A Supabase system relation outside the public schema, so it is absent from the generated types by design.",
};

describe("every .from() names a relation that exists", () => {
  const relations = generatedRelations();

  it("reads the generated types at all, so an empty set cannot pass everything", () => {
    // A parse that quietly returns nothing would make every assertion below
    // vacuous, which is the shape of guard this repo keeps paying for.
    expect(relations.size).toBeGreaterThan(50);
    expect(relations.has("deployments")).toBe(true);
    expect(relations.has("studio_changesets")).toBe(true);
    // And the name that caused this: it must NOT be there.
    expect(relations.has("changesets")).toBe(false);
  });

  it("finds no .from() naming something that is not a relation", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles("src")) {
      const src = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const m of src.matchAll(/\.from\(\s*"([a-z][a-z0-9_]*)"/g)) {
        const name = m[1];
        if (relations.has(name) || NOT_A_RELATION[name]) continue;
        const line = src.slice(0, m.index).split("\n").length;
        offenders.push(`${file}:${line}  .from("${name}")`);
      }
    }
    /*
     * If this fails: the name you passed to `.from()` is not a table or view in
     * the generated types, so PostgREST will answer 42703/42P01 at runtime and
     * the read will fail in a way `tsc` cannot see. Check the spelling against
     * `src/integrations/supabase/types.ts`; if the relation is genuinely new,
     * regenerate the types rather than adding it to `NOT_A_RELATION`.
     */
    expect(offenders).toEqual([]);
  });

  it("makes every deliberate exception carry its reason", () => {
    for (const [name, why] of Object.entries(NOT_A_RELATION)) {
      expect(why.length, `${name} needs a reason`).toBeGreaterThan(20);
    }
  });
});
