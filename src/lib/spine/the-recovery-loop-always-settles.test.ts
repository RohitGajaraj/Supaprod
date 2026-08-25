/**
 * A track that goes wrong ends up somewhere, and never spins.
 *
 * WHY THIS IS THE LAST COMPOSITION WORTH PINNING. `a-signal-walks-the-whole-spine`
 * proves the happy path composes: seven stations, correct briefs, no false hold. The
 * path that decides whether a person can TRUST the loop is the other one. Work goes
 * wrong constantly, and what happens then is `decideDrive` and `decideCorrection`
 * handing a track back and forth -- two pure rules, each individually tested, whose
 * COMPOSITION nothing exercised.
 *
 * Three things have to be true of that composition, and only the first is obvious:
 *
 *   1. It terminates. A go-back moves the track earlier on the route, which resets
 *      `attempts`, which is exactly the shape that loops for ever if the correction
 *      budget is not doing its job. `correction.ts` says as much about why
 *      `corrections` is counted separately from `attempts`: "a correction budget
 *      measured in attempts would never run out."
 *   2. It ends somewhere a person can act, or it recovers. `give-up` and an
 *      escalation are both fine endings. Silence is not.
 *   3. It does not escalate to a person over a station that was working, which is
 *      the failure `needIsMet`'s header describes and the reason `externalMet` is
 *      three-valued.
 *
 * The simulation applies the real rules and models only the effects: which station
 * the work stands at, what it has filed, and the two counters. Every DECISION here
 * is the shipped one.
 */
import { describe, expect, it } from "bun:test";

import {
  decideCorrection,
  MAX_TRACK_CORRECTIONS,
  STATION_NEEDS,
  type CorrectionInputs,
} from "./correction";
import {
  decideDrive,
  MAX_STATION_ATTEMPTS,
  type HoldReason,
  type UpstreamArtifact,
} from "./driver";
import { STATION_ARTIFACT } from "./attach";
import { nextStation, suggestRoute, type SpineRoute } from "./route";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

type Ending =
  | { kind: "finished" }
  | { kind: "escalated"; reason: string; at: AgentStation }
  | { kind: "gave-up"; at: AgentStation };

type Trace = {
  ending: Ending;
  /** Every station the work stood at, in order, including repeats. */
  path: AgentStation[];
  /** Every backward move the correction loop ordered. */
  goBacks: Array<{ from: AgentStation; to: AgentStation; kind: string }>;
  ticks: number;
};

/**
 * Run driver-then-correction until the track settles.
 *
 * `canFinish` decides which stations are able to file their artifact. Everything
 * else is the real rules.
 */
