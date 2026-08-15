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

import {
  AGENT_STATIONS,
  AGENT_STATION_ORDER,
  SPECIALIST_CATALOG,
  type AgentStation,
} from "@/lib/agent-vocabulary";

/**
 * The agent that leads a station.
 *
 * The first ACTIVE CAST entry for the station, because the catalog's order is
 * documented as roster order within a station, so the first one is the lead by
 * construction. Crew agents are engine-only and never lead; deprecated ones map
 * history and must never be dispatched.
 */
export function leadAgentFor(station: AgentStation): string | null {
  return stationCrew(station)[0]?.slug ?? null;
}

/**
 * Everyone who works a station, in the order they work it.
 *
 * WHY A CREW AND NOT A LEAD (founder ruling 2026-08-01: "what are the necessary
 * agents that is going to get attached... those things needs to be sitting
 * somewhere"). The driver used to dispatch exactly one agent per station, so
 * seven of the thirteen active cast agents ran and six never ran at all:
 * `researcher`, `customer-insights`, `critic`, `sprint-planner` and `qa` were
 * defined, named, coloured, given relay verbs, and dispatched by nothing. A
 * station led by one generalist does one station's job partially; that is why
 * Plan produced a spec and never the tasks, and why Design produced a surface
 * nobody read back.
 *
 * The ordering is the station's actual sequence of work, and it matters, because
 * each role is briefed with what the previous role filed. Verify runs BEFORE
 * Announce. Challenge runs AFTER Prioritize. A crew in the wrong order is a
 * review that happens after the thing it was meant to review.
 *
 * Derived FROM the catalog rather than duplicating it, so an agent cannot be
 * added to the roster and quietly left out of the loop. `driver.test.ts` asserts
 * every active cast agent appears in exactly one crew, which is the check that
 * would have caught the six missing ones on the day they were written.
 */
export type CrewRole = {
  slug: string;
  /** What this agent is asked to do, in its own terms. */
  job: string;
  /**
   * What it must FILE, named as the tool that files it.
   *
   * Per ROLE, not per station, because two agents at one station file different
   * things: Draft writes the spec, Plan writes the tasks the spec implies. A
   * station-wide instruction would tell each of them to do the other's job.
   */
  file: string;
};

/**
 * What each agent is FOR, in the words that agent needs.
 *
 * Keyed by slug because the job is the agent's, not the station's: two agents at
 * one station are only worth having if they are asked different questions.
 */
