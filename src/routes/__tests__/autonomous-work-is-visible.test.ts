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
 * WHAT THIS TEST HOLDS. Every surface an agent demonstrably runs behind mounts
 * `CrewWorking`, which is bound to real running mission rows rather than to a
 * local mutation. It is a source scan because what is being protected is the
 * MOUNT: a surface that quietly drops it goes dark again with nothing else
 * failing.
 *
 * WHY THE LIST GREW PAST THE FIVE LOOP STATIONS (2026-08-06). Three surfaces
 * where agents run were not on it, each missed for its own reason.
 *
 *   - DISCOVER is station 01, and its body is a COMPONENT rather than a route
 *     file. A scan rooted at `routes/` could not have caught it, which is why
 *     the paths below are relative to `src/` instead.
 *   - DESIGN looked covered: it carries three `AgentPulse` mounts, more than
 *     any other surface on the list below (Decide, Build and Ship have one
 *     each; Plan's index, Learn, Discover and Brain have none). Per surface
 *     and not per station, because the count is per file: plan.spec is a Plan
 *     route, is not on this list, and carries three of its own. All three of
 *     Design's are gated on `drawAt.isPending` or
 *     `critic.isPending`, so between them they report one thing — a run the
 *     reader started in this tab and still has open. Neither
 *     `redrawDesignScaffold` nor `runScaffoldDesignCritic` writes a mission row
 *     (design-scaffold.functions.ts names `missions` nowhere), so those three
 *     pulses and this line are structurally incapable of reporting the same
 *     piece of work. A count of indicators was the wrong test; what each one is
 *     bound to is the right one.
 *   - BRAIN had no live element at all. Its single agent mark is drawn
 *     `state="quiet"`, which is precisely the state that claims nothing is
 *     happening, on the one surface whose every sentence is past tense.
 */

/**
 * Rooted at `src/`, not at this directory, so a surface that is a component
 * sits in the same list as a surface that is a route. See Discover above.
 */
const SRC = join(import.meta.dir, "..", "..");
const read = (f: string) => readFileSync(join(SRC, f), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/**
 * WHY THE LIST GREW AGAIN (2026-08-18): THE SURFACE THIS FILE'S OWN HEADER
 * NAMES AS THE SHARPEST CASE WAS NOT ON IT.
 *
 * Read the paragraph above beginning "The sharpest case". It names
 * `plan.spec` — `sendToStudio` enqueues a builder run the sweeper later
 * promotes, and the pulse labelled "Build is picking up the spec" stopped at
 * the exact moment the agent actually started. Then the list below listed
 * `plan.index` and stopped, so the file argued its case on one route and
 * guarded a different one, and `plan.spec.$id.tsx` mounted no `CrewHere` of any
 * kind for as long as this test has existed.
 *
 * The reason it was missed is written into the note above too, and it is the
 * same reason Design was missed: this list is per SURFACE, and Plan has two.
 * The route that DISPATCHES is not the route that is named after the station.
 * `sendToStudio` also navigates the reader away, so the one moment the
 * autonomous path is most worth showing is the moment this surface went dark.
 *
 * Every surface a person watches work happen on: the seven lifecycle stations,
 * in lifecycle order, the spec editor that hands work to Build, and then the
 * record the crew writes to.
 */
const STATIONS = [
  // Station 01. The route file is a shell that parses the deep link; this is
  // the surface a person actually reads.
  "components/discover/DiscoverSurface.tsx",
  // "routes/_authenticated.decide.tsx", "routes/_authenticated.plan.
  // index.tsx", "routes/_authenticated.design.tsx" and
  // "routes/_authenticated.build.index.tsx" left this list (P-14,
  // A-QUEUE.md, R-34): all four stations are deleted, so no agent runs
  // visibly on any of them any more.
  //
  // Station 03's surviving surface, and the only one in the product that
  // dispatches a build. See the note above this list.
  "routes/_authenticated.plan.spec.$id.tsx",
  // "_authenticated.ship.tsx" left this list on 2026-09-09 (P-14b): it is a
  // redirect to Outcomes, which is already on the list below and mounts
  // CrewWorking once for every tab, Ship's record included.
  // "_authenticated.learn.tsx" left this list on 2026-09-09 (P-14b): it is a
  // redirect to Outcomes, which is already on the list and mounts CrewWorking.
  // Not a station. The company record, where agents write and where a reader
  // is most likely to assume nothing is running.
  // "_authenticated.brain.tsx" -> "_authenticated.outcomes.tsx" (P-14a): the
  // page moved, taking CrewWorking with it. The stub left at the old path
  // redirects and mounts nothing.
  "routes/_authenticated.outcomes.tsx",
];

describe("every surface where agents run shows the crew working on its own", () => {
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
  const hook = strip(read("hooks/use-live-agents.ts"));
  const comp = strip(read("components/shell/CrewWorking.tsx"));

  it("reads real mission rows and filters on a working status", () => {
    // The marks read since 2026-09-09: the same rows, seven fields a mission,
    // one round trip, instead of listMissions's steps, runs and cost.
    expect(hook).toMatch(/listMissionMarks/);
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
    expect(hook).toMatch(/queryKey: missionMarksKey\(workspaceId\)/);
    expect(hook).not.toMatch(/refetchInterval/);
  });

  /*
   * THE KEY MUST NOT PROMISE A SCOPE THE FETCH DOES NOT APPLY.
   *
   * The assertion above pinned the key and stopped there, and that is exactly
   * where the two drifted apart. Until 2026-08-18 the key read
   * `missionsKey(workspaceId)` while the fetch read `{ data: {} }`, and
   * `listMissions` only filters when `workspaceId` is present -- so the hook
   * returned every working mission on the ACCOUNT while claiming, in its own
   * cache key, to be per-workspace.
   *
   * Because four callers share that key and only `today.tsx` passed the
   * workspace, one key held two different datasets and the answer depended on
   * which component mounted first. A guard that pins half a contract is how a
   * bug like that survives a rename, a review and a rewrite.
   */
  it("fetches the workspace its key claims, in every caller that shares the key", () => {
    expect(hook).toMatch(/fetchMissions\(\{ data: \{ workspaceId/);

    for (const caller of [
      "components/shell/AppFrame.tsx",
      "components/ask/AskPane.tsx",
      // _authenticated.today.tsx left this list in P-10 (A-QUEUE.md,
      // 2026-09-02): it was a pure redirect stub with no missionsKey call,
      // deleted along with the other 48 the packet's census found.
    ]) {
      const source = strip(read(caller));
      if (!/missionsKey\(|missionMarksKey\(/.test(source)) continue;
      expect(source, `${caller} shares a missions key and must pass the workspace`).not.toMatch(
        /fetchMissions\(\{ data: \{\} \}\)/,
      );
    }
  });

  it("renders nothing when nothing is running, so it can never fabricate a step", () => {
    expect(comp).toMatch(/if \(shown\.length === 0\) return null;/);
  });

  it("names the agent and the work, rather than saying 'loading'", () => {
    expect(comp).toMatch(/is working on/);
    expect(comp).not.toMatch(/Loading|Please wait/i);
  });
});

/**
 * WHAT THE AGENT IS DOING HAS TO SURVIVE THE TRIP, AND NOTHING HELD IT.
 *
 * `mission_steps.sub_goal` is `text NOT NULL` and populated on every row, and
 * `listMissions` was already reading that table for the step dots, so the
 * sentence was one column away from the surface for as long as the surface has
 * existed. The carry is four hops -- select, row type, hook, component -- and a
 * quiet edit at any one of them puts the strip back to saying "native is
 * working" with nothing failing. These assertions are the far half nobody wrote
 * when the carry landed.
 */
describe("the sentence survives every hop from the row to the surface", () => {
  const server = strip(read("lib/missions.functions.ts"));
  const hook = strip(read("hooks/use-live-agents.ts"));
  const crew = strip(read("components/shell/CrewWorking.tsx"));
  const dock = strip(read("components/ask/AskDock.tsx"));

  it("selects the column on the read the step dots already make", () => {
    // Named together on one line, because the point is that this costs no
    // extra query. Splitting the select would pass this test and add a round
    // trip to a hot list endpoint.
    expect(server).toMatch(/\.select\("mission_id,idx,status,sub_goal"\)/);
  });

  it("carries it through the row type and the hook", () => {
    expect(server).toMatch(/current_sub_goal/);
    /*
     * THE HOP MOVED, THE REQUIREMENT DID NOT (P-127). The hook read
     * `listMissions` and mapped `m.current_sub_goal`; its subject is
     * `agent_runs` now, because a mission-shaped reader could not see the seats
     * the spine dispatches and the header said "Nothing running" over two of
     * them on the day this shipped its first release.
     *
     * The sentence still has to reach the surface, so the reader selects the
     * same column and the hook still carries it -- which is what this test is
     * about. Pinning the old expression would have made it a vote on WHICH
     * reader, and it was never written about that.
     */
    const runsReader = strip(read("lib/spine/track.functions.ts"));
    /* `current_sub_goal` is DERIVED, not a column -- the column guard caught
       the first draft selecting it as one. The runs reader reads the step in
       flight from `mission_steps`, with the same running-before-dispatched
       precedence `missions.functions.ts` uses, so the two cannot describe one
       step differently. */
    expect(runsReader).toMatch(/select\("mission_id,status,sub_goal"\)/);
    expect(hook).toMatch(/subGoal: seat\.subGoal/);
  });

  it("never shortens the sentence in JavaScript", () => {
    // THE DEFECT THIS EXISTS TO STOP. A first pass sliced the string and
    // appended an ellipsis. On a product whose claim is the record, a
    // truncated quote of what an agent said is a fabrication -- the tail did
    // not exist anywhere, so it could not be selected, copied or read out. The
    // clamp is CSS, so the DOM keeps the sentence whole.
    expect(crew).not.toMatch(/\.slice\(|\.substring\(|\.substr\(/);
    expect(crew).toMatch(/WebkitLineClamp/);
  });

  it("keeps the sentence out of the mono nowrap slot", () => {
    // `.sp-pulse-detail` is mono, nowrap and ellipsised, and AgentPulse's own
    // contract says `detail` takes a NOUN this surface already read. A 110-char
    // imperative sentence there clips to a fragment beside a second verb, which
    // is worse than the title it would displace.
    expect(crew).not.toMatch(/detail=\{[^}]*subGoal/);
  });

  it("gives the dock the title, and lets only the title truncate", () => {
    // The dock is on every authenticated route, so this is the most-seen
    // instance of the line. It takes the TITLE, not the sentence: one row
    // beside a prompt and a shortcut has no space for prose.
    expect(dock).toMatch(/sp-dock-live-work/);
    expect(dock).toMatch(/lead\.title/);
    // The state leads and the count trails, both outside the truncating span,
    // so a long title can eat neither.
    expect(dock).toMatch(/is working[\s\S]{0,400}sp-dock-live-work/);
    expect(dock).toMatch(/sp-dock-live-work[\s\S]{0,400}more/);
  });
});
