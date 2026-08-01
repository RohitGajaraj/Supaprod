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

  it("tells Decide it may say no", () => {
    // A decide station that can only say yes is theatre, and the whole
    // decision record downstream would be worthless.
    expect(stationGoal("decide", track)).toContain("does not support it");
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
