import { describe, expect, it } from "bun:test";

import { howThisRan, tallyDrives } from "./how-this-ran";

describe("how this ran", () => {
  it("says nothing when there are no moves to count", () => {
    expect(howThisRan([])).toBeNull();
    expect(howThisRan(null)).toBeNull();
    expect(howThisRan(undefined)).toBeNull();
  });

  it("counts a loop-only route and refuses to call it unattended", () => {
    /*
     * `d1168015` is this shape, and a person answered three calls on it. The
     * sentence must not be shortenable to "nobody touched it", which is the
     * misreading F-79 exists to correct.
     */
    const line = howThisRan(["sweep", "sweep", "sweep", "sweep", "sweep", "sweep", "sweep"]);
    expect(line).toContain("All 7 moves");
    expect(line).toContain("by the loop on its own");
    expect(line).toContain("a call answered along the way is not one");
    for (const forbidden of ["unattended", "nobody", "no one", "no human", "without a person"]) {
      expect(line?.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("names a person's press rather than burying it in a total", () => {
    const line = howThisRan(["sweep", "press", "sweep"]);
    expect(line).toBe(
      "3 moves on this route: 2 by the loop on its own and 1 after somebody pressed Run it now.",
    );
  });

  it("drops the scope clause once a person is already named", () => {
    // The reader has been told somebody acted, so the caveat would be noise.
    expect(howThisRan(["sweep", "press"])).not.toContain("is not one");
  });

  it("does not fold an unrecorded move into the loop's count", () => {
    /*
     * `getTrackActivity`'s contract: `foreground` and null mean the row
     * predates the question, and "a surface must claim nothing about a person
     * for either." Counting them as sweep would turn every old track into a
     * clean run.
     */
    const t = tallyDrives(["sweep", "foreground", null]);
    expect(t).toEqual({ sweep: 1, press: 0, continuation: 0, unrecorded: 2, total: 3 });
    expect(howThisRan(["sweep", "foreground", null])).toContain("before the record kept who asked");
  });

  it("says the record is silent when every move predates it", () => {
    const line = howThisRan(["foreground", null]);
    expect(line).toBe("2 moves on this route, made before the record kept who asked for them.");
    expect(line).not.toContain("loop");
  });

  it("keeps the client's own continuation apart from a person acting", () => {
    // A leg that stopped because its window closed is not somebody pressing.
    const line = howThisRan(["press", "continuation", "continuation"]);
    expect(line).toContain("1 after somebody pressed Run it now");
    expect(line).toContain("2 carried on by itself");
  });

  it("reads as a sentence with a single move", () => {
    expect(howThisRan(["sweep"])).toContain("The only move on this route");
    expect(howThisRan(["press"])).toBe(
      "1 move on this route: 1 after somebody pressed Run it now.",
    );
  });
});

describe("what the moves cannot see", () => {
  const SWEPT: "sweep"[] = ["sweep", "sweep", "sweep", "sweep", "sweep", "sweep", "sweep"];

  it("keeps the caveat only while the answered count is unknown", () => {
    expect(howThisRan(SWEPT, null)).toContain("a call answered along the way is not one");
  });

  it("replaces the caveat with the fact once it can see one", () => {
    /*
     * `d1168015`: every move the loop's, and three calls a person decided
     * mid-run. This is the sentence that stops it reading as the acceptance.
     */
    const line = howThisRan(SWEPT, 3);
    expect(line).toBe(
      "All 7 moves on this route were made by the loop on its own. A person answered 3 calls along the way.",
    );
    expect(line).not.toContain("is not one");
  });

  it("says nobody answered only when it actually looked", () => {
    expect(howThisRan(SWEPT, 0)).toBe(
      "All 7 moves on this route were made by the loop on its own. Nobody answered a call along the way either.",
    );
  });

  it("never lets a read that has not landed read as nobody", () => {
    /*
     * The failure this guards is latency becoming a claim of autonomy on the
     * one screen where autonomy is the product.
     */
    expect(howThisRan(SWEPT, null)).not.toContain("Nobody answered");
  });

  it("counts one call as a phrase rather than a digit", () => {
    expect(howThisRan(SWEPT, 1)).toContain("A person answered one call along the way.");
  });

  it("adds the answer to a mixed route without qualifying it", () => {
    const line = howThisRan(["sweep", "press"], 2);
    expect(line).toContain("A person also answered 2 calls.");
    expect(line).not.toContain("is not one");
  });

  it("stays quiet about zero on a mixed route", () => {
    // A person is already named, so there is no autonomy claim to qualify.
    expect(howThisRan(["sweep", "press"], 0)).not.toContain("answered");
  });
});
