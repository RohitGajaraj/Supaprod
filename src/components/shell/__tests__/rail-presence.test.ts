import { describe, expect, it } from "bun:test";

import { deriveRailPresence } from "../rail-presence";

/**
 * The rail character may only show a state the shell's rows prove. These tests
 * pin both the honesty (no state without its rows) and the precedence (a
 * person being needed outranks work in flight, mirroring `deriveCharacter`).
 */
describe("the rail's presence is derived, never staged", () => {
  it("says nothing while the reads have not answered", () => {
    // The caller renders no mark at all while loading; the derivation must not
    // hand it one anyway.
    const state = deriveRailPresence({
      loading: true,
      feedDead: false,
      waitingOnYou: 3,
      missionsWorking: 1,
      tracksMoving: 2,
    });
    // Even mid-load with facts nominally present, an unread feed proves
    // nothing — out-of-touch is the honest answer, never awake.
    expect(state).toBe("out-of-touch");
  });

  it("admits a dead feed before claiming anything", () => {
    const state = deriveRailPresence({
      loading: false,
      feedDead: true,
      waitingOnYou: 0,
      missionsWorking: 0,
      tracksMoving: 0,
    });
    expect(state).toBe("out-of-touch");
  });

  it("turns to the person while a decision waits on them", () => {
    const state = deriveRailPresence({
      loading: false,
      feedDead: false,
      waitingOnYou: 1,
      missionsWorking: 0,
      tracksMoving: 0,
    });
    expect(state).toBe("asking");
  });

  it("a person being needed outranks work in flight", () => {
    const state = deriveRailPresence({
      loading: false,
      feedDead: false,
      waitingOnYou: 1,
      missionsWorking: 4,
      tracksMoving: 2,
    });
    expect(state).toBe("asking");
  });

  it("shows working while a mission has a worker", () => {
    const state = deriveRailPresence({
      loading: false,
      feedDead: false,
      waitingOnYou: 0,
      missionsWorking: 1,
      tracksMoving: 0,
    });
    expect(state).toBe("working");
  });

  it("shows working while a spine track moves inside the freshness window", () => {
    const state = deriveRailPresence({
      loading: false,
      feedDead: false,
      waitingOnYou: 0,
      missionsWorking: 0,
      tracksMoving: 1,
    });
    expect(state).toBe("working");
  });

  it("stays awake when nothing is provably happening", () => {
    const state = deriveRailPresence({
      loading: false,
      feedDead: false,
      waitingOnYou: 0,
      missionsWorking: 0,
      tracksMoving: 0,
    });
    expect(state).toBe("awake");
  });
});
