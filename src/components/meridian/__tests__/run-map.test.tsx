/**
 * THE MAP TURNS AN UNENFORCED POLICY INTO A CONTROL, so that is what this pins.
 *
 * A founder ruling has required since 2026-08 that a skipped station is a
 * DECISION ON THE RECORD WITH A REASON rather than a silent omission.
 * `SpineRoute.waived` has carried the shape of it all along and nothing ever
 * asked a person for one. The assertions that matter here are therefore not
 * about layout: they are that the removal cannot complete without a reason, that
 * a waiver arriving without one admits it, and that no tool name can reach the
 * rendered output.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";

import { RunMap, type RunMapStation } from "../RunMap";
import { GLYPH_FOR_STATION } from "../station-glyphs";
import { HOLD_LINE, holdLine } from "@/lib/spine/driver";
import { AGENT_STATIONS, AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

const SOURCE = readFileSync("src/components/meridian/RunMap.tsx", "utf8");
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/** The whole loop, which is the case the spine is widest on. */
const SEVEN: RunMapStation[] = AGENT_STATION_ORDER.map((station, i) => ({
  station,
  state: i === 0 ? "done" : i === 1 ? "active" : "pending",
  outcome: i === 0 ? "Read Intercom and PostHog for verify-step drop-off" : undefined,
}));

/** A route that skips four, which is the common shape for existing-feature work. */
const THREE: RunMapStation[] = [
  {
    station: "define",
    state: "done",
    outcome: "Wrote the firmware reboot notice spec, with the outage precedent cited",
  },
  { station: "build", state: "active", outcome: "Writing the notice component" },
  { station: "ship", state: "pending" },
];

const noop = () => {};
const stopEls = (c: HTMLElement) => [...c.querySelectorAll("li")];

describe("it draws a route of any length", () => {
  it("renders all seven stations, in loop order, by name", () => {
    const { container } = render(<RunMap stops={SEVEN} />);
    expect(stopEls(container).length).toBe(7);
    const names = AGENT_STATION_ORDER.map((s) => AGENT_STATIONS[s].name);
    for (const name of names) expect(screen.getByText(name)).toBeTruthy();
  });

  it("renders a three-station route without inventing the four it skips", () => {
    const { container } = render(<RunMap stops={THREE} />);
    expect(stopEls(container).length).toBe(3);
    // The route is what it is. A map that padded it back to seven would be
    // asserting stations this work never had.
    expect(screen.queryByText(AGENT_STATIONS.sense.name)).toBe(null);
    expect(screen.queryByText(AGENT_STATIONS.learn.name)).toBe(null);
  });

  it("says so when there is no route at all, rather than drawing an empty rail", () => {
    const { container } = render(<RunMap stops={[]} />);
    expect(screen.getByText("This work has no route yet.")).toBeTruthy();
    // `data-mrd` on the early return too, which is exactly how it gets lost.
    expect(container.querySelector("[data-mrd]")).toBeTruthy();
  });

  it("draws each station as its own mark rather than as a colour", () => {
    const { container } = render(<RunMap stops={SEVEN} />);
    // Seven glyphs, one per stop, all on the shared 24-grid at one size.
    const marks = [...container.querySelectorAll("svg")].filter(
      (s) => s.getAttribute("width") === "16",
    );
    expect(marks.length).toBe(7);
    for (const m of marks) expect(m.getAttribute("viewBox")).toBe("0 0 24 24");
  });
});

