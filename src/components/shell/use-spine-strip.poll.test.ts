import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { stripPollMs } from "./use-spine-strip";

/**
 * THE STRIP ASKS LESS OFTEN WHEN NOBODY IS ANSWERING.
 *
 * `refetchInterval: 5000` with no error awareness is an unbounded retry loop in
 * disguise: in TanStack Query the interval and `retry` are independent, so
 * `retry` bounds attempts inside ONE fetch while the interval keeps scheduling
 * NEW ones whatever the query's state.
 *
 * `WorkspaceSpine` is mounted for the whole signed-in session, so this was every
 * screen in the product asking a dead backend twelve times a minute, hardest at
 * the moment it was least able to answer.
 *
 * A COST DEFECT, NOT AN HONESTY ONE. The strip says "count unavailable"
 * throughout and that stays true, so nothing claimed a state it did not have.
 * That is why the fix is arithmetic and changes no words on screen.
 */

const SRC = readFileSync("src/components/shell/use-spine-strip.ts", "utf8");

describe("stripPollMs", () => {
  it("is five seconds while the answer is arriving, because it is a live signal", () => {
    expect(stripPollMs(0)).toBe(5_000);
  });

  it("doubles as failures accumulate", () => {
    expect(stripPollMs(1)).toBe(10_000);
    expect(stripPollMs(2)).toBe(20_000);
    expect(stripPollMs(3)).toBe(40_000);
  });

  it("CAPS AT A MINUTE, so a long outage still notices recovery", () => {
    // Uncapped doubling drifts to hours and the strip would stay wrong long
    // after the backend came back.
    expect(stripPollMs(4)).toBe(60_000);
    expect(stripPollMs(50)).toBe(60_000);
    expect(stripPollMs(1000)).toBe(60_000);
  });

  it("NEVER STOPS, which is the whole design", () => {
    // Returning false would be the easy fix and the wrong one: the strip's
    // failure text is honest but useless, and a strip that gives up stays
    // wrong until the person navigates.
    for (const f of [0, 1, 5, 100]) {
      expect(typeof stripPollMs(f)).toBe("number");
      expect(stripPollMs(f)).toBeGreaterThan(0);
    }
  });

  it("returns to five seconds the moment one read succeeds", () => {
    // fetchFailureCount resets to 0 on success, so recovery is immediate
    // rather than walking back down the backoff.
    expect(stripPollMs(0)).toBe(5_000);
  });
});

describe("the query is wired to it", () => {
  it("reads the failure count rather than polling blind", () => {
    expect(SRC).toContain("refetchInterval: (query) => stripPollMs(query.state.fetchFailureCount)");
    // THE CODE FORM, not the phrase. The header above the fix quotes the old
    // line while explaining why it went, and a bare `toContain` on the phrase
    // counts that prose as code - the exact mistake this repo keeps paying for.
    expect(SRC).not.toContain("\n    refetchInterval: 5000,");
  });

  it("leaves the slow ambient poll alone", () => {
    // Pending outcomes is already 60s and is not the one that hammers.
    expect(SRC).toContain("refetchInterval: 60_000");
  });
});
