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
      else expect(clause).toContain("waived");
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

  it("agrees on number: one waived station is, several are", () => {
    for (const shape of SHAPES) {
      const n = suggestRoute(shape, null).waived.length;
      const clause = routeClause(shape);
      if (n === 1) expect(clause).toContain("is waived");
      if (n > 1) expect(clause).toContain("are waived");
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
