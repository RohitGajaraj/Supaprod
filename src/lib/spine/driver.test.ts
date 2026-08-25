/**
 * The driver's stop conditions, tested without a database.
 *
 * These tests are the safety of the whole autonomous feature. A driver that
 * runs when it should not is worse than no driver at all, so the invariants
 * that matter are the refusals and their ORDER: a kill switch outranks
 * everything, and a track with a call already in front of a person never
 * dispatches more work on top of it.
 */

import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  decideDrive,
  leadAgentFor,
  stationCrew,
  stationGoal,
  HOLD_LINE,
  MAX_STATION_ATTEMPTS,
} from "./driver";
import { AGENT_STATION_ORDER, SPECIALIST_CATALOG } from "@/lib/agent-vocabulary";

const base = {
  paused: false,
  station: "define" as const,
  title: "Add SSO to the admin console",
  origin: "Two enterprise deals are blocked on it",
  pendingApprovals: 0,
  attempts: 0,
};

describe("leadAgentFor", () => {
  it("names an active cast agent for every station on the spine", () => {
    // A station with no dispatchable agent cannot be driven, so the driver
    // would silently hold there forever. Better caught here than in a cron.
    for (const station of AGENT_STATION_ORDER) {
      expect(leadAgentFor(station)).toBeTruthy();
    }
  });

  it("never returns the conductor", () => {
    // The orchestrator routes work; it is not a station occupant. Dispatching
    // it as a station lead would nest an orchestrator inside a route.
    const slugs = AGENT_STATION_ORDER.map(leadAgentFor);
    expect(slugs).not.toContain("orchestrator");
  });
});

describe("decideDrive refusals, in priority order", () => {
  it("a kill switch outranks everything, including work that is otherwise ready", () => {
    const d = decideDrive({ ...base, paused: true });
    expect(d.act).toBe(false);
    expect(d).toMatchObject({ hold: "paused" });
  });

  it("paused wins even when a person is also waiting", () => {
    // Both are true; only one may be reported, and the pause is the fact that
    // explains why nothing at all is moving.
    const d = decideDrive({ ...base, paused: true, pendingApprovals: 4 });
    expect(d).toMatchObject({ hold: "paused" });
  });

  it("never dispatches on top of a call already in front of a person", () => {
    // Otherwise one unanswered approval becomes an unbounded queue, which is
    // the exact failure the boundary surface exists to shrink.
    const d = decideDrive({ ...base, pendingApprovals: 1 });
    expect(d).toMatchObject({ hold: "waiting-on-a-person" });
  });

  it("reports a finished route as done rather than acting", () => {
    const d = decideDrive({ ...base, station: null });
    expect(d).toMatchObject({ hold: "done" });
  });

  it("stops retrying a station that keeps producing nothing", () => {
    // A retry loop is a metered cost leak that looks like progress.
    const d = decideDrive({ ...base, attempts: MAX_STATION_ATTEMPTS });
    expect(d).toMatchObject({ hold: "stalled" });
  });

  it("still acts one attempt below the ceiling", () => {
    expect(decideDrive({ ...base, attempts: MAX_STATION_ATTEMPTS - 1 }).act).toBe(true);
  });
});

describe("decideDrive when it acts", () => {
  it("names the station, the agent and the job", () => {
    const d = decideDrive(base);
    expect(d.act).toBe(true);
    if (!d.act) return;
    expect(d.station).toBe("define");
    expect(d.agentSlug).toBeTruthy();
    expect(d.goal).toContain("Add SSO to the admin console");
  });

  it("carries the reason the work exists into the goal", () => {
    // The origin is the one thing only the track knows. Without it an agent
    // working below Discover has no idea why it is doing any of this.
    const d = decideDrive(base);
    if (!d.act) throw new Error("expected the driver to act");
    expect(d.goal).toContain("Two enterprise deals are blocked on it");
  });

  it("omits the reason cleanly when there is none", () => {
    const d = decideDrive({ ...base, origin: null });
    if (!d.act) throw new Error("expected the driver to act");
    expect(d.goal).not.toContain("It exists because");
    expect(d.goal).toContain("Add SSO");
  });
});

