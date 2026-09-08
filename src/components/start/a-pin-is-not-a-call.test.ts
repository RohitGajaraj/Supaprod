/**
 * ON THE HOME, THE ONLY `you` STATE IS DRAWN BY A CALL.
 *
 * Fourth review, 2026-09-09. A pinned row wore `<StatusChip status="you">`
 * reading "First": the one colour on the page the design system defines as
 * "a person is required" (law 3), on the one row nobody was waiting on, in
 * the same column where Answer marks the rows that do need them. The pin is
 * a preference, so it is drawn as a tag (a category), not a pill (a status).
 *
 * Source-read, because the property is which component the pin uses, and a
 * render would pass with the wrong hue as happily as the right one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const RUNS_UI = strip(readFileSync("src/components/start/YourRuns.tsx", "utf8"));

describe("a pin is not a call", () => {
  it("draws no you-hued chip on the home's rows", () => {
    expect(RUNS_UI).not.toMatch(/StatusChip\s+status="you"/);
  });

  it("draws the pin as a tag, so the column keeps one meaning for the you hue", () => {
    expect(RUNS_UI).toContain('<RecordTag label="First" />');
  });

  it("names no station on a row's control", () => {
    /* R-01: no station name as a door. The held row's control read "Decide",
       the second stop on the map above it; it now names what it opens. */
    expect(RUNS_UI).not.toMatch(/"(Discover|Decide|Define|Design|Build|Ship|Learn)"\s*\}/);
    expect(RUNS_UI).toContain('"Why it stopped"');
  });
});
