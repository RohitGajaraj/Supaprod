/**
 * A promoted cluster walks all seven stations, and is briefed correctly at each.
 *
 * WHY THIS FILE EXISTS, and why it is the last guard this spine was missing. Every
 * other test here checks ONE link: this station can finish, that hold is
 * correctable, this brief inlines that body. The failure this repo keeps finding is
 * the other kind -- every link correct and the chain one link short, with nothing
 * anywhere saying so. Four of those were closed in a single pass on 2026-08-14, and
 * not one of them would have been caught by any per-link test, including the ones
 * shipped alongside the fixes.
 *
 * So this walks a track. It composes the REAL decision layer -- `suggestRoute`,
 * `decideDrive`, `nextStation`, `needIsMet`, `STATION_NEEDS`, `STATION_ARTIFACT`,
 * `stationGoal`, `describeUpstream` -- and simulates only the two things that are
 * genuinely IO: an agent filing the row its station exists to file, and the driver
 * writing the move. If any of those modules disagrees with any other about what a
 * station produces, needs, or is told, a walk stops early and this file says where.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not mock Supabase or `runAgentLoop`. A
 * harness that faked the whole driver would be a test of the harness, and this repo
 * has paid for that shape before: two of the nine features found doing nothing in
 * production had unit tests asserting the defect as the contract. The line drawn
 * here is that every DECISION is the real one and every EFFECT is data.
 *
 * The most valuable assertion in the file is the one that says a healthy run never
 * holds. An advance rule that is too strict freezes real work, and it would look
 * exactly like a correct rule in every per-station test.
 */
import { describe, expect, it } from "bun:test";

import { STATION_ARTIFACT } from "./attach";
import { needIsMet, STATION_NEEDS } from "./correction";
import {
  decideDrive,
  MAX_STATION_ATTEMPTS,
  type HoldReason,
  type UpstreamArtifact,
} from "./driver";
import { nextStation, suggestRoute, validateRoute, type SpineRoute } from "./route";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

/**
 * What each station's agent actually files, as a member row with real text.
 *
 * The KIND comes from `STATION_ARTIFACT`, never from a literal here, so a station
 * whose product changes drags this walk with it instead of leaving the test
 * asserting a shape the product no longer has.
 */
function filedBy(station: AgentStation): UpstreamArtifact {
  const kind = STATION_ARTIFACT[station].kind;
  return {
    kind,
    id: `${kind}-from-${station}`,
    // Distinct, greppable text per station so a brief assertion can tell which
    // station's output it is looking at.
    title: `${kind} filed at ${station}`,
    body: `BODY(${station}): what ${station} produced.`,
  };
}

type Stop = {
  station: AgentStation;
  /** The brief this station's agent was actually handed. */
  goal: string;
  /** What the record held when it ran, oldest first. */
  sawKinds: string[];
};

type Walk = {
  stops: Stop[];
  /** Where it ended up, or null when the route finished. */
  endedAt: AgentStation | null;
  /** The hold that stopped it, when one did. */
  hold: HoldReason | null;
  /**
   * Every hold it hit on the way, in order.
   *
   * KEPT BECAUSE THE LAST HOLD IS NOT THE DIAGNOSIS. A station that files the wrong
   * artifact holds `nothing-to-hand-on`, retries, and only once it has spent
   * `MAX_STATION_ATTEMPTS` does `decideDrive` report `stalled` and send it to the
   * correction loop. Asserting the final hold alone would have this file claiming
   * the cause was "it ran and produced nothing", which is the exact conflation the
   * separate hold reason exists to prevent.
   */
  holds: HoldReason[];
  finished: boolean;
};

/**
 * Drive a track until it finishes or holds, applying the driver's own rules.
 *
 * `files` decides what each station produces, so a caller can model a healthy run,
 * a station that files the wrong thing, or one that files nothing at all.
 */
