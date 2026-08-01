// The rules that decide whether a track moves, and who moves it.
//
// FOUNDER RULING 2026-08-01: "seamlessly agent takes care of everything and
// human just watches. And even if human do not watch, agent should be able to
// complete entire thing and deliver the outcome to the user. End to end product
// lifecycle needs to be taken care."
//
// WHAT WAS ACTUALLY MISSING, established by reading the code rather than
// assuming. Every station works. The orchestrator already drives missions
// autonomously WITHIN Build (startOrchestratedMission -> mission_steps ->
// advanceMissionCore, swept by resume-runs). loop-state.functions.ts derives
// what stage work is in. But it is a READ MODEL: it reports position, it never
// moves anything. Nothing in the product carried one piece of work from
// Discover through Learn. A station transition was a navigate() call in a
// component, which means it required a person to click, which means the loop
// stopped the moment nobody was watching.
//
// WHY THE DRIVER DISPATCHES AN AGENT RATHER THAN CALLING FUNCTIONS. Only six
// `*Core` functions exist that are callable server to server; the rest of each
// station's logic lives inside `createServerFn` handlers that need a request.
// Hand-coding around that would mean re-implementing seven stations in a
// second place, which is how two implementations drift.
//
// The agentic-first answer is also the correct one, and it is what the
// orchestrator already does: hand the station's own agent the station's own
// job and let it use its registered tools under its boundary. The driver never
// does product work itself. It decides WHO acts and WHETHER the track may move,
// which is exactly what the route knows and the agent does not.
//
// Pure and dependency-free so every stop condition is unit-tested without a
// database. The stop conditions are the safety of the whole feature: a driver
// that runs when it should not is worse than no driver.

import { SPECIALIST_CATALOG, type AgentStation } from "@/lib/agent-vocabulary";

/**
 * The agent that leads a station.
 *
 * The first ACTIVE CAST entry for the station, because the catalog's order is
 * documented as roster order within a station, so the first one is the lead by
 * construction. Crew agents are engine-only and never lead; deprecated ones map
 * history and must never be dispatched.
 */
export function leadAgentFor(station: AgentStation): string | null {
  const entry = SPECIALIST_CATALOG.find(
    (e) => e.station === station && e.tier === "cast" && e.status === "active" && !e.conductor,
  );
  return entry?.slug ?? null;
}

/** Why the driver did not move a track. Every one is reported, never silent. */
export type HoldReason =
  /** A kill switch is on. Nothing runs, whatever any boundary says. */
  | "paused"
  /** The agent hit its boundary and put a call in front of a person. */
  | "waiting-on-a-person"
  /** No active cast agent serves this station, so nobody can be dispatched. */
  | "no-agent"
  /** The track finished its route. */
  | "done"
  /** The station ran and produced nothing, repeatedly. */
  | "stalled";

export type DriveDecision =
  | { act: true; station: AgentStation; agentSlug: string; goal: string }
  | { act: false; hold: HoldReason };

/**
 * How many times a station may run and produce nothing before the driver stops
 * trying it.
 *
 * A driver that retries forever is a cost leak that looks like progress, and
 * this product meters every model call. Three is enough to survive a transient
 * model failure and few enough that a genuinely stuck station is surfaced to a
 * person the same working day.
 */
export const MAX_STATION_ATTEMPTS = 3;

/**
 * The job of each station, in the words the station's own agent needs.
 *
 * Written as an OUTCOME, never as a mechanism. The agent has its own tools and
 * its own system prompt; what it does not have is why this particular piece of
 * work exists, which is the one thing only the track knows. `origin` is
 * therefore threaded into every goal, and it is the reason the route model
 * refuses to start work below Discover without one.
 */
export function stationGoal(
  station: AgentStation,
  track: { title: string; origin: string | null },
): string {
  const why = track.origin ? ` It exists because: ${track.origin}` : "";
  const subject = `"${track.title}".${why}`;

  switch (station) {
    case "sense":
      return `Gather and cluster the evidence for ${subject} Surface what the sources actually say, and do not invent a signal that is not there.`;
    case "decide":
      return `Decide whether ${subject} is worth doing, and say what the evidence supports. If the evidence does not support it, say so plainly rather than finding a reason.`;
    case "define":
      return `Write the spec for ${subject} It must state the outcome it is trying to move and how anyone would know it worked, because that is what the outcome is graded against later.`;
    case "design":
      return `Design the surface for ${subject} Follow the workspace's standing design language where it applies, and say which parts it does not cover.`;
    case "build":
      return `Build ${subject} Work to the spec, and stop at anything your boundary does not let you do alone.`;
    case "ship":
      return `Ship ${subject} and record where it went, so the release can be pointed at.`;
    case "learn":
      return `Grade the outcome of ${subject} Compare what happened against what the spec said it was for, and record the verdict even when it is a miss. A miss recorded honestly is worth more than a win claimed loosely.`;
  }
}

/**
 * Whether the driver may act on this track right now, and as whom.
 *
 * ORDER MATTERS AND IS TESTED. `paused` is checked before everything, because a
 * kill switch outranks every other consideration in the product and a driver
 * that reasoned its way past one would be the single worst bug this feature
 * could have. `waiting-on-a-person` comes next: a track with a call already in
 * front of someone must not dispatch more work, or one unanswered approval
 * becomes an unbounded queue.
 */
export function decideDrive(input: {
  paused: boolean;
  station: AgentStation | null;
  title: string;
  origin: string | null;
  pendingApprovals: number;
  attempts: number;
}): DriveDecision {
  if (input.paused) return { act: false, hold: "paused" };
  if (input.pendingApprovals > 0) return { act: false, hold: "waiting-on-a-person" };
  // A null station means the route is finished. Nothing follows learn.
  if (!input.station) return { act: false, hold: "done" };
  if (input.attempts >= MAX_STATION_ATTEMPTS) return { act: false, hold: "stalled" };

  const agentSlug = leadAgentFor(input.station);
  if (!agentSlug) return { act: false, hold: "no-agent" };

  return {
    act: true,
    station: input.station,
    agentSlug,
    goal: stationGoal(input.station, { title: input.title, origin: input.origin }),
  };
}

/** What a person reads when the driver stopped. Never a status word on its own. */
export const HOLD_LINE: Record<HoldReason, string> = {
  paused: "Everything is paused for this workspace, so nothing ran.",
  "waiting-on-a-person": "A call is in front of you. The work continues once it is decided.",
  "no-agent": "No agent serves this station yet, so this one needs a person.",
  done: "The route is finished. This work has been graded.",
  stalled: "This station ran and produced nothing several times, so it stopped trying.",
};
