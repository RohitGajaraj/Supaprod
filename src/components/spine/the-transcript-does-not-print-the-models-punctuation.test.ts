import { describe, expect, it } from "bun:test";

import { saidLine } from "./TrackActivity";

/**
 * MEASURED TWICE, AND THE SECOND MEASUREMENT IS THE POINT.
 *
 * 2026-08-26: 1,375 of 2,771 `agent_runs.output` rows carried an em dash the
 * model wrote. S0 wrapped seven write sites and backfilled, and the column then
 * read zero, so this guard was deleted.
 *
 * 2026-08-27: 9 dashed rows, ALL NINE written after that fix, newest at 23:30
 * UTC. The column total had answered a question about HISTORY while the write
 * path was still open, and a backfill is exactly what makes that total lie.
 *
 * So the rule this file protects is not "clean the column once". It is: the
 * transcript renders model prose, model prose keeps arriving, and until a count
 * of rows created SINCE the fix reads zero, the surface cleans on the way out.
 */
describe("the agent's own line", () => {
  const REAL =
    "No user-sourced signals exist for this — all search results were internal documents.";

  it("does not print the model's em dashes", () => {
    expect(saidLine(REAL)).not.toMatch(/[—–]/);
  });

  it("changes the punctuation and nothing else", () => {
    // The transcript's honesty rests on this being what the agent said.
    const words = (s: string) => s.replace(/[^A-Za-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
    expect(words(saidLine(REAL)!)).toEqual(words(REAL));
  });

  it("truncates after cleaning, not before", () => {
    const long = `${"word ".repeat(40)}— tail`;
    const out = saidLine(long)!;
    expect(out).not.toMatch(/[—–]/);
    expect(out.length).toBeLessThanOrEqual(163);
  });

  it("is idempotent, so a row cleaned on write is untouched here", () => {
    const once = saidLine(REAL)!;
    expect(saidLine(once)).toBe(once);
  });

  it("says nothing when the agent said nothing", () => {
    expect(saidLine(null)).toBeNull();
    expect(saidLine(undefined)).toBeNull();
    expect(saidLine("")).toBeNull();
  });
});