describe("a station comes off the route only with a reason", () => {
  const openWaive = (onWaive: (s: string, r: string) => void) => {
    render(<RunMap stops={THREE} mode="editable" onWaive={onWaive} />);
    const row = screen.getByText(AGENT_STATIONS.ship.name).closest("li") as HTMLElement;
    fireEvent.click(
      [...row.querySelectorAll("button")].find((b) => b.textContent === "Take it off")!,
    );
    return screen.getByText(AGENT_STATIONS.ship.name).closest("li") as HTMLElement;
  };

  it("asks why, and will not commit until it has an answer", () => {
    let taken: unknown = null;
    const row = openWaive((s, r) => (taken = [s, r]));
    const submit = [...row.querySelectorAll("button")].find(
      (b) => b.textContent === "Take it off the route",
    ) as HTMLButtonElement;
    expect(submit, "the reason form did not open").toBeTruthy();
    expect(submit.disabled, "an empty reason was accepted").toBe(true);
    fireEvent.click(submit);
    expect(taken, "a station came off the route with no reason").toBe(null);
  });

  it("commits the station and its reason, trimmed", () => {
    let taken: unknown = null;
    const row = openWaive((s, r) => (taken = [s, r]));
    fireEvent.change(row.querySelector("input") as HTMLInputElement, {
      target: { value: "  Nothing customer visible ships this week  " },
    });
    fireEvent.click(
      [...row.querySelectorAll("button")].find((b) => b.textContent === "Take it off the route")!,
    );
    expect(taken).toEqual(["ship", "Nothing customer visible ships this week"]);
  });

  it("refuses whitespace, which is a reason nobody gave", () => {
    let taken: unknown = null;
    const row = openWaive((s, r) => (taken = [s, r]));
    fireEvent.change(row.querySelector("input") as HTMLInputElement, {
      target: { value: "    " },
    });
    const submit = [...row.querySelectorAll("button")].find(
      (b) => b.textContent === "Take it off the route",
    ) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(submit);
    expect(taken).toBe(null);
  });

  it("submits on Enter and cancels on Escape", () => {
    let taken: unknown = null;
    const row = openWaive((s, r) => (taken = [s, r]));
    const input = row.querySelector("input") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Escape" });
    expect(
      (screen.getByText(AGENT_STATIONS.ship.name).closest("li") as HTMLElement).querySelector(
        "input",
      ),
      "Escape did not close the form",
    ).toBe(null);

    const again = screen.getByText(AGENT_STATIONS.ship.name).closest("li") as HTMLElement;
    fireEvent.click(
      [...again.querySelectorAll("button")].find((b) => b.textContent === "Take it off")!,
    );
    const second = (
      screen.getByText(AGENT_STATIONS.ship.name).closest("li") as HTMLElement
    ).querySelector("input") as HTMLInputElement;
    fireEvent.change(second, { target: { value: "Not shipping this week" } });
    fireEvent.keyDown(second, { key: "Enter" });
    expect(taken).toEqual(["ship", "Not shipping this week"]);
  });

  it("requires the reason in the signature, not only in the field", () => {
    // No overload omits it, so a caller cannot record a waiver with nothing
    // attached even by accident.
    expect(CODE).toContain("onWaive?: (station: AgentStation, reason: string) => void;");
  });

  it("offers nothing to remove without a handler, and nothing outside editable mode", () => {
    const { container: readonlyMode } = render(<RunMap stops={THREE} mode="editable" />);
    expect(
      [...readonlyMode.querySelectorAll("button")].some((b) => b.textContent === "Take it off"),
      "drew a control with no handler behind it",
    ).toBe(false);

    for (const mode of ["live", "replay"] as const) {
      const { container } = render(<RunMap stops={THREE} mode={mode} onWaive={noop} />);
      expect(
        [...container.querySelectorAll("button")].some((b) => b.textContent === "Take it off"),
        `${mode} mode offered an edit`,
      ).toBe(false);
    }
  });

  it("shows a waived station's reason, and admits when it has none", () => {
    render(
      <RunMap
        stops={[
          {
            station: "design",
            state: "skipped",
            waivedReason: "The notice reuses a shipped component",
          },
          { station: "build", state: "skipped" },
        ]}
      />,
    );
    expect(screen.getByText("The notice reuses a shipped component")).toBeTruthy();
    // The founder ruling: a skip is a decision with a reason, so a waiver with
    // none has to say so rather than look complete.
    expect(screen.getByText("Nobody said why this station came off the route.")).toBeTruthy();
  });
});

