/**
 * F-151. THE PARK RAN 4,320 TIMES INSTEAD OF ONCE, AND THE CAUSE IS A SHAPE.
 *
 * `ci-poll-tick.ts` asked "is this mission over?" with an inline literal list
 * that omitted `completed_with_failures` — the second most common outcome in
 * the table, 452 of 1,135 runs. So the comment above it, "Park the mission
 * once, honestly", was false for exactly the missions that most needed it: one
 * finishing with failures never read as terminal, was parked to `blocked`,
 * resumed, failed again, and was parked again every tick. Measured 2026-08-31:
 * three missions oscillating on a ~40-second cadence since 2026-08-25, roughly
 * 12,960 stage events in 48 hours with no agent work behind any of them.
 *
 * `governance.functions.ts:325-336` records the SAME omission being made and
 * fixed once already, in a different set. That is what makes this a shape
 * rather than a location, so this guard is keyed to the STATUS WORD and to the
 * canonical helper, not to any one call site. A fifth list written tomorrow
 * that forgets the word again should fail here.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { isTerminalStatus } from "@/lib/reliability/runaway";

describe("a run that finished with failures has finished", () => {
  it("reads as terminal, which is the word every inline list kept forgetting", () => {
    expect(isTerminalStatus("completed_with_failures")).toBe(true);
  });

  it("covers the whole finished vocabulary, both spellings of cancelled included", () => {
    for (const status of [
      "done",
      "completed",
      "completed_with_failures",
      "failed",
      "halted",
      "cancelled",
      "canceled",
    ]) {
      expect({ status, terminal: isTerminalStatus(status) }).toEqual({ status, terminal: true });
    }
  });

  it("still says no to the states where work is genuinely live", () => {
    for (const status of ["queued", "running", "dispatched", "waiting_approval", "blocked"]) {
      expect({ status, terminal: isTerminalStatus(status) }).toEqual({ status, terminal: false });
    }
  });

  it("treats a status it has never heard of as live, so an unknown word is never silently parked", () => {
    expect(isTerminalStatus("some_status_added_next_year")).toBe(false);
  });
});

/*
 * AND THE HALF THAT WAS MISSING, FOUND BY MUTATION (S4-162).
 *
 * Every assertion above is about `isTerminalStatus`, which was ALWAYS RIGHT:
 * it carried `completed_with_failures` before the fix and carries it after.
 * The defect was that a CALL SITE did not ask it, and a test of the helper
 * cannot see a call site.
 *
 * Measured 2026-08-31: restoring the exact pre-fix literal at
 * `ci-poll-tick.ts:1100` left this file at 4 pass / 0 fail, and left all ten
 * files in the repository that name `ci-poll-tick` at 143 pass / 0 fail.
 * The commit that shipped the fix claimed "a fifth list written tomorrow
 * fails". It did not, and this is the assertion that makes it true.
 *
 * COMMENTS ARE STRIPPED BEFORE ASSERTING, which is this repository's own hard
 * lesson: a naive grep reads prose as code, and the comment above the fixed
 * line explains the defect it replaced. S2 demonstrated that false positive on
 * its own commit. Without the strip, a correct tree could fail here for
 * describing what it fixed.
 */
describe("no tick decides a mission is over from its own list of words", () => {
  const TICK = "src/routes/api/public/hooks/ci-poll-tick.ts";

  /** Source with block and line comments removed, so prose is never read as code. */
  const codeOf = (path: string): string =>
    readFileSync(path, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  it("asks the canonical helper at the park decision", () => {
    expect(codeOf(TICK)).toContain("isTerminalStatus(mStatus)");
  });

  it("carries no inline terminal-status list of its own", () => {
    // The shape, not the spelling: any array literal holding the finished
    // vocabulary and fed to .includes is a fifth list waiting to forget a word.
    expect(codeOf(TICK)).not.toMatch(/\[[^\]]*"(blocked|halted|cancelled|failed|completed)"[^\]]*\]\s*\.includes/);
  });
});
