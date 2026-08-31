/**
 * A station with nothing on it still has to hand a person somewhere to go.
 *
 * WHY THIS FILE EXISTS. Learn was the only one of the seven stations that, on a
 * brand-new workspace, rendered a headline and one paragraph with no button and
 * no link. Every read on that desk is count-gated, and each gate is individually
 * correct: the forecast desk draws nothing with no forecast due, the settle panel
 * returns null with no rows, the notes row is gated on notes, the
 * take-it-with-you block is gated on a record existing. Four correct gates
 * compose into a dead end, and no test could see it because every one of them
 * asks "does this block behave correctly" and none asks "does the page still
 * offer a way forward when they all decline".
 *
 * That is the same shape as the four reachability defects in the August audit,
 * pointed at a surface rather than at a module: the units are right and the
 * feature is missing. Learn is the station the moat rests on, which is why it
 * being the dead end mattered more than where it sat in the list.
 *
 * WHAT THIS CAN AND CANNOT PROVE. It reads source text, so it proves that an
 * empty branch CARRIES a navigation door, not that the door renders in a browser
 * under every state. A real render test would need a mounted query client per
 * station and is worth writing; this is the cheap guard that would have caught
 * the actual defect, which was a total absence rather than a subtle condition.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROUTES = join(import.meta.dir, "..");

/**
 * The seven stations, by the file that renders each.
 *
 * Build and Plan render from `.index` files; the others are flat. Discover,
 * Decide and Design keep their doors in components, so the surface file is read
 * along with the component directory it mounts, which is why the check below
 * looks for a door anywhere in the station's own source rather than in one file.
 */
const STATIONS: Array<{ station: string; files: string[]; components?: string[] }> = [
  {
    station: "01 Discover",
    files: ["_authenticated.discover.tsx"],
    // Discover's route file is an 80-line shell; every control lives here.
    components: ["discover/DiscoverSurface.tsx"],
  },
  { station: "02 Decide", files: ["_authenticated.decide.tsx"] },
  { station: "03 Plan", files: ["_authenticated.plan.index.tsx"] },
  { station: "04 Design", files: ["_authenticated.design.tsx"] },
  { station: "05 Build", files: ["_authenticated.build.index.tsx"] },
  { station: "06 Ship", files: ["_authenticated.ship.tsx"] },
  { station: "07 Learn", files: ["_authenticated.learn.tsx"] },
];

function sourceOf(s: { files: string[]; components?: string[] }): string {
  const parts = s.files.map((f) => readFileSync(join(ROUTES, f), "utf8"));
  for (const c of s.components ?? []) {
    parts.push(readFileSync(join(ROUTES, "..", "components", c), "utf8"));
  }
  return parts.join("\n");
}

/** A door is a navigate, a Link, or a router-typed `to=`. Any of the three. */
function doorCount(src: string): number {
  const navigates = src.match(/navigate\(\s*\{\s*to:/g)?.length ?? 0;
  const links = src.match(/<Link\b/g)?.length ?? 0;
  const tos = src.match(/\bto="\/[a-z-]/g)?.length ?? 0;
  return navigates + links + tos;
}

describe("every station offers somewhere to go", () => {
  for (const spec of STATIONS) {
    it(`${spec.station} carries at least one door`, () => {
      // WHAT THIS CAUGHT WHEN IT WAS WRITTEN: Ship had no in-app door of any
      // kind. Every link on that station is an anchor to an external address (a
      // production URL, a pull request) or one raw href to a legacy route name,
      // so the router was never used from it at all. Learn had none either.
      expect(doorCount(sourceOf(spec))).toBeGreaterThan(0);
    });
  }
});

describe("Learn's empty desk asks a question and answers it with a door", () => {
  const learn = () => readFileSync(join(ROUTES, "_authenticated.learn.tsx"), "utf8");

  it("puts a Gate on the nothing-settled branch, not a bare paragraph", () => {
    // THE DEFECT, stated as a property. The branch reached when `outcomes.total`
    // is zero is the one a brand-new workspace lands on, and it used to be an
    // `Empty` with prose and no control.
    const src = learn();
    const branch = src.slice(src.indexOf("(outcomes?.total ?? 0) === 0"));
    const untilNext = branch.slice(0, branch.indexOf("(outcomes?.validated ?? 0) === 0"));
    expect(untilNext).toContain("<Gate");
    expect(untilNext).toContain("navigate({ to:");
  });

  it("offers exactly one primary, because a Gate asks one question", () => {
    const src = learn();
    const branch = src.slice(src.indexOf("(outcomes?.total ?? 0) === 0"));
    const untilNext = branch.slice(0, branch.indexOf("(outcomes?.validated ?? 0) === 0"));
    expect(untilNext.match(/variant="primary"/g)?.length ?? 0).toBe(1);
  });

  it("sends people to stations that exist", () => {
    // A door to a route that does not resolve is worse than no door: it reads as
    // progress and ends in a not-found.
    const src = learn();
    const targets = [...src.matchAll(/navigate\(\s*\{\s*to:\s*"(\/[a-z-]+)"/g)].map((m) => m[1]);
    expect(targets.length).toBeGreaterThan(0);
    const known = new Set([
      "/ship",
      "/plan",
      "/discover",
      "/decide",
      "/design",
      "/build",
      "/learn",
      "/brain",
    ]);
    for (const t of targets) expect(known.has(t)).toBe(true);
  });

  it("uses the loop's own words for what is missing, rather than a second wording", () => {
    // `STATION_NEEDS.learn` already says this exact thing to an agent when a
    // track arrives at Learn with nothing to grade. One product, one sentence.
    const src = learn();
    expect(src).toContain("what its spec");
    expect(src.toLowerCase()).toContain("meant to move");
  });
});
