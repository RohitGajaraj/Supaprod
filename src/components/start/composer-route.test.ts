/**
 * The composer's route clause says the road, and reads it from the road.
 *
 * The defect this pins is the one the fifth review found: the home filed every
 * sentence as `new-capability`, so a break entered at Discover. The clause is
 * derived from `suggestRoute`, so the guard's job is to prove it stays derived
 * (station NAMES, every waiver, no ids) rather than to re-type the sentences.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { routeClause } from "./ComposerRoutePicker";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { suggestRoute, WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";

const SHAPES = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];

describe("the sentence knows where it enters before Enter", () => {
  it("names the entry station of every shape, by its name", () => {
    for (const shape of SHAPES) {
      const entry = AGENT_STATIONS[suggestRoute(shape, null).entry].name;
      expect(routeClause(shape)).toContain(`enters at ${entry}`);
    }
  });

  it("names every station policy waives, so a waiver cannot go unsaid", () => {
    for (const shape of SHAPES) {
      const waived = suggestRoute(shape, null).waived;
      const clause = routeClause(shape);
      for (const w of waived) expect(clause).toContain(AGENT_STATIONS[w.station].name);
      if (waived.length === 0) expect(clause).toContain("all seven stations");
      /*
       * "SKIPS", AND THIS ASSERTION USED TO PIN "waived" — the internal word.
       * The claim was always "a waiver cannot go unsaid", which the loop above
       * checks by NAME. What this line adds is that the sentence says a route
       * skips them, in the word `tracks-feed.ts` already uses for the same idea
       * ("needs a step this route skips"). Pinning the old spelling made the
       * test fail on a copy improvement and pass on a meaning change, which is
       * the wrong way round.
       */
      else expect(clause).toContain("skips");
    }
  });

  it("never leaks a station id", () => {
    // `sense`, `define` and the rest are the driver's words, never a person's.
    const ids = Object.keys(AGENT_STATIONS);
    for (const shape of SHAPES) {
      const clause = routeClause(shape).toLowerCase();
      for (const id of ids) {
        if (AGENT_STATIONS[id as keyof typeof AGENT_STATIONS].name.toLowerCase() === id) continue;
        expect(clause).not.toContain(id);
      }
    }
  });

  it("reads as one sentence about one route, whether it skips one station or four", () => {
    /*
     * THIS USED TO ASSERT SUBJECT-VERB AGREEMENT, "is waived" against "are
     * waived", because the sentence ended in a passive clause whose verb had
     * to agree with a list. It does not any more: "it enters at Build and
     * skips Discover, Decide, Plan and Design" has no verb to agree.
     *
     * The claim underneath was that the sentence stays grammatical at every
     * length, so that is what this checks now -- and it checks the join, which
     * is the part that can actually break: one name bare, several with a comma
     * series and a final "and".
     */
    for (const shape of SHAPES) {
      const waived = suggestRoute(shape, null).waived.map((w) => AGENT_STATIONS[w.station].name);
      const clause = routeClause(shape);
      if (waived.length === 0) continue;
      if (waived.length === 1) {
        expect(clause).toContain(`skips ${waived[0]}`);
        expect(clause).not.toContain(", ");
      } else {
        /*
         * TWO NAMES TAKE NO COMMA -- "skips Discover and Design" -- and three
         * or more take a series. My first version of this asserted a comma at
         * every length above one and failed on the two-station route, which is
         * the test being wrong rather than the sentence: `named` has always
         * joined a pair with a bare "and".
         */
        expect(clause).toContain(` and ${waived[waived.length - 1]}`);
        expect(clause).toContain(
          waived.length === 2 ? `skips ${waived[0]} and` : `skips ${waived[0]},`,
        );
      }
      // No semicolon: two clauses joined by "and" are one fact about one
      // route, where a semicolon reads as a second announcement.
      expect(clause).not.toContain(";");
    }
  });

  it("the home passes the picked shape to the start, and its origin with it", () => {
    /*
     * The ORIGIN RULE (track.functions.ts `validateRoute`): work entering below
     * Discover has no evidence behind it, so a route with no stated origin is
     * refused. The home already sent the sentence as `origin` for a non-default
     * shape; this pins that the shape it sends is the picked one rather than
     * the constant that made the defect.
     */
    const SRC = readFileSync("src/routes/_authenticated.start.tsx", "utf8");
    expect(SRC).toContain("const shape: WorkShape = job?.shape ?? pickedShape;");
    expect(SRC).toContain('origin: shape !== "new-capability" ? s : undefined');
    expect(SRC).toContain("<ComposerRoutePicker");
  });
});
