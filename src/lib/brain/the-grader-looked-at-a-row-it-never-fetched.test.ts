/**
 * ── THE GRADER REPORTED AN EMPTY WORLD IT HAD NEVER LOOKED AT ────────────────
 *
 * Measured on production 2026-09-10. Fifteen real forecasts were past their
 * horizon and ungraded, the oldest since 2026-08-18. `brain.calibrate-tick` had
 * run 276 times, daily, with ZERO failures, and it had drafted a verdict for
 * every one of them -- fourteen of them at 00:00:03 that morning. So the tick
 * ran, reached every row, and produced:
 *
 *     verdict inconclusive · confidence 0 · read 0 · cited 0
 *     "Graded without evidence. Nothing dated after this decision could be read."
 *
 * Thirteen of those fifteen had between one and nineteen eligible signals
 * sitting in their window.
 *
 * ── THE CAUSE WAS A CAST OVER A COLUMN NOBODY FETCHED ───────────────────────
 *
 * `readKitForForecast` opens its signals read with
 * `if (decision.workspace_id && decision.created_at)`. `auditDueForecasts`
 * selected six columns, `created_at` was not among them, and it built the kit's
 * argument with `(raw as { created_at?: string | null }).created_at ?? null`.
 *
 * A cast is not a check. It told the compiler what to believe about a value the
 * query had never asked for, `created_at` was null on every row, the guard was
 * false on every row, and **THE SIGNALS READ NEVER RAN ONCE, FOR ANY FORECAST,
 * EVER.** `product_id` was null the same way and silently WIDENED the scope --
 * the opposite direction, equally unintended, and unobservable for as long as
 * the read never ran.
 *
 * ── WHY EVERY EXISTING TEST PASSED ──────────────────────────────────────────
 *
 * `the-grader-reads-evidence-before-it-grades` drives `readKitForForecast`
 * directly with a hand-built `DECISION` that has `created_at` set. The kit is
 * correct and its test proves it. What nobody tested is the SEAM: whether the
 * caller hands it a row that actually contains the fields it is guarded on.
 *
 * So this guard is about the seam, and it derives one side from the other
 * rather than restating either. A hand-written list of "columns the select
 * ought to have" would be a third source and would drift the same way.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { DUE_FORECAST_SELECT } from "./forecast-audit.server";

const AUDIT = readFileSync("src/lib/brain/forecast-audit.server.ts", "utf8");
const KIT = readFileSync("src/lib/brain/what-the-grader-read.ts", "utf8");

/** The keys of the object literal `auditDueForecasts` hands to the kit. */
function kitArgumentKeys(): string[] {
  const at = AUDIT.indexOf("await readKitForForecast(");
  expect(at).toBeGreaterThan(-1);
  const body = AUDIT.slice(at, AUDIT.indexOf("link.evidence", at));
  return [...body.matchAll(/^\s{10}([a-zA-Z_][\w]*):/gm)].map((m) => m[1]);
}

/** The fields of `raw` that argument reads, which must therefore be fetched. */
function fieldsReadFromTheRow(): string[] {
  const at = AUDIT.indexOf("await readKitForForecast(");
  const body = AUDIT.slice(at, AUDIT.indexOf("link.evidence", at));
  return [...new Set([...body.matchAll(/\braw\.([a-zA-Z_][\w]*)/g)].map((m) => m[1]))];
}

describe("the row the grader is handed contains the fields it is guarded on", () => {
  const selected = DUE_FORECAST_SELECT.split(",").map((c) => c.trim());

  it("fetches every column the kit argument reads off the row", () => {
    const read = fieldsReadFromTheRow();
    // The scan has to find something, or it passes by looking at nothing.
    expect(read.length).toBeGreaterThan(3);
    expect(read.sort()).toEqual(read.filter((f) => selected.includes(f)).sort());
  });

  /*
   * THE THREE BY NAME, because the general rule above would go quiet if someone
   * removed the field AND the read together, and these three are the ones whose
   * absence produced a confident false statement about the world rather than a
   * crash. `workspace_id` and `created_at` gate the signals read; `product_id`
   * scopes it.
   */
  it("fetches the two the signals read is gated on, and the one that scopes it", () => {
    expect(selected).toContain("workspace_id");
    expect(selected).toContain("created_at");
    expect(selected).toContain("product_id");
  });

  /*
   * NO CAST ACROSS THE SEAM. This is the mechanism rather than the symptom: the
   * defect was invisible precisely because a cast stood where a type should
   * have, so tsc was told the answer instead of asked the question.
   */
  it("asserts no field into existence on the way to the kit", () => {
    const at = AUDIT.indexOf("await readKitForForecast(");
    const body = AUDIT.slice(at, AUDIT.indexOf("link.evidence", at));
    expect(body).not.toContain("raw as {");
    expect(body).not.toContain(" as {");
  });

  /*
   * AND THE GUARD THE WHOLE THING TURNS ON IS STILL THE GUARD. If the kit stops
   * requiring `created_at`, the rule above is about a field nothing needs, and
   * this test would keep passing while meaning nothing.
   */
  it("is still guarding the read it was written for", () => {
    expect(KIT.replace(/\s+/g, " ")).toContain(
      "if (decision.workspace_id && decision.created_at) {",
    );
  });
});

/**
 * ── AND THE EXCLUSION MUST NOT DROP THE ROWS IT DOES NOT NAME ───────────────
 *
 * Second defect in the same read. `LOOP_AUTHORED_EXCLUSIONS` was applied with a
 * bare `.neq` pair, and `NULL <> 'loop_authored'` is NULL rather than TRUE, so
 * PostgREST discards every row whose column is unset. On production 2026-09-10:
 * **428 of 1,524 signals carry `source_kind` null**, and across the fifteen
 * overdue forecasts the bare pair admitted 56 rows where the null-safe form
 * admits 181 -- 69% of the eligible evidence thrown away by a filter written to
 * exclude the loop's own writing.
 *
 * This repo had already paid for the identical SQL fact one module over:
 * `listDueForecastsImpl` uses `.or(dueCheckFilter(nowIso))` under a comment
 * reading *"a bare comparison drops NULLs in SQL ... the loudest possible way to
 * get this wrong and still look like it works."*
 */
describe("the loop-authored exclusion survives a null column", () => {
  it("applies the rule with an or, never a bare neq", () => {
    const at = KIT.indexOf("LOOP_AUTHORED_EXCLUSIONS)");
    expect(at).toBeGreaterThan(-1);
    const line = KIT.slice(at, KIT.indexOf(";", at));
    expect(line).toContain(".is.null,");
    expect(line).not.toMatch(/q\.neq\(/);
  });

  /*
   * A READ THAT FAILED IS NOT A WORLD WITH NOTHING IN IT. The error was
   * discarded, so an unreadable signals table produced `rows: []`, which the
   * grader reports as "Nothing dated after this decision could be read" -- a
   * confident statement about the world, made without looking at it.
   */
  it("throws on an unreadable signals table rather than reporting an empty world", () => {
    const at = KIT.indexOf("LOOP_AUTHORED_EXCLUSIONS)");
    const after = KIT.slice(at, at + 1400);
    expect(after).toContain("const { data, error } = await q;");
    expect(after).toContain("could not read signals");
  });
});
