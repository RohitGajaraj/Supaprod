/**
 * THE CASES ARE THE PRODUCTION ROUTES, NOT INVENTED ONES.
 *
 * Every sequence in the first block is a real `string_agg` of one track's legs,
 * read off `agent_runs` joined to the seat catalog on 2026-09-10. A detector
 * for circling that was only ever fed circles is not yet a detector, so the
 * straight routes are here in the same number as the bent ones.
 */
import { describe, expect, it } from "bun:test";
import type { AgentStation } from "@/lib/agent-vocabulary";
import {
  lapOf,
  lapsThatFiledNothingNew,
  nothingNewLine,
  roundLead,
  theRunWentRound,
  timesWord,
} from "./the-run-went-round";

const legs = (s: string) => s.split(" ") as AgentStation[];

/** The column key to the word the transcript's own headers use. */
const NAME: Record<string, string> = {
  sense: "Discover",
  decide: "Decide",
  define: "Plan",
  design: "Design",
  build: "Build",
  ship: "Ship",
  learn: "Learn",
};
const nameOf = (s: AgentStation) => NAME[s] ?? s;

describe("theRunWentRound, on the routes production actually walked", () => {
  it("finds the three laps in the shape four tracks share", () => {
    // `6cc7a010`, `0c0db8e6` and two more: the founder's own stuck runs.
    const r = theRunWentRound(
      legs("sense decide define design build define design build define design build"),
    );
    expect(r).not.toBeNull();
    expect(r!.cycle).toEqual(legs("define design build"));
    expect(r!.laps).toBe(3);
    expect(r!.lapStarts).toEqual([2, 5, 8]);
  });

  it("finds a cycle that the run later escaped, which a trailing read cannot", () => {
    // `sense decide` three times over and then Learn. The tail is not a cycle,
    // and the run still went round three times.
    const r = theRunWentRound(legs("sense decide sense decide sense decide learn"));
    expect(r!.cycle).toEqual(legs("sense decide"));
    expect(r!.laps).toBe(3);
    expect(r!.lapStarts).toEqual([0, 2, 4]);
  });

  it("takes the circle covering the most legs when a run walked two", () => {
    // Real: `define design build` twice, then `ship learn` twice. Six legs
    // beats four.
    const r = theRunWentRound(
      legs("sense decide define design build define design build ship learn ship learn"),
    );
    expect(r!.cycle).toEqual(legs("define design build"));
    expect(r!.laps).toBe(2);
  });

  it("breaks a tie on coverage towards the later circle", () => {
    // Two disjoint two-lap circles of the same size. The later one is what the
    // run was doing most recently.
    const r = theRunWentRound(legs("sense decide sense decide build ship build ship"));
    expect(r!.cycle).toEqual(legs("build ship"));
    expect(r!.lapStarts).toEqual([4, 6]);
  });

  it("prefers the tighter circle when two start in the same place", () => {
    // `design design design design` is one station four times, not two
    // stations twice.
    const r = theRunWentRound(legs("design design design design"));
    expect(r!.cycle).toEqual(legs("design"));
    expect(r!.laps).toBe(4);
  });
});

describe("theRunWentRound stays silent on a run that walked a line", () => {
  it.each([
    ["the whole route, once", "sense decide define design build ship learn"],
    ["a run that stopped early", "sense decide define design"],
    ["one station", "sense"],
    ["nothing at all", ""],
  ])("%s", (_label, route) => {
    expect(theRunWentRound(route === "" ? [] : legs(route))).toBeNull();
  });

  it("never matches two sections the record could not place to each other", () => {
    // Two nulls in the same position of two blocks would otherwise read as a
    // repeat, inventing a circle out of an absence.
    expect(
      theRunWentRound([null, "build" as AgentStation, null, "build" as AgentStation]),
    ).toBeNull();
  });
});

