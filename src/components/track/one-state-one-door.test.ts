/**
 * ── SHAPE 1: THREE DOORS FOR ONE STATE, TWO OF WHICH COULD NOT OPEN IT ────
 *
 * No single component was wrong. Each renders because its own condition is
 * true, and each knows nothing about the others. The screen was wrong, and only
 * the screen can be, which is why the decision is one function rather than four
 * edits.
 */
import { describe, expect, it } from "bun:test";

import { oneDoorFor, composerPromiseFor, type HoldFacts } from "./one-door-for-one-state";

const facts = (over: Partial<HoldFacts> = {}): HoldFacts => ({
  hold: "needs-evidence",
  hasConnection: false,
  connectionIsBound: false,
  productName: "Relay",
  ...over,
});

describe("one state gets one door", () => {
  it("says point, not connect, when a connection exists and is unbound", () => {
    // The honest run's case. "Connect a source" to somebody who has connected
    // reads as the product not knowing what it has.
    expect(oneDoorFor(facts({ hasConnection: true, connectionIsBound: false }))).toEqual({
      door: "point-a-source",
      label: "Point a source at Relay",
    });
  });

  it("says connect only when there is genuinely nothing connected", () => {
    expect(oneDoorFor(facts({ hasConnection: false }))).toEqual({
      door: "connect-a-source",
      label: "Connect a source",
    });
  });

  it("draws NO door when the source is wired and simply has nothing to say", () => {
    // A screen that always finds a door to draw is back to shape 1.
    expect(oneDoorFor(facts({ hasConnection: true, connectionIsBound: true }))).toEqual({
      door: "none",
    });
  });

  it("draws no door for a state that is not stuck on evidence", () => {
    for (const hold of ["produced-nothing", "paused", "out-of-credit", null]) {
      expect(oneDoorFor(facts({ hold })).door).toBe("none");
    }
  });

  it("names the product, because a door without it is an instruction", () => {
    expect(oneDoorFor(facts({ hasConnection: true, productName: null })).door).toBe(
      "point-a-source",
    );
    expect(
      (oneDoorFor(facts({ hasConnection: true, productName: null })) as { label: string }).label,
    ).toBe("Point a source at this");
  });
});

describe("the second promise moves to the composer rather than being dropped", () => {
  it("offers R-36's own words where the typing happens", () => {
    // A button would only announce the offer; the placeholder makes it at the
    // moment it can be accepted.
    expect(composerPromiseFor(facts())).toBe("Say what you know, and it carries on from that");
    expect(composerPromiseFor(facts({ hold: "carried-on-your-sentence" }))).toBe(
      "Say what you know, and it carries on from that",
    );
  });

  it("says nothing when nothing is stuck", () => {
    // A placeholder that changes when nothing is stuck is noise.
    expect(composerPromiseFor(facts({ hold: "produced-nothing" }))).toBeNull();
    expect(composerPromiseFor(facts({ hold: null }))).toBeNull();
  });
});