const CREW_ROLE: Record<string, { job: string; file: string }> = {
  // 01 Discover
  "discovery-scout": {
    job: "Gather the evidence that already exists for this work.",
    file: "File each piece by calling signals.log. Evidence that is only in your answer is not on the record and the next station cannot read it.",
  },
  researcher: {
    job: "Go deeper than the first pass: find what the sources say that the scout did not reach.",
    file: "File what you found with signals.log, then group the evidence by calling research.synthesize or cluster.trigger.",
  },
  "customer-insights": {
    job: "Say what customers actually said, in their words, not what we would like them to have said.",
    file: "File each quote or complaint with signals.log, attributed to where it came from.",
  },
  // 02 Decide
  strategist: {
    job: "Weigh this against what else could be done, and say what the evidence supports. If the evidence does not support it, say so plainly rather than finding a reason.",
    file: "Call decision.record with the alternatives you weighed. A decision that is only in your answer is not on the record.",
  },
  critic: {
    job: "Red-team the call that was just made. Argue the strongest case against it, and say what would have to be true for it to be wrong.",
    file: "Call critic.evaluate on the decision. If it should not stand, call decision.revise rather than leaving the objection in prose.",
  },
  // 03 Plan
  "prd-writer": {
    job: "Write the spec: the outcome it moves, and how anyone would know it worked. That is what the outcome gets graded against later.",
    // NAME THE ARGUMENTS THE TOOL ACTUALLY HAS. This read "call prd.draft with
    // the spec body" and `prd.draft` has never accepted a body: its schema is
    // {opportunity_id?, brief?, title?, audience?} and it writes the body itself
    // from its own model call. Live agent_runs showed prd-writer composing a
    // full {opportunity_id, body, problem, goals} payload and hitting the step
    // limit before the call landed — the founder billed for a spec body the tool
    // discards, and `spine_track_members` holding zero rows of kind 'prd' across
    // all 43 tracks. A brief that instructs an impossible call is worse than no
    // brief, because the agent obeys it.
    file: "Call prd.draft with `opportunity_id`, the bet this work belongs to. If Decide was waived and no bet exists, pass `brief` instead — what the work is and why it exists, in your own words. It writes the spec body itself, so do not compose one to pass in. A spec that is only in your answer is not on the record and Design and Build cannot read it.",
  },
  "sprint-planner": {
    job: "Break the spec above into the work it actually implies. Do not invent scope the spec does not ask for.",
    file: "Call tasks.create for each piece of work. A plan that is only in your answer cannot be worked.",
  },
  // 04 Design
  "ux-architect": {
    job: "Design the surface the spec describes. Follow the standing design language, and say which parts it does not cover.",
    file: "Call design.draft with the surface you designed. A design that is only in your answer is not on the record and Build cannot read it.",
  },
  "design-critic": {
    job: "Read the design back against the standing system and against the spec. Name what does not conform, and what the spec asked for that the design does not do.",
    file: "If the design needs to change, call design.draft with the corrected version. Say plainly if it is sound as it stands.",
  },
  // 05 Build
  builder: {
    job: "Build to the spec and the design above. Stop at anything your boundary does not let you do alone.",
    file: "Call studio.stage with the change you made. Work that is only in your answer is not on the record and cannot be shipped.",
  },
  qa: {
    job: "Check the change against the spec before it goes anywhere. Say plainly what does not meet it.",
    file: "If it does not meet the spec, call studio.stage with the fix. Do not pass work you would not sign off.",
  },
  // 06 Ship
  "release-verifier": {
    job: "Decide whether this is ready to go out. Check it against the spec and against what review found. Shipping cannot be undone from inside this product, so say no if it is not ready.",
    file: "Record your readiness call with decision.record, naming what you checked. If it is not ready, say so and stop; do not publish.",
  },
  release: {
    job: "Publish it and record where it went, so the release can be pointed at.",
    file: "Call release.publish. A release that is only in your answer did not happen.",
  },
  // 07 Learn
  "data-analyst": {
    job: "Grade the outcome against what the spec above said it was for. Record the verdict even when it is a miss; a miss recorded honestly is worth more than a win claimed loosely.",
    // `prd_id` IS NAMED HERE BECAUSE NOTHING ELSE CAN SUPPLY IT ON THIS ROUTE.
    // learning.record falls back to mission -> decision -> spec when the agent
    // omits prd_id, and that fallback cannot fire for a driver-run track: the
    // driver attaches a mission only at Build, so `missionId` is null at Learn.
    // The second hop is dead there too, because decision.record at Decide has no
    // spec to name and `decisions.prd_id` is null by construction. So the
    // agent's own argument is the ONLY link that can exist, and a verdict
    // recorded without it attaches to nothing and re-ranks nothing.
    // `stationGoal` names the exact id when the track has filed one.
    file: "Call learning.record with the verdict, and pass `prd_id` — the spec this work was graded against. Without it the grade attaches to no spec, so it can never move the bet behind it. A grade that is only in your answer never reaches the next piece of work.",
  },
  "insight-keeper": {
    job: "Say what this outcome means for the NEXT piece of work. Generalise beyond this one bet without overclaiming from a single result.",
    // memory.remember WRITES the guidance; memory.promote only raises the standing
    // of a memory that already exists. An earlier version of this instruction
    // said "call memory.promote", and the agent did exactly as told: it passed
    // the id of the learnings row it had just written, which is not an
    // agent_memory id, and every run failed. The brief was wrong, not the agent.
    file: "Call memory.remember with scope 'global' so the next track's Decide and Plan stations meet this guidance. If it is a cross-agent truth, follow with memory.promote using the memory_id that memory.remember returned. Guidance that is only in your answer is storage, and this product does not claim storage.",
  },
};

