import { describe, expect, it } from "bun:test";

import type { Turn } from "@/lib/spine/activity";
import { handoffLine, turnsAtStation, whatCameWith } from "./handed-over";

const turn = (o: Partial<Turn>): Turn => ({
  runId: "r1",
  agentSlug: "scout",
  agentName: "Discovery Scout",
  station: "sense",
  stationName: "Discover",
  at: "2026-08-26T11:26:23.941Z",
  outcome: "done",
  made: [],
  said: null,
  tookMs: null,
  tokens: null,
  stopLine: null,
  usd: 0,
  ...o,
});

const made = (...words: string[]) => words.map((word, i) => ({ kind: word, word, id: `a${i}` }));

describe("which turns filed what the next station picked up", () => {
  it("takes the whole stretch the station ran, not just the turn before the move", () => {
    /*
     * THE CASE THAT JUSTIFIES THIS FILE. The turn immediately before a handoff
     * is very often the one that CHECKED the work, filing nothing, while the
     * turn before that produced the thing. Reading only the last one reports an
     * empty handoff over a station that did its job.
     */
    const earlier = [turn({ runId: "a", made: made("brief") }), turn({ runId: "b", made: [] })];
    const stretch = turnsAtStation(earlier, "Discover");
    expect(stretch.map((t) => t.runId)).toEqual(["a", "b"]);
    expect(whatCameWith(stretch)).toEqual(["brief"]);
  });

  it("stops at the station boundary, so an earlier visit is not folded in", () => {
    // A rewind makes a second visit to the same station real, and counting the
    // first visit's output as handed over now would credit work that was undone.
    const earlier = [
      turn({ runId: "old", stationName: "Discover", made: made("brief") }),
      turn({ runId: "mid", stationName: "Decide", made: made("decision") }),
      turn({ runId: "new", stationName: "Discover", made: [] }),
    ];
    expect(turnsAtStation(earlier, "Discover").map((t) => t.runId)).toEqual(["new"]);
  });
});

describe("the line under a handoff", () => {
  it("says plainly when nothing came with it", () => {
    // The most common failure in this product and the best hidden: the run looks
    // like it advanced. If this ever renders as a blank again, this fails.
    expect(handoffLine("Discover", [])).toBe("picked up from Discover, which filed nothing");
  });

  it("counts repeats instead of stuttering, which the running product showed", () => {
    /*
     * THE LIVE DEFECT. A Discover station that filed three signals rendered
     * "with its signal, signal and 1 more" on real data: it reads as a stutter
     * and buries the number the reader wanted.
     */
    expect(handoffLine("Discover", ["signal", "signal", "signal"])).toBe(
      "picked up from Discover with its 3 signals",
    );
    expect(handoffLine("Plan", ["spec", "task", "task", "task"])).toBe(
      "picked up from Plan with its spec and 3 tasks",
    );
    // A sibilant kind must not become "sketchs" if one is ever added.
    expect(handoffLine("Design", ["sketch", "sketch"])).toBe(
      "picked up from Design with its 2 sketches",
    );
  });

  it("names one, names two, and counts the rest", () => {
    expect(handoffLine("Plan", ["spec"])).toBe("picked up from Plan with its spec");
    expect(handoffLine("Plan", ["spec", "design"])).toBe(
      "picked up from Plan with its spec and design",
    );
    expect(handoffLine("Plan", ["spec", "design", "task", "change"])).toBe(
      "picked up from Plan with its spec, design and 2 more",
    );
  });

  it("carries no em dash, on any branch", () => {
    // RUN-21's rule, asserted at the source rather than only by the file scan,
    // because this line is built at runtime and the scanner cannot see it.
    for (const words of [[], ["spec"], ["spec", "design"], ["a", "b", "c"]]) {
      expect(handoffLine("Discover", words)).not.toMatch(/[—–]/);
    }
  });
});
