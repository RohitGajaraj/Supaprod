/**
 * A STATION MAY ONLY BE TOLD TO CALL A TOOL IT CAN ACTUALLY CALL.
 *
 * F-50 fixed the briefs: `studio.checks.run` and `studio.pr.merge` had ZERO
 * mentions in this file, `release.publish` refuses a changeset that is not
 * merged, and nothing in the seven stations merged anything — so the pull
 * request Build opened sat there forever. This file guards the constraint the
 * fix had to satisfy, which is a different thing from the fix and outlives it.
 *
 * THE CONSTRAINT. `studio.pr.merge` and `studio.checks.run` both open
 * `if (!missionId) throw`, and both resolve the changeset THROUGH the mission.
 * `driveTrackOnce` attaches a mission at Build **and nowhere else**. So those
 * two tools are callable at exactly one station, and briefing them anywhere else
 * would produce what `prd-writer`'s comment three hundred lines up warns about in
 * as many words: *"a brief that instructs an impossible call is worse than no
 * brief, because the agent obeys it."*
 *
 * THAT IS NOT HYPOTHETICAL. Two sessions fixed F-50 in parallel and reached
 * different designs — one put the merge on Build's checking seat, the other on
 * Ship. **Only the first is mechanically possible**, and the difference is
 * invisible in review: both read fine, both typecheck, and one of them fails at
 * runtime on a station nothing had ever reached before. This test is what tells
 * them apart.
 *
 * So it tests the PROPERTY rather than today's two tools, and derives BOTH lists
 * from the source that decides them: the tools by matching the throw in
 * `registry.server.ts`, the stations from the driver's own ternary. A third tool
 * with the same precondition, or a station quietly dropped from that ternary,
 * fails here rather than at 04:00 on a live run.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { stationCrew } from "./driver";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const DRIVER_SRC = read("./driver.ts");
const DRIVER_SERVER_SRC = read("./driver.server.ts");
const REGISTRY_SRC = read("../ai/tools/registry.server.ts");

/** Tools whose handler refuses outright without a mission. Derived, not listed. */
const MISSION_REQUIRED: string[] = [
  ...new Set([...REGISTRY_SRC.matchAll(/"([a-z][a-z.]+)\s+requires a mission/g)].map((m) => m[1])),
].sort();

/** Stations the driver hands a mission to, read off the ternary that decides it. */
const MISSION_ATTACHED: string[] = [
  ...new Set(
    [
      ...DRIVER_SERVER_SRC.slice(
        DRIVER_SERVER_SRC.indexOf("const missionId ="),
        DRIVER_SERVER_SRC.indexOf("const missionId =") + 600,
      ).matchAll(/station === "([a-z]+)"/g),
    ].map((m) => m[1]),
  ),
].sort();

/** The station's fallback filing instruction, used when it has no crew entry. */
const FILE_IT_BLOCK = DRIVER_SRC.slice(
  DRIVER_SRC.indexOf("const FILE_IT: Record<AgentStation, string>"),
  DRIVER_SRC.indexOf("\n};", DRIVER_SRC.indexOf("const FILE_IT: Record<AgentStation, string>")),
);

function fallbackFor(station: AgentStation): string {
  // Sliced to the next TOP-LEVEL key, not the next indented line: several of
  // these entries put the string on the line after the key, so stopping at the
  // first "\n  " returned the key and nothing else — and every `toContain`
  // against it passed vacuously. A helper that silently returns almost nothing
  // makes a test that cannot fail, which is worse than no test.
  const at = FILE_IT_BLOCK.indexOf(`\n  ${station}:`);
  if (at === -1) return "";
  const after = FILE_IT_BLOCK.slice(at + 1);
  const next = after.search(/\n {2}[a-z][a-zA-Z]*:/);
  return next === -1 ? after : after.slice(0, next);
}

/** Everything a seat at this station is told, plus the fallback. */
function briefsFor(station: AgentStation): string {
  return (
    stationCrew(station)
      .map((seat) => `${seat.job} ${seat.file}`)
      .join(" ") + ` ${fallbackFor(station)}`
  );
}

describe("the lists this property is built on", () => {
  it("finds the tools that refuse without a mission", () => {
    expect(MISSION_REQUIRED).toContain("studio.pr.merge");
    expect(MISSION_REQUIRED).toContain("studio.checks.run");
    expect(MISSION_REQUIRED.length).toBeGreaterThanOrEqual(2);
  });

  it("finds the stations the driver gives a mission to", () => {
    expect(MISSION_ATTACHED).toEqual(["build"]);
  });
});

describe("no station is told to make a call it cannot make", () => {
  it.each(AGENT_STATION_ORDER)(
    "%s names no mission-requiring tool it has no mission for",
    (station) => {
      const brief = briefsFor(station as AgentStation);
      for (const tool of MISSION_REQUIRED) {
        if (!brief.includes(tool)) continue;
        expect(
          MISSION_ATTACHED,
          `${station} is told to call ${tool}, which throws without a mission, and the driver gives ${station} no mission`,
        ).toContain(station);
      }
    },
  );
});

describe("the ship chain, where F-50 left it", () => {
  it("is briefed end to end from one station, because that is the only one with a mission", () => {
    const build = briefsFor("build");
    for (const tool of ["studio.stage", "studio.commit", "studio.pr.open", "studio.pr.merge"]) {
      expect(build, `Build must name ${tool}`).toContain(tool);
    }
  });

  it("reads the checks before it lands the branch", () => {
    const build = briefsFor("build");
    expect(build).toContain("studio.checks.run");
    // Order is mechanical, not stylistic: merging before knowing the verdict is
    // the thing `studio.pr.merge`'s own in-tool CI gate exists to refuse, and a
    // brief that describes it backwards teaches the agent to try.
    expect(build.indexOf("studio.checks.run")).toBeLessThan(build.lastIndexOf("studio.pr.merge"));
  });

  /**
   * THE FALLBACK IS THE HALF THAT GETS FORGOTTEN. F-32 was found half-fixed
   * because the retired sentence also lived in `CREW_ROLE`, and `stationGoal`
   * composes both into one brief. A defect is a shape, not a location.
   */
  it("says the same thing in the fallback as in the seats", () => {
    const fallback = fallbackFor("build");
    for (const tool of ["studio.commit", "studio.pr.open", "studio.pr.merge"]) {
      expect(fallback, `the build fallback must name ${tool}`).toContain(tool);
    }
  });

  /**
   * Ship publishes and does not merge — not as a preference, but because it has
   * no mission and `studio.pr.merge` would throw before it did anything. The
   * property above already forbids it; this names the case so a future reader
   * sees the intent rather than deducing it from a generic assertion.
   */
  it("leaves Ship publishing, which is the only ship-chain call it can make", () => {
    const ship = briefsFor("ship");
    expect(ship).toContain("release.publish");
    expect(ship).not.toContain("studio.pr.merge");
    expect(ship).not.toContain("studio.checks.run");
  });
});
