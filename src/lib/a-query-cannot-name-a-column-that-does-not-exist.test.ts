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

/** One `.from("table")` call site, found in a comment-stripped file. */
type FromCall = { file: string; src: string; table: string; index: number; matchLength: number };

function strippedSource(file: string): string {
  /*
   * COMMENTS STRIPPED FIRST. `trust.server.ts` documents its own defect by
   * quoting the query verbatim, and a guard that fires on a correct
   * explanation of a fixed bug is a guard that gets its explanation deleted.
   * This file has been bitten by that three times in two days.
   */
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
    .replace(/^([^\n"'`]*?)\/\/.*$/gm, (_, keep) => keep);
}

function everyFromCall(): FromCall[] {
  const out: FromCall[] = [];
  for (const file of sourceFiles("src")) {
    const src = strippedSource(file);
    for (const m of src.matchAll(FROM)) {
      out.push({ file, src, table: m[1]!, index: m.index!, matchLength: m[0].length });
    }
  }
  return out;
}

function scan(): Finding[] {
  const schema = schemaFromTypes();
  const found: Finding[] = [];
  for (const call of everyFromCall()) {
    const table = call.table;
    const cols = schema.get(table);
    if (!cols) continue;
    const chain = chainFor(call);
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
        found.push({ file: call.file, line: lineOf(call), table, column: c });
      }
    }
  }
  return found;
}

/**
 * THE CHAIN IS THE CONTIGUOUS RUN OF METHOD CALLS, and nothing looser works.
 * Three bounds were tried against the real codebase:
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
 * somebody deletes on a busy morning. Shared by every scan below (P-35,
 * A-QUEUE.md) -- one chain-walk, not one per guard, so a future fourth
 * check inherits the same exactness rather than re-deriving it.
 */
function chainFor(call: FromCall): string {
  const from = call.index + call.matchLength;
  const rest = call.src.slice(from);
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
  return chainLines.join("\n");
}

function lineOf(call: FromCall): number {
  return call.src.slice(0, call.index).split("\n").length;
}

/**
 * ── EVERY TABLE WITH A VECTOR COLUMN, AND EVERY BLIND SELECT AGAINST ONE ──
 * (P-35, A-QUEUE.md.) P-32 found `listThemes` selecting `*` on `themes`,
 * which carries a pgvector `embedding`: 2.6 MB of a 2.75 MB response for 138
 * rows, rendered nowhere on the one screen that read it.
 *
 * HAND-MAINTAINED, NOT DERIVED FROM `types.ts` -- AND THAT IS THE REASON THIS
 * IS A SEPARATE MAP. `schemaFromTypes()` above reads column NAMES, and a
 * pgvector column has no distinct TypeScript shape to detect by: Supabase's
 * generator emits `embedding: string | null`, the identical shape as `title`
 * or `origin`. There is nothing in the generated file that says "this one is
 * 1536 floats" — only the live schema does (`udt_name = 'vector'`, checked
 * against Helio Labs through the Lovable MCP, not assumed). Same discipline
 * `attach.ts`'s `TOOL_PRODUCTS` and `chain.ts`'s `ARTIFACT_SOURCE` already
 * use for a fact `types.ts` cannot state: verified once against the real
 * database, kept here as the one place that says it.
 */
const VECTOR_COLUMNS: Readonly<Record<string, string>> = {
  agent_memory: "embedding",
  decisions: "embedding",
  learnings: "embedding",
  opportunities: "embedding",
  prds: "embedding",
  rag_chunks: "embedding",
  signals: "embedding",
  themes: "embedding",
};

/** `select("*")`, `select("*", {...})`, or a bare `select()` -- every shape
 *  PostgREST reads as "every column", including the vector. */
const STAR_OR_BARE_SELECT = /\.select\(\s*(?:\)|"\*"\s*[,)])/;

type VectorFinding = { file: string; line: number; table: string; detail: string };

function scanVectorSelectStar(): VectorFinding[] {
  const found: VectorFinding[] = [];
  for (const call of everyFromCall()) {
    if (!(call.table in VECTOR_COLUMNS)) continue;
    const chain = chainFor(call);
    if (STAR_OR_BARE_SELECT.test(chain)) {
      found.push({
        file: call.file,
        line: lineOf(call),
        table: call.table,
        detail: `select("*") or select() names every column, including ${call.table}.${VECTOR_COLUMNS[call.table]}`,
      });
    }
  }
  return found;
}