describe("stationGoal", () => {
  const track = { title: "Add SSO", origin: null };

  it("gives every station a job", () => {
    for (const station of AGENT_STATION_ORDER) {
      expect(stationGoal(station, track).length).toBeGreaterThan(20);
    }
  });

  it("tells Decide it may say no, and that a no is filed", () => {
    // A decide station that can only say yes is theatre, and the whole
    // decision record downstream would be worthless.
    //
    // This assertion used to read `toContain("does not support it")`, which
    // pinned the SPELLING of one clause. F-32 rewrote the brief and the claim
    // survived while the literal did not, so the test failed on improved copy
    // — pin the claim.
    //
    // The claim has two halves and the second is the one that was missing in
    // practice: a station that says no and files nothing leaves no `decisions`
    // row, so no forecast, so nothing that can ever be resolved. On
    // 2026-08-25 that is exactly where the live track stopped.
    const goal = stationGoal("decide", track);
    expect(goal).toContain('"no"');
    expect(goal).toContain("file it the same way as a yes");
    expect(goal).toContain("must not do is decline to decide");
  });

  it("tells Learn to record a miss", () => {
    // The one station whose value depends entirely on honesty.
    expect(stationGoal("learn", track).toLowerCase()).toContain("miss");
  });

  it("tells Build to stop at its boundary", () => {
    expect(stationGoal("build", track)).toContain("boundary");
  });
});

describe("HOLD_LINE", () => {
  it("explains every hold reason a person could hit", () => {
    for (const reason of Object.keys(HOLD_LINE) as Array<keyof typeof HOLD_LINE>) {
      expect(HOLD_LINE[reason].length).toBeGreaterThan(10);
      // A status word alone is not an explanation.
      expect(HOLD_LINE[reason]).toMatch(/\s/);
    }
  });
});

/**
 * THE ROSTER IS FULLY ASSIGNED, which is the check that was missing.
 *
 * Six active cast agents (researcher, customer-insights, critic, sprint-planner,
 * qa, and Design's second seat, which did not exist) were defined in the catalog
 * with names, colours and relay verbs, and dispatched by nothing at all: the
 * driver took the FIRST active agent per station and ignored the rest. Nothing
 * failed, because an agent that never runs raises no error. It just quietly does
 * not happen, and the station does part of its job forever.
 */
describe("the station crews", () => {
  const active = SPECIALIST_CATALOG.filter(
    (e) => e.tier === "cast" && e.status === "active" && !e.conductor,
  );

  it("gives every active cast agent a station to work", () => {
    const crewed = new Set(AGENT_STATION_ORDER.flatMap((s) => stationCrew(s).map((r) => r.slug)));
    const orphans = active.map((e) => e.slug).filter((s) => !crewed.has(s));
    expect(orphans).toEqual([]);
  });

  it("gives every crew member a job, so nobody is dispatched with an empty brief", () => {
    const jobless = AGENT_STATION_ORDER.flatMap((s) => stationCrew(s))
      .filter((r) => !r.job.trim())
      .map((r) => r.slug);
    expect(jobless).toEqual([]);
  });

  it("staffs all seven stations, so no station is dispatched to nobody", () => {
    const empty = AGENT_STATION_ORDER.filter((s) => stationCrew(s).length === 0);
    expect(empty).toEqual([]);
  });

  it("pairs a maker with a reader at every station that produces an artifact", () => {
    // Design was the one station with a single seat, so nothing read the work
    // before it was handed on. Every other station already had the pair. This
    // pins it: a station shipping one agent again is a regression, not a choice
    // somebody can make quietly.
    const alone = AGENT_STATION_ORDER.filter((s) => stationCrew(s).length < 2);
    expect(alone).toEqual([]);
  });

  it("verifies a release before announcing it, never after", () => {
    const ship = stationCrew("ship").map((r) => r.slug);
    // Ship is the only irreversible station in the loop. A verifier that runs
    // after the publish is not a verifier.
    expect(ship.indexOf("release-verifier")).toBeLessThan(ship.indexOf("release"));
  });

  it("challenges the call after it is made, never before", () => {
    const decide = stationCrew("decide").map((r) => r.slug);
    expect(decide.indexOf("strategist")).toBeLessThan(decide.indexOf("critic"));
  });

  it("keeps the lead as the first of the crew, so the old contract still holds", () => {
    for (const s of AGENT_STATION_ORDER) {
      expect(leadAgentFor(s)).toBe(stationCrew(s)[0].slug);
    }
  });
});

