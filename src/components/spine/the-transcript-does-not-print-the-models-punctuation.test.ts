import { describe, expect, it } from "bun:test";

import { saidLine } from "./TrackActivity";

/**
 * MEASURED, WHICH IS WHY THIS TEST EXISTS AT ALL: on 2026-08-26, 1,375 of 2,771
 * `agent_runs.output` rows carried an em or en dash and the newest was written
 * that day. That column is the agent's line in the transcript, so about half of
 * every run in the product was showing punctuation the founder asked us to
 * remove, on his own workspace, and no scan of our source could see it.
 */
describe("the agent's own line", () => {
  const REAL =
    "No user-sourced signals exist for this — all search results were internal documents.";

  it("does not print the model's em dashes", () => {
    expect(saidLine(REAL)).not.toMatch(/[—–]/);
  });

  it("changes the punctuation and nothing else", () => {
    // The transcript's honesty rests on this line being what the agent said.
    // Compare the WORDS: if a future change starts rewriting prose, this fails.
    const words = (s: string) => s.replace(/[^A-Za-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
    expect(words(saidLine(REAL)!)).toEqual(words(REAL));
  });

  it("truncates after cleaning, not before", () => {
    /*
     * Cleaning can shorten the text, so truncating first would cut at a
     * character the sanitizer was about to remove and could leave a dash as the
     * last thing on screen.
     */
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
