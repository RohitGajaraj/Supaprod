/**
 * THE STORY RENDERS, WHICH IS A DIFFERENT CLAIM FROM "THE LOGIC IS RIGHT".
 *
 * `the-through-line.test.ts` proves the shaping: given a run's stops, these are
 * the lines. It cannot prove the component mounts, and on the afternoon this
 * shipped my browser wedged before I could read the page, so the claim "it
 * renders" was made by nobody. That gap is the reason this file exists, and it
 * is the better answer than the screenshot I could not take: a screenshot is
 * true once, and this is true on every run of the suite.
 *
 * It also catches the failure I could not rule out by hand. A component that
 * loops on render does not fail an assertion, it hangs the runner — so a test
 * that mounts it at all is the check, and every assertion after the mount is a
 * bonus.
 *
 * The fixture is `ce846e9b` on Helio Labs: the finding, the decision with its
 * own rationale and three rejected alternatives, the spec and tasks, and the
 * Build station that filed nothing and said the same sentence eighteen times.
 */
import * as React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, test, expect, afterEach } from "bun:test";

import { ThroughLine } from "@/components/track/ThroughLine";
import type { LineStop } from "@/components/track/the-through-line";

afterEach(cleanup);

const SAYING =
  "This repository contains only the checkout module for Relay, not the full Relay homeowner app that renders status tiles.";

const STOPS: LineStop[] = [
  {
    station: "sense",
    items: [
      {
        kind: "signal",
        artifactId: "sig-1",
        title: "Homeowners cannot tell a real outage from a firmware reboot",
        missing: false,
      },
    ],
  },
  {
    station: "decide",
    items: [
      {
        kind: "decision",
        artifactId: "dec-1",
        title: "Differentiate OTA reboot red tile from real outage red tile",
        missing: false,
        fields: {
          rationale:
            "The product renders OTA reboots and real outages identically (red tile), causing homeowner confusion. This is confirmed by 16+ signals.",
          alternatives_considered: ["Leave as-is", "Tooltip only", "Delay"],
        },
      },
    ],
  },
  {
    station: "define",
    items: [
      { kind: "prd", artifactId: "prd-1", title: "Differentiate the red tile", missing: false },
      { kind: "task", artifactId: "t-1", title: "Implement", missing: false },
    ],
  },
  { station: "build", items: [] },
];

function draw(over: Partial<React.ComponentProps<typeof ThroughLine>> = {}) {
  return render(
    <ThroughLine
      stops={STOPS}
      standing="build"
      stuckAt="build"
      stuckSaying={SAYING}
      {...over}
    />,
  );
}

describe("the run's story renders", () => {
  test("mounts and draws one line per station that did something", () => {
    // The mount IS the assertion this file was written for: a render loop hangs
    // the runner rather than failing, so reaching the next line is the proof.
    draw();
    expect(screen.getByLabelText("What happened on this run")).toBeTruthy();
    for (const name of ["Discover", "Decide", "Plan", "Build"]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  test("names the one thing a station filed, in the seat's own words", () => {
    draw();
    expect(
      screen.getByText('filed "Homeowners cannot tell a real outage from a firmware reboot"'),
    ).toBeTruthy();
  });

  test("draws the decision's own reason and what it weighed against", () => {
    // The pair that had lived one click deep, inside a card nobody opens.
    draw();
    expect(screen.getByText(/3 alternatives rejected/)).toBeTruthy();
    expect(screen.getByText(/causing homeowner confusion/)).toBeTruthy();
  });

  test("quotes the run's own words where it stopped", () => {
    draw();
    expect(screen.getByText(`"${SAYING}"`)).toBeTruthy();
  });

  test("a line opens the artifact its station filed", () => {
    const opened: string[] = [];
    draw({ onOpen: (id) => opened.push(id) });
    fireEvent.click(screen.getByText("Discover").closest("button")!);
    expect(opened).toEqual(["sig-1"]);
  });

  test("the stopped station is a line and NOT a button, because it opened nothing", () => {
    // A control that opens nothing is worse than a line of text.
    draw();
    expect(screen.getByText("Build").closest("button")).toBeNull();
  });

  test("draws nothing at all when the run has filed nothing anywhere", () => {
    // The pane's own empty state owns that case; a heading over nothing is
    // worse than no heading.
    const { container } = draw({ stops: [], stuckAt: null, stuckSaying: null });
    expect(container.innerHTML).toBe("");
  });

  test("survives a read that has not answered", () => {
    const { container } = draw({ stops: null, stuckAt: null, stuckSaying: null });
    expect(container.innerHTML).toBe("");
  });
});
