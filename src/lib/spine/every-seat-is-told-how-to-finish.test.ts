/**
 * EVERY SEAT MUST BE TOLD HOW TO FINISH, AND THE TEST HAS TO COMPOSE THE BRIEF
 * TO KNOW IT.
 *
 * ── THE INCIDENT THIS EXISTS FOR ───────────────────────────────────────────
 * On 2026-08-26 the Discover brief was rewritten so that grouping evidence that
 * is ALREADY in the workspace counts as finishing. The rewrite went into
 * `FILE_IT.sense`. It reached no agent.
 *
 * `driver.ts` composes a seat's brief as:
 *
 *     const file = seat?.file ?? FILE_IT[station];
 *
 * so `FILE_IT` is read ONLY when a station has no seat. Discover has three
 * seats, all three read `CREW_ROLE`, and `CREW_ROLE` was not touched. Measured
 * on the live database afterwards: the prompt md5 in `agent_runs.input` was
 * byte-identical before and after the change, per agent, and five completed runs
 * filed zero `spine_track_members` rows.
 *
 * ── WHY THE TEST THAT SHIPPED WITH IT DID NOT CATCH IT ─────────────────────
 * It `readFileSync`s `driver.ts`, slices the `FILE_IT` constant out of the
 * SOURCE TEXT, and asserts `toContain` on that slice. It never calls
 * `stationGoal` and never calls `stationCrew`, so it proves the sentence is
 * present in a file. It cannot prove that any agent is ever handed it, and it
 * was green throughout.
 *
 * That is the general lesson and it is why this file composes the real brief
 * through the real function for the real seats: a test that asserts on a
 * constant proves the constant. Only composing proves delivery.
 *
 * This is F-32 in the other direction, and `driver.ts` already warns about it in
 * the `strategist` seat: `stationGoal` composes the station's job AND the seat's
 * job, so a sentence that must be read has to survive both paths.
 */
import { describe, expect, it } from "bun:test";

import { AGENT_STATION_ORDER } from "../agent-vocabulary";
import { stationCrew, stationGoal } from "./driver";

const TRACK = { title: "A track used only to compose a brief", origin: null };

/** Every active cast seat in the product, with the station it sits at. */
const SEATS = AGENT_STATION_ORDER.flatMap((station) =>
  stationCrew(station).map((seat) => ({ station, seat })),
);

describe("every seat is told how to finish", () => {
  it("has seats to check at all, so a silent empty catalog cannot pass this file", () => {
    expect(SEATS.length).toBeGreaterThan(0);
  });

  /**
   * `stationCrew` builds a seat with `CREW_ROLE[e.slug]?.file ?? ""`, and an
   * empty string is NOT nullish. So a cast seat added to the catalog without a
   * `CREW_ROLE` entry gets `file: ""`, and `seat?.file ?? FILE_IT[station]` then
   * returns that empty string rather than falling back to the station default.
   * The agent is briefed with no filing instruction at all, and nothing says so.
   *
   * At the time of writing this is latent: 0 of 15 active cast seats hit it.
   * Latent is exactly when to nail it down, because the way it goes live is
   * somebody adding a seat, which is a one-line change that looks harmless.
   */
  it.each(SEATS)("$station/$seat.slug is given a filing instruction", ({ seat }) => {
    expect(seat.file.trim()).not.toBe("");
  });

  it.each(SEATS)(
    "$station/$seat.slug has its job and its filing instruction in the composed brief",
    ({ station, seat }) => {
      const brief = stationGoal(station, TRACK, [], seat);
      expect(brief).toContain(seat.job);
      expect(brief).toContain(seat.file);
    },
  );

  /**
   * NOT DUPLICATED HERE, ON PURPOSE.
   *
   * The Discover wording itself, and the rule that the STATION's filing text
   * reaches every seat at every station, are asserted in
   * `evidence-already-on-the-record-is-evidence.test.ts`, which S0 rewrote to
   * compose real briefs after this defect. Two files asserting one claim means
   * one of them gets edited and the other quietly stops meaning anything.
   *
   * This file keeps the half that one does not cover: that each SEAT's own job
   * and filing text survive composition, and that no seat is handed an empty
   * filing instruction in the first place.
   */

  /**
   * OPEN, AND IT IS THE PRODUCT'S OWN CLAIM RATHER THAN A DETAIL.
   *
   * CLAUDE.md: "The moat is the forecast captured at decision time." The forecast
   * IS captured: `FILE_IT.decide` refuses a decision without one, naming what you
   * expect to happen, the observable that will settle it, and the date it comes
   * due. Then nothing reads it back.
   *
   * `FILE_IT.learn` tells the seat to grade against `prd_id`, "the spec this work
   * was graded against". `data-analyst`'s own job says "grade the outcome against
   * what the spec above said it was for". Neither ever names the forecast, so the
   * seat that grades is never told what was predicted.
   *
   * MEASURED ON THE LIVE DATABASE, all 18 runs these two seats have ever had:
   * `input ILIKE '%forecast%'` is FALSE on every one, including the two composed
   * briefs of 7,800 and 7,842 characters.
   *
   * This is the cause of S4-052, and it corrects it: the two verdicts that graded
   * tablet abandonment against a 5% spec target instead of the forecast were the
   * agents doing EXACTLY what they were briefed to do. The defect is the brief,
   * not the crew.
   *
   * NAMING IT IN THE BRIEF IS NOT ENOUGH, and this is the part that would have
   * cost a wasted cycle. Two more things drop the forecast before it arrives:
   *
   *   1. `chain.ts:120` is `decision: { table: "decisions", title: "title",
   *      body: "rationale" }`. Only `rationale` is selected, so not one of the
   *      ELEVEN `forecast_*` columns on `decisions` is ever loaded.
   *   2. `driver.ts:871` is `describeUpstream(upstream, station === "learn" ?
   *      ["prd"] : [])`, and `describeUpstream` inlines only the two NEWEST
   *      bodies plus the yardstick. On a full walk the decision is among the
   *      oldest, so even a forecast-carrying body would be dropped at Learn.
   *
   * So the fix is three changes and any one alone does nothing: carry the
   * forecast columns in the decision's body, make the decision a yardstick at
   * Learn, and name the forecast in the brief.
   *
   * Left as a todo rather than a failing assertion for the same reason as before:
   * four lanes gate every push on `bun test`, and the fix is S0's, in S0's file.
   * It flips to a real assertion the moment the Learn brief names the forecast.
   */
  it.todo("the seats that grade are told what was forecast, not only the spec", () => {
    for (const seat of stationCrew("learn")) {
      const brief = stationGoal("learn", TRACK, [], seat);
      expect(brief.toLowerCase()).toContain("forecast");
    }
  });
});
