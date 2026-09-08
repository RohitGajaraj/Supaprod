/**
 * THE MAP'S WORKING STOP STOPS ITS CLOCK WHEN ITS SEAT GOES QUIET.
 *
 * Fourth review, 2026-09-09. The stop gated its ticking clock on the state
 * alone, so a seat quiet for 42 min read "42m 13s · past its usual time here"
 * under a still node and a still dot, while the strip 100px above said
 * "quiet for 42 min" with no clock. A ticking clock is Meridian's own
 * live-work signal (AgentPresence stops its clock on `alive === false`); the
 * road now does the same, and prints the strip's own words on the strip's
 * rounding, so the two say one thing.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { Journey, type JourneyStation } from "../Journey";

const at = new Date(Date.now() - 42 * 60_000).toISOString();

function road(presence: NonNullable<JourneyStation["presences"]>[number]): JourneyStation[] {
  return [
    { key: "sense", state: "done" },
    { key: "decide", state: "working", at, presences: [presence] },
    { key: "define", state: "pending" },
  ];
}

const lineOf = (c: HTMLElement) => c.querySelector('li[data-state="working"]')?.textContent ?? "";

describe("the stop's clock", () => {
  it("stops with the breath and says how long the seat has been quiet", () => {
    const { container } = render(
      <Journey
        size="full"
        stations={road({ seat: "Ada", colour: "--mrd-viz-3", alive: false, quietMs: 42 * 60_000 })}
      />,
    );
    const line = lineOf(container);
    expect(line).toContain("quiet for 42 min");
    expect(line).not.toMatch(/\d+m \d+s/);
    /* And the accessible description says quiet, not working. */
    const li = container.querySelector('li[data-state="working"]');
    expect(li?.getAttribute("aria-label")).toContain("quiet for 42 min");
    expect(li?.getAttribute("aria-label")).not.toContain("working here now");
  });

  it("ticks while the seat is alive", () => {
    const { container } = render(
      <Journey size="full" stations={road({ seat: "Ada", colour: "--mrd-viz-3", alive: true })} />,
    );
    const line = lineOf(container);
    expect(line).toMatch(/\d+m \d+s/);
    expect(line).not.toContain("quiet");
  });
});
