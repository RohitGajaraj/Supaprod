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
  it("is twenty seconds, which is a ruled number rather than an inherited one", () => {
    /*
     * CHANGED FROM 5_000 ON 2026-08-31, and the old test's reason is the thing
     * that was wrong: it said "because it is a live signal". The strip is not a
     * live signal - it is a COUNT of where work sits, and the live signal is
     * the presence layer, which polls at 10s and answers a different question.
     *
     * Measured before changing it, service-role, hourly stage events:
     * 270/hour from 03:00 to 08:00 (F-151's spin), 109 at 09:00 as it stopped,
     * then 1, 1, 0, 4, 1 from 10:00 to 14:00. **The honest post-fix rate is
     * ~1.4 an hour.** At 5s the strip asked 720 times an hour on every surface
     * for a state that changes roughly once every 43 minutes.
     *
     * The 24-hour average would have said "one every 17 seconds" and justified
     * the old number - a window read as if it were a mechanism.
     */
    expect(stripPollMs(0)).toBe(20_000);
  });

  it("doubles as failures accumulate", () => {
    expect(stripPollMs(1)).toBe(40_000);
    expect(stripPollMs(2)).toBe(80_000);
    /* 20_000 * 2**3 is 160s, so `MAX_POLL_MS` clamps here. At the old 5s base
       it did not: 5_000 * 2**4 is 80s, UNDER the 120s ceiling, so the ramp was
       bound by `MAX_DOUBLINGS` and the ceiling never applied. Raising the base
       moved which of the two limits binds - see the next test. */
    expect(stripPollMs(3)).toBe(120_000);
  });

  it("CAPS, so a long outage still notices recovery", () => {
    // Uncapped doubling drifts to hours and the strip would stay wrong long
    // after the backend came back. The cap itself lives in `poll.ts`, shared
    // with every other live read, which is why this asserts the value rather
    // than restating the rule.
    /*
     * ── THE WORST CASE MOVED, AND PRETENDING IT DID NOT WAS THE FIRST DRAFT ──
     * These read 80_000 before the cadence ruling and now read 120_000, which
     * is `MAX_POLL_MS` in `poll.ts`. Both numbers come from the same unedited
     * helper: at a 5s base the ramp topped out at `5_000 * 2**4` = 80s and the
     * ceiling was never reached, so raising the base to 20s did not change the
     * cap - it changed WHICH LIMIT BINDS, from the doubling count to the cap.
     *
     * **A dead backend is therefore retried every 2 minutes rather than every
     * 80 seconds: a 40-second-worse recovery notice.** Recorded here rather
     * than smoothed over, because a cadence change that quietly slowed outage
     * recovery would be exactly the kind of cost that gets discovered later by
     * somebody staring at a stale strip.
     */
    expect(stripPollMs(4)).toBe(120_000);
    expect(stripPollMs(50)).toBe(120_000);
    expect(stripPollMs(1000)).toBe(120_000);
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

  it("returns to its base the moment one read succeeds", () => {
    // fetchFailureCount resets to 0 on success, so recovery is immediate
    // rather than walking back down the backoff.
    expect(stripPollMs(0)).toBe(20_000);
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

  it("backs the slow ambient poll off too", () => {
    // A minute is gentle, but on a dead backend it is still an unbounded loop
    // from every screen. The only argument for exempting it was that it is
    // merely a little wasteful.
    expect(SRC).toContain("pollMs(60_000, query.state.fetchFailureCount)");
  });

  it("DELEGATES to the shared helper rather than carrying its own arithmetic", () => {
    // Three partial answers to "how often should this ask again" existed in
    // this codebase and none of them backed off on failure. One place now.
    expect(SRC).toContain('from "@/components/shell/poll"');
    expect(SRC).toContain("return pollMs(20_000, failures);");
  });
});
