import { describe, expect, it } from "bun:test";
import { resumeSeatFrom, stationCrew } from "./driver";
import { TICK_DEADLINE_MS } from "./track-caps.server";

/**
 * The spine drives up to five tracks per tick under ONE shared deadline, and a
 * station is a crew of up to three agent dispatches. Before the seat cursor, the
 * crew loop began at its first seat every time, so a station that did not fit in
 * the window left to it paid for a seat, broke on the clock, and started that
 * same seat again on the next tick. It never finished and it never stopped
 * spending.
 *
 * Measured 2026-08-22 on the only real workspace holding tracks: all four
 * holding `out-of-time`, `attempts` still 0, spend_used_usd 0.093 / 0.054 /
 * 0.022, driven_at within one second of each other, across ten consecutive ticks
 * running 46s to 107s against a 45s deadline. `attempts` stays 0 because running
 * out of OUR time is correctly not the track's fault, which is also why
 * MAX_STATION_ATTEMPTS never tripped and nothing ever called the track stuck.
 */
describe("resumeSeatFrom", () => {
  it("resumes at the seat the clock stopped us before reaching", () => {
    expect(resumeSeatFrom(1, 3)).toBe(1);
    expect(resumeSeatFrom(2, 3)).toBe(2);
  });

  it("starts at the first seat for a track that was never interrupted", () => {
    expect(resumeSeatFrom(0, 3)).toBe(0);
    expect(resumeSeatFrom(null, 3)).toBe(0);
    expect(resumeSeatFrom(undefined, 3)).toBe(0);
  });

  /**
   * The clamp, and the reason it fails toward repeating work rather than
   * skipping it. A crew that got shorter between deploys leaves a cursor past
   * its own end; honouring that would run no seats at all and let the station
   * advance on work that never happened. Repeating a seat costs money, which is
   * recoverable. A station that reports itself done without running is not.
   */
  it("restarts the crew rather than skipping it when the cursor is out of range", () => {
    expect(resumeSeatFrom(3, 3)).toBe(0);
    expect(resumeSeatFrom(9, 3)).toBe(0);
    expect(resumeSeatFrom(1, 1)).toBe(0);
  });

  it("treats nonsense as the first seat", () => {
    expect(resumeSeatFrom(-1, 3)).toBe(0);
    expect(resumeSeatFrom(1.9, 3)).toBe(1);
    expect(resumeSeatFrom(Number.NaN, 3)).toBe(0);
  });

  /**
   * The premise, asserted so this test fails loudly if the shape that made the
   * livelock possible ever goes away. A cursor is only worth persisting while a
   * station really can cost more than the window it shares.
   */
  it("still guards a real multi-seat station under a finite deadline", () => {
    expect(TICK_DEADLINE_MS).toBeGreaterThan(0);
    const multiSeat = (["sense", "decide", "plan", "build"] as const).some(
      (s) => stationCrew(s).length > 1,
    );
    expect(multiSeat).toBe(true);
  });
});
