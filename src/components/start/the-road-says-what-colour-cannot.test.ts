/**
 * ── TWO STATIONS, ONE PIXEL, OPPOSITE MEANINGS ────────────────────────────
 *
 * MEASURED ON THE SERVED HOME, 2026-09-09, workspace A1 delete probe. Two
 * stations were lit on the road and their computed styles came back
 * byte-identical:
 *
 *   Decide   3 runs, all `the-call-is-yours`   ->  state `you`
 *   Design   2 runs, both `going-in-circles`   ->  state `stopped`
 *
 *   both:  fill oklch(0.28 0.14 315) · ink oklch(0.74 0.11 315)
 *
 * Three runs waiting for an answer and two that gave up and will never move
 * again are the same pixel. That is the founder's *"the stations do not form
 * a flow"* on the surface he named: the road answers "where is everything" and
 * cannot answer "and is any of it dead".
 *
 * ── WHY THE FIX IS WORDS AND NOT A COLOUR ─────────────────────────────────
 * `Journey`'s paint table is right. Both states ARE "a person required", which
 * is why they share the you hue, and every other channel carries a written
 * owner: the glyph is the STATION's (law 4), the fill moved to the you-chip on
 * a measured greyscale argument, and the dashed ring belongs to `waived`.
 * Settling the pair means taking a channel from another state, which reaches
 * every lane's surfaces, so it is filed in the contract with the measurement
 * rather than decided alone.
 *
 * The caption is the one channel colour cannot contend for, and it was
 * spending itself on furniture: a label the section's own `aria-label` already
 * carries, and an instruction the first press teaches.
 */
import { describe, expect, it } from "bun:test";
import { captionFor } from "./JourneyMap";
import type { JourneyStation } from "@/components/meridian/Journey";

const at = (key: string, state: string, count: number): JourneyStation =>
  ({ key, state, count }) as unknown as JourneyStation;

/** A1 delete probe as it actually stood when this was measured. */
const A1: JourneyStation[] = [
  at("sense", "pending", 0),
  at("decide", "you", 3),
  at("plan", "waiting", 1),
  at("design", "stopped", 2),
  at("build", "pending", 0),
  at("ship", "pending", 0),
  at("learn", "scheduled", 2),
];

describe("the road names the work that has stopped", () => {
  it("says which station, and that nothing will move it", () => {
    expect(captionFor({ mode: "map", stations: A1, selected: null })).toBe(
      "Design has stopped, and will not move without you.",
    );
  });

  it("names every station that has stopped, not just the first", () => {
    const two = A1.map((s) => (s.key === "build" ? at("build", "stopped", 1) : s));
    expect(captionFor({ mode: "map", stations: two, selected: null })).toBe(
      "Design and Build have stopped, and will not move without you.",
    );
  });

  it("names three, which is the founder's other workspace as it actually stands", () => {
    /*
     * MEASURED: "My workspace" holds 8 runs and every one is stopped --
     * `station-cannot-finish` at Decide and Design, `tools-refused` at Build,
     * `going-in-circles` at Decide. All four holds are in `TERMINAL_HOLDS`, so
     * three stations light `stopped` at once and the caption has to carry a
     * list rather than a name. That is the workspace the sentence matters most
     * on, so it is pinned rather than assumed.
     */
    const three = A1.map((s) =>
      s.key === "build"
        ? at("build", "stopped", 1)
        : s.key === "decide"
          ? at("decide", "stopped", 3)
          : s,
    );
    expect(captionFor({ mode: "map", stations: three, selected: null })).toBe(
      "Decide, Design and Build have stopped, and will not move without you.",
    );
  });

  it("says nothing about stopping when nothing has stopped", () => {
    /*
     * The mirror that matters. A caption that always warned would be
     * wallpaper by the third visit, and this line has to be worth reading on
     * the one day it appears.
     */
    const none = A1.map((s) => (s.key === "design" ? at("design", "you", 2) : s));
    expect(captionFor({ mode: "map", stations: none, selected: null })).toBe(
      "Press a station to see only the runs there.",
    );
  });

  it("ignores a stopped state with nothing standing on it", () => {
    // A station can carry a state with a zero count; a warning about no runs
    // is the invention this file exists to refuse.
    const zero = A1.map((s) => (s.key === "build" ? at("build", "stopped", 0) : s));
    expect(captionFor({ mode: "map", stations: zero, selected: null })).toBe(
      "Design has stopped, and will not move without you.",
    );
  });
});

describe("the caption no longer spends itself on furniture", () => {
  it("does not repeat the label the section's own name already carries", () => {
    // "Where your work stands" is the aria-label AND the visible region name.
    // A third copy in the caption told a reader nothing.
    for (const stations of [A1, A1.map((s) => (s.key === "design" ? at("design", "you", 2) : s))]) {
      expect(captionFor({ mode: "map", stations, selected: null })).not.toContain(
        "Where your work stands",
      );
    }
  });
});

describe("the states the caption must not touch", () => {
  it("keeps the selection sentence when a station is filtered", () => {
    expect(captionFor({ mode: "map", stations: A1, selected: "design" })).toBe(
      "Showing the 2 runs at Design.",
    );
  });

  it("keeps the morning-after sentence on an empty road", () => {
    const empty = A1.map((s) => at(s.key as string, "pending", 0));
    expect(captionFor({ mode: "map", stations: empty, selected: null })).toBe(
      "Nothing is standing on the road. What finished is in the runs below.",
    );
  });

  it("says nothing at all in promise mode", () => {
    // The hero's sentence and the stops' own lines already say it, and it was
    // printed twice.
    expect(captionFor({ mode: "promise", stations: A1, selected: null })).toBeNull();
  });
});