describe("live mode reports what is happening and claims nothing more", () => {
  it("paints the running station with the agent token and no other", () => {
    const { container } = render(<RunMap stops={SEVEN} mode="live" />);
    /*
     * SCOPED TO THE MARKS, and the first draft was not. A bare className sweep
     * also picked up the `Running` chip, which carries the agent token perfectly
     * legitimately, so it counted two and proved nothing about the marks. The
     * claim that matters is that exactly ONE STATION'S MARK is azure.
     */
    const marks = [...container.querySelectorAll("span")].filter(
      (s) => s.querySelector("svg") !== null && s.className.includes("size-[18px]"),
    );
    expect(marks.length, "the marks were not found at all").toBe(7);
    const azure = marks.filter((m) => m.className.includes("text-mrd-agent"));
    expect(azure.length).toBe(1);
    // And it is the running one, not merely one of them.
    const running = screen.getByText(AGENT_STATIONS.decide.name).closest("li") as HTMLElement;
    expect(running.contains(azure[0])).toBe(true);
    expect(container.innerHTML).toContain("Running");
  });

  it("shows K-18's sentence for a held station, verbatim", () => {
    render(
      <RunMap
        stops={[{ station: "build", state: "pending", hold: "out-of-credit" }]}
        mode="live"
      />,
    );
    // Verbatim from `HOLD_LINE`, never re-worded here: one copy of the words.
    expect(screen.getByText(HOLD_LINE["out-of-credit"])).toBeTruthy();
  });

  it("names the station in a hold that is about one station", () => {
    // `holdLine` substitutes the station's display name for the leading "This
    // station", which is the behaviour K-18 established and the reason this
    // component takes the raw id rather than the sentence.
    render(
      <RunMap
        stops={[{ station: "build", state: "pending", hold: "station-cannot-finish" }]}
        mode="live"
      />,
    );
    // Asserted as a PROPERTY rather than against a station name this test would
    // otherwise have to hardcode: the sentence rendered is not the raw one, and
    // it no longer opens with the pronoun that has no referent in a list.
    expect(screen.queryByText(HOLD_LINE["station-cannot-finish"])).toBe(null);
    const rendered = holdLine("station-cannot-finish", { station: "build" });
    expect(rendered).toBeTruthy();
    expect(rendered).not.toBe(HOLD_LINE["station-cannot-finish"]);
    expect(rendered?.startsWith("This station")).toBe(false);
    expect(screen.getByText(rendered as string)).toBeTruthy();
  });

  it("says nothing about a hold once the route has settled", () => {
    // A hold on a finished route is history, and repeating it in a replay would
    // report stopped work that has since moved.
    render(
      <RunMap stops={[{ station: "build", state: "done", hold: "out-of-credit" }]} mode="replay" />,
    );
    expect(screen.queryByText(HOLD_LINE["out-of-credit"])).toBe(null);
  });

  it("implies no percentage anywhere, because a coding agent cannot know one", () => {
    const { container } = render(<RunMap stops={SEVEN} mode="live" />);
    expect(container.innerHTML).not.toContain("%");
    expect(container.querySelector('[role="progressbar"]')).toBe(null);
    expect(container.querySelector("[aria-valuenow]")).toBe(null);
    expect(container.querySelector("progress")).toBe(null);
  });
});