export function stationCrew(station: AgentStation): CrewRole[] {
  return SPECIALIST_CATALOG.filter(
    (e) => e.station === station && e.tier === "cast" && e.status === "active" && !e.conductor,
  ).map((e) => ({
    slug: e.slug,
    job: CREW_ROLE[e.slug]?.job ?? "",
    file: CREW_ROLE[e.slug]?.file ?? "",
  }));
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
  /**
   * The station filed something, and not the thing the next station needs.
   *
   * DISTINCT FROM `produced-nothing`, and the distinction is the diagnosis. That
   * one means the run's output went nowhere. This one means the run produced a
   * real artifact that the next station cannot work from: Plan logging a signal
   * instead of writing a spec, so Design has nothing to design against.
   *
   * The driver used to advance on ANY artifact, because it asked "did this station
   * file something" when the question that matters is "can the next station work
   * from what is now on the record". Those differ exactly when a station does the
   * wrong job well, which is the case the loop cannot otherwise notice: everything
   * downstream then reports, correctly, that it was handed nothing.
   */
  | "nothing-to-hand-on"
  /** The station ran and produced nothing, repeatedly. */
  | "stalled"
  /**
   * The tick ran out of wall clock before this seat could start.
   *
   * OURS, NOT THE STATION'S. The work is fine and the budget is fine; the
   * Worker that drives it has a duration limit and a crew is several dispatches.
   * So it never counts as an attempt and never looks like a failure: the next
   * tick picks the track up exactly where this one left it.
   */
  | "out-of-time"
  /**
   * This track has spent what it was allowed.
   *
   * The ceiling that sits where the autonomy sits: a person starts a track and
   * walks away, so the track is the thing that has to be bounded. Not a failure
   * and not a refusal, which is why it is its own reason rather than `stalled`;
   * the work is fine, the budget is finished, and raising it resumes exactly
   * where it stopped.
   */
  | "over-budget"
  /**
   * The ACCOUNT ran out of credit before this station could run.
   *
   * NOT THE STATION'S FAILURE, and separating it is a correction of a live
   * defect rather than a nicety. `runtime.server.ts` throws
   * `CreditExhaustedError` before a single token is spent, the driver caught it
   * as a dispatch failure, counted it as an attempt and recorded `stalled`. Three
   * ticks of an empty account therefore burned a station's whole attempt budget
   * in half an hour and froze the track permanently, having never once run the
   * station. Measured on the live database on 2026-08-02: three frozen tracks
   * had `spend_used_usd = 0` and nothing but credit refusals behind them.
   *
   * So it behaves exactly like `out-of-time`: reported, never counted as an
   * attempt, and resumed by topping the account up.
   */
  | "out-of-credit"
  /* ---------------------------------------------------------------------- *
   * THE CORRECTION LOOP'S OWN HOLDS (founder ruling 2026-08-02).
   *
   * Each one is a DIFFERENT thing for a person to do, which is why they are four
   * reasons rather than four shades of `stalled`. The rule that produces them is
   * `decideCorrection` in ./correction.ts, and the sentence a person reads names
   * the station, because "escalated" is a status word and this product does not
   * hand people status words.
   * ---------------------------------------------------------------------- */
  /** Nothing to work from, and no station in the loop can produce it. */
  | "needs-evidence"
  /** The station that files the missing thing is waived off this route. */
  | "needs-a-waived-station"
  /** Everything the station needs is on the record and it still finishes empty. */
  | "station-cannot-finish"
  /** Sent back for a fix as often as it is allowed, and still short. */
  | "corrections-spent"
  /** Corrected, came back, still cannot finish. Nothing more will be tried. */
  | "given-up";

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
      body.length > HANDOFF_BODY_CHARS ? `${body.slice(0, HANDOFF_BODY_CHARS)}\n[truncated]` : body;
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
 *
 * AND, AT LEARN ONLY, WITH THE ARGUMENT ITSELF. The filing instruction names the
 * tool; `specId` names the one value the Learn agent cannot derive on this route
 * and that decides whether its verdict attaches to anything. See `newestSpecId`.
 */
export function stationGoal(
  station: AgentStation,
  track: { title: string; origin: string | null },
  upstream: UpstreamArtifact[] = [],
  /** Which member of the crew is being briefed. Defaults to the lead. */
  role: CrewRole | null = null,
  /**
   * Why this station is being run AGAIN, when the work was sent back to it.
   *
   * THE DETERMINISTIC HALF OF THE LEARNING (founder ruling 2026-08-02). A
   * station that receives corrected work and is not told what went wrong files
   * the same thing again, which turns the correction loop into an expensive
   * retry. The sentence is built by `correctionNote` in ./correction.ts from the
   * track's own recorded transitions, so it costs no model call and cannot go
   * stale. It sits AFTER the record and BEFORE the filing instruction, because
   * it is an instruction about what to file.
   */
  correction: string | null = null,
  /**
   * The spec this track filed, named so Learn can attach its verdict to it.
   *
   * ONLY LEARN USES IT, because `prd_id` is an argument of `learning.record` and
   * of nothing else in the filing instructions. Every other station either wrote
   * the spec itself or reads it out of the handoff above.
   *
   * It is passed rather than derived here so this function stays a total
   * function of its arguments — `newestSpecId` is the deriver and the driver
   * calls it — and so a caller that knows better can name a different spec.
   */
  specId: string | null = null,
): string {
  const why = track.origin ? ` It exists because: ${track.origin}` : "";
  const subject = `"${track.title}".${why}`;
  const prior = describeUpstream(upstream);
  const seat = role ?? stationCrew(station)[0] ?? null;

  // The station's outcome first, so every agent on the crew knows what the
  // station as a whole is for and not merely its own slice. Then the seat's own
  // job, then what already exists, then what it must file. An agent that knows
  // only its slice optimises its slice.
  const mine = seat?.job ? `\n\nYour part in that: ${seat.job}` : "";
  const file = seat?.file ?? FILE_IT[station];
  const back = correction?.trim() ? `\n\n${correction.trim()}` : "";

  // THE ID ITSELF, not a description of where to find it. The filing
  // instructions already tell Learn to pass `prd_id`; an agent told to pass an
  // argument it has to go and find is an agent that spends steps finding it, and
  // the Define station's own budget burn is what that costs. Sits immediately
  // after the filing instruction because it is part of the same instruction.
  const named =
    station === "learn" && specId
      ? `\n\nThe spec this work was written against is ${specId}. Pass exactly that as \`prd_id\`.`
      : "";

  return `${stationJob(station, subject)}${mine}${prior}${back}\n\n${file}${named}`;
}

const FILE_IT: Record<AgentStation, string> = {
  sense:
    "Finish by filing what you found: call signals.log for each piece of evidence, and research.synthesize or cluster.trigger to group them. A finding that is only in your answer is not on the record and the next station cannot read it.",
  decide:
    "Finish by calling decision.record with the alternatives you weighed. A decision that is only in your answer is not on the record and the next station cannot read it.",
  // Same correction as the `prd-writer` seat above, and it has to be made in
  // both places: this is the fallback used when a station has no crew entry, and
  // a fallback that names an argument the tool does not have is the same defect
  // wearing a different key.
  define:
    "Finish by calling prd.draft with `opportunity_id`, the bet this work belongs to — or with `brief`, what the work is and why it exists, when Decide was waived and no bet was ever filed. It writes the spec body itself. Then call tasks.create for the work the spec implies. A spec that is only in your answer is not on the record and the next station cannot read it.",
  design:
    "Finish by calling design.draft with the surface you designed. A design that is only in your answer is not on the record and the next station cannot read it.",
  build:
    "Finish by calling studio.stage with the change you made. Work that is only in your answer is not on the record and cannot be shipped.",
  ship: "Finish by calling release.publish so the release can be pointed at. A release that is only in your answer did not happen.",
  learn:
    "Finish by calling learning.record with the verdict, and pass `prd_id` — the spec this work was graded against — so the grade attaches to it. A grade that is only in your answer is not on the record and never reaches the next piece of work.",
};

/**
 * The newest spec on this track's record, or null.
 *
 * THE ARGUMENT THE LEARN STATION CANNOT DERIVE FOR ITSELF. `learning.record`
 * takes an optional `prd_id` and recovers it from mission -> decision -> spec
 * when the agent omits it; on the autonomous route that recovery is unreachable,
 * because the driver attaches a mission at Build only, so `missionId` is null at
 * Learn. Naming the id in the brief is what closes that, and it is why
 * `stationGoal` takes it.
 *
 * Read off the handoff rather than from a second query, deliberately. The
 * upstream list is already loaded, is already ordered oldest first, and — unlike
 * a raw `spine_track_members` read — has already dropped any member whose
 * artifact row is gone. So this can only ever name a spec the analyst can
 * actually open. That is the opposite requirement from the spec lookup in
 * `linkSpecToMission`, which must name the id even when the row behind it cannot
 * be read, because a lineage edge is a pointer and not a reading.
 */
export function newestSpecId(upstream: UpstreamArtifact[]): string | null {
  for (let i = upstream.length - 1; i >= 0; i -= 1) {
    if (upstream[i].kind === "prd") return upstream[i].id;
  }
  return null;
}

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
  /**
   * Why the driver stopped last time. Read ONLY to tell a station that failed
   * from an account that could not pay, which are not the same fact and must not
   * share a ceiling.
   */
  lastHold?: HoldReason | null;
  /** What earlier stations filed. Empty on the first station of a route. */
  upstream?: UpstreamArtifact[];
}): DriveDecision {
  if (input.paused) return { act: false, hold: "paused" };
  if (input.pendingApprovals > 0) return { act: false, hold: "waiting-on-a-person" };
  // A null station means the route is finished. Nothing follows learn.
  if (!input.station) return { act: false, hold: "done" };
  /**
   * THE CEILING IS FOR STATIONS THAT FAILED, NOT FOR AN EMPTY ACCOUNT.
   *
   * A track whose last stop was `out-of-credit` never ran, so its attempts were
   * not spent on anything. Letting the ceiling apply to it means an account that
   * empties for three ticks freezes every track it owns permanently, and topping
   * the account back up does not revive them: `stalled` escalates to
   * `station-cannot-finish`, which is terminal and asks a person to go and look
   * at a station that was never the problem. Measured in production on
   * 2026-08-14: 26 of 43 tracks sitting at exactly that, against an account at
   * balance 0, all frozen since 2026-08-01.
   *
   * The write side already refuses to count these as attempts. This is the read
   * side agreeing, so a track frozen before that refusal existed still recovers
   * the moment it can pay, rather than needing a person to notice and reset it.
   */
  const blockedOnMoney = input.lastHold === "out-of-credit" || input.lastHold === "over-budget";
  if (!blockedOnMoney && input.attempts >= MAX_STATION_ATTEMPTS) {
    return { act: false, hold: "stalled" };
  }

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
  // Names what is MISSING rather than what arrived, because the next station is
  // what a person has to unblock and the stray artifact is not the problem.
  "nothing-to-hand-on":
    "This station filed something, but not what the next station needs, so the work cannot move on yet. It will try again.",
  // NO LONGER TERMINAL, and the wording had to change with it. This used to read
  // "so it stopped trying", which was true and was the defect: nothing anywhere
  // handled the state and the work froze for good. A track that reaches the
  // ceiling now goes to `decideCorrection`, which sends it back to the station
  // that can fix the precondition or puts one specific ask in front of a person.
  stalled: "This station ran and produced nothing several times, so it is being sent for a fix.",
  "over-budget":
    "This work has spent its budget, so it stopped. Raise the ceiling to let it carry on.",
  "out-of-time": "This run of the loop ran long, so the rest of the work carries on next time.",
  "out-of-credit":
    "The account ran out of credit before this station could run, so nothing was tried and nothing was charged against this work. Top the account up and it carries on from here.",
  "needs-evidence":
    "This station has nothing to work from, and no other station can make it. Connect a source, or file the missing input by hand, and this starts again on its own.",
  "needs-a-waived-station":
    "This station needs something that a waived station was the one to file, so nothing is going to file it. Put that station back on the route, or file it yourself.",
  "station-cannot-finish":
    "This station has everything it needs on the record and still finishes with nothing, several times over. That is the station rather than the work, so it needs your eyes.",
  "corrections-spent":
    "This work has been sent back for the same fix as often as it is allowed and is still short of it. Nothing further will be spent on it until you look.",
  "given-up":
    "This station was corrected, came back, and still cannot finish with everything it needs on the record. Nothing more will be tried on it automatically.",
};

