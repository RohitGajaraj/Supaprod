import { describe, expect, it } from "bun:test";

import { stationProgress } from "./station-progress";

const COUNT = 7; // Discover Decide Plan Design Build Ship Learn

/**
 * The path the "When it breaks" tab actually plays, read off FAIL_LOG. It is
 * the whole reason this module exists: the run works Build, gets corrected
 * back to Plan, walks forward through Design to Build again, then ships.
 */
const FAILURE_PATH = [4, 4, 4, 4, 2, 3, 4, 4, 4, 5, 6];

describe("stationProgress", () => {
  it("reports no position before the trace starts", () => {
    const p = stationProgress([], COUNT);
    expect(p.at).toBe(-1);
    expect(p.returned).toBe(false);
    expect(p.visits).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("counts consecutive steps inside one station as a single visit", () => {
    // Otherwise the tally would report how chatty a station is rather than
    // how many times the run came back to it, and Build would read x4 on a
    // run that never left it.
    const p = stationProgress([4, 4, 4, 4], COUNT);
    expect(p.visits[4]).toBe(1);
    expect(p.returned).toBe(false);
    expect(p.at).toBe(4);
  });

  it("walks a clean forward run with every station visited once", () => {
    const p = stationProgress([0, 1, 2, 3, 4, 5, 6], COUNT);
    expect(p.visits).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(p.returned).toBe(false);
    expect(p.at).toBe(6);
  });

  /**
   * The guard on the whole point of the redesign. If this ever goes back to a
   * high-water mark, `returned` goes false and the strip silently stops
   * showing that the loop came back, which is the claim the section exists to
   * make.
   */
  it("records the second visit to Build on the failure path", () => {
    const p = stationProgress(FAILURE_PATH, COUNT);
    expect(p.visits[4]).toBe(2);
    expect(p.returned).toBe(true);
    expect(p.at).toBe(6);
  });

  it("puts the cursor BEHIND stations the correction undid, mid-retreat", () => {
    // Frozen at the moment the run has just been sent back to Plan. Build has
    // been worked once but now sits AHEAD of the cursor, so the strip renders
    // it faint again: it is unfinished once more, which is what happened.
    const p = stationProgress([4, 4, 4, 4, 2], COUNT);
    expect(p.at).toBe(2);
    expect(p.visits[4]).toBe(1);
    expect(p.at).toBeLessThan(4);
  });

  it("skips entries that carry no station instead of reading them as Discover", () => {
    // Log entries that are not station work have a null station. Treating
    // null as 0 would drag the cursor back to Discover on every one of them.
    const p = stationProgress([2, null, undefined, 3], COUNT);
    expect(p.at).toBe(3);
    expect(p.visits[0]).toBe(0);
    expect(p.visits[2]).toBe(1);
    expect(p.visits[3]).toBe(1);
  });

  it("ignores an out-of-range station rather than clamping it", () => {
    // Clamping would light a real station the run never touched, turning a
    // bug in the log into a false statement on a public page.
    const p = stationProgress([1, 99, -4, 2.5, 2], COUNT);
    expect(p.visits).toEqual([0, 1, 1, 0, 0, 0, 0]);
    expect(p.at).toBe(2);
  });

  it("returns a tally sized to the station list", () => {
    expect(stationProgress([], COUNT).visits).toHaveLength(COUNT);
    expect(stationProgress([], 0).visits).toHaveLength(0);
  });
});
