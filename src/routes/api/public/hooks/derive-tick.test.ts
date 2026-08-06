import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * "WORKING AND QUIET" AND "THROWING EVERY TICK" LOOKED IDENTICAL.
 *
 * WHAT WAS FOUND. `runInsightPush` rides the two-hourly derive tick and its
 * failures were caught by a bare `catch {}` commented "best-effort: the push
 * channel is additive". The best-effort part was right -- a push failure must
 * never block the derive pass. Discarding the error was not: the tick's response
 * was byte-identical whether the push had nothing to say or had been dead for a
 * week.
 *
 * WHY IT SURFACED. On 2026-08-06 the lane had been silent for three days and
 * nine hours (last push 2026-08-02 16:00 UTC, 51 cards still open). Answering
 * "is this broken?" took a live database session and a reading of the detector,
 * because the tick that ran it every two hours could not say. It turned out to
 * be HONEST quiet -- zero learnings and zero settled outcomes in the window, and
 * the detectors key off settled outcomes -- but nothing in the system could have
 * told the difference, and next time it may not be honest quiet.
 *
 * The product's central claim is that a settled outcome re-ranks the next call.
 * The channel carrying that claim to the user is exactly the one whose failures
 * were being discarded.
 */

const SRC = readFileSync(join(import.meta.dir, "derive-tick.ts"), "utf8");

describe("the derive tick cannot hide a dead push", () => {
  it("keeps the error instead of swallowing it", () => {
    expect(SRC).toMatch(/pushError = e instanceof Error \? e\.message : String\(e\)/);
  });

  it("is still best-effort: a push failure does not abort the derive pass", () => {
    // The original behaviour that was CORRECT and must survive. A rethrow here
    // would let one workspace's bad data stop every later workspace deriving.
    //
    // COMMENTS STRIPPED FIRST. Written without this, the assertion matched the
    // word "thrown" inside the catch block's own explanatory comment and failed
    // against correct code -- the same self-matching mistake a grep test in this
    // repo made on 2026-08-05 against `github_issue_url`. A test that reads
    // prose is testing prose.
    const block = SRC.slice(SRC.indexOf("let pushed = 0;"));
    const catchBody = block
      .slice(block.indexOf("} catch (e) {"), block.indexOf("pushError ="))
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .join("\n");
    expect(catchBody).not.toMatch(/throw/);
  });

  it("the error reaches the response on BOTH exit paths", () => {
    // Capturing into a variable nothing reads is the same silence with more
    // steps. The loop leaves either by the daily-cap `continue` or by its normal
    // end, and a push failure is equally invisible on either.
    //
    // WHITESPACE-TOLERANT ON PURPOSE. The first version of these two matched an
    // exact single-line layout and `eslint --fix` broke it minutes later by
    // wrapping the ternary across three lines -- a passing test turned red
    // against code that had not changed behaviour at all. A test that pins
    // formatting will be broken by the formatter, and teaches people to edit
    // the test rather than read it.
    const flat = SRC.replace(/\s+/g, " ");
    expect(flat).toMatch(/note: pushError \? `daily cap reached; push failed: \$\{pushError\}`/);
    expect(flat).toMatch(
      /\.\.\.\(pushError \? \{ note: `push failed: \$\{pushError\}` \} : \{\}\)/,
    );
  });

  it("reports per workspace, so one bad workspace does not hide the rest", () => {
    // Declared INSIDE the loop. Hoisted out, a failure in workspace 3 would be
    // reported against workspaces 4..20 as well.
    expect(SRC).toMatch(/let pushError: string \| undefined;/);
    expect(SRC.indexOf("let pushError")).toBeGreaterThan(
      SRC.indexOf("for (const ws of workspaces"),
    );
  });
});