/**
 * The hold line, naming the station when the reason is about one.
 *
 * WHY THIS EXISTS RATHER THAN A LONGER MAP. Six of the reasons above are true of
 * the workspace or of the track as a whole and read perfectly as they stand. The
 * correction loop's reasons are true of a PARTICULAR station, and "this station"
 * in a list of five pieces of work is not an answer, it is a pronoun with no
 * referent. Naming the station costs one argument the caller already has and is
 * the difference between a reason and a status word.
 *
 * Tolerant of an unknown reason on purpose: `last_hold` is a text column and a
 * value written by a newer deploy must render as nothing rather than as a crash
 * on the surface that lists work.
 */
export function holdLine(
  hold: string | null | undefined,
  ctx: { station?: AgentStation | null } = {},
): string | null {
  if (!hold) return null;
  const line = HOLD_LINE[hold as HoldReason];
  if (!line) return null;
  const station = ctx.station ? SPECIALIST_STATION_NAME[ctx.station] : null;
  if (!station || !STATION_SPECIFIC.has(hold as HoldReason)) return line;
  // Only ever replaces the leading pronoun, so the sentence stays the one
  // written above and there is no second copy of the words to drift.
  return line.replace(/^This station/, station).replace(/^This work/, station);
}

/** The reasons that are about one station rather than the whole track. */
const STATION_SPECIFIC: ReadonlySet<HoldReason> = new Set<HoldReason>([
  "needs-evidence",
  "needs-a-waived-station",
  "station-cannot-finish",
  "given-up",
]);

/** Station display names, read from the one vocabulary the whole product uses. */
const SPECIALIST_STATION_NAME: Record<AgentStation, string> = AGENT_STATION_ORDER.reduce(
  (acc, s) => {
    acc[s] = AGENT_STATIONS[s]?.name ?? s;
    return acc;
  },
  {} as Record<AgentStation, string>,
);
