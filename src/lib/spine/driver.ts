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
  /**
   * The station ran, completed cleanly, and filed nothing.
   *
   * Distinct from `stalled`, which is the ceiling this eventually reaches.
   * Separated on 2026-08-01 because they have different causes and different
   * fixes: `stalled` means "stop spending on this", while this one means "the
   * run worked and its output went nowhere", which is nearly always a tool the
   * agent could not reach or a brief it satisfied in prose.
   */
  | "produced-nothing"
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
 * What an earlier station on this track already produced.
 *
 * The kind word matches `spine_track_members.artifact_kind`, so the handoff and
 * the chain panel name the same things the same way.
 */
export type UpstreamArtifact = {
  kind: string;
  id: string;
  title: string;
  /** The artifact's own text, when it has one worth reading. */
  body?: string | null;
};

/**
 * How much of an upstream artifact is inlined into the next station's brief.
 *
 * A spec is the longest thing that gets handed forward and they run to a few
 * thousand characters, so this holds a whole one while bounding what a
 * pathological row can do to the prompt (and therefore to the bill).
 */
export const HANDOFF_BODY_CHARS = 6000;

/**
 * How many upstream artifacts get their full text inlined.
 *
 * The most recent two, because the station that just ran is the handoff and the
 * one before it is the context that handoff assumes. Everything older is named
 * with its kind and id so the agent can look it up if it actually needs it,
 * which keeps a track that has been round the loop several times from carrying
 * its entire history into every prompt.
 */
export const HANDOFF_BODIES = 2;

/**
 * The work already on the record, written for the agent about to act on it.
 *
 * THIS IS THE HANDOFF, and its absence was the defect. Until 2026-08-01 every
 * station received only the track's title and origin, so Design never saw the
 * spec, Build never saw the design, and Learn was asked to "compare against what
 * the spec said" while never being shown the spec. Each station restarted from a
 * one-line brief and invented what it needed, which is why the loop could run
 * end to end and deliver nothing: it was not a chain, it was seven strangers
 * given the same sentence.
 *
 * Ordered oldest first so it reads as the story of the work.
 */
export function describeUpstream(upstream: UpstreamArtifact[]): string {
  if (!upstream.length) return "";

  // The tail gets the full text; the head is named only. Counted from the end so
  // the freshest work is always the work that arrives whole.
  const inlineFrom = Math.max(0, upstream.length - HANDOFF_BODIES);

  const parts = upstream.map((a, i) => {
    const head = `${a.kind} "${a.title}" (id ${a.id})`;
    const body = (a.body ?? "").trim();
    if (i < inlineFrom || !body) return head;
    const clipped =
      body.length > HANDOFF_BODY_CHARS
        ? `${body.slice(0, HANDOFF_BODY_CHARS)}\n[truncated]`
        : body;
    return `${head}:\n${clipped}`;
  });

  return `\n\nAlready on the record for this work, oldest first. Build on it, do not restate it, and do not contradict it without saying why:\n\n${parts.join("\n\n")}`;
}

/**
 * The job of each station, in the words the station's own agent needs.
 *
 * Written as an OUTCOME, never as a mechanism. The agent has its own tools and
 * its own system prompt; what it does not have is why this particular piece of
 * work exists, which is the one thing only the track knows. `origin` is
 * therefore threaded into every goal, and it is the reason the route model
 * refuses to start work below Discover without one.
 *
 * Every goal now ends by naming what the station must FILE, not merely what it
 * must think about. An agent told to "write the spec" can satisfy itself by
 * writing one into its final answer, where nothing reads it and nothing can be
 * handed forward; that is exactly what Plan did on 2026-08-01. A station's
 * output is the row it wrote, so the brief says so.
 */
export function stationGoal(
  station: AgentStation,
  track: { title: string; origin: string | null },
  upstream: UpstreamArtifact[] = [],
): string {
  const why = track.origin ? ` It exists because: ${track.origin}` : "";
  const subject = `"${track.title}".${why}`;
  const prior = describeUpstream(upstream);

  return `${stationJob(station, subject)}${prior}\n\n${FILE_IT[station]}`;
}

/**
 * What each station must leave behind, named as the tool that leaves it.
 *
 * Naming the tool is deliberate. "Record the decision" is a sentence an agent
 * can believe it satisfied by writing a paragraph; "call decision.record" is
 * not. The record is the product here, so the brief is explicit about it.
 */
const FILE_IT: Record<AgentStation, string> = {
  sense:
    "Finish by filing what you found: call signals.log for each piece of evidence, and research.synthesize or cluster.trigger to group them. A finding that is only in your answer is not on the record and the next station cannot read it.",
  decide:
    "Finish by calling decision.record with the alternatives you weighed. A decision that is only in your answer is not on the record and the next station cannot read it.",
  define:
    "Finish by calling prd.draft with the spec body, then tasks.create for the work it implies. A spec that is only in your answer is not on the record and the next station cannot read it.",
  design:
    "Finish by calling design.draft with the surface you designed. A design that is only in your answer is not on the record and the next station cannot read it.",
  build:
    "Finish by calling studio.stage with the change you made. Work that is only in your answer is not on the record and cannot be shipped.",
  ship: "Finish by calling release.publish so the release can be pointed at. A release that is only in your answer did not happen.",
  learn:
    "Finish by calling learning.record with the verdict. A grade that is only in your answer is not on the record and never reaches the next piece of work.",
};

/** The outcome half of the brief, without the filing instruction. */
function stationJob(station: AgentStation, subject: string): string {
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
  /** What earlier stations filed. Empty on the first station of a route. */
  upstream?: UpstreamArtifact[];
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
    goal: stationGoal(
      input.station,
      { title: input.title, origin: input.origin },
      input.upstream ?? [],
    ),
  };
}

/** What a person reads when the driver stopped. Never a status word on its own. */
export const HOLD_LINE: Record<HoldReason, string> = {
  paused: "Everything is paused for this workspace, so nothing ran.",
  "waiting-on-a-person": "A call is in front of you. The work continues once it is decided.",
  "no-agent": "No agent serves this station yet, so this one needs a person.",
  done: "The route is finished. This work has been graded.",
  "produced-nothing":
    "This station ran but filed nothing, so there is nothing to hand to the next one. It will try again.",
  stalled: "This station ran and produced nothing several times, so it stopped trying.",
};
