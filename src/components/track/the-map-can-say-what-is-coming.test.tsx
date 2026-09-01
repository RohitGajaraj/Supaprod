/**
 * THE DEAD BRANCH, PROVED LIVE.
 *
 * `RunMap` has drawn a step graph for an opened station since 2026-08-20 and
 * heads it *"What ${name} intends to do"* when that station is `pending`. Every
 * producer of `RunMapStation` left `steps` unset -- `runPosition` on all six of
 * its shapes, `AskPlanGate.stopsForRoute` on all of its -- so in the shipping
 * product that heading could not be reached by any row. The goal's *"what it is
 * about to do"* was answered at STATION level only: the strip marked the next
 * stop and nothing said what that stop would do.
 *
 * The unit assertions on the derivation, and on everything it refuses to say,
 * are in `station-intent.test.ts`. THIS file asserts the one thing those cannot:
 * that a real track row, through the real `runPosition`, reaches the real
 * component and puts the words on screen. A derivation nothing renders is the
 * defect this repo files as "an index with no reader is half a feature", and it
 * is the exact shape the branch was already in.
 */
import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { runPosition } from "./run-position";
import { RunMap } from "@/components/meridian/RunMap";
import { AGENT_STATIONS, AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

type Arg = Parameters<typeof runPosition>[0];

function track(over: Partial<Arg> = {}): Arg {
  return {
    station: "define",
    status: "open",
    route: { path: [...AGENT_STATION_ORDER], waived: [] },
    holdReason: null,
    ...over,
  };
}

/** The live pane's own call: `TrackRun` renders `stops` in `live`/`stack`. */
function liveMap(t: Arg, walking = false) {
  const { stops } = runPosition(t, walking);
  return render(<RunMap stops={stops} mode="live" orientation="stack" label="The route" />);
}

describe("a reader can open a station ahead and see what it is about to do", () => {
  test("the station the work has not reached yet is pressable, and says it intends", () => {
    const { container } = liveMap(track({ station: "define" }));
    const build = [...container.querySelectorAll("li")].find((li) =>
      li.textContent?.includes(AGENT_STATIONS.build.name),
    ) as HTMLElement;
    const press = build.querySelector("button") as HTMLButtonElement;
    expect(press, "a station ahead offered nothing to open").toBeTruthy();

    fireEvent.click(press);

    // The heading is the branch that could not previously be reached.
    expect(screen.getByText(/intends to do/)).toBeTruthy();
    expect(screen.queryByText(/Build did/)).toBe(null);
    // ...and the steps under it are Build's real filing chain, in brief order.
    expect(screen.getByText("Staging the change")).toBeTruthy();
    expect(screen.getByText("Merging the pull request")).toBeTruthy();
  });

  test("no tool name reaches the screen, which is the map's standing law", () => {
    // `RunMap` bans one structurally by having no field to carry it. The step
    // labels are curated verbs for exactly this reason: `verbForTool`'s
    // fallback is `running ${tool}` and would have walked straight through.
    const { container } = liveMap(track({ station: "define" }));
    for (const press of container.querySelectorAll("button")) fireEvent.click(press);
    expect(container.textContent ?? "").not.toMatch(/studio\.|prd\.|signals\.|release\./);
  });

  test("the station being worked offers no plan to open", () => {
    // It may be part-way through its own brief already, and one row cannot say
    // how far. `RunTimeline` and `ToolStream` answer that, behind their own door.
    const { container } = liveMap(track({ station: "build" }), true);
    const build = [...container.querySelectorAll("li")].find((li) =>
      li.textContent?.includes(AGENT_STATIONS.build.name),
    ) as HTMLElement;
    expect(build.querySelector("button")).toBe(null);
  });

  test("a settled route opens nothing at all", () => {
    // `replay` is what `TrackRun` mounts once the run is over, and a finished
    // run promises no further work.
    const { stops } = runPosition(track({ station: "learn", status: "done" }), false);
    const { container } = render(<RunMap stops={stops} mode="replay" orientation="stack" />);
    expect(container.querySelector("button")).toBe(null);
  });
});