describe("the machine does not leak into the map", () => {
  it("has no field that could carry a tool name", () => {
    /*
     * ENFORCED BY ABSENCE RATHER THAN BY A FILTER, which is the only way it
     * holds: with no field for it, no caller can pass a tool through and no
     * future edit can start rendering one without adding a field and answering
     * for it.
     */
    expect(CODE).not.toMatch(/\btool\b\s*\??\s*:/);
    expect(CODE).not.toContain("toolActionLabel");
    expect(CODE).not.toContain("runGlyphForTool");
  });

  it("renders no dotted registry name for any state it can be given", () => {
    const { container } = render(
      <RunMap
        stops={[
          ...SEVEN,
          { station: "learn", state: "failed", outcome: "Could not grade the outcome" },
        ]}
        mode="live"
      />,
    );
    // `web.search`, `prd.draft`, `studio.pr.merge`: a lowercase dotted pair is
    // what every registry name looks like.
    expect(container.textContent ?? "").not.toMatch(/\b[a-z]+\.[a-z_]+\b/);
  });

  it("is not a workflow builder, and has no gesture that would make it one", () => {
    // No palette, no conditions, no branches, no reordering, no adding. The only
    // authoring gesture is subtraction with a reason.
    for (const forbidden of ["onAddStation", "onReorder", "onConnect", "onAddStep", "draggable"]) {
      expect(CODE, `${forbidden} would make this a node editor`).not.toContain(forbidden);
    }
  });

  it("spends no per-station colour, so identity stays shape", () => {
    const { container } = render(<RunMap stops={SEVEN} mode="live" />);
    const html = container.innerHTML;
    // Law 4 has been broken on this three times: a stage hue ramp per station.
    expect(html).not.toContain("stageHue");
    expect(html).not.toContain("--mrd-viz");
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(html).not.toMatch(/\brgba?\(/);
    // `--mrd-you` may appear only on a chip that means a person is required.
    for (const stop of stopEls(container)) {
      if (stop.className.includes("mrd-you")) throw new Error("a station wore the accent");
    }
  });
});

describe("the spine scrolls inside itself", () => {
  it("scrolls horizontally in its own container rather than moving the page", () => {
    const { container } = render(<RunMap stops={SEVEN} />);
    const list = container.querySelector("ol") as HTMLElement;
    expect(list.className).toContain("overflow-x-auto");
    // A fixed stop width is what makes the row overflow rather than squeeze seven
    // stations into a pane too narrow to read any of them.
    for (const stop of stopEls(container)) {
      expect(stop.style.width).toBe("168px");
      expect(stop.className).toContain("shrink-0");
    }
  });

  it("opens a station's steps BELOW the spine, never inside the row", () => {
    // A graph unfolding inside a horizontal row pushes every station after it
    // sideways and the reader loses the route they were reading.
    const { container } = render(
      <RunMap
        stops={[
          {
            station: "build",
            state: "active",
            steps: [
              { id: "a", label: "Write the notice component", state: "done" },
              { id: "b", label: "Run the checks", state: "active" },
            ],
          },
        ]}
      />,
    );
    const stop = container.querySelector("li") as HTMLElement;
    fireEvent.click(stop.querySelector("button") as HTMLButtonElement);
    const graph = screen.getByText("Write the notice component");
    expect(stop.contains(graph), "the graph opened inside the spine row").toBe(false);
  });

  it("draws the steps through Flowchart rather than a second graph of its own", () => {
    // A fourth view of one run in a fifth rhythm is the defect `run-rows.tsx`
    // exists to prevent. `Flowchart` already solves measured heights, anchored
    // connectors and dragging.
    expect(CODE).toContain("flowFromSteps");
    expect(CODE).toContain("<Flowchart");
    expect(CODE).not.toContain("<svg");
  });

  it("presses nothing on a station with no steps to show", () => {
    const { container } = render(<RunMap stops={[{ station: "ship", state: "pending" }]} />);
    expect(container.querySelector("button")).toBe(null);
  });
});

describe("it speaks one vocabulary with the rest of the system", () => {
  it("takes PlanCard's step states rather than a private enum", () => {
    expect(CODE).toContain('import type { PlanStep, PlanStepState } from "./PlanCard";');
  });

  it("reads the one shared station-to-glyph map", () => {
    // It was declared twice before this, in CrewChrome and AppFrame, and a third
    // copy was about to be written here.
    expect(CODE).toContain("GLYPH_FOR_STATION");
    expect(Object.keys(GLYPH_FOR_STATION).length).toBe(AGENT_STATION_ORDER.length);
    for (const station of AGENT_STATION_ORDER) {
      expect(GLYPH_FOR_STATION[station], `${station} has no glyph`).toBeTruthy();
    }
  });
});
