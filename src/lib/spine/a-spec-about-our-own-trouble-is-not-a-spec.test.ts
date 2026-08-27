/**
 * A SPEC ABOUT THE LOOP'S OWN DIFFICULTY IS NOT A SPEC (2026-08-27).
 *
 * Found by watching track `a30238f5` walk to Ship, not by reading code.
 *
 * Define filed three specs. Two were about the work. The third was titled
 * *"Design failed to proceed from existing specs because they lacked concrete,
 * implementation-grade detail"*, opening *"Design has been unable to produce
 * working mockups for the address screen due to insufficient detail."*
 *
 * That is a spec about a STATION FAILURE. It is the loop eating its own exhaust
 * — the defect `signals.log` refuses at Discover (*"NEVER log the absence of
 * evidence"*) and `own-artifact-source` refuses for citations — arriving one
 * station over, where nothing was watching for it.
 *
 * ── IT COST THE RUN ITS SHIP ───────────────────────────────────────────────
 * The newest spec wins, so that document superseded the two real ones, and Ship
 * read it and refused: *"the PRD is still in draft... success_metric_count: 0"*.
 * **The station was right to refuse.** It was grading a document about a process
 * problem, which will never have a success metric, because it is not work.
 *
 * The rule is the one Discover already has: a station's difficulty is something
 * to SAY, not something to FILE. Filing it puts a run's own trouble into the
 * record every later station reads, and the record is what this product sells.
 */
import { describe, expect, it } from "bun:test";

import { stationCrew, stationGoal } from "./driver";

const TRACK = { title: "Let returning customers reuse a saved delivery address", origin: null };
const briefs = () => [
  stationGoal("define", TRACK),
  ...stationCrew("define").map((s) => stationGoal("define", TRACK, [], s)),
];

describe("every Define seat is told not to spec its own trouble", () => {
  it("Define has seats, or this proves nothing", () => {
    expect(stationCrew("define").length).toBeGreaterThan(0);
  });

  it("the refusal reaches every seat", () => {
    for (const b of briefs()) {
      expect(b).toContain("NEVER write a spec ABOUT THIS RUN'S OWN DIFFICULTY");
    }
  });

  it("and names the exact sentences that were filed as specs", () => {
    // Naming them is what makes the rule recognisable rather than abstract.
    for (const b of briefs()) {
      expect(b).toContain("Design could not proceed");
      expect(b).toContain("the existing specs lacked detail");
    }
  });

  it("it says what to do instead: say it, file nothing", () => {
    for (const b of briefs()) {
      expect(b).toContain("say exactly what is missing in your answer and file nothing");
    }
  });

  it("and gives the reason, because a rule with a reason survives an edit", () => {
    for (const b of briefs()) {
      expect(b).toContain("supersedes the real ones");
    }
  });
});

describe("what must NOT change: Define still has to file a real spec", () => {
  it("prd.draft is still the way to finish", () => {
    for (const b of briefs()) {
      expect(b).toContain("prd.draft");
      expect(b).toContain("tasks.create");
    }
  });

  it("and a spec that stays in the answer is still not on the record", () => {
    for (const b of briefs()) {
      expect(b).toContain("not on the record and the next station cannot read it");
    }
  });
});