function walk(
  route: SpineRoute,
  opts: {
    /** The cluster the promotion filed against the track before it ever ran. */
    seed: UpstreamArtifact[];
    files?: (station: AgentStation) => UpstreamArtifact | null;
  },
): Walk {
  const files = opts.files ?? filedBy;
  const members: UpstreamArtifact[] = [...opts.seed];
  const stops: Stop[] = [];
  const holds: HoldReason[] = [];
  let station: AgentStation | null = route.entry;
  let attempts = 0;
  let lastHold: HoldReason | null = null;

  // Bounded so a rule that never advances fails loudly instead of hanging. Seven
  // stations times the attempt ceiling is the worst a healthy route can need.
  const ceiling = AGENT_STATION_ORDER.length * (MAX_STATION_ATTEMPTS + 1);
  for (let tick = 0; tick < ceiling; tick++) {
    const decision = decideDrive({
      paused: false,
      station,
      title: "Address re-confirm loses people at checkout",
      origin: "Nine people lost a saved address at the address step.",
      pendingApprovals: 0,
      attempts,
      lastHold,
      upstream: members,
    });

    if (!decision.act) {
      const hold = decision.hold ?? null;
      if (hold === "done") return { stops, endedAt: null, hold: null, holds, finished: true };
      return { stops, endedAt: station, hold, holds, finished: false };
    }

    stops.push({
      station: decision.station,
      goal: decision.goal,
      sawKinds: members.map((m) => m.kind),
    });

    /**
     * BUILD OPENS ITS MISSION AT THE START OF THE TICK, and the placement of these
     * four lines is the whole reason this walk can see the defect it was written
     * for.
     *
     * `missionForTrack` runs before the crew loop, and `loadUpstream` has already
     * built the brief by then. So the mission is absent from Build's FIRST brief and
     * present in every one after it -- which is why the bug it caused only ever bit
     * on a RETRY. Filing it after the stop is recorded reproduces that exactly.
     *
     * Written with no body because `ARTIFACT_SOURCE.mission` has no body column. It
     * was that bodyless member spending a body slot that pushed the spec out.
     */
    if (decision.station === "build" && !members.some((m) => m.kind === "mission")) {
      members.push({ kind: "mission", id: "mission-1", title: "Address re-confirm", body: null });
    }

    const made = files(decision.station);
    if (!made) {
      // produced-nothing, as driveTrackOnce records it.
      attempts += 1;
      lastHold = "produced-nothing";
      holds.push(lastHold);
      continue;
    }
    members.push(made);

    // The advance rule, exactly as driveTrackOnce applies it.
    const arrivedAt = nextStation(route, decision.station);
    if (arrivedAt) {
      const held = members.map((m) => m.kind);
      if (!needIsMet(STATION_NEEDS[arrivedAt], held)) {
        attempts += 1;
        lastHold = "nothing-to-hand-on";
        holds.push(lastHold);
        continue;
      }
    }
    station = arrivedAt;
    attempts = 0;
    lastHold = null;
  }

  throw new Error(
    `the walk never settled in ${ceiling} ticks, last at ${station}. Visited: ${stops
      .map((s) => s.station)
      .join(" -> ")}`,
  );
}

/** The route a promoted cluster actually enters on. See promote.server.ts. */
function promotedRoute(): SpineRoute {
  return suggestRoute("new-capability", "Nine people lost a saved address.");
}

/** The cluster filed against the track by `attachOriginTheme` before it ever ran. */
const originTheme: UpstreamArtifact = {
  kind: "theme",
  id: "theme-1",
  title: "Address re-confirm loses people at checkout",
  body: "BODY(origin): nine reports across four sources.",
};

describe("the route a promoted cluster enters on", () => {
  it("is valid, so no station on it owns nothing", () => {
    expect(validateRoute(promotedRoute())).toEqual([]);
  });

  it("enters at Discover with nothing waived, which is why promote picks this shape", () => {
    const route = promotedRoute();
    expect(route.entry).toBe("sense");
    expect(route.waived).toEqual([]);
    expect(route.path).toEqual([...AGENT_STATION_ORDER]);
  });
});

describe("a healthy run reaches the end", () => {
  const result = walk(promotedRoute(), { seed: [originTheme] });

  it("finishes the route", () => {
    expect(result.hold).toBeNull();
    expect(result.finished).toBe(true);
  });

  it("stops at all seven stations, in order, once each", () => {
    // Once each is the assertion that catches a rule which advances but also
    // re-runs, and the order is what catches a route that skips.
    expect(result.stops.map((s) => s.station)).toEqual([...AGENT_STATION_ORDER]);
  });

  it("never holds on the way, which is what proves the advance rule is not too strict", () => {
    // THE MOST IMPORTANT LINE IN THIS FILE. `nothing-to-hand-on` blocks a station
    // that filed the wrong thing, and a version of that rule which was slightly too
    // strict would freeze real work while passing every per-station test. This walk
    // accumulates members exactly as the driver does, including Build's mission.
    expect(result.stops.length).toBe(AGENT_STATION_ORDER.length);
  });

  it("hands every station an agent", () => {
    // `no-agent` is a hold, so reaching all seven stops already proves it, but the
    // failure would otherwise read as a route problem rather than a staffing one.
    expect(result.hold).not.toBe("no-agent");
  });
});