/**
 * `.server.ts` FILES ARE EXCLUDED HERE, ON PURPOSE, AND ONLY HERE.
 *
 * The packet's own scope names it precisely: "the embedding column is never
 * in a CLIENT-FACING select" (P-35, A-QUEUE.md). `cluster.server.ts` and
 * `sink.server.ts` both read `signals.embedding` deliberately -- clustering
 * and near-duplicate restatement screening are exactly what a vector column
 * is FOR -- and neither ever returns a signal row to a caller: `clusterSignalsCore`
 * resolves to `{ themes, theme_ids, message }`, `screenRestatements` to
 * `{ keep, restated }`, neither carrying the vector past the function that
 * read it. `.server.ts` is this repo's own existing convention for "internal,
 * never a `createServerFn` client boundary" (`driver.server.ts`,
 * `critic.server.ts`, and every other `*.server.ts` file already mean this),
 * so it is the one line that separates a legitimate consumer from a leak
 * without hand-listing every function that is allowed to compute with a
 * vector. `scanVectorSelectStar` above stays UNSCOPED: naming columns
 * explicitly instead of `*` is good practice everywhere, server-internal
 * code included, and it is not the "reaches the browser" question this one
 * guard is for.
 */
function scanVectorColumnNamed(): VectorFinding[] {
  const found: VectorFinding[] = [];
  for (const call of everyFromCall()) {
    if (call.file.endsWith(".server.ts")) continue;
    const vectorCol = VECTOR_COLUMNS[call.table];
    if (!vectorCol) continue;
    const chain = chainFor(call);
    for (const sel of [...chain.matchAll(SELECT)].map((s) => s[1]!)) {
      if (sel.includes("(")) continue; // an embedded resource, not a flat column list
      const names = sel.split(",").map((raw) => raw.trim().split(":").pop()!.trim());
      if (names.includes(vectorCol)) {
        found.push({
          file: call.file,
          line: lineOf(call),
          table: call.table,
          detail: `select() names ${call.table}.${vectorCol} explicitly`,
        });
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

describe("no query selects a vector it will never render (P-35, A-QUEUE.md)", () => {
  it("no select(*) or bare select() reaches a table that carries one", () => {
    const found = scanVectorSelectStar();
    const said = found.map((f) => `${f.file}:${f.line}  ${f.table}: ${f.detail}`).join("\n");
    expect(found, `\n${said}\n`).toEqual([]);
  });

  it("no select ever names the vector column itself, even explicitly", () => {
    const found = scanVectorColumnNamed();
    const said = found.map((f) => `${f.file}:${f.line}  ${f.table}: ${f.detail}`).join("\n");
    expect(found, `\n${said}\n`).toEqual([]);
  });

  it("the vector census is not stale, so a table added later cannot go unwatched", () => {
    // THE GUARD ON THIS GUARD. `VECTOR_COLUMNS` cannot be derived from
    // `types.ts` (see its own header) so nothing catches a NINTH vector
    // column landing without this map growing to name it -- this at least
    // pins the eight known today, so a silent drop of one is caught here
    // even though a genuinely new one still needs a person to add it.
    expect(Object.keys(VECTOR_COLUMNS).sort()).toEqual([
      "agent_memory",
      "decisions",
      "learnings",
      "opportunities",
      "prds",
      "rag_chunks",
      "signals",
      "themes",
    ]);
  });

  it("both scans would catch a real select(*) if one existed", () => {
    // Asserted against the regex directly, the same reasoning as "and would
    // still catch the five it was written for" above: a synthetic chain,
    // not a live bug reintroduced and reverted, proves the pattern matches
    // without leaving a real regression in the tree between commits.
    expect(STAR_OR_BARE_SELECT.test('.select("*", { count: "exact" })')).toBe(true);
    expect(STAR_OR_BARE_SELECT.test(".select()")).toBe(true);
    expect(STAR_OR_BARE_SELECT.test('.select("id,title")')).toBe(false);
  });
});
