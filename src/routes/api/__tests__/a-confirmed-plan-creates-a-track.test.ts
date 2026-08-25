/*
 * A CONFIRMED PLAN CREATES A TRACK, NOT A MISSION (R-24 · queue item 16 · F-04).
 *
 * The front door's whole defect was measured before it was ruled: the app-wide
 * composer said "What should we build?", filed a MISSION the run workbench
 * cannot see, and only 59 tracks ever existed. R-24 settled it — a dispatch
 * that is a piece of work creates a TRACK through `startTrackCore` with the
 * route the person confirmed on the gate; the mission is Build's container and
 * is opened by the Build station alone.
 *
 * There is no unit harness for a TanStack route handler here, so this guards
 * the way this repo guards route invariants: on the source, against
 * IDENTIFIERS rather than copy (pin the claim, not the spelling — a renamed
 * import fails this loudly instead of drifting).
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(import.meta.dir, "..", "plan-gate.ts"), "utf8");

describe("plan-gate dispatches work as a track", () => {
  test("the gate imports and calls startTrackCore", () => {
    expect(src).toContain("startTrackCore");
    expect(src.match(/startTrackCore\(/g)?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  test("the gate never opens a mission or an agent loop itself", () => {
    expect(src).not.toContain("createMission");
    expect(src).not.toContain("runAgentLoop");
  });

  test("the response carries trackId, and missionId is the explicit null R-24 asks for", () => {
    expect(src).toContain("trackId,");
    expect(src).toContain("missionId: null");
  });

  test("the persisted answer carries the door to the track", () => {
    expect(src).toContain("/track/${trackId}");
  });
});