describe("every station is briefed with what it needs", () => {
  const result = walk(promotedRoute(), { seed: [originTheme] });
  const at = (station: AgentStation) => {
    const stop = result.stops.find((s) => s.station === station);
    expect(stop, `${station} was never reached`).toBeDefined();
    return stop as Stop;
  };

  it("Discover is told why the work exists", () => {
    expect(at("sense").goal).toContain("Nine people lost a saved address");
  });

  it("Decide can see the cluster it is deciding about", () => {
    // The defect this closed on 2026-08-14: a promoted track reached its first
    // station with no members at all, so the crew whose job is to weigh a cluster
    // was briefed with a title.
    expect(at("decide").goal).toContain("BODY(origin)");
  });

  it("Plan can see the decision it is planning", () => {
    expect(at("define").goal).toContain("BODY(decide)");
  });

  it("Design can see the spec it is designing against", () => {
    expect(at("design").goal).toContain("BODY(define)");
  });

  it("Build can see BOTH the spec and the design", () => {
    // Two bodies, and both are needed: the spec says what to build and the design
    // says what it looks like.
    const goal = at("build").goal;
    expect(goal, "Build cannot see the spec").toContain("BODY(define)");
    expect(goal, "Build cannot see the design").toContain("BODY(design)");
  });

  it("Ship can see the change it is shipping", () => {
    expect(at("ship").goal).toContain("BODY(build)");
  });

  it("Learn can see the spec it grades against AND what shipped", () => {
    // The yardstick. By Learn the spec is four artifacts back, and without the
    // always-whole rule it arrives as a bare id -- which is the exact failure
    // driver.ts's header claims the handoff ended.
    const goal = at("learn").goal;
    expect(goal, "Learn cannot see the spec it is grading against").toContain("BODY(define)");
    expect(goal, "Learn cannot see what shipped").toContain("BODY(ship)");
  });

  it("never dumps the whole history into one brief", () => {
    // The constant exists so a track round the loop does not carry everything into
    // every prompt. By Learn the cluster and the decision are old news.
    const goal = at("learn").goal;
    expect(goal).not.toContain("BODY(origin)");
    expect(goal).not.toContain("BODY(decide)");
  });
});

describe("a station that files the wrong thing stops the work", () => {
  it("holds rather than handing Design a spec that was never written", () => {
    // Plan's crew is two seats. If the spec never lands and a task does, the old
    // rule advanced on a non-empty attachment and Design was handed nothing.
    const result = walk(promotedRoute(), {
      seed: [originTheme],
      files: (station) =>
        station === "define"
          ? { kind: "task", id: "task-1", title: "a task", body: "BODY(task)" }
          : filedBy(station),
    });

    // The CAUSE, which is the fact worth keeping: Plan filed something and it was
    // not what Design needs.
    expect(result.holds).toContain("nothing-to-hand-on");
    // And it never once claimed the station had produced nothing, because it had.
    expect(result.holds).not.toContain("produced-nothing");
    // The final hold is `stalled`, which is correct rather than a compromise: the
    // attempt ceiling is what hands a stuck station to the correction loop, and
    // `stalled` is the word that loop reads.
    expect(result.hold).toBe("stalled");
    expect(result.endedAt).toBe("define");
    expect(result.stops.map((s) => s.station)).not.toContain("design");
  });

  it("holds rather than walking on when a station files nothing at all", () => {
    const result = walk(promotedRoute(), {
      seed: [originTheme],
      files: (station) => (station === "build" ? null : filedBy(station)),
    });

    expect(result.hold).toBe("stalled");
    expect(result.endedAt).toBe("build");
    expect(result.stops.map((s) => s.station)).not.toContain("ship");
  });

  it("reaches a person after the ceiling rather than looping for ever", () => {
    // The bound is what turns a stuck station into something a person sees the same
    // day. A rule with no ceiling would spin.
    const result = walk(promotedRoute(), {
      seed: [originTheme],
      files: (station) =>
        station === "define"
          ? { kind: "task", id: "task-1", title: "a task", body: "BODY(task)" }
          : filedBy(station),
    });
    const planStops = result.stops.filter((s) => s.station === "define").length;
    expect(planStops).toBe(MAX_STATION_ATTEMPTS);
  });
});