function recover(
  route: SpineRoute,
  opts: {
    seed: UpstreamArtifact[];
    canFinish: (station: AgentStation, visitsSoFar: number) => boolean;
    externalMet?: boolean | null;
  },
): Trace {
  const canFinish = opts.canFinish;
  const members: UpstreamArtifact[] = [...opts.seed];
  const path: AgentStation[] = [];
  const goBacks: Trace["goBacks"] = [];
  const visits = new Map<AgentStation, number>();

  let station: AgentStation | null = route.entry;
  let attempts = 0;
  let corrections = 0;
  let lastHold: HoldReason | null = null;

  /**
   * A HARD BOUND, and it is the assertion rather than a safety net. If the rules
   * settle, this is never reached; if they can loop, the test fails here with the
   * path that looped instead of hanging the suite.
   */
  const CEILING = 400;

  for (let tick = 0; tick < CEILING; tick++) {
    const decision = decideDrive({
      paused: false,
      station,
      title: "Address re-confirm loses people at checkout",
      origin: "Nine people lost a saved address.",
      pendingApprovals: 0,
      attempts,
      lastHold,
      upstream: members,
    });

    if (decision.act) {
      const at = decision.station;
      path.push(at);
      const seen = (visits.get(at) ?? 0) + 1;
      visits.set(at, seen);

      if (!canFinish(at, seen)) {
        attempts += 1;
        lastHold = "produced-nothing";
        continue;
      }

      members.push({
        kind: STATION_ARTIFACT[at].kind,
        id: `${at}-${seen}`,
        title: `filed at ${at}`,
        body: `BODY(${at})`,
      });
      station = nextStation(route, at);
      attempts = 0;
      lastHold = null;
      continue;
    }

    const hold = decision.hold;
    if (hold === "done") return { ending: { kind: "finished" }, path, goBacks, ticks: tick };

    // Everything else goes to the correction loop, exactly as the driver does.
    const standing = station as AgentStation;
    const inputs: CorrectionInputs = {
      hold: hold as HoldReason,
      station: standing,
      route,
      attempts,
      corrections,
      filed: members.map((m) => m.kind),
      externalMet: opts.externalMet ?? null,
      priorHold: lastHold,
    };
    const fix = decideCorrection(inputs);

    if (fix.action === "retry") {
      if (fix.resume) attempts = 0;
      else if (attempts >= MAX_STATION_ATTEMPTS) {
        // A retry that cannot run is the one shape that would spin for ever. If the
        // rules ever produce it, say so here rather than burning the ceiling.
        throw new Error(
          `decideCorrection said retry at ${standing} with attempts ${attempts} and no resume, which cannot run. Path: ${path.join(" -> ")}`,
        );
      }
      lastHold = hold as HoldReason;
      continue;
    }

    if (fix.action === "go-back") {
      goBacks.push({ from: standing, to: fix.station, kind: fix.kind });
      corrections += 1;
      station = fix.station;
      attempts = 0;
      lastHold = null;
      continue;
    }

    if (fix.action === "escalate") {
      return {
        ending: { kind: "escalated", reason: fix.reason, at: standing },
        path,
        goBacks,
        ticks: tick,
      };
    }
    return { ending: { kind: "gave-up", at: standing }, path, goBacks, ticks: tick };
  }

  throw new Error(
    `the recovery loop never settled in ${CEILING} ticks. Path: ${path.join(" -> ")}. Go-backs: ${goBacks
      .map((g) => `${g.from}->${g.to}`)
      .join(", ")}`,
  );
}

const fullRoute = () => suggestRoute("new-capability", "Nine people lost a saved address.");

const originTheme: UpstreamArtifact = {
  kind: "theme",
  id: "theme-1",
  title: "Address re-confirm loses people at checkout",
  body: "BODY(origin): nine reports across four sources.",
};

const always = () => true;

describe("a station that can never finish", () => {
  const trace = recover(fullRoute(), {
    seed: [originTheme],
    canFinish: (station) => station !== "build",
    externalMet: true,
  });

  it("settles rather than spinning", () => {
    // The bound in the harness throws before this line if it did not.
    expect(trace.ending.kind).not.toBe("finished");
  });

  it("ends somewhere a person can act", () => {
    expect(["escalated", "gave-up"]).toContain(trace.ending.kind);
  });

  it("spends its correction budget and no more", () => {
    expect(trace.goBacks.length).toBeLessThanOrEqual(MAX_TRACK_CORRECTIONS);
  });

  it("never sends the work backwards past the start of its route", () => {
    const order = new Map(AGENT_STATION_ORDER.map((s, i) => [s, i]));
    for (const g of trace.goBacks) {
      expect(
        order.get(g.to)!,
        `sent back to ${g.to}, which is not earlier than ${g.from}`,
      ).toBeLessThan(order.get(g.from)!);
      expect(fullRoute().path).toContain(g.to);
    }
  });

  it("names the station that failed, not an innocent one", () => {
    if (trace.ending.kind === "escalated" || trace.ending.kind === "gave-up") {
      expect(trace.ending.at).toBe("build");
    }
  });
});

