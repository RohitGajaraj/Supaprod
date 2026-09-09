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
import { captionFor, routeStations } from "./JourneyMap";
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

/*
 * ── A PRESS THAT COULD ONLY EVER RETURN NOTHING ───────────────────────────
 *
 * WALKED ON THE SERVED HOME, 2026-09-10. Discover, Build and Ship carried no
 * count and were still buttons. Pressing Discover gave:
 *
 *   caption:  "Showing the 0 runs at Discover."
 *   list:     "Nothing is standing at Discover."
 *
 * A press that could only ever return nothing, answered twice, one of them as
 * "the 0 runs" -- an absence dressed as a count, which `crew.tsx` already
 * names as a defect in its own words.
 *
 * The road ALREADY says it: a station with no work carries no badge and draws
 * faint. The press adds nothing a person could not see before making it, which
 * is the founder's "anticipate, do not interrogate" exactly. An empty filter
 * stop is not a control any more (`Journey`), and the caption stops printing a
 * zero.
 */
describe("a filtered station with nothing on it", () => {
  it("says nothing, because the list below is the thing that is empty", () => {
    const emptied = A1.map((s) => (s.key === "design" ? at("design", "stopped", 0) : s));
    expect(captionFor({ mode: "map", stations: emptied, selected: "design" })).toBeNull();
  });

  it("still counts normally the moment there is something to count", () => {
    // The mirror: nulling this branch must not swallow the selection sentence
    // for a station that actually holds runs.
    expect(captionFor({ mode: "map", stations: A1, selected: "decide" })).toBe(
      "Showing the 3 runs at Decide.",
    );
  });

  it("never prints a zero, in any selection", () => {
    for (const key of ["sense", "build", "ship"]) {
      const cap = captionFor({ mode: "map", stations: A1, selected: key as never });
      expect({ key, cap }).toEqual({ key, cap: null });
    }
  });
});

/*
 * ── THE ROAD SHOWS THE ROUTE A SENTENCE WILL TAKE ─────────────────────────
 *
 * MEASURED ON THE SERVED HOME, 2026-09-10: changing the composer's shape
 * picker moved the sentence beside it and moved NOTHING on the road below. The
 * one drawing that could show the path a piece of work is about to take was
 * describing it in prose, forty pixels above a seven-station picture of
 * exactly that model. That is "the stations do not form a flow" at the moment
 * a person is choosing.
 *
 * I stopped once, on the grounds that overlaying a hypothetical on a map of
 * real work leaves a reader unable to tell them apart. Lane 2's answer is
 * better: the discriminator is not map-versus-preview, it is HAS THIS RUN
 * STARTED. While a sentence is being written there is no work on that track,
 * so there is nothing to confuse it with -- and `promise` mode already draws a
 * road with nothing standing on it, so this is not a new idea, it is that one
 * a level down.
 */
describe("the route a sentence will take", () => {
  it("marks every skipped station, and leaves the rest to be walked", () => {
    /*
     * THE KEYS ARE THE DRIVER'S, NOT THE LABELS. Plan's key is `define`, and
     * my first version of this wrote `plan` and failed -- the test being wrong
     * rather than the code, which is exactly why the assertion lists all seven
     * states positionally instead of trusting a name.
     */
    const skipped = ["sense", "decide", "define", "design"];
    const road = routeStations(skipped);
    expect(road.map((s) => s.state)).toEqual([
      "waived",
      "waived",
      "waived",
      "waived",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("draws all seven as pending when the route skips nothing", () => {
    expect(routeStations([]).every((s) => s.state === "pending")).toBe(true);
    expect(routeStations([]).length).toBe(7);
  });

  it("carries NO counts, because nothing is standing on it yet", () => {
    /*
     * A zero here would be the absence-dressed-as-a-measurement this file was
     * already repaired for once, and it would also make the empty stops
     * pressable filters over a list of runs that has nothing to do with them.
     */
    for (const s of routeStations(["sense"])) {
      expect({ key: s.key, count: s.count }).toEqual({ key: s.key, count: undefined });
    }
  });

  it("says what the drawing is, because the road has changed subject", () => {
    // A drawing that changes meaning without saying so is the ambiguity the
    // whole objection was about. It does NOT repeat the picker's sentence,
    // which already names the entry and the skips in words just above.
    expect(captionFor({ mode: "route", stations: routeStations(["sense"]), selected: null })).toBe(
      "The road this sentence will take. Your work returns when you clear it.",
    );
  });

  it("still answers as a map the moment the sentence is gone", () => {
    // The mirror: the preview must not survive its trigger, or a person who
    // clears the composer is left looking at a road about nothing.
    expect(captionFor({ mode: "map", stations: A1, selected: null })).toBe(
      "Design has stopped, and will not move without you.",
    );
  });
});
