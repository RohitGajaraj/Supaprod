/**
 * Mutation tests for the baseline comparison.
 *
 * Written because I could not run the browser version: another lane held port
 * 8080 while I was testing it, and committing a check I had not seen work is the
 * thing this whole harness exists to stop other people doing.
 */
import { describe, expect, it } from "bun:test";

import { compareToBaseline, type SurfaceNumbers } from "./baseline";

const clean: SurfaceNumbers = {
  failureSentences: 2,
  retries: 0,
  unnamed: 0,
  wideProse: 0,
  contrastBelow: 0,
};
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
      { failureSentences: 5, retries: 3, unnamed: 1, wideProse: 2, contrastBelow: 4 },
      base,
    );
    for (const key of ["failureSentences", "retries", "unnamed", "wideProse", "contrastBelow"]) {
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

/*
 * CONTRAST JOINED THESE CHECKS LATE, and adding it broke the "unchanged" case
 * here before it could reach anybody else: a baseline entry written before the
 * field existed has no `contrastBelow`, so the comparison read it as 0 and
 * called every surface a regression on its first run after the upgrade.
 *
 * That is the cost of a new check on a stored baseline, and it is worth one
 * test rather than one confusing night.
 */
describe("a check added after the baseline was written", () => {
  it("reports a surface whose stored entry predates the new field", () => {
    const line = compareToBaseline("/x", { ...clean, contrastBelow: 7 }, {
      "/x": { failureSentences: 2, retries: 0, unnamed: 0, wideProse: 0 },
    });
    expect(line).toContain("contrastBelow 0 -> 7 REGRESSED");
  });

  it("stays quiet when the stored entry carries the new field and matches", () => {
    const line = compareToBaseline("/x", { ...clean, contrastBelow: 7 }, {
      "/x": { failureSentences: 2, retries: 0, unnamed: 0, wideProse: 0, contrastBelow: 7 },
    });
    expect(line).toBeNull();
  });
});

/*
 * THE SAME PATH IS TWO PAGES. /learn signed out is the login screen.
 */
describe("a baseline taken in a different run mode", () => {
  it("refuses to compare rather than calling a redirect a regression", () => {
    const line = compareToBaseline(
      "/learn",
      { ...clean, contrastBelow: 0 },
      { "/learn": { failureSentences: 2, contrastBelow: 2, mode: "signed-in" } },
      "public",
    );
    expect(line).toContain("Not compared");
    expect(line).not.toContain("IMPROVED");
  });

  it("compares normally when the modes agree", () => {
    const line = compareToBaseline(
      "/learn",
      { ...clean, contrastBelow: 5 },
      { "/learn": { failureSentences: 2, retries: 0, unnamed: 0, wideProse: 0, contrastBelow: 2, mode: "signed-in" } },
      "signed-in",
    );
    expect(line).toContain("contrastBelow 2 -> 5 REGRESSED");
  });

  it("still compares when the baseline predates modes being recorded", () => {
    const line = compareToBaseline(
      "/learn",
      { ...clean, contrastBelow: 5 },
      { "/learn": { failureSentences: 2, retries: 0, unnamed: 0, wideProse: 0, contrastBelow: 2 } },
      "signed-in",
    );
    expect(line).toContain("REGRESSED");
  });
});
