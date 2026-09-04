/**
 * THE TWO THINGS A PERSON WATCHING A RUN MUST NOT HAVE TO INFER.
 *
 * HOW FAR THROUGH, and it has to be counted rather than estimated. Meridian
 * refuses progress bars on a stated argument -- a coding agent cannot know how
 * long it will take, so a proportion of an unknown total is a lie a reader
 * catches inside one session. `StepMeter` is the second component allowed past
 * that rule, on the same test `Spend` passes: both numbers known, denominator
 * fixed, the proportion IS the fact. So what this pins is the refusal half --
 * no percentage, no ETA, and motion only where a row says a machine is working.
 *
 * AND WHETHER IT FITS. `RunMap` was built, was good, and had one caller: the
 * gallery. It could not be mounted on the run page because seven stations at a
 * fixed 168px is about 1176px inside a 300-440px rail (SPEC-LAYOUT gap G3). The
 * fix had to be a direction on the existing component rather than a second route
 * renderer, so this pins that the stacked route carries no fixed width and no
 * horizontal scroll, and that the spine is untouched.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { StepMeter, type StepMeterStep } from "../progress";
import { RunMap, type RunMapStation } from "../RunMap";
import { AGENT_STATIONS, AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

const METER_SOURCE = readFileSync("src/components/meridian/progress.tsx", "utf8");
const METER_CODE = METER_SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/** A seven-stop route parked at Build with nobody driving it: the common case. */
const PARKED: StepMeterStep[] = AGENT_STATION_ORDER.map((s, i) => ({
  key: s,
  label: AGENT_STATIONS[s].name,
  state: i < 4 ? "done" : i === 4 ? "here" : "ahead",
}));

const rail = (c: HTMLElement) => c.querySelector("[aria-hidden]") as HTMLElement;
const segs = (c: HTMLElement) => [...rail(c).children] as HTMLElement[];

describe("the meter counts stops and refuses to estimate anything else", () => {
  it("prints which stop of how many, in the caller's own noun", () => {
    render(<StepMeter steps={PARKED} noun="Station" />);
    expect(screen.getByText("Station 5 of 7")).toBeTruthy();
  });

  it("draws one segment per stop and not one pixel of anything else", () => {
    const { container } = render(<StepMeter steps={PARKED} noun="Station" />);
    expect(segs(container).length).toBe(7);
  });

  it("never renders a percentage, and has no field that could carry an ETA", () => {
    const { container } = render(<StepMeter steps={PARKED} noun="Station" />);
    expect(container.textContent).not.toContain("%");
    // Enforced by ABSENCE rather than by a filter, which is the only way it
    // holds: there is no prop here for a rate, a remaining time or a
    // completion estimate, so no caller can pass one and no later edit can
    // start drawing one without adding a field and answering for it.
    for (const word of ["eta", "remaining", "percent", "estimate"]) {
      expect(METER_CODE.toLowerCase()).not.toContain(word);
    }
  });

  it("moves ONLY where a row says a machine is working", () => {
    const { container } = render(<StepMeter steps={PARKED} noun="Station" />);
    // Parked at a station is the state 58 of this product's 59 tracks were in.
    // A rail that animated there would be reporting work nobody is doing.
    for (const s of segs(container)) expect(s.style.animation ?? "").toBe("");

    const walking = PARKED.map((s) =>
      s.state === "here" ? { ...s, state: "working" as const } : s,
    );
    const live = render(<StepMeter steps={walking} noun="Station" />);
    const moving = segs(live.container).filter((s) => (s.style.animation ?? "").length > 0);
    expect(moving.length, "exactly one segment may move, and only the live one").toBe(1);
    // Declared inline, so meridian.css's reduced-motion block can reach it. An
    // animation in a utility class keeps moving for somebody who asked it not
    // to, which is a defect this repo has paid for in six files.
    expect(moving[0].style.animation).toContain("mrd-shimmer");
  });

  it("stops claiming a position once the run has none", () => {
    const finished: StepMeterStep[] = AGENT_STATION_ORDER.map((s) => ({
      key: s,
      label: AGENT_STATIONS[s].name,
      state: "done",
    }));
    render(<StepMeter steps={finished} noun="Station" />);
    // "Station 7 of 7" would assert it is standing at Learn. It is not; it is
    // finished, which is a different sentence.
    expect(screen.getByText("7 of 7 done")).toBeTruthy();
  });

  it("draws nothing at all for a route that does not exist yet", () => {
    // The zero case belongs to the route, which composes a full answer for it.
    // A second empty state stacked above that one is two answers to one
    // question.
    const { container } = render(<StepMeter steps={[]} noun="Station" />);
    expect(container.textContent).toBe("");
  });

  it("keeps the fact in text, because the drawing is hidden from the reader who listens", () => {
    const { container } = render(<StepMeter steps={PARKED} noun="Station" />);
    expect(rail(container).getAttribute("aria-hidden")).not.toBe(null);
    expect(screen.getByText("Station 5 of 7")).toBeTruthy();
  });

  it("puts the caller's one extra fact on the same line as the figure", () => {
    // The run header pairs the position with its clock here, which is the whole
    // point: how far through and how long, read in one movement of the eye.
    render(<StepMeter steps={PARKED} noun="Station" note="Walking for 12.4s" />);
    expect(screen.getByText("Walking for 12.4s")).toBeTruthy();
  });
});

