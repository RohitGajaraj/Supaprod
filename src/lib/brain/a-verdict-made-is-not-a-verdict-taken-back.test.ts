/**
 * `forecast_resolution_log` was built for one writer, the reopen path, and its
 * NOT NULLs still described that world after two more writers arrived. The
 * defect was invisible from the code alone and invisible from the schema alone;
 * it only appeared where they met, which is why these guards read both.
 *
 * Measured on production 2026-09-03: two decisions settled by `forecast-auditor`
 * at 12:00 UTC, and zero rows in the log that is supposed to hold them.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";

const AUDIT = readFileSync("src/lib/brain/forecast-audit.server.ts", "utf8");
const REGISTRY = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
const TICK = readFileSync("src/routes/api/public/hooks/calibrate-tick.ts", "utf8");
const MIGRATIONS = readdirSync("supabase/migrations")
  .map((f) => readFileSync(`supabase/migrations/${f}`, "utf8"))
  .join("\n");

describe("a verdict being made is not a verdict taken back", () => {
  it("makes the log's reason a TYPED ARGUMENT, so a caller cannot forget it", () => {
    // The whole defect: `reason` is NOT NULL with no default and the grader
    // never set it, so every insert raised 23502. A comment asking for one is
    // what was already there. Only the signature stops the next caller.
    const sig = AUDIT.slice(AUDIT.indexOf("async function fileResolutionRow"));
    const params = sig.slice(0, sig.indexOf("): Promise<"));
    expect(params).toContain("reason: string;");
    expect(params).not.toContain("reason?:");
  });

  it("gives EVERY fileResolutionRow call a reason", () => {
    // Counted rather than sampled: a third call site added without one is the
    // exact regression, and it typechecks only because the param is required.
    //
    // BRACE-MATCHED, not `indexOf("})")`. The first draft of this guard used
    // that terminator and one call site cut off early at the `}` inside
    // `(refused[0] as { workspace_id?: string | null })`, so a call that DID
    // carry a reason was read as missing one. A slice that ends at the wrong
    // brace is the same class of defect this file exists to catch.
    const calls = AUDIT.split("fileResolutionRow(supabase, {").slice(1);
    expect(calls.length).toBeGreaterThanOrEqual(2);
    for (const c of calls) {
      let depth = 1;
      let end = 0;
      while (end < c.length && depth > 0) {
        if (c[end] === "{") depth++;
        else if (c[end] === "}") depth--;
        if (depth > 0) end++;
      }
      expect(depth).toBe(0);
      expect(c.slice(0, end)).toContain("reason:");
    }
  });

  it("stops swallowing the failure silently: it is counted and returned", () => {
    // A tick that reports ok while every log write is rejected is how this
    // survived a full day. The settle still must not fail, so the count travels.
    expect(AUDIT).toContain("unlogged: number;");
    expect(AUDIT).toContain("unlogged++");
    expect(AUDIT).toContain("return { drafted, autoSettled, raced, failed, unlogged };");
    expect(TICK).toContain("forecastsUnlogged: totalForecastsUnlogged,");
  });

  it("frees reopened_at, which NO code fix could have reached", () => {
    // Both writers say these columns "stay null". `reopened_at` was NOT NULL
    // DEFAULT now(), so it could not, and every verdict MADE would have been
    // stamped with the time it was taken BACK the moment inserts started
    // landing. A log where every row looks reopened cannot be told apart from
    // the record it corrects.
    expect(MIGRATIONS).toContain("alter column reopened_at drop not null");
    expect(MIGRATIONS).toContain("alter column reopened_at drop default");
  });

  it("constrains the reopen pair to move together", () => {
    // Enforced, because the comment saying the same thing is what let this ship.
    expect(MIGRATIONS).toContain("forecast_resolution_log_reopen_is_whole");
    expect(MIGRATIONS).toContain("check ((reopened_by is null) = (reopened_at is null))");
  });

  it("leaves no comment claiming reopened_at stays null without naming the fix", () => {
    // The stale comment IS the defect class this repo keeps paying for: a rule
    // written as a description reads as a decision that was checked. Both files
    // asserted these columns stay null while the schema made that impossible.
    //
    // The check is the MIGRATION NAME, not the prose. The first draft grepped
    // for "NOT NULL DEFAULT now()" and failed on the file that had been fixed,
    // because the sentence wraps across a comment line break. A guard that
    // depends on where a paragraph happens to wrap tests the formatter.
    const MIGRATION = "a_verdict_being_made_is_not_a_verdict_taken_back";
    for (const src of [AUDIT, REGISTRY]) {
      if (src.includes("stay null") || src.includes("are left null")) {
        expect(src).toContain(MIGRATION);
      }
    }
  });
});
