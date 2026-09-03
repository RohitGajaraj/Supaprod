/**
 * A COLUMN THAT DOES NOT EXIST IS NOT AN ERROR ANYONE SEES. IT IS AN EMPTY LIST.
 *
 * ── WHY THIS GUARD EXISTS: FIVE OF THEM, AND FOUR REACHED PRODUCTION ──────
 * PostgREST answers a query naming an unknown column with `42703` and no rows.
 * Almost nothing in this codebase reads `.error` on a read it expects to be
 * empty sometimes, so the failure arrives as "there is nothing here" — which is
 * a legitimate answer for almost every query, and therefore invisible.
 *
 * The five, all found by hand and all after they had shipped:
 *
 *   `studio_changesets.track_id` × 3   F-72's staged gate, P-02's acceptance
 *                                      gate and P-03's done rule. **F-72's gate
 *                                      never fired once since it was written**,
 *                                      and the third copy was added a month
 *                                      after the first without anyone noticing
 *                                      the first had never worked. Caught only
 *                                      when a live run rebuilt a finished PR.
 *   `ai_events.agent_id`               `trust.server.ts` documents its own: the
 *                                      event list came back empty, so the evals
 *                                      that hung off it silently measured
 *                                      nothing.
 *   `decisions.track_id`               `getDecisionsForAsk`, plus
 *   `learnings.metadata` × 2           in both Ask helpers. Neither is called by
 *                                      anything, and neither could have returned
 *                                      a row if it had been.
 *
 * Every one is the same shape and every one was found by a person reading code.
 * That is not a review problem, it is a missing test: the schema is machine
 * readable, the queries are machine readable, and nothing was comparing them.
 *
 * ── WHAT THIS CHECKS, AND WHAT IT DELIBERATELY DOES NOT ───────────────────
 * It reads `types.ts`, which the repo already treats as the schema of record and
 * which `the-types-must-know-every-column-a-migration-added` keeps in step with
 * the migrations. Then it walks every `.from("table")` in `src/` and checks the
 * columns named in the filters and flat selects that follow it, stopping at the
 * next `.from(` so a neighbouring query's columns are never attributed here.
 *
 * It skips embedded selects (`select("a, other(b)")`), which are PostgREST
 * relationship syntax rather than columns on this table, and it skips tables
 * `types.ts` does not know. Both are places a false positive would come from,
 * and a guard that cries wolf is one that gets deleted.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Columns per table, from the generated Row blocks. */
function schemaFromTypes(): Map<string, Set<string>> {
  const src = readFileSync("src/integrations/supabase/types.ts", "utf8");
  const out = new Map<string, Set<string>>();
  const block = /\n {6}(\w+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\}\n/g;
  for (const m of src.matchAll(block)) {
    const cols = new Set([...m[2]!.matchAll(/^\s+(\w+):/gm)].map((c) => c[1]!));
    if (cols.size > 0) out.set(m[1]!, cols);
  }
  return out;
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "node_modules") sourceFiles(path, acc);
    } else if (/\.tsx?$/.test(name) && !name.includes(".test.")) {
      acc.push(path);
    }
  }
  return acc;
}

const FROM = /\.from\(\s*"([a-z_]+)"(?:\s+as\s+never)?\s*\)/g;
const FILTER = /\.(?:eq|neq|gt|gte|lt|lte|like|ilike|is|in|order)\(\s*"([a-zA-Z_]+)"/g;
const SELECT = /\.select\(\s*"([^"]+)"/g;

type Finding = { file: string; line: number; table: string; column: string };

