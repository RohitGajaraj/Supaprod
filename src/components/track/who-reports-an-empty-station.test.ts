import { describe, expect, it } from "bun:test";

import { panelSaysItFiledNothing } from "./who-reports-an-empty-station";
import { HOLD_LINE } from "@/lib/spine/driver";

describe("who reports an empty station", () => {
  it("stays quiet under a hold line that already says it filed nothing", () => {
    /*
     * 12 tracks are held at `produced-nothing` and all twelve have no member at
     * their current station, so the panel and the hold line were saying the
     * same thing to every one of them.
     */
    expect(panelSaysItFiledNothing("produced-nothing")).toBe(false);
  });

  it("stays quiet under the two hold lines that say the OPPOSITE", () => {
    /*
     * Both open "This station filed something". Against a panel saying "filed
     * no spec" that is a contradiction rather than a repeat, and a reader
     * cannot tell which is true. Latent today only because the one
     * `nothing-to-hand-on` track happens to have a member.
     */
    for (const reason of ["nothing-to-hand-on", "self-check-failed"]) {
      expect(panelSaysItFiledNothing(reason)).toBe(false);
      expect(HOLD_LINE[reason as keyof typeof HOLD_LINE]).toContain("filed something");
    }
  });

  it("speaks when there is no hold at all, which is the common case", () => {
    expect(panelSaysItFiledNothing(null)).toBe(true);
    expect(panelSaysItFiledNothing(undefined)).toBe(true);
    expect(panelSaysItFiledNothing("")).toBe(true);
  });

  it("speaks under every hold whose line is about something else", () => {
    // "Plan ran and filed no spec" beside "Everything is paused for this
    // workspace" is a station and a cause, and a person needs both.
    for (const reason of ["paused", "no-agent", "out-of-credit", "waiting-on-a-person"]) {
      expect(panelSaysItFiledNothing(reason)).toBe(true);
    }
  });

  it("is silent about a reason it has never seen, rather than guessing", () => {
    // `last_hold` is a text column, so a value from a newer deploy must not
    // suppress a sentence the panel is still the only source of.
    expect(panelSaysItFiledNothing("something-nobody-has-written-yet")).toBe(true);
  });

  it("keys on the reason and not on the words, which S0 may rewrite", () => {
    /*
     * The hold lines are S0's to reword. This rule survives any rewrite because
     * it never reads them; the assertion above that they contain "filed
     * something" is a check on THEIR text, deliberately in a test rather than
     * in the rule.
     */
    expect(HOLD_LINE["produced-nothing"]).toContain("filed nothing");
  });
});