describe("a track that enters below Discover still completes", () => {
  it("walks a shape that waives stations, and is briefed at the ones that remain", () => {
    // A waived route is the case an advance rule most easily breaks: if the rule
    // asked for the previous station's artifact rather than the next station's need,
    // every waived station would strand the work.
    const route = suggestRoute("incident-fix", "Checkout throws on a saved address.");
    expect(validateRoute(route)).toEqual([]);

    const seed: UpstreamArtifact[] = route.path.includes("sense")
      ? [originTheme]
      : // Entering below Discover, whatever the entry station needs has to already be
        // on the record; that is what `validateRoute` means by refusing a track that
        // enters low with no reason. Seeded with the kinds the entry station needs.
        STATION_NEEDS[route.entry].kinds.map((kind) => ({
          kind,
          id: `${kind}-seeded`,
          title: `${kind} already on the record`,
          body: `BODY(seed:${kind}): filed before this track existed.`,
        }));

    const result = walk(route, { seed });

    expect(result.hold, `a waived route held at ${result.endedAt}`).toBeNull();
    expect(result.finished).toBe(true);
    expect(result.stops.map((s) => s.station)).toEqual(route.path);
    for (const station of route.waived) {
      expect(result.stops.map((s) => s.station)).not.toContain(station);
    }
  });
});

describe("a station that has to try twice is briefed as well the second time", () => {
  /**
   * THE CASE THE WALK MISSED ON ITS FIRST DRAFT, and finding that is the argument
   * for writing walks at all.
   *
   * A healthy run visits every station once, so it never modelled a RETRY. But the
   * attempt ceiling exists precisely because stations retry, and the bug that
   * pushed the spec out of Build's brief only ever bit on the second tick: the
   * mission `missionForTrack` opens is written after that tick's brief was read, so
   * it is absent the first time and present every time after.
   *
   * The first draft of this file planted that defect and passed. A test that cannot
   * see a bug it was written for is worse than no test, because it certifies the
   * thing it missed.
   *
   * A retry is also the attempt that needs its brief MOST, because the previous one
   * failed and the agent is being asked to do better with the same information.
   */
  function withOneFailedAttemptAt(target: AgentStation): Walk {
    let attemptsSeen = 0;
    return walk(promotedRoute(), {
      seed: [originTheme],
      files: (station) => {
        if (station !== target) return filedBy(station);
        attemptsSeen += 1;
        return attemptsSeen === 1 ? null : filedBy(station);
      },
    });
  }

  it("still finishes the route when Build needs a second attempt", () => {
    const result = withOneFailedAttemptAt("build");
    expect(result.hold).toBeNull();
    expect(result.finished).toBe(true);
    expect(result.holds).toEqual(["produced-nothing"]);
  });

  it("shows Build the spec on the retry, not only on the first attempt", () => {
    // THE DEFECT, exactly. On the retry the record holds cluster, decision, spec,
    // prototype and the bodyless mission. Under a rule that reserved trailing
    // POSITIONS the newest two were the prototype and the mission, so the mission
    // spent a body slot on nothing and the spec arrived as a bare id.
    const result = withOneFailedAttemptAt("build");
    const buildStops = result.stops.filter((s) => s.station === "build");
    expect(buildStops.length).toBe(2);

    const retry = buildStops[1];
    expect(retry.sawKinds, "the mission is not on the record on the retry").toContain("mission");
    expect(retry.goal, "Build cannot see the spec on its retry").toContain("BODY(define)");
    expect(retry.goal, "Build cannot see the design on its retry").toContain("BODY(design)");
  });

  it("shows Learn the spec on a retry too", () => {
    const result = withOneFailedAttemptAt("learn");
    const learnStops = result.stops.filter((s) => s.station === "learn");
    expect(learnStops.length).toBe(2);
    expect(learnStops[1].goal).toContain("BODY(define)");
    expect(learnStops[1].goal).toContain("BODY(ship)");
  });

  it("does not let a bodyless member quietly widen what a brief carries", () => {
    // The other direction. The fix must not have turned into "inline more": the
    // oldest members still arrive named only on the retry.
    const result = withOneFailedAttemptAt("build");
    const retry = result.stops.filter((s) => s.station === "build")[1];
    expect(retry.goal).not.toContain("BODY(origin)");
    expect(retry.goal).not.toContain("BODY(decide)");
  });
});