function scan(): Finding[] {
  const schema = schemaFromTypes();
  const found: Finding[] = [];
  for (const file of sourceFiles("src")) {
    /*
     * COMMENTS STRIPPED FIRST. `trust.server.ts` documents its own dead-column
     * defect by quoting the query verbatim, and a guard that fires on a correct
     * explanation of a fixed bug is a guard that gets its explanation deleted.
     * This file has been bitten by that three times in two days.
     */
    const src = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
      .replace(/^([^\n"'`]*?)\/\/.*$/gm, (_, keep) => keep);
    const starts = [...src.matchAll(FROM)];
    for (let i = 0; i < starts.length; i += 1) {
      const m = starts[i]!;
      const table = m[1]!;
      const cols = schema.get(table);
      if (!cols) continue;
      /*
       * THE CHAIN IS THE CONTIGUOUS RUN OF METHOD CALLS, and nothing looser
       * works. Three bounds were tried against the real codebase:
       *
       *   a fixed character window   349 findings, 342 of them a neighbouring
       *                              query's columns blamed on this table
       *   up to the next `.from(`    7 findings, 4 of them noise
       *   up to the next `;`         1 finding, still noise: a chain formatted
       *                              as a `Promise.all` argument has no
       *                              semicolon before the NEXT argument, so it
       *                              swallowed `recallBase().eq("outcome", ...)`
       *                              -- a builder on a different table entirely.
       *
       * A query builder is written as `.a().b().c()`, one call per line, and it
       * ends where that stops. Walking the lines is exact where a character
       * count and a delimiter are both guesses, and it is what makes this file
       * safe to keep: a guard that reports four false positives is a guard
       * somebody deletes on a busy morning.
       */
      const from = m.index! + m[0].length;
      const rest = src.slice(from);
      const lines = rest.split("\n");
      const chainLines: string[] = [lines[0] ?? ""];
      for (const line of lines.slice(1)) {
        const t = line.trim();
        // Blank lines and closing punctuation belong to the call that is still
        // open; anything else is the next expression.
        if (t === "" || t.startsWith(".") || /^[)\],;]/.test(t)) {
          chainLines.push(line);
          if (/^[)\],;]/.test(t) && !t.startsWith(".")) break;
          continue;
        }
        break;
      }
      const chain = chainLines.join("\n");
      const named = new Set([...chain.matchAll(FILTER)].map((f) => f[1]!));
      for (const sel of [...chain.matchAll(SELECT)].map((s) => s[1]!)) {
        // An embedded resource is a relationship, not a column on this table.
        if (sel.includes("(")) continue;
        for (const raw of sel.split(",")) {
          const c = raw.trim().split(":").pop()!.trim();
          if (/^[a-zA-Z_]+$/.test(c) && c !== "*") named.add(c);
        }
      }
      for (const c of named) {
        if (!cols.has(c)) {
          found.push({ file, line: src.slice(0, m.index!).split("\n").length, table, column: c });
        }
      }
    }
  }
  return found;
}

describe("no query names a column its table does not have", () => {
  it("finds nothing, and says exactly where when it does", () => {
    const found = scan();
    const said = found.map((f) => `${f.file}:${f.line}  ${f.table}.${f.column}`).join("\n");
    /*
     * The message is the whole value of this test. A bare count tells whoever
     * broke it nothing; the file, the line, the table and the column tell them
     * everything, because the fix is always one of two things — the query names
     * the wrong column, or the migration that adds it has not been written.
     */
    expect(found, `\n${said}\n`).toEqual([]);
  });

  it("reads a real schema, so a broken parse cannot pass by finding no tables", () => {
    // THE GUARD ON THE GUARD. If `types.ts`'s shape changes and the Row block
    // regex stops matching, every lookup misses and this file goes quietly
    // green — which is the same silent-pass failure it was written to catch.
    const schema = schemaFromTypes();
    expect(schema.size).toBeGreaterThan(150);
    expect(schema.get("spine_tracks")?.has("last_hold")).toBe(true);
    expect(schema.get("studio_changesets")?.has("mission_id")).toBe(true);
  });

  it("and would still catch the five it was written for", () => {
    /*
     * Asserted against the schema rather than by reintroducing the bugs: each of
     * these is a column the code really did name and the table really does not
     * have. If any becomes real, this test says so and the header above needs
     * its history corrected rather than the check loosened.
     */
    const schema = schemaFromTypes();
    expect(schema.get("studio_changesets")?.has("track_id")).toBe(false);
    expect(schema.get("decisions")?.has("track_id")).toBe(false);
    expect(schema.get("learnings")?.has("metadata")).toBe(false);
    expect(schema.get("ai_events")?.has("agent_id")).toBe(false);
  });

  it("scans a real number of files, so an empty walk cannot pass either", () => {
    expect(sourceFiles("src").length).toBeGreaterThan(500);
  });
});
