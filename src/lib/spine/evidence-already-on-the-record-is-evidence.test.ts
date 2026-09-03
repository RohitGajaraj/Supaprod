/**
 * EVIDENCE ALREADY ON THE RECORD IS EVIDENCE (2026-08-27).
 *
 * This is why Discover has never cleared, and it is one sentence.
 *
 * The sense brief said *"call signals.log for each piece of evidence"* and named
 * no other way to finish. So a crew searching a workspace that was ALREADY FULL
 * of evidence concluded there was nothing to log, and filed nothing.
 *
 * ── MEASURED ON THE REAL WORKSPACE ─────────────────────────────────────────
 * 258 signals, **81 of them from genuinely outside sources**: NPS survey 28,
 * analytics dashboard 15, session replay archive 15, sales calls 6, support
 * tickets 5, a GitHub connector 7. Against track `a30238f5` — reusing a saved
 * delivery address — the table holds an analytics row titled *"41 percent of
 * abandonments happened on the redundant address re-confirm screen"* and a
 * session-replay row about redundant address entry, both tagged
 * `address-friction`.
 *
 * The crew **quoted that 41 percent figure back** and still reported *"no
 * user-sourced evidence exists ... the workspace contains only internal
 * documentation (PRDs, decisions, brief excerpts)"*. It had read the number out
 * of a PRD rather than out of the signals table, and F-73 correctly forbids
 * citing our own artifacts as evidence about the world.
 *
 * **Every guard was working as designed.** The brief simply never said that
 * evidence already on the record counts. Both sense-entry tracks died of it,
 * twelve drives each, and the F-43 ceiling was right to stop them.
 *
 * ── WIDENING A FINISH IS WHEN A CREW LOOKS FOR A CHEAPER ONE ───────────────
 * So this file pins the widening AND all three refusals it must not take with
 * it.
 */
import { describe, expect, it } from "bun:test";

import { stationCrew, stationGoal } from "./driver";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

/*
 * ── THIS FILE WAS GREEN WHILE THE FIX REACHED NOBODY ───────────────────────
 *
 * Its first version did `readFileSync` on `driver.ts`, sliced the `FILE_IT`
 * constant out of the SOURCE TEXT, and asserted on that slice. `FILE_IT` was
 * only read for a station with NO seats, and Discover has three, so all three
 * read `CREW_ROLE[slug].file` and never saw the sentence. S4 measured the prompt
 * md5 in `agent_runs.input` byte-identical before and after the fix shipped.
 *
 * A test that reads a constant proves the constant. It does not prove the
 * sentence is DELIVERED. So this renders the brief every seat actually receives
 * and asserts against that, which is the only form that could have failed.
 */
const TRACK = { title: "Let returning customers reuse a saved delivery address", origin: null };

/** The brief each seat at a station really gets, lead included. */
function briefsFor(station: Parameters<typeof stationGoal>[0]): string[] {
  const seats = stationCrew(station);
  return [stationGoal(station, TRACK), ...seats.map((s) => stationGoal(station, TRACK, [], s))];
}

describe("every Discover seat is told that existing evidence counts", () => {
  const briefs = briefsFor("sense");

  it("Discover really does have seats, or this test proves nothing", () => {
    // The original defect hid behind an empty crew. If this ever reads 0, the
    // assertions below are vacuous and must be re-examined rather than trusted.
    expect(stationCrew("sense").length).toBeGreaterThan(0);
  });

  it("EVERY seat's brief says existing evidence counts", () => {
    for (const b of briefs) {
      expect(b).toContain("ALREADY IN THIS WORKSPACE COUNTS");
    }
  });

  it("every seat is told the hand that searches, not only the one that writes", () => {
    for (const b of briefs) expect(b).toContain("signals.list");
  });

  it("and that grouping what is there is a complete outcome", () => {
    for (const b of briefs) expect(b).toContain("complete, correct outcome, not a shortcut");
  });
});

describe("THE THREE REFUSALS REACH EVERY SEAT TOO", () => {
  const briefs = briefsFor("sense");

  it("never file the absence of evidence", () => {
    for (const b of briefs) expect(b).toContain("never do is file the ABSENCE of evidence");
  });

  it("never cite our own artifacts, and why", () => {
    for (const b of briefs) {
      expect(b).toContain("own PRDs, decisions or briefs");
      expect(b).toContain("our own writing coming back");
    }
  });

  it("an empty workspace still means file nothing, and now says so in a way the run can read", () => {
    /*
     * The property is unchanged and the CHANNEL is not. This asserted the words
     * "say so in your answer and file nothing", and an answer is prose the
     * driver cannot read: it could not tell a seat that searched and found
     * nothing from a seat that did nothing, charged an attempt against both,
     * and on the founder's own run was one tick from giving up with nothing
     * built (R-36, P-40). The seat now calls `sense.found_nothing`, which is a
     * typed row in `tool_calls`.
     *
     * Both halves are still asserted: file nothing, AND say it.
     */
    for (const b of briefs) {
      expect(b).toContain("call sense.found_nothing");
      expect(b).toContain("file nothing");
    }
  });
});

describe("the station's filing rule reaches every seat at EVERY station", () => {
  it("no seat anywhere loses it, which is the defect this file exists for", () => {
    /*
     * The bug was structural, not specific to Discover: choosing between the
     * station rule and the seat rule loses one of them wherever seats exist.
     * Every station is checked so the next one to gain a seat cannot repeat it.
     */
    for (const station of AGENT_STATION_ORDER) {
      for (const b of briefsFor(station)) {
        expect(b.length, `${station} produced an empty brief`).toBeGreaterThan(100);
        expect(b, `${station} lost its filing instruction`).toMatch(
          /file|record|call [a-z]+\.[a-z]/i,
        );
      }
    }
  });
});
