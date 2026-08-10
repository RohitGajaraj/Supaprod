import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "bun:test";

import { StationSpine } from "../Replay";
import { stationProgress } from "../station-progress";

/**
 * The strip is the landing page's claim that the loop is not a line, so these
 * assert what a READER can see, not what the reducer computed. station-progress
 * .test.ts already guards the maths; if that passed while the strip still
 * rendered every station identically, the page would go on making a claim it
 * does not show, which is the exact defect this work fixed.
 *
 * Colours are compared to each other rather than to literals. The point is
 * never "Build is #565c66", it is "Build reads the same as a station the run
 * never touched", and that survives a palette change.
 */

const COUNT = 7;
const FAILURE_PATH = [4, 4, 4, 4, 2, 3, 4, 4, 4, 5, 6];
/** Frozen the instant the correction sends the run back to Plan. */
const MID_RETREAT = [4, 4, 4, 4, 2];

/**
 * Station labels are uppercased by CSS (`textTransform`), so `textContent`
 * carries the source case: "Plan", not "PLAN". The first draft of this file
 * keyed on the uppercase form, which made every lookup `undefined` and turned
 * `expect(c.BUILD).toBe(c.DISCOVER)` into `undefined === undefined` -- a test
 * that passed while asserting nothing. Hence `colourOf`, which throws on a
 * name it cannot find rather than handing back a silent undefined.
 */
function colourOf(station: string): string {
  const li = screen
    .getAllByRole("listitem")
    .find((el) => (el.querySelector("span")?.textContent ?? "").trim() === station);
  if (!li) throw new Error(`no station labelled ${station}`);
  return (li.querySelector("span") as HTMLElement).style.color;
}

describe("StationSpine", () => {
  it("dims the work a correction undid, mid-retreat", () => {
    render(<StationSpine progress={stationProgress(MID_RETREAT, COUNT)} live />);

    // Discover was never entered on this path, so it is the reference for
    // "not done". Build WAS worked, then the correction sent the run behind
    // it, so Build must read as unfinished again rather than staying lit.
    expect(colourOf("Build")).toBe(colourOf("Discover"));
    // Plan is where the run is now, so it must not read like either.
    expect(colourOf("Plan")).not.toBe(colourOf("Discover"));
    expect(colourOf("Plan")).not.toBe(colourOf("Design"));
  });

  it("marks the station being worked for assistive tech", () => {
    render(<StationSpine progress={stationProgress(MID_RETREAT, COUNT)} live />);
    const current = screen.getAllByRole("listitem").filter((li) => li.getAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent ?? "").toContain("Plan");
  });

  it("says out loud that Build was worked twice", () => {
    render(<StationSpine progress={stationProgress(FAILURE_PATH, COUNT)} live={false} />);
    const build = screen
      .getAllByRole("listitem")
      .find((li) => (li.querySelector("span")?.textContent ?? "").trim() === "Build");
    expect(build).toBeDefined();
    expect(build?.textContent ?? "").toContain("2");
    expect(build?.querySelector("[title]")?.getAttribute("title")).toMatch(/came back/i);
  });

  it("stays quiet on a run that never doubles back", () => {
    // The count is a fact about a particular run, not chrome. A clean forward
    // pass must render exactly as it did before this feature existed.
    render(<StationSpine progress={stationProgress([0, 1, 2, 3, 4, 5, 6], COUNT)} live={false} />);
    for (const li of screen.getAllByRole("listitem")) {
      expect(li.querySelector("[title]")).toBeNull();
    }
  });

  it("draws no connector between stations", () => {
    // The connectors asserted an edge between each pair of neighbours while
    // the failure path's busiest move, Build straight back to Plan, had none.
    render(<StationSpine progress={stationProgress(FAILURE_PATH, COUNT)} live={false} />);
    expect(screen.getByRole("list").querySelectorAll("[aria-hidden]")).toHaveLength(0);
  });

  it("settles rather than holding the working colour once the run ends", () => {
    const progress = stationProgress(FAILURE_PATH, COUNT);
    render(<StationSpine progress={progress} live={false} />);
    // Learn is the cursor, but nothing is running, so it must read as finished
    // rather than as permanently in progress.
    expect(colourOf("Learn")).toBe(colourOf("Ship"));
    expect(
      screen.getAllByRole("listitem").filter((li) => li.getAttribute("aria-current")),
    ).toHaveLength(0);
  });
});
