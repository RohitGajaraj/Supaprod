/**
 * The database and the union must agree about what a decision's origin can be.
 *
 * WHY THIS FILE EXISTS. `decisions_source_kind_check` has been the bug three
 * times, in the same shape each time:
 *
 *   2026-08-06  the Gate wrote `source_kind: 'opportunity'`   -> check refused
 *   2026-08-10  the MCP tool wrote `source_kind: 'mcp'`       -> check refused
 *   2026-08-11  `decision.record` wrote `source_kind:'agent'` -> check refused
 *
 * The third one ran for TEN DAYS. `decision.record` is the Decide station's
 * only artifact-creating hand; it shipped on 2026-08-01 and wrote exactly zero
 * rows, because the insert threw on every single call. Nobody noticed, because
 * a station that files nothing is indistinguishable from a station with nothing
 * to file — the defect this repo keeps deleting under new names.
 *
 * The drift also runs the other way, and that half was live too: three values
 * ('roadmap', 'critic', 'retrospective') sat in the DATABASE and never reached
 * the TypeScript union, so `d.source_kind as DecisionSource` lied to tsc and
 * `SOURCE_LABEL[...]` returned undefined for 50 of 296 production rows.
 *
 * So this asserts the two sides match IN BOTH DIRECTIONS. It is deliberately
 * not a snapshot and not a count: it parses the live constraint out of the
 * migration that last defined it and compares that set to the const the type is
 * derived from. Widening one without the other fails here, which is the only
 * place the two can be compared at all — tsc cannot see SQL, and the database
 * cannot see the union.
 *
 * IT READS THE MIGRATION, NOT THE DATABASE, on purpose. A test that queried
 * Postgres would need credentials, would not run in CI, and would pass against
 * a stale local copy. The migration file is what will be applied, so it is what
 * the code has to agree with.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { DECISION_SOURCES } from "@/lib/decisions.functions";

const MIGRATIONS_DIR = join(import.meta.dir, "..", "..", "..", "supabase", "migrations");

/**
 * The migration that most recently defined the constraint, by filename order.
 *
 * Migration filenames are timestamp-prefixed and applied in that order, so the
 * lexicographically last file that ADDS the constraint is the definition in
 * force. Matching on `add constraint` rather than the bare name matters: the
 * older migrations also contain `drop constraint if exists` and a `comment on
 * constraint`, and either would select the wrong file.
 */
function constraintDefinition(): { file: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (let i = files.length - 1; i >= 0; i--) {
    const sql = readFileSync(join(MIGRATIONS_DIR, files[i]), "utf8");
    if (/add\s+constraint\s+decisions_source_kind_check/i.test(sql)) {
      return { file: files[i], sql };
    }
  }
  throw new Error(
    "No migration adds decisions_source_kind_check. If the constraint was " +
      "deliberately dropped, delete this test and say why in the migration.",
  );
}

/**
 * The allowed values, read out of the `array[...]` literal.
 *
 * Scoped to the text AFTER the `add constraint` line so a file that also drops
 * and re-adds, or that carries the old list in a comment, cannot contribute
 * stale values. The comment-stripping is why: every migration in this repo
 * carries a long `--` preamble, and the 2026-08-11 one quotes the previous
 * list inside it.
 */
function allowedValues(sql: string): string[] {
  const start = sql.search(/add\s+constraint\s+decisions_source_kind_check/i);
  const body = sql.slice(start);
  const withoutComments = body.replace(/--[^\n]*/g, "");
  const arrayMatch = withoutComments.match(/array\s*\[([\s\S]*?)\]/i);
  if (!arrayMatch) throw new Error("Could not find the array[...] literal in the constraint.");
  return [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe("decisions.source_kind: the database and the union agree", () => {
  test("the constraint's allowed set is exactly DECISION_SOURCES", () => {
    const { file, sql } = constraintDefinition();
    const inDatabase = allowedValues(sql).sort();
    const inCode = [...DECISION_SOURCES].sort();

    // Reported as two directed differences rather than one equality, because
    // the two failures have completely different consequences and a bare
    // toEqual would not say which one happened.
    const writableButUnlabelled = inDatabase.filter((v) => !inCode.includes(v));
    const claimedButRefused = inCode.filter((v) => !inDatabase.includes(v));

    expect({ file, writableButUnlabelled }).toEqual({ file, writableButUnlabelled: [] });
    expect({ file, claimedButRefused }).toEqual({ file, claimedButRefused: [] });
    expect(inDatabase).toEqual(inCode);
  });

  test("the value decision.record actually writes is admitted", () => {
    // The specific regression, named. `registry.server.ts` writes this literal
    // and throws on error, so if it ever falls out of the constraint again the
    // Decide station goes silently handless — which is precisely what happened
    // between 2026-08-01 and 2026-08-11.
    const { sql } = constraintDefinition();
    expect(allowedValues(sql)).toContain("agent");
    expect(DECISION_SOURCES).toContain("agent");
  });

  test("'manual' still exists, because a reader depends on its meaning", () => {
    // `isAgentDrafted` (approvals-queue.functions.ts) treats source_kind
    // 'manual' as "the human wrote this themselves" and skips gate-signal
    // recording for it. Removing or renaming the value would silently change
    // which decisions feed the correction-rate flywheel.
    const { sql } = constraintDefinition();
    expect(allowedValues(sql)).toContain("manual");
  });
});