describe("a station that recovers once it is given what it needed", () => {
  it("finishes the route after a go-back fixes the precondition", () => {
    // Plan fails its first visit, so Build stands with no spec. The correction sends
    // the work back to Plan, Plan succeeds the second time, and the whole thing
    // completes. This is the case the correction loop EXISTS for, and if it did not
    // work the loop would only ever be a nicer way to fail.
    const trace = recover(fullRoute(), {
      seed: [originTheme],
      canFinish: (station, visits) => (station === "define" ? visits > MAX_STATION_ATTEMPTS : true),
      externalMet: true,
    });

    expect(trace.ending.kind).toBe("finished");
    expect(trace.path.filter((s) => s === "define").length).toBeGreaterThan(1);
    expect(trace.path).toContain("learn");
  });
});

describe("Discover with nothing new to find", () => {
  it("asks a person for evidence instead of blaming the station", () => {
    // THE FAILURE needIsMet's HEADER DESCRIBES. Discover's need is evidence to
    // gather and its kinds are exactly what Discover files, so a membership test
    // answered yes for the rest of the track's life and a later empty tick escalated
    // to `station-cannot-finish` -- terminal, and it sends a person to inspect a
    // station that was working. With no external evidence the honest answer is
    // needs-evidence.
    const trace = recover(fullRoute(), {
      seed: [originTheme],
      canFinish: (station) => station !== "sense",
      externalMet: false,
    });

    expect(trace.ending.kind).toBe("escalated");
    if (trace.ending.kind === "escalated") {
      expect(trace.ending.reason).toBe("needs-evidence");
      expect(trace.ending.reason).not.toBe("station-cannot-finish");
    }
  });

  it("does not treat an unreadable check as evidence", () => {
    // `externalMet` is three-valued and null means nobody could check. It reads as
    // unsatisfied so an unreadable table can only make the loop more cautious.
    const trace = recover(fullRoute(), {
      seed: [originTheme],
      canFinish: (station) => station !== "sense",
      externalMet: null,
    });
    expect(trace.ending.kind).toBe("escalated");
  });
});

describe("a waived route is never sent to a station it waived", () => {
  it("asks for the waived station back rather than sending work to nobody", () => {
    // `existing-feature` enters at Plan with Discover and Decide waived, so it will
    // never have a recorded decision and must never be sent to Decide to get one.
    // The route is the only thing that knows "missing" from "already settled".
    const route = suggestRoute("existing-feature", "The address step needs rework.");
    const trace = recover(route, {
      seed: STATION_NEEDS[route.entry].kinds.map((kind) => ({
        kind,
        id: `${kind}-seed`,
        title: `${kind} seeded`,
        body: `BODY(seed:${kind})`,
      })),
      canFinish: (station) => station !== "define",
      externalMet: true,
    });

    for (const g of trace.goBacks) {
      expect(route.waived, `sent back to waived station ${g.to}`).not.toContain(g.to);
      expect(route.path).toContain(g.to);
    }
    expect(["escalated", "gave-up"]).toContain(trace.ending.kind);
  });
});

describe("every station, one at a time, cannot hang the loop", () => {
  /**
   * THE SWEEP THAT MAKES THIS FILE WORTH MORE THAN ITS EXAMPLES.
   *
   * Termination is a property of the RULES, not of the one scenario somebody thought
   * to write. So each station in turn is made unable to finish, and every one of
   * those seven tracks has to settle. The harness throws on a loop, so a hang is a
   * failure with a path attached rather than a suite that never returns.
   */
  for (const broken of AGENT_STATION_ORDER) {
    it(`settles when ${broken} can never finish`, () => {
      const trace = recover(fullRoute(), {
        seed: [originTheme],
        canFinish: (station) => station !== broken,
        externalMet: true,
      });
      expect(["escalated", "gave-up"]).toContain(trace.ending.kind);
      expect(trace.goBacks.length).toBeLessThanOrEqual(MAX_TRACK_CORRECTIONS);
    });
  }

  it("finishes when nothing is broken, so the sweep above is measuring failure", () => {
    const trace = recover(fullRoute(), {
      seed: [originTheme],
      canFinish: always,
      externalMet: true,
    });
    expect(trace.ending.kind).toBe("finished");
  });
});
