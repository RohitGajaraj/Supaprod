/**
 * THE SCHEDULER ASKED FOR A COLUMN THAT HAS NEVER EXISTED, AND SAID OK.
 *
 * Commit c5d479fd6 ("Rename product Cadence -> Supaprod") replaced the word
 * `cadence` INSIDE this hook's PostgREST select string, so it asked `loops` for
 * a column named `supaprod`. PostgREST answered 42703, the hook's own
 * pre-migration tolerance swallowed 42703, and it returned
 * `{ok: true, processed: 0}` **144 times a day from 2026-07-16**.
 *
 * Measured on production 2026-08-22: 28 active loops, **all 28 overdue**, 29 of
 * 29 having run exactly once -- inline at creation -- and **zero tick errors in
 * seven days**. A dead scheduler reporting green.
 *
 * `tsc` cannot catch this: Supabase select strings are loosely typed, a trap
 * `AGENTS.md` already records. So the guard is structural -- the select must
 * name exactly the fields the row type declares, and `LoopRow` is the type
 * `runLoopPass` actually consumes, so the two cannot drift apart in silence.
 *
 * The second half matters as much as the first: a missing TABLE is
 * pre-migration tolerance and is fine; a missing COLUMN on a table that exists
 * is the code and the schema disagreeing, which cannot fix itself by waiting.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = readFileSync(join(import.meta.dir, "loop-tick.ts"), "utf8");
const SHARED = readFileSync(
  join(import.meta.dir, "..", "..", "..", "..", "lib", "loops.shared.ts"),
  "utf8",
);

/** The fields `LoopRow` declares, read from the type rather than restated. */
function loopRowFields(): string[] {
  const body = SHARED.slice(SHARED.indexOf("export interface LoopRow"));
  const inner = body.slice(body.indexOf("{") + 1, body.indexOf("}"));
  return [...inner.matchAll(/^\s*([a-z_]+)\s*[?]?:/gm)].map((m) => m[1]);
}

/** The columns the hook's `loops` select actually asks PostgREST for. */
function selectedColumns(): string[] {
  const m =
    HOOK.match(/\.from\("loops"[^)]*\)\s*\.select\(\s*"([^"]+)"/s) ??
    HOOK.match(/\.select\(\s*\n?\s*"([^"]+)"/s);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

describe("loop-tick selects columns that exist", () => {
  it("finds both sides, or it is measuring nothing", () => {
    // The control. A regex that stops matching would otherwise pass silently,
    // which is the same class of failure this file exists to catch.
    expect(loopRowFields().length).toBeGreaterThan(5);
    expect(selectedColumns().length).toBeGreaterThan(5);
  });

  it("asks for no column the row type does not declare", () => {
    const declared = new Set(loopRowFields());
    const unknown = selectedColumns().filter((c) => !declared.has(c));
    expect(unknown).toEqual([]);
  });

  it("still asks for cadence, which the rename ate", () => {
    expect(selectedColumns()).toContain("cadence");
    expect(selectedColumns()).not.toContain("supaprod");
  });

  it("a missing COLUMN is loud, while a missing TABLE stays tolerated", () => {
    // 42P01 / PGRST205 = the table is not there yet: real pre-migration lag.
    // 42703 / PGRST204 = a column is missing from a table that exists: a defect
    // that cannot fix itself by waiting, and the thing that hid this for weeks.
    const tolerated = HOOK.match(/if \(code === "42P01"[^}]*}/s)?.[0] ?? "";
    expect(tolerated).toContain("42P01");
    expect(tolerated).not.toContain("42703");
    expect(HOOK).toMatch(/42703[\s\S]{0,400}?(ok:\s*false|500)/);
  });
});
