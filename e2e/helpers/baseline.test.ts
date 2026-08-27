/**
 * Mutation tests for the baseline comparison.
 *
 * Written because I could not run the browser version: another lane held port
 * 8080 while I was testing it, and committing a check I had not seen work is the
 * thing this whole harness exists to stop other people doing.
 */
import { describe, expect, it } from "bun:test";

import { compareToBaseline, type SurfaceNumbers } from "./baseline";

const clean: SurfaceNumbers = { failureSentences: 2, retries: 0, unnamed: 0, wideProse: 0 };
const base = { "/today": { ...clean } };

describe("the baseline comparison", () => {
  it("says nothing when a surface is unchanged, so a quiet run means quiet", () => {
    expect(compareToBaseline("/today", clean, base)).toBeNull();
  });

  it("calls a rise a REGRESSION and names both numbers", () => {
    const line = compareToBaseline("/today", { ...clean, failureSentences: 5 }, base);
    expect(line).toContain("failureSentences 2 -> 5");
    expect(line).toContain("REGRESSED");
  });

  it("calls a fall an IMPROVEMENT, because a fix should be visible too", () => {
    const line = compareToBaseline("/today", { ...clean, failureSentences: 1 }, base);
    expect(line).toContain("IMPROVED");
    expect(line).not.toContain("REGRESSED");
  });

  it("reports every check that moved, not just the first", () => {
    const line = compareToBaseline(
      "/today",
      { failureSentences: 5, retries: 3, unnamed: 1, wideProse: 2 },
      base,
    );
    for (const key of ["failureSentences", "retries", "unnamed", "wideProse"]) {
      expect(line).toContain(key);
    }
  });

  it("names a surface with NO baseline entry instead of calling it a regression", () => {
    const line = compareToBaseline("/brand-new", clean, base);
    expect(line).toContain("no baseline entry");
    expect(line).not.toContain("REGRESSED");
  });

  it("treats a missing CHECK on an existing entry as zero rather than crashing", () => {
    const partial = { "/today": { failureSentences: 2 } };
    const line = compareToBaseline("/today", { ...clean, unnamed: 1 }, partial);
    expect(line).toContain("unnamed 0 -> 1 REGRESSED");
  });
});
