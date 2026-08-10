/**
 * THE AGENT SURFACE MUST ONLY SELECT COLUMNS THAT EXIST.
 *
 * This is a guard against a defect this endpoint has already shipped once.
 *
 * `append_decision` was advertised in `tools/list`, was callable, and targeted
 * a `decision_queue` table and columns that were absent from the live schema.
 * It could never succeed. It was removed on 2026-06-24, and the note left
 * behind on the replacement write tool says only that the new one "cannot
 * repeat the append_decision schema-drift bug" — a promise about one tool,
 * with nothing checking the other eleven.
 *
 * The reason it survived is worth stating: a broken read tool fails at the
 * PostgREST boundary, returns an error to a caller nobody is watching, and
 * changes nothing on any screen a human looks at. Measured 2026-08-10, zero
 * MCP tokens have ever been issued and zero agent API calls have ever been
 * made, so on this surface a defect has no observer at all. Nothing about
 * running the product would reveal it.
 *
 * So the check runs offline against the generated Supabase types, which are
 * the repo's own record of the live schema. Verified against production on
 * 2026-08-10: all 38 claimed columns exist. This keeps that true.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..");
const MCP = readFileSync(join(SRC, "lib", "mcp.functions.ts"), "utf8");
const TYPES = readFileSync(join(SRC, "integrations", "supabase", "types.ts"), "utf8");

/** Comments stripped so a paragraph describing a removed tool cannot satisfy
 *  or trip the scan. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * Every `.from("table").select("a, b, c")` pair in the file.
 *
 * Deliberately literal: it only understands the shape the MCP functions
 * actually use. A dynamic table name or a computed select would be missed, and
 * that is the right trade here — a false pass on an exotic shape is better
 * than a false failure that teaches people to delete the guard.
 */
function claimedColumns(src: string): Array<{ table: string; column: string }> {
  const code = codeOf(src);
  const out: Array<{ table: string; column: string }> = [];
  const re = /from\(\s*"([a-z_]+)"\s*\)\s*(?:\r?\n\s*)?\.select\(\s*"([^"]+)"/g;
  for (const m of code.matchAll(re)) {
    const table = m[1];
    for (const raw of m[2].split(",")) {
      const col = raw.trim();
      // SKIP embeds outright rather than trying to strip them. A PostgREST
      // embed is `alias:related_table(cols)`, and the text before the colon is
      // the ALIAS, not a column on this table. Splitting on ":" and keeping the
      // left side is the obvious move and it is wrong: it turns
      // `opportunity:opportunities(title)` into a claim that `learnings` has an
      // `opportunity` column, which it does not. That produced four false
      // failures on the first run of this guard.
      if (!col || col === "*" || /[:()]/.test(col)) continue;
      out.push({ table, column: col });
    }
  }
  return out;
}

/** The generated types block for one table, or null when the table is absent. */
function typesBlockFor(table: string): string | null {
  const marker = `      ${table}: {`;
  const at = TYPES.indexOf(marker);
  if (at === -1) return null;
  // Row shape comes first in the generated types and is the read contract.
  return TYPES.slice(at, at + 6000);
}

describe("every column the agent surface selects exists in the schema", () => {
  const claimed = claimedColumns(MCP);

  it("found the select statements at all", () => {
    // Without this the whole suite passes vacuously the moment the file is
    // refactored into a shape the extractor does not understand, which is
    // exactly how a guard becomes decorative.
    expect(claimed.length).toBeGreaterThan(20);
  });

  it("every table it reads is a real table", () => {
    const tables = [...new Set(claimed.map((c) => c.table))];
    const missing = tables.filter((t) => typesBlockFor(t) === null);
    expect(
      missing,
      `The agent surface reads tables absent from the schema: ${missing.join(", ")}. ` +
        `This is the append_decision defect, which targeted a decision_queue table ` +
        `that did not exist and could never succeed.`,
    ).toEqual([]);
  });

  it("every column it selects is a real column on that table", () => {
    const bad: string[] = [];
    for (const { table, column } of claimed) {
      const block = typesBlockFor(table);
      if (!block) continue; // reported by the test above
      // The generated types render each column as `name: type` or `name?: type`.
      const declared = new RegExp(`\\b${column}\\??:\\s`).test(block);
      if (!declared) bad.push(`${table}.${column}`);
    }
    expect(
      bad,
      `The agent surface selects columns that do not exist: ${bad.join(", ")}. ` +
        `A read tool that names a missing column fails at the PostgREST boundary ` +
        `and returns an error to a caller nobody is watching, which is how ` +
        `append_decision survived being advertised and broken.`,
    ).toEqual([]);
  });
});
