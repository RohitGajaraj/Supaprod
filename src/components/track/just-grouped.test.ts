import { describe, expect, it } from "bun:test";

import { justGrouped } from "./just-grouped";

describe("a piece of evidence joining a pattern", () => {
  it("animates when it moves from nowhere into a theme", () => {
    // The grouping itself, and the half that used to be silent: only a NEW
    // theme animated, so a pattern that already existed and gained a signal
    // showed nothing.
    expect(justGrouped("", "theme-a")).toBe(true);
  });

  it("animates when it moves from one theme to another", () => {
    expect(justGrouped("theme-a", "theme-b")).toBe(true);
  });

  it("never animates the first time it is seen", () => {
    /*
     * The first page of data is history, not an event. This is the
     * transcript's rule and the reason its `seen` set is primed on first
     * paint; without it, opening a track with fifty grouped signals plays
     * fifty entrances at once.
     */
    expect(justGrouped(undefined, "theme-a")).toBe(false);
    expect(justGrouped(undefined, "")).toBe(false);
  });

  it("never animates a signal leaving a theme", () => {
    // A real change, and not a grouping. Drawing the two the same way would
    // make an ungrouping look like the machine finding something.
    expect(justGrouped("theme-a", "")).toBe(false);
  });

  it("never animates a signal that has not moved, however often it is polled", () => {
    /*
     * The guard against a clock wearing a data field. Animating the STATE
     * "this signal has a theme" would fire on every poll forever, which
     * SPEC-PRESENCE forbids outright: no timers, no scripted sequences, and a
     * state the data cannot prove is a state you do not draw.
     */
    expect(justGrouped("theme-a", "theme-a")).toBe(false);
    expect(justGrouped("", "")).toBe(false);
  });
});
