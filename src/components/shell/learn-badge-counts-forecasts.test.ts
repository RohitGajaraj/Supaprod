import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE LEARN BADGE COUNTS THE THING THE PRODUCT IS ABOUT.
 *
 * It counted only shipped specs with no outcome recorded. Measured 2026-08-27
 * by S1: 0 of 21 shipped specs are unsettled, so the badge was correctly quiet
 * - and 15 decision forecasts sit past their horizon with no verdict written,
 * which nothing outside /learn surfaced.
 *
 * A forecast with no verdict is the moat: what a team believed would happen,
 * recorded before the outcome was known. A station badge silent while fifteen
 * come due is silent about the only thing that station is for.
 */

const SRC = readFileSync("src/components/shell/use-spine-strip.ts", "utf8");
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("the count", () => {
  it("USES `total`, NEVER THE PAGE LENGTH", () => {
    // `listDueForecastsImpl` selects with `count: "exact"` AND
    // `.limit(DUE_FORECAST_PAGE)`. The array is one page; the count is the
    // population. Rendering the page as the number is the defect S1 measured
    // across the approvals queue the same day: 116 pending gates behind a limit
    // of 100, and every surface said 100.
    expect(code).toContain("dueForecasts.data?.total");
    expect(code).not.toContain("dueForecasts.data?.due.length");
  });

  it("is BOTH READS OR NEITHER, never a total assembled from half", () => {
    // This line has no room to say which half is missing, and a partial total
    // presented as a total is the defect this lane spent the day removing.
    expect(code).toContain("if (specs === undefined || forecasts === undefined) return null;");
  });

  it("stays silent rather than claiming zero when a read has not answered", () => {
    // `?? 0` feeds the existing `> 0` guard, so an unanswered read draws
    // nothing. That is what the hook already did when the outcome read failed.
    expect(code).toContain("const pendingCount = outcomesDue ?? 0;");
  });
});

describe("the read", () => {
  it("SHARES THE DESK'S QUERY KEY, so three readers cannot disagree", () => {
    // `ForecastDeskPanel` and the inbox already read `["forecast-due"]`.
    // A third reader on the same key costs one fetch.
    expect(code).toContain('queryKey: ["forecast-due"]');
    const desk = readFileSync("src/components/learn/ForecastDeskPanel.tsx", "utf8");
    expect(desk).toContain('queryKey: ["forecast-due"]');
  });

  it("backs off like every other live read in this lane", () => {
    expect(code).toContain("pollMs(60_000, query.state.fetchFailureCount)");
  });
});

describe("the word", () => {
  it("still says outcomes, which is what both of them are", () => {
    // A shipped spec with no outcome and a forecast past its horizon are the
    // same act for the person: write down what actually happened.
    expect(SRC).toContain('"outcome" : "outcomes"');
  });
});