/**
 * ── THE ROSTER DRIFT THE EXISTING GUARDS CANNOT SEE ──────────────────────
 *
 * The block above filters `tier === "cast" && status === "active"`, which is the
 * right question asked of two thirds of the catalogue. Three kinds of drift live
 * in the part it does not look at, and all three were invisible to every gate:
 *
 *   1. TWO AGENTS, ONE NAME, ONE STATION. `builder` and `engineer` both render
 *      as "Engineer" at Build. A job-verb naming scheme exists precisely so a
 *      person can tell two workers apart, and this is the one collision it must
 *      not have.
 *   2. ACTIVE AND DISPATCHED BY NOTHING. `reactor` and `archivist` are
 *      `status: "active"` at `tier: "crew"`, and the cast filter cannot see
 *      them, so nothing checks that anything runs them.
 *   3. DISPATCHED AND NOT ACTIVE. Nothing anywhere asked the question in the
 *      other direction: is every slug the code actually dispatches a real,
 *      current agent? That one is the reason this block exists.
 */
describe("the roster does not drift from the code that dispatches it", () => {
  const bySlug = new Map(SPECIALIST_CATALOG.map((e) => [e.slug, e]));
  const active = SPECIALIST_CATALOG.filter((e) => e.status === "active");

  it("gives no two seedable agents the same name at the same station", () => {
    /*
     * SCOPED TO `active`, AND THE SCOPE IS THE WHOLE POINT.
     *
     * The deprecated entries SHARE names deliberately: their documented job is
     * "map-only, renders a name on historical runs", so a run recorded against
     * `scout` has to come back as "Watch" rather than as a raw slug. Asserting
     * global uniqueness would forbid the aliasing the catalogue exists to do.
     *
     * What must never collide is two agents that can both be SEEDED into one
     * workspace, because then a person sees two rows with one name and no way to
     * tell which is which. That is `builder` and `engineer` today: `engineer` is
     * `deprecated` in the catalogue, so this passes, and it is seeded into all 16
     * workspaces in production, so the defect is real and lives in the DATA.
     * Unseeding it is Claude's; this is the guard that stops it being re-created
     * in the catalogue.
     */
    const seen = new Map<string, string[]>();
    for (const e of active) {
      const key = `${e.name} @ ${e.station}`;
      seen.set(key, [...(seen.get(key) ?? []), e.slug]);
    }
    const collisions = [...seen.entries()].filter(([, slugs]) => slugs.length > 1);
    expect(collisions).toEqual([]);
  });

  it("dispatches nothing the catalogue does not know", () => {
    /*
     * THE QUESTION NOBODY WAS ASKING. `driver.test.ts` checked that every active
     * agent has a station; nothing checked that every slug the code dispatches is
     * an active agent. Those are different failures and only the second one lies
     * to a person: `agentDisplayName` falls back to a title-cased slug for an
     * unknown one, so a run attributes itself to an agent that is not on the
     * roster and looks entirely normal doing it.
     *
     * Read out of the source rather than from a list, because a hand-written list
     * of dispatch sites is a list that goes stale the next time somebody adds one.
     */
    const dispatched = new Set<string>();
    for (const pattern of ["src/**/*.ts", "src/**/*.tsx"]) {
      for (const file of new Bun.Glob(pattern).scanSync(".")) {
        /* Tests are excluded and it matters: their fixtures dispatch deprecated
           and invented slugs on purpose, to prove the fallbacks work. Including
           them would make this fail on the very tests that check the aliasing. */
        if (file.includes(".test.")) continue;
        const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        for (const m of src.matchAll(/agentSlug:\s*"([a-z][a-z-]*)"/g)) dispatched.add(m[1]);
      }
    }
    expect(dispatched.size, "no dispatch sites were found, so this proves nothing").toBeGreaterThan(
      3,
    );

    const unknown = [...dispatched].filter((s) => !bySlug.has(s)).sort();
    const stale = [...dispatched].filter((s) => bySlug.get(s)?.status === "deprecated").sort();

    expect({ unknown, stale }).toEqual({ unknown: [], stale: [] });
  });

  it("sees every active agent, whatever its tier, and knows what runs it", () => {
    /*
     * BOTH TIERS NOW, WHICH IS WHAT THE CAST FILTER ABOVE CANNOT DO.
     *
     * The two tiers are dispatched by different machinery and the catalogue says
     * so: `cast` "can appear in the relay", `crew` is "engine-only, never
     * user-facing". So the honest guard is not one rule, it is one rule per tier,
     * and the thing that was missing is that nobody had written the second:
     *
     *   cast  must be in a station crew, or the station does part of its job
     *         forever and nothing errors.
     *   crew  must NOT be in a station crew, because a station-dispatched agent
     *         is by definition user-facing, and it must have a subsystem that
     *         runs it.
     *
     * `status: "active"` is documented as "seeded + shown", and for a crew agent
     * that is FALSE: neither `reactor` nor `archivist` is seeded anywhere and
     * neither is shown. The word means two different things depending on the tier,
     * which is the drift underneath this item. Recorded rather than papered over:
     * see the build log.
     */
    const crewed = new Set(AGENT_STATION_ORDER.flatMap((s) => stationCrew(s).map((r) => r.slug)));

    const castOrphans = active
      .filter((e) => e.tier === "cast" && !e.conductor && !crewed.has(e.slug))
      .map((e) => e.slug);
    expect(castOrphans, "an active cast agent is dispatched by no station").toEqual([]);

    const crewOnStation = active
      .filter((e) => e.tier === "crew" && crewed.has(e.slug))
      .map((e) => e.slug);
    expect(crewOnStation, "an engine-only agent is being dispatched as a station seat").toEqual([]);

    // And the tier is actually populated, so neither assertion passes on nothing.
    expect(
      active.some((e) => e.tier === "crew"),
      "no active crew agent to check",
    ).toBe(true);
  });

  it("keeps every agent the catalogue ever named, so a historical run still reads", () => {
    /*
     * THE ACCEPTANCE'S THIRD LINE, WHICH NOTHING GUARDED: no agent merged,
     * renamed to a persona, or removed from the catalogue.
     *
     * The deprecated entries are the ones at risk, because they look like dead
     * weight and they are the opposite: each one is the reason a run recorded
     * months ago against `scout` or `planner` still says "Watch" and "Plan"
     * instead of showing a raw slug to somebody reading their own history.
     * Deleting one is silent until an old run is opened.
     *
     * The existing block above already pins the maker-reader pairing at every
     * station that produces an artifact, which is the guard against MERGING, so
     * this does not restate it. An earlier draft of this test tried to and got it
     * wrong: it asserted two distinct `face` values per station, and Sense has
     * three seats that are all scouts because Sense produces signals rather than
     * an artifact for someone to read back.
     */
    const deprecated = SPECIALIST_CATALOG.filter((e) => e.status === "deprecated");
    expect(deprecated.length, "the aliases are gone, so history cannot be read").toBeGreaterThan(5);

    for (const e of deprecated) {
      // Resolves to a real display name rather than to a title-cased slug, which
      // is what `agentDisplayName` falls back to for something it never heard of.
      expect(e.name.trim().length, `${e.slug} has no name`).toBeGreaterThan(0);
      expect(e.name, `${e.slug} renders as its own slug`).not.toBe(e.slug);
      // And it points at a station that still exists, or the mark cannot be drawn.
      expect(AGENT_STATION_ORDER, `${e.slug} names a station that is gone`).toContain(e.station);
    }
  });
});
