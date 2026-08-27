import { describe, expect, it } from "bun:test";

import { needsALookLine } from "./crew-words";

/**
 * THE EXCEPTION SIGNAL THE ROSTER HELD AND NEVER DREW.
 *
 * `CrewRunTally.failed` is on every roster row. The card renders "Last worked
 * 44m ago" and nothing about how those runs went, and `stageFor` has no
 * "attention" state — it returns idle — so an agent whose runs are failing
 * looks exactly like a healthy quiet one. The card's own header already states
 * the rule this breaks: "if a person has to open each one to find out whether
 * any of them needs them, the surface has failed."
 */

describe("needsALookLine", () => {
  it("SAYS NOTHING at zero, because seventeen cards reading '0 did not finish' is noise", () => {
    expect(needsALookLine(0)).toBeNull();
  });

  it("names the exception when there is one", () => {
    expect(needsALookLine(3)).toBe("3 runs did not finish.");
  });

  it("counts one as one", () => {
    expect(needsALookLine(1)).toBe("1 run did not finish.");
  });

  it("refuses a value that is not a usable count rather than printing NaN", () => {
    // The same class as "Last worked null ago", which this file's neighbour was
    // written to prevent.
    expect(needsALookLine(null)).toBeNull();
    expect(needsALookLine(undefined)).toBeNull();
    expect(needsALookLine(Number.NaN)).toBeNull();
    expect(needsALookLine(-2)).toBeNull();
  });
});
