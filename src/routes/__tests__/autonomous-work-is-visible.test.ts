import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE WORK AGENTS DO ON THEIR OWN MUST BE VISIBLE SOMEWHERE.
 *
 * THE GAP THIS CLOSES, and it was the largest one between what this product
 * does and what a person can see it do.
 *
 * Twelve `<AgentPulse>` mounts existed across the stations, and almost every one
 * was gated on a react-query mutation's `isPending`: `draftSpec.isPending` on
 * Decide, `critic.isPending` and `drawAt.isPending` on Design, `busy` on a run.
 * So the indicator lived exactly as long as the fetch THE READER'S OWN CLICK
 * started, and not one moment longer.
 *
 * Which meant everything the product claims to do on its own had no light
 * anywhere: `driveTrackOnce` walking a track through all seven stations, the
 * resume-runs sweeper promoting a queued run minutes after the click that
 * enqueued it, anything dispatched from Ask, anything a cron raised. The single
 * defining claim of an agentic product was the one thing with no indicator.
 *
 * The sharpest case, because it shows the shape rather than the size: on
 * plan.spec, `sendToStudio` ENQUEUES a builder run that the sweeper later
 * promotes, and the pulse labelled "Build is picking up the spec" stopped at the
 * exact moment the agent actually started.
 *
 * WHAT THIS TEST HOLDS. Every loop station mounts `CrewWorking`, which is bound
 * to real running mission rows rather than to a local mutation. It is a source
 * scan because what is being protected is the MOUNT: a station that quietly
 * drops it goes dark again with nothing else failing.
 */

const ROUTES = join(import.meta.dir, "..");
const read = (f: string) => readFileSync(join(ROUTES, f), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** The loop stations a person watches work happen on. */
const STATIONS = [
  "_authenticated.decide.tsx",
  "_authenticated.plan.index.tsx",
  "_authenticated.build.index.tsx",
  "_authenticated.ship.tsx",
  "_authenticated.learn.tsx",
];

describe("every loop station shows the crew working on its own", () => {
  for (const station of STATIONS) {
    const src = strip(read(station));

    it(`${station} mounts CrewWorking`, () => {
      expect(src).toMatch(/<CrewWorking\b/);
    });

    it(`${station} imports it from the shell, not a local copy`, () => {
      expect(src).toMatch(/import \{ CrewWorking \} from "@\/components\/shell\/CrewWorking"/);
    });
  }
});

describe("the indicator is bound to the run, not to the reader's click", () => {
  const hook = strip(readFileSync(join(ROUTES, "..", "hooks", "use-live-agents.ts"), "utf8"));
  const comp = strip(
    readFileSync(join(ROUTES, "..", "components", "shell", "CrewWorking.tsx"), "utf8"),
  );

  it("reads real mission rows and filters on a working status", () => {
    expect(hook).toMatch(/listMissions/);
    expect(hook).toMatch(/WORKING\.has\(m\.status\)/);
  });

  it("is gated on no mutation state at all", () => {
    // The whole defect in one assertion. If this hook ever consults isPending
    // it has become the thing it replaced.
    expect(hook).not.toMatch(/isPending|isFetching|isMutating/);
    expect(comp).not.toMatch(/isPending|isFetching|isMutating/);
  });

  it("adds no second poll, by sharing the shell's query key", () => {
    // A separate key would double the traffic to say the same thing, and the
    // shell already owns the cadence.
    expect(hook).toMatch(/queryKey: missionsKey\(workspaceId\)/);
    expect(hook).not.toMatch(/refetchInterval/);
  });

  it("renders nothing when nothing is running, so it can never fabricate a step", () => {
    expect(comp).toMatch(/if \(shown\.length === 0\) return null;/);
  });

  it("names the agent and the work, rather than saying 'loading'", () => {
    expect(comp).toMatch(/is working on/);
    expect(comp).not.toMatch(/Loading|Please wait/i);
  });
});
