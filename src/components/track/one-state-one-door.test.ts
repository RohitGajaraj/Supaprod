/**
 * ── SHAPE 1: THREE DOORS FOR ONE STATE, TWO OF WHICH COULD NOT OPEN IT ────
 *
 * No single component was wrong. Each renders because its own condition is
 * true, and each knows nothing about the others. The screen was wrong, and only
 * the screen can be, which is why the decision is one function rather than four
 * edits.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { oneDoorFor, composerPromiseFor, type HoldFacts } from "./one-door-for-one-state";
import { waitingOnTime } from "./a-calendar-wait-is-not-a-stoppage";

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

describe("the promise is only made where it is true", () => {
  /**
   * A1, from the 19:42 read, and it is a real bug in the first version rather
   * than a preference. `needs-evidence` means two different things at two
   * stations:
   *
   *   at Sense   the workspace holds nothing about the person's sentence, and
   *              what they type genuinely carries the work on.
   *   at Learn   the forecast's horizon has not arrived, and NOTHING carries on
   *              until the date, whatever anybody types.
   *
   * Offering "and it carries on from that" at Learn is false in the most
   * expensive direction: it invites a person to do work that changes nothing
   * and then look like it was ignored.
   */
  it("offers it at Sense, where typing does carry the work on", () => {
    expect(composerPromiseFor(facts({ station: "sense" }))).toBe(
      "Say what you know, and it carries on from that",
    );
  });

  it("says nothing at Learn, because nothing carries on until the date", () => {
    expect(composerPromiseFor(facts({ station: "learn" }))).toBeNull();
  });

  it("still offers it when the station is unknown", () => {
    // Sense is the common case for this hold and the promise is true there.
    expect(composerPromiseFor(facts({ station: null }))).not.toBeNull();
  });
});

describe("the header says one word for one state", () => {
  it("gives a calendar wait the board's own word", async () => {
    /*
     * The header said "On hold" while the footer said "Learn returns ..." and
     * the pane said the same, which is §12's stated failure: one state named
     * two ways. "Waiting on time" is `tracks-feed`'s word, reused rather than
     * invented, so the header, the board, the footer and the pane agree.
     */
    const { runStatus } = await import("./run-status");
    const track = {
      station: "learn",
      holdReason: "needs-evidence",
      status: "open",
      title: "t",
    } as unknown as Parameters<typeof runStatus>[0];
    const s = runStatus(track, false, "2099-01-01T00:00:00.000Z");
    expect(s?.word).toBe("Waiting on time");
    expect(s?.pulse).toBe(false);
  });

  it("does NOT claim a calendar wait once the horizon has passed", () => {
    // The same overdue case the footer already guards.
    expect(
      waitingOnTime({
        station: "learn",
        holdReason: "needs-evidence",
        horizon: "2020-01-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });
});

describe("the door is derived from the binding, not from the source count", () => {
  /**
   * My first wiring took `hasConnection` from `sourceVerdict`, and it was wrong
   * twice over.
   *
   * `scout_targets` has NO `product_id` column: a scout is workspace-scoped, so
   * it cannot answer "is anything pointed at THIS product", which is the whole
   * question the verb turns on. And the door was gated on `offerToConnect`,
   * which is true only for `no-sources`, so the "Point a source" case, the case
   * the honest run actually hit, would never have rendered a door at all.
   *
   * `connection_bindings` carries `product_id` and `listProductBindings`
   * already reads it. These assertions pin the three states apart so the two
   * facts cannot be collapsed back into one again.
   */
  it("points when a connector exists and nothing is bound to this product", () => {
    expect(
      oneDoorFor(facts({ hasConnection: true, connectionIsBound: false, productName: "Relay" })),
    ).toEqual({ door: "point-a-source", label: "Point a source at Relay" });
  });

  it("connects only when there is genuinely no connector", () => {
    expect(oneDoorFor(facts({ hasConnection: false, connectionIsBound: false })).door).toBe(
      "connect-a-source",
    );
  });

  it("draws nothing when a connector is bound and simply has nothing to say", () => {
    expect(oneDoorFor(facts({ hasConnection: true, connectionIsBound: true })).door).toBe("none");
  });
});

/**
 * ── A READ THAT FAILED IS NOT "THERE IS NONE" ────────────────────────────────
 *
 * `hasConnection` and `connectionIsBound` come from two queries on the run
 * screen, and a failed one used to arrive as `false`. That sends this function
 * to "Connect a source" -- the exact sentence this file's own header calls
 * wrong when somebody has already connected one. The bound case was fixed and
 * the UNREAD case kept producing the same wrong door.
 */
describe("a fact nobody could read draws no door", () => {
  it("draws nothing when the connections read failed", () => {
    expect(oneDoorFor(facts({ hasConnection: null, connectionIsBound: false }))).toEqual({
      door: "none",
    });
  });

  it("draws nothing when the bindings read failed, even with a connection", () => {
    expect(oneDoorFor(facts({ hasConnection: true, connectionIsBound: null }))).toEqual({
      door: "none",
    });
  });

  /*
   * THE MIRROR (law 12). "Null draws nothing" passes just as well if EVERY
   * input drew nothing, which would remove the door from the one state it
   * exists for. The two real answers are asserted in the same breath.
   */
  it("still draws the right door when both facts were actually read", () => {
    expect(oneDoorFor(facts({ hasConnection: false, connectionIsBound: false })).door).toBe(
      "connect-a-source",
    );
    expect(oneDoorFor(facts({ hasConnection: true, connectionIsBound: false })).door).toBe(
      "point-a-source",
    );
    expect(oneDoorFor(facts({ hasConnection: true, connectionIsBound: true })).door).toBe("none");
  });

  it("the composer's promise is untouched by an unread connection", () => {
    // It offers a sentence, not an instruction about connectors, so a fact
    // nobody could read does not change what it can honestly say.
    expect(composerPromiseFor(facts({ hasConnection: null, connectionIsBound: null }))).toBe(
      "Say what you know, and it carries on from that",
    );
  });
});

/**
 * THE ONE THING THE PURE FUNCTION CANNOT SAY. `boolean` is assignable to
 * `boolean | null`, so the pane can drop its failure check and every test
 * above still passes and tsc still reports zero. The wiring has to be asked
 * about directly, or the fix is one careless edit from being undone in
 * silence.
 */
describe("the pane passes the failure through, not a false zero", () => {
  const PANE = readFileSync("src/components/track/ArtifactPane.tsx", "utf8");

  it("reports an unread connection as unknown rather than as none", () => {
    const at = PANE.indexOf("const door = oneDoorFor({");
    expect(at).toBeGreaterThan(-1);
    const call = PANE.slice(at, PANE.indexOf("});", at));
    expect(call).toContain("connections.isError ? null :");
    expect(call).toContain("bindings.isError ? null :");
  });
});
