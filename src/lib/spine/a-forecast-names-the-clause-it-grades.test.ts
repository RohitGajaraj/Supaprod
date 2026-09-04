import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * P-150 MOVE 1: THE KEY, GUARDED ON BOTH SIDES.
 *
 * ── THE MEASUREMENT THAT MADE THIS A COLUMN RATHER THAN A RULE ────────────
 * Production, 2026-09-04:
 *
 *   decisions naming a forecast_metric .............. 6
 *   ... that also carry a prd_id .................... 1
 *   distinct spellings of those 3 metrics ........... 4
 *   prds carrying a reading on any clause ........... 0 of 133
 *
 * "tablet_checkout_completion_rate" and "tablet checkout completion rate" are
 * one metric on two decisions. Readings live on contract clauses keyed by
 * clause id; the metric is named in prose on the decision. **Nothing joined
 * them**, so P-150's rule -- a band is well founded on readings the record
 * holds -- had no definition, and computing it would have meant matching prose
 * to prose: the guess P-144 scope 3 refused because grading against the wrong
 * number is worse than not grading.
 *
 * Read from source, per rule 24: the defect this prevents is a link that is
 * never written, and no seam returns "what prd.draft would have linked"
 * without a live database and a model call.
 */
const REGISTRY = readFileSync(join(import.meta.dir, "../ai/tools/registry.server.ts"), "utf8");

/** prd.draft's body only, so a match in another tool cannot satisfy these. */
const PRD_DRAFT = (() => {
  const start = REGISTRY.indexOf('name: "prd.draft"');
  expect(start, "prd.draft not found").toBeGreaterThan(-1);
  const end = REGISTRY.indexOf("\nconst ", start);
  return REGISTRY.slice(start, end === -1 ? REGISTRY.length : end);
})();

describe("the link is written at Plan, where both halves are in view", () => {
  test("prd.draft reads the track's decision and its observable", () => {
    // At decision.record time the spec does not exist, so Decide cannot name a
    // clause. This is the only writer holding both.
    expect(PRD_DRAFT).toContain("forecast_how_we_will_know");
    expect(PRD_DRAFT).toContain('artifact_kind", "decision"');
  });

  test("both sides are set: the clause names the decision AND the decision names the clause", () => {
    expect(PRD_DRAFT).toContain("measures_decision_id");
    expect(PRD_DRAFT).toContain("forecast_clause_id");
  });

  test("the graded clause carries the forecast's OWN observable, not a chosen metric", () => {
    /*
     * Picking the closest drafted metric would be the prose match wearing a
     * different hat, and it can fail outright: nothing guarantees the extractor
     * wrote a metric for the thing the decision bet on. Copying the observable
     * in guarantees the graded clause exists and is exactly what was promised.
     */
    expect(PRD_DRAFT).toMatch(/clauseShape\(observable/);
  });

  test("an existing link is never repointed by a second spec", () => {
    // The readings already recorded against the first clause are what that
    // forecast is graded on; moving the pointer changes what a decision was
    // judged by, silently.
    expect(PRD_DRAFT).toContain("alreadyLinked");
    expect(PRD_DRAFT).toMatch(/\.is\("forecast_clause_id", null\)/);
  });

  test("the decision is pointed back only AFTER the spec exists", () => {
    // A decision pointing at a clause on a spec that was never filed is a
    // dangling key, and a reader that resolves it cannot tell "no reading yet"
    // from "no spec". Absent is honest; broken is not.
    const insertAt = PRD_DRAFT.indexOf('.from("prds")');
    const linkAt = PRD_DRAFT.indexOf("forecast_clause_id: forecastLink.clauseId");
    expect(insertAt).toBeGreaterThan(-1);
    expect(linkAt).toBeGreaterThan(insertAt);
  });

  test("neither half throws: a spec the seat wrote is never lost to a link failure", () => {
    expect(PRD_DRAFT).toContain("could not link the forecast to a clause");
    expect(PRD_DRAFT).toContain("could not be pointed back at it");
  });

  test("one clause shape, so the two writers cannot drift apart", () => {
    // A clause the grader can read is one whose keys match ContractClauseSchema.
    // Two near-identical object literals is how one of them quietly diverges.
    expect(REGISTRY).toContain("const clauseShape = (");
    expect(PRD_DRAFT).toMatch(/const clause = \(text: string\) => clauseShape\(text, nowIso\)/);
  });
});

describe("the clause shape carries the key in both schemas", () => {
  test("the Zod contract schema accepts measures_decision_id", () => {
    const disc = readFileSync(join(import.meta.dir, "../discovery.functions.ts"), "utf8");
    expect(disc).toContain("measures_decision_id: z.string().uuid().nullable().optional()");
  });

  test("and the ARD JSON schema mirrors it, so the two cannot disagree", () => {
    const ard = readFileSync(join(import.meta.dir, "../ard-schema.ts"), "utf8");
    expect(ard).toContain("measures_decision_id");
  });

  test("it is OPTIONAL, because every clause written before today has no decision", () => {
    // Absent must keep meaning "nobody linked this". Requiring the key would
    // fail every one of the 133 specs already on the record.
    const disc = readFileSync(join(import.meta.dir, "../discovery.functions.ts"), "utf8");
    expect(disc).toMatch(/measures_decision_id:.*\.optional\(\)/);
  });
});

describe("the migration states the key and backfills nothing", () => {
  const SQL = readFileSync(
    join(
      import.meta.dir,
      "../../../supabase/migrations/20260909093200_p150_a_forecast_names_the_clause_it_grades.sql",
    ),
    "utf8",
  );

  test("the column is nullable and added idempotently", () => {
    expect(SQL).toContain("ADD COLUMN IF NOT EXISTS forecast_clause_id uuid");
    /*
     * Asserted on the ALTER statement alone, not the file: the partial index
     * legitimately carries `WHERE forecast_clause_id IS NOT NULL`, and a
     * file-wide match reads that as a column constraint. A guard that cannot
     * tell a predicate from a constraint fails on correct SQL, which is how a
     * guard gets loosened instead of fixed.
     */
    const alter = SQL.slice(
      SQL.indexOf("ALTER TABLE"),
      SQL.indexOf(";", SQL.indexOf("ALTER TABLE")),
    );
    expect(alter).not.toMatch(/NOT NULL/);
    expect(alter).not.toMatch(/DEFAULT/i);
  });

  test("nothing is backfilled, because no backfill can avoid guessing", () => {
    /*
     * All 204 existing forecasts get NULL. There is no non-guessing way to say
     * which clause any of them meant -- that is the whole finding -- and a
     * forecast with no clause named has no readings the record can attribute to
     * it, which is the correct answer for a forecast nobody linked.
     */
    expect(SQL).not.toMatch(/UPDATE\s+public\.decisions/i);
    expect(SQL).toContain("nothing backfills them");
  });
});