const ROUTE: RunMapStation[] = AGENT_STATION_ORDER.map((station, i) => ({
  station,
  state: i < 4 ? "done" : i === 4 ? "here" : "pending",
}));

describe("the route fits a rail without becoming a second route renderer", () => {
  it("stacked stops carry no fixed width, so seven of them fit a 300px pane", () => {
    const { container } = render(<RunMap stops={ROUTE} mode="live" orientation="stack" />);
    const stops = [...container.querySelectorAll("li")] as HTMLElement[];
    expect(stops.length).toBe(7);
    for (const s of stops) expect(s.style.width).toBe("");
  });

  it("stacked routes never scroll sideways", () => {
    const { container } = render(<RunMap stops={ROUTE} mode="live" orientation="stack" />);
    const ol = container.querySelector("ol") as HTMLElement;
    expect(ol.className).not.toContain("overflow-x-auto");
    expect(ol.className).toContain("flex-col");
  });

  it("leaves the spine a separate direction, though its geometry has since changed", () => {
    /*
     * WHAT THIS TEST IS FOR, and it is not the 168px it used to assert. This
     * file exists to prove that adding `stack` did not disturb `spine` -- one
     * route renderer, two directions, no second component. That claim is about
     * the SEPARATION, and it survives the spine's geometry changing underneath
     * it.
     *
     * P-125 replaced the fixed-width scrolling row with seven shared grid
     * tracks, because fixed cells walked past the pane's edge at 1512px on the
     * first run that shipped. Pinning `168px` here made this file a second
     * owner of that decision, which is how a test starts voting on a design it
     * was not written about.
     */
    const { container } = render(<RunMap stops={ROUTE} mode="live" />);
    const ol = container.querySelector("ol") as HTMLElement;
    expect(ol.className).toContain("grid");
    expect(ol.className).not.toContain("flex-col");
    // Still the two directions, still one component drawing both.
    const { container: stacked } = render(<RunMap stops={ROUTE} mode="live" orientation="stack" />);
    expect((stacked.querySelector("ol") as HTMLElement).className).toContain("flex-col");
  });
});

describe("the route can now say the two things a live run says constantly", () => {
  it("a held station says it is on hold, and does not claim a machine is running", () => {
    // SPEC-LAYOUT gap G1. Before this the state did not exist, so a held
    // station arrived as `active` and wore "Running" over a track the driver
    // had stopped at.
    const held: RunMapStation[] = [{ station: "build", state: "held", hold: "out-of-credit" }];
    render(<RunMap stops={held} mode="live" orientation="stack" />);
    expect(screen.getByText("On hold")).toBeTruthy();
    expect(screen.queryByText("Running")).toBe(null);
  });

  it("a held station renders the driver's own sentence rather than a re-worded one", () => {
    const held: RunMapStation[] = [{ station: "build", state: "held", hold: "out-of-credit" }];
    const { container } = render(<RunMap stops={held} mode="live" orientation="stack" />);
    // `holdLine` is the one copy of these words. Any sentence here that is not
    // from it is a second copy that drifts the first time either is edited.
    expect(container.textContent).toContain("credit");
  });

  it("standing at a station wears no chip, because a position is not a status", () => {
    const here: RunMapStation[] = [{ station: "build", state: "here" }];
    render(<RunMap stops={here} mode="live" orientation="stack" />);
    expect(screen.queryByText("Running")).toBe(null);
    expect(screen.queryByText("On hold")).toBe(null);
    expect(screen.queryByText("Needs you")).toBe(null);
    // It wears the system's COLOURLESS tag instead: a pill is round and carries
    // status, a tag is square and carries a category, and where the work stands
    // is a category. Without it the stop is drawn in the same ink as the four
    // behind it and the position is invisible on the map.
    expect(screen.getByText("Here")).toBeTruthy();
  });
});