describe("lapOf numbers only the sections inside the circle", () => {
  const round = theRunWentRound(
    legs("sense decide define design build define design build define design build"),
  )!;

  it("leaves the approach unnumbered", () => {
    expect(lapOf(round, 0)).toBeNull();
    expect(lapOf(round, 1)).toBeNull();
  });

  it("numbers each lap's sections", () => {
    expect([2, 3, 4].map((i) => lapOf(round, i))).toEqual([1, 1, 1]);
    expect([5, 6, 7].map((i) => lapOf(round, i))).toEqual([2, 2, 2]);
    expect([8, 9, 10].map((i) => lapOf(round, i))).toEqual([3, 3, 3]);
  });

  it("leaves everything after the circle unnumbered", () => {
    const escaped = theRunWentRound(legs("sense decide sense decide sense decide learn"))!;
    expect(lapOf(escaped, 6)).toBeNull();
  });

  it("says nothing about a run with no circle", () => {
    expect(lapOf(null, 0)).toBeNull();
  });
});

describe("roundLead is a sentence, in the words the column already uses", () => {
  it("says it the way a person would", () => {
    const r = theRunWentRound(
      legs("sense decide define design build define design build define design build"),
    )!;
    expect(roundLead(r, nameOf)).toBe("Three times round Plan, Design and Build.");
  });

  it("handles a two-station circle and a one-station one", () => {
    expect(roundLead(theRunWentRound(legs("sense decide sense decide"))!, nameOf)).toBe(
      "Twice round Discover and Decide.",
    );
    expect(roundLead(theRunWentRound(legs("design design design"))!, nameOf)).toBe(
      "Three times round Design.",
    );
  });

  it("falls back to a numeral past the point where a word is read", () => {
    expect(timesWord(3)).toBe("three times");
    expect(timesWord(7)).toBe("7 times");
    const many = theRunWentRound(Array.from({ length: 7 }, () => "build" as AgentStation))!;
    expect(roundLead(many, nameOf)).toBe("7 times round Build.");
  });
});

describe("lapsThatFiledNothingNew", () => {
  const proto = (title: string) => ({ kind: "prototype", title });
  const task = (title: string) => ({ kind: "task", title });

  it("names the lap that only re-filed what was already on the record", () => {
    // `6cc7a010`, as the transcript reads it: lap 2 added two tasks nobody had
    // filed before, lap 3 re-filed five that existed and one drawing that did.
    expect(
      lapsThatFiledNothingNew([
        [task("Add Reschedule button"), proto("Reschedule installer visit from order page")],
        [task("Instrument support tickets"), proto("Reschedule installer visit from order page")],
        [task("Add Reschedule button"), proto("Reschedule installer visit from order page")],
      ]),
    ).toEqual([3]);
  });

  it("ignores case and surrounding space, because a model rewrites neither meaningfully", () => {
    expect(
      lapsThatFiledNothingNew([
        [proto("Reschedule From Order Page")],
        [proto("  reschedule from order page  ")],
      ]),
    ).toEqual([2]);
  });

  it("does not call a lap that filed NOTHING a lap that repeated itself", () => {
    // Build's laps file nothing at all. "Nothing new" would be a softer and
    // less true report than the rows' own "Filed nothing."
    expect(lapsThatFiledNothingNew([[proto("A drawing")], [], []])).toEqual([]);
  });

  it("never blames the first lap", () => {
    expect(lapsThatFiledNothingNew([[proto("A")], [proto("B")]])).toEqual([]);
  });

  it("separates two artifacts that share a title but not a kind", () => {
    expect(lapsThatFiledNothingNew([[proto("Reschedule")], [task("Reschedule")]])).toEqual([]);
  });
});

describe("nothingNewLine says it only when it discriminates", () => {
  const three = theRunWentRound(
    legs("define design build define design build define design build"),
  )!;
  const two = theRunWentRound(legs("define design define design"))!;

  it("is silent when every lap produced something", () => {
    expect(nothingNewLine(three, [])).toBeNull();
  });

  it("names the last lap when only the last repeated", () => {
    expect(nothingNewLine(three, [3])).toBe(
      "The last lap filed nothing that was not already on the record.",
    );
  });

  it("collapses to one sentence when every lap after the first repeated", () => {
    expect(nothingNewLine(three, [2, 3])).toBe(
      "Every lap after the first filed nothing that was not already on the record.",
    );
    expect(nothingNewLine(two, [2])).toBe(
      "The second lap filed nothing that was not already on the record.",
    );
  });

  it("lists them when the repeats are not the whole tail", () => {
    const four = theRunWentRound(legs("define design define design define design define design"))!;
    expect(nothingNewLine(four, [2, 4])).toBe(
      "Laps 2 and 4 filed nothing that was not already on the record.",
    );
  });
});
