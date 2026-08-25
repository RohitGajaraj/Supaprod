/**
 * The universal correction loop: what a track does when a station cannot finish.
 *
 * FOUNDER RULING 2026-08-02, verbatim: "It should not be applicable only to ship
 * to build. It should be applicable to whole seven cycles. Say, if something is
 * moving forward, something messed up, an agent should automatically learn, go
 * back, correct it, and come back, and it should not be limited to a particular
 * stage. It should be across all seven stages. Reinforcement learning should be
 * there, and it should know what is happening and how it should learn."
 *
 * WHAT WAS ACTUALLY BROKEN, read off the live database rather than assumed.
 * `decideDrive` returns `{act:false, hold:"stalled"}` the moment `attempts`
 * reaches `MAX_STATION_ATTEMPTS`, and NOTHING anywhere handled that state. It is
 * terminal by omission: no recovery, no escalation, nothing learned. On
 * 2026-08-02 the live workspace held 42 open tracks, EVERY ONE of them standing
 * at Discover, nine of them already at the ceiling and frozen for good. One
 * track in the product's whole history has ever reached `done`.
 *
 * WHY A RETRY IS NOT THE ANSWER, and this is the distinction the whole module
 * turns on. `attempts` already retries. It retried those nine tracks three times
 * each and froze them anyway, because the thing blocking them was never at the
 * station being retried. Running the same station again against the same inputs
 * is the definition of expecting a different result, and on a product that
 * meters every model call it is a cost leak that looks like effort.
 *
 * SO THE RULE DIAGNOSES INSTEAD. Every station has a PRECONDITION: something
 * that has to be on the record before its agents can do their job, and a station
 * that OWNS producing it. When a station burns its attempts, the question is not
 * "shall we try again", it is "what did this station need, is it there, and who
 * files it". The answer sends the work back to the station where the fix lives,
 * or, when nothing inside the loop can supply it, to the one person who can, with
 * the specific thing they have to do.
 *
 * WHAT KEEPS IT FROM BEING WORSE THAN A FROZEN TRACK. A loop that can bounce
 * work between two stations forever spends real money doing it, so corrections
 * are counted and capped SEPARATELY from attempts. They have to be separate:
 * `attempts` resets to zero on every station move (driver.server.ts), and a
 * correction IS a station move, so a correction budget measured in attempts
 * would be unbounded by construction.
 *
 * PURE, IO-FREE AND UNIT-TESTED, the same shape as `decideDrive` above it and
 * `classifyOutcomeSettlement` in src/lib/ai/outcome-review.ts. The autonomous
 * driver decides with it while nobody is watching, so every branch is a total
 * function of its arguments and every refusal is asserted in correction.test.ts.
 */

import { AGENT_STATIONS, AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { MAX_STATION_ATTEMPTS, type HoldReason } from "@/lib/spine/driver";
import { waiverFor, type SpineRoute } from "@/lib/spine/route";

/**
 * How many times one track may be sent back for a fix before a person is asked.
 *
 * Two, and the number is argued rather than felt. One correction covers the
 * ordinary case: a precondition was genuinely missing and the station that owns
 * it can file it. A second covers the case where filling the first gap revealed
 * a second one, which is a real and common shape of product work. A third bounce
 * of the same piece of work is no longer a system correcting itself, it is a
 * pattern somebody needs to look at, and paying for another lap of it buys
 * nothing.
 *
 * The cost of the bound being wrong is asymmetric and that is why it is low. A
 * cap set too high spends money on a loop nobody is watching; a cap set too low
 * puts one extra item in front of a person, which the governance canon treats as
 * the exception it is meant to be.
 */
export const MAX_TRACK_CORRECTIONS = 2;

/**
 * What a station has to have before its crew can do the station's job.
 *
 * `kinds` are `spine_track_members.artifact_kind` values, so this map speaks the
 * same vocabulary as `TOOL_PRODUCTS` in ./attach.ts and `ARTIFACT_SOURCE` in
 * ./chain.ts. ANY ONE of them satisfies the precondition: Build can work from a
 * spec or from the tasks the spec implies, and demanding both would send healthy
 * work backwards.
 *
 * `from` is the station that FILES it, which is the whole routing mechanism: the
 * correction goes where the fix lives rather than where the failure surfaced.
 * `null` means no station in the loop produces it, which is true of exactly one
 * precondition and it is the first one: evidence has to enter the workspace from
 * the outside before Discover has anything to gather.
 */
export type Precondition = {
  /** Any one of these on the record satisfies it. */
  kinds: string[];
  /** The station that files it, or null when it comes from outside the loop. */
  from: AgentStation | null;
  /** What is missing, in the words a person reads. Never a table name. */
  missing: string;
  /** What fills it when no station can. Only read when `from` is null. */
  fix: string;
};

/**
 * The seven preconditions, one per station, which is what makes this apply to
 * the whole loop rather than to Build and Ship.
 *
 * The interesting entries are the ones with several kinds, because they are
 * where a route that waived a station still has to work. Learn accepts a spec, a
 * code change or a release: an incident fix waives Plan, so demanding a spec
 * would strand every incident at Learn, and the honest reading is that Learn
 * needs SOMETHING written down to grade against, not specifically a spec.
 */
export const STATION_NEEDS: Readonly<Record<AgentStation, Precondition>> = {
  // The one precondition the loop cannot produce for itself. Discover reads the
  // world; if nothing has been ingested there is nothing to read, and three more
  // attempts will find the same nothing. This is precisely what froze the nine
  // live tracks: every Discover run reported "signals.list returned empty" and
  // correctly refused to invent evidence, and the driver read a clean run that
  // filed nothing as a station failure worth retrying.
  sense: {
    kinds: ["signal", "theme"],
    from: null,
    missing: "evidence in this workspace to gather",
    fix: "Connect a source on Discover, or log one signal by hand. Discover reads what is there and will not invent what is not.",
  },
  decide: {
    kinds: ["signal", "theme"],
    from: "sense",
    missing: "evidence to weigh the call against",
    fix: "Log the evidence this call rests on.",
  },
  define: {
    kinds: ["decision"],
    from: "decide",
    missing: "a recorded decision to write the spec against",
    fix: "Record the decision, including what was weighed against it.",
  },
  design: {
    kinds: ["prd"],
    from: "define",
    missing: "a spec to design against",
    fix: "Write the spec first.",
  },
  build: {
    kinds: ["prd", "task"],
    from: "define",
    missing: "a spec or the tasks to build from",
    fix: "Write the spec, and the work it implies.",
  },
  ship: {
    kinds: ["changeset", "deployment"],
    from: "build",
    missing: "a code change to release",
    fix: "There is nothing built to ship.",
  },
  learn: {
    kinds: ["prd", "changeset", "deployment"],
    from: "define",
    missing: "something written down to grade the outcome against",
    fix: "Write down what this was meant to move before it can be graded.",
  },
};

const ORDER = new Map<AgentStation, number>(AGENT_STATION_ORDER.map((s, i) => [s, i]));

function isEarlier(a: AgentStation, b: AgentStation): boolean {
  return (ORDER.get(a) ?? 0) < (ORDER.get(b) ?? 0);
}

/** The station's name as a person says it. Never the internal id. */
function label(station: AgentStation): string {
  return AGENT_STATIONS[station]?.name ?? station;
}

/**
 * The holds this rule owns.
 *
 * Deliberately short, and every exclusion is a decision. `paused` is a kill
 * switch and correcting past one would be the worst bug this feature could have.
 * `waiting-on-a-person` is the boundary working. `over-budget`, `out-of-time`
 * and `out-of-credit` are money and clocks rather than failures, and the driver
 * already refuses to count them as attempts. `done` and `no-agent` are not
 * failures of a station either. What is left is the two holds that mean a
 * station ran and could not finish, which is the only thing worth correcting.
 */
export const CORRECTABLE_HOLDS: ReadonlySet<HoldReason> = new Set<HoldReason>([
  "stalled",
  "produced-nothing",
  // Same family as produced-nothing: a station ran and could not do its job. The
  // difference is that its output went to the wrong place rather than nowhere,
  // and either way the fix may live at an earlier station.
  "nothing-to-hand-on",
]);

/**
 * The escalations that answer themselves.
 *
 * WHY THIS EXISTS, and it is the difference between an escalation and a queue.
 * Each of these holds is the loop asking a person for ONE specific thing:
 * evidence to gather, a waived station put back, a spec that was never filed.
 * When that thing arrives, the work should carry on by itself. Making the person
 * ALSO come back and unstick nineteen pieces of work by hand is precisely the
 * failure the governance canon names: a queue added to the work rather than the
 * work automated. The human's job is to set the boundary and supply what only
 * they can; it is not to press go afterwards.
 *
 * BOUNDED BY CONSTRUCTION, which is why it cannot become a retry loop. The
 * resume fires on the hold the track is ALREADY carrying, and the run it grants
 * overwrites that hold with whatever happens next. So a station that fails again
 * comes back carrying `stalled` rather than the ask, this branch does not fire a
 * second time, and the next decision is the ordinary one. One extra pass per
 * answered ask, never two.
 *
 * `station-cannot-finish` and `given-up` are deliberately absent: neither asked
 * for anything, so nothing can arrive that would make a retry justified.
 */
export const RESUMABLE_HOLDS: ReadonlySet<HoldReason> = new Set<HoldReason>([
  "needs-evidence",
  "needs-a-waived-station",
  "corrections-spent",
]);

/**
 * The holds NOTHING will ever clear on its own, so the sweep stops picking them
 * up.
 *
 * THE TWO ABOVE, SEEN FROM THE SWEEP'S SIDE. `RESUMABLE_HOLDS`'s own paragraph
 * says why these two are absent from it: *"neither asked for anything, so
 * nothing can arrive that would make a retry justified."* A track carrying one
 * is finished until a person does something, and `decideDrive` correctly refuses
 * to act on it every time.
 *
 * WHAT THAT COST, MEASURED 2026-08-24 23:50 UTC. The tick takes the five oldest
 * open tracks by `driven_at`. The live workspace held **five `given-up` tracks
 * and one live one**, so all five slots went to work that could not move, the
 * live track was pushed to sixth, and it was **not driven at all that tick**.
 * The rotation does eventually come round -- a refused track still gets stamped,
 * so it sorts to the back -- which makes this a **halving of throughput rather
 * than a freeze**, and it is invisible: every one of those ticks reported `ok`
 * in 500ms having done nothing.
 *
 * That is the same shape as the frozen rotation `track-tick`'s own header
 * describes, one layer out. There it was a track the tick could not SERVE
 * holding its place; here it is a track the tick can never serve at all.
 *
 * **Excluding them is safe because the exclusion is on the HOLD, not on the
 * track.** Every route back into the sweep clears the hold first: the retry
 * control writes `last_hold = null`, and so does a correction. So a revived
 * track re-enters on the next tick with no further change, and nothing has to
 * remember it was ever excluded.
 */
export const TERMINAL_HOLDS: readonly HoldReason[] = ["given-up", "station-cannot-finish"];

/**
 * A run the loop HALTED, mapped to the hold that describes why.
 *
 * ── THE DEFECT THIS CLOSES, WHICH IS A 2026-08-02 FIX THAT ROTTED ─────────
 *
 * `driveTrackOnce` has a careful branch for an empty account: a station that
 * could not run because there was no credit must NOT count an attempt, because
 * "attempts exist to stop a station that cannot do its job, and this one was
 * never given the chance." Its comment records what happened without it --
 * three of nine tracks frozen on 2026-08-02 with `spend_used_usd = 0` and
 * nothing behind them but credit refusals.
 *
 * **That branch only fires when the dispatch THROWS.** The loop stopped
 * throwing. `CreditExhaustedError` is now caught inside `executeLoop`, which
 * marks the run `halted`, refunds it, and RETURNS normally with
 * `halted: { kind: "out_of_credit" }` -- deliberately, so a wallet event stays
 * out of the failure counts. The driver never read that field, saw a run that
 * returned cleanly and filed nothing, and recorded `produced-nothing`.
 *
 * MEASURED 2026-08-25 00:00 UTC on the live run: all three Discover seats
 * halted with *"account credit balance (13) is below the projected cost (16)"*,
 * and the track went from `attempts 1` to `attempts 2` for it. Three of those
 * and it is `given-up` -- the exact failure the 2026-08-02 fix was written to
 * prevent, arriving through the one door left open to it.
 *
 * ── WHY EVERY HALT IS A NON-ATTEMPT ───────────────────────────────────────
 *
 * The loop's own words for why it models these as halts rather than failures:
 * *"a run stopped by a boundary rather than by a fault, marked halted, refunded,
 * and kept out of the failure counts."* A boundary stopping a station says
 * nothing about whether that station can do its job. Every hold below is one the
 * driver already declines to count.
 *
 * Deliberately NOT exhaustive over every halt kind. `stopped` (another actor
 * ended the run) is left out because it is a race rather than a boundary, and
 * mapping it here would put a sentence in front of a person that is not true of
 * their workspace. An unmapped halt keeps today's behaviour exactly.
 */
export const HALT_HOLD: Readonly<Record<string, HoldReason>> = {
  // The wallet. The one measured above.
  out_of_credit: "out-of-credit",
  // A kill switch is on. `paused` is the reason the driver checks first anyway.
  kill_switch: "paused",
  // A ceiling bit. Not a failure and not a refusal: the work is fine, the money
  // is finished, and raising it resumes exactly where it stopped.
  mission_spend_cap: "over-budget",
  mission_token_cap: "over-budget",
  // The agent was switched off mid-flight. Nobody can be dispatched, which is
  // precisely what `no-agent` says.
  "agent-disabled": "no-agent",
};

/** The hold a halted run should record, or null to leave behaviour unchanged. */
export function holdForHalt(kind: string | null | undefined): HoldReason | null {
  if (!kind) return null;
  return HALT_HOLD[kind] ?? null;
}

export type CorrectionInputs = {
  /** Why the driver stopped. Only `stalled` and `produced-nothing` are ours. */
  hold: HoldReason;
  /** Where the work is standing. Every station is treated the same way. */
  station: AgentStation;
  /**
   * The track's own route.
   *
   * IN THE RULE BECAUSE A WAIVER IS NOT A DEFECT. `existing-feature` work enters
   * at Plan with Discover and Decide waived, which means it will never have a
   * recorded decision and must never be sent back to Decide to get one. The
   * route is the only thing that knows the difference between "the decision is
   * missing" and "this route says the call was already made".
   */
  route: SpineRoute;
  /** Attempts spent at THIS station. The first bound, and it is checked first. */
  attempts: number;
  /**
   * Corrections this track has already spent, across every station.
   *
   * SEPARATE FROM ATTEMPTS ON PURPOSE. `attempts` resets to zero on every
   * station move and a correction is a station move, so a correction budget
   * measured in attempts would never run out. Counted from the track's own
   * backward transitions in `stage_events`, which is the trail that already
   * records every move and needs no new column to be trusted.
   */
  corrections: number;
  /**
   * What this track has actually filed, as `spine_track_members.artifact_kind`.
   *
   * THE INPUT THAT MAKES THIS A DIAGNOSIS. Without it the rule can only retry;
   * with it the rule can tell "Build has no spec, so Plan is the fix" from
   * "Build has the spec and still cannot work, so what Plan filed is not good
   * enough to build from", which are the same hold and different corrections.
   */
  filed: readonly string[];
  /**
   * Whether the precondition no station can produce is satisfied now.
   *
   * Only consulted when the failing station's `from` is null, which today is
   * Discover alone. `null` means nobody checked, and it is read as "not
   * satisfied" so the rule never spends on a run it cannot justify.
   */
  externalMet?: boolean | null;
  /**
   * The hold the track was ALREADY carrying when this tick picked it up.
   *
   * IN THE RULE SO AN ESCALATION CAN ANSWER ITSELF. Without it, work that
   * stopped for want of one specific thing stays stopped after the person
   * supplies it, and somebody has to go and unstick nineteen pieces of work by
   * hand. That is the approvals queue in another costume, and the governance
   * canon rejects it in as many words: the human's job is to set the boundary
   * and supply what only they can, not to press go afterwards.
   *
   * It is also what BOUNDS the resume, because the run it grants overwrites this
   * very field. See `RESUMABLE_HOLDS`.
   */
  priorHold?: HoldReason | null;
};

/**
 * What to do about a station that could not finish.
 *
 * Four answers and no fifth, in the shape the driver has to act on: run it
 * again, send it back to the station that can fix the precondition, put a
 * specific ask in front of a person, or stop and say so.
 */
export type CorrectionDecision =
  | {
      action: "retry";
      /**
       * True when the ceiling should be cleared because the inputs changed.
       *
       * The ordinary retry is the driver doing what it already does, so it needs
       * nothing done to the row. A RESUME is different: the station is at its
       * attempt ceiling and would never run again, and the only reason it may is
       * that the thing it was waiting for has arrived. The caller has to reset
       * `attempts` for that one, and the flag is what tells the two apart
       * without the caller re-deriving the rule.
       */
      resume: boolean;
      because: string;
    }
  | {
      action: "go-back";
      /** The station that owns the fix. Always earlier on this route. */
      station: AgentStation;
      /** The precondition at issue, in plain words. */
      missing: string;
      /** Whether it is absent, or present and not good enough. */
      kind: "absent" | "not-enough";
      because: string;
    }
  | { action: "escalate"; reason: EscalationReason; because: string }
  | { action: "give-up"; because: string };

/**
 * The shapes an escalation takes. Kept as a closed vocabulary because each one
 * has a DIFFERENT action for the person, and an escalation that does not say
 * what to do is a status word with extra steps.
 */
export type EscalationReason =
  /** Nothing to work from, and no station can make it. Only a person or a source can. */
  | "needs-evidence"
  /** A waived station owns the missing thing. Reopen it, or file it by hand. */
  | "needs-a-waived-station"
  /** Everything is on the record and the station still finishes empty. */
  | "station-cannot-finish"
  /** Sent back twice for the same thing and it is still missing. */
  | "corrections-spent";

/**
 * Is the precondition on the record, or supplied from outside the loop?
 *
 * A PRECONDITION NO STATION CAN PRODUCE IS NEVER SATISFIED BY WHAT A STATION
 * PRODUCED, and that asymmetry is the whole correction of a live defect.
 *
 * Discover's need is "evidence in this workspace to gather", and its `kinds` are
 * `signal` and `theme` -- which is exactly what Discover itself files. So the
 * membership test answered yes the moment Discover succeeded once, for the rest
 * of the track's life. A later Discover tick that found nothing new therefore
 * took the "you have everything and still finish empty" branch and escalated to
 * `station-cannot-finish`: terminal, and it sends a person to inspect a station
 * that was working correctly. The signals on the record are the station's own
 * output, not a fresh supply of work, and reading them as a supply is how the
 * loop came to tell people their Discover was broken when the truth was that
 * nothing new had landed.
 *
 * So for the one precondition with no owning station, the world outside is the
 * ONLY thing that can answer it. `externalMet` is deliberately three-valued and
 * `null` (nobody could check) reads as unsatisfied, so an unreadable table can
 * only ever make the loop more cautious.
 */
export function needIsMet(
  need: Precondition,
  filed: readonly string[],
  externalMet: boolean | null = null,
): boolean {
  if (need.from === null) return externalMet === true;
  return need.kinds.some((k) => filed.includes(k));
}

/**
 * Can this correction actually be routed to a station, or is there nothing
 * behind this one to send it to?
 *
 * Three ways the answer is no, and all three are real. The precondition comes
 * from outside the loop (Discover). The station that owns it was waived, so the
 * route deliberately says nobody is going to file it. Or it is not on the path
 * at all, which means sending work there would strand it somewhere no station
 * owns.
 */
export function correctableTo(
  need: Precondition,
  route: SpineRoute,
  at: AgentStation,
): AgentStation | null {
  const owner = need.from;
  if (!owner) return null;
  if (!isEarlier(owner, at)) return null;
  if (waiverFor(route, owner)) return null;
  if (!route.path.includes(owner)) return null;
  return owner;
}

/**
 * Retry here, go back to the station that can fix it, ask a person, or stop.
 *
 * ORDER MATTERS AND IS TESTED, on the same reasoning as `decideDrive`. The
 * attempts ceiling is checked before anything else, because `attempts` is the
 * bound the product already has and a correction that fires early would replace
 * a cheap retry with an expensive round trip. Everything after it is a single
 * question asked in one direction: what did this station need, is it there, and
 * is there anywhere to send the work so that it will be.
 */
export function decideCorrection(i: CorrectionInputs): CorrectionDecision {
  // A hold that is not a station failing has nothing to correct. Money, clocks,
  // kill switches and open boundary calls are all handled where they arise, and
  // reasoning past any of them here would quietly undo those controls.
  if (!CORRECTABLE_HOLDS.has(i.hold)) {
    return {
      action: "retry",
      resume: false,
      because: "Nothing about this hold says the station failed, so there is nothing to correct.",
    };
  }

  // The station still has attempts, and attempts are the cheap bound. A
  // transient model failure should cost one more run, not a round trip through
  // an earlier station.
  if (i.attempts < MAX_STATION_ATTEMPTS) {
    return {
      action: "retry",
      resume: false,
      because: `${label(i.station)} has attempts left, and a retry is cheaper than a correction.`,
    };
  }

  const need = STATION_NEEDS[i.station];
  const met = needIsMet(need, i.filed, i.externalMet ?? null);
  const target = correctableTo(need, i.route, i.station);
  const spent = i.corrections >= MAX_TRACK_CORRECTIONS;

  // THE ASK WAS ANSWERED, so the work carries on by itself.
  //
  // The loop stopped and named one specific thing it needed from a person. That
  // thing is now on the record, which is information this station has never run
  // against, so it gets a clean set of attempts rather than a person having to
  // come back and restart nineteen pieces of work by hand. This is what makes
  // the escalation an exception rather than a queue.
  //
  // It cannot become a retry loop: the run it grants overwrites `priorHold`, so
  // a station that fails again comes back carrying `stalled` and lands on the
  // ordinary branches below instead of here.
  if (met && i.priorHold && RESUMABLE_HOLDS.has(i.priorHold)) {
    return {
      action: "retry",
      resume: true,
      because: `${label(i.station)} stopped for want of ${need.missing}, and that is now on the record, so it runs again.`,
    };
  }

  // NOTHING TO SEND IT BACK TO. Either the precondition comes from outside the
  // loop, or the station that files it is waived on this route. Both are asks a
  // person can answer in one action, and neither is answerable by any agent, so
  // spending another run on it would be spending to learn nothing.
  if (!target) {
    if (!met && need.from === null) {
      return {
        action: "escalate",
        reason: "needs-evidence",
        // Only ever rendered for a precondition with no owning station, which
        // today is Discover alone, so it is written to read naturally with that
        // one `missing` phrase rather than with all seven.
        because: `${label(i.station)} ran ${MAX_STATION_ATTEMPTS} times and filed nothing, because there is no ${need.missing}. ${need.fix}`,
      };
    }
    if (!met && need.from) {
      return {
        action: "escalate",
        reason: "needs-a-waived-station",
        because: `${label(i.station)} cannot proceed without ${need.missing}, and ${label(need.from)} is waived on this route so nothing is going to file it. Put ${label(need.from)} back on the route, or file it yourself.`,
      };
    }
    return {
      action: "escalate",
      reason: "station-cannot-finish",
      because: `${label(i.station)} has what it needs on the record and still finished empty ${MAX_STATION_ATTEMPTS} times. Nothing earlier on this route can fix that, so it needs your eyes on the station rather than on the work.`,
    };
  }

  // THE CORRECTION BUDGET, which is what stops this from being worse than a
  // frozen track. Bouncing the same work between two stations forever costs real
  // money on every lap, so the loop stops proposing laps and says what it knows.
  if (spent) {
    if (!met) {
      return {
        action: "escalate",
        reason: "corrections-spent",
        because: `This went back to ${label(target)} ${i.corrections} times for ${need.missing} and ${label(i.station)} still does not have it. Nothing else will be spent on it until you look.`,
      };
    }
    return {
      action: "give-up",
      because: `${label(i.station)} has ${need.missing}, has been corrected ${i.corrections} times, and still cannot finish. Nothing more will be tried on this automatically.`,
    };
  }

  // ABSENT: the ordinary correction. The station is missing the one thing it
  // needs and an earlier station on its own route is the station that files it.
  if (!met) {
    return {
      action: "go-back",
      station: target,
      missing: need.missing,
      kind: "absent",
      because: `${label(i.station)} cannot proceed without ${need.missing}, and ${label(target)} is the station that files it.`,
    };
  }

  // NOT ENOUGH: the founder's own example. Build has the spec and still cannot
  // build, which means the spec is not something you can build from. The rule
  // cannot read a spec's quality and does not pretend to; what it can say is
  // that three clean runs against this input produced nothing, so the input is
  // the thing to fix, and the station that filed it is the one to fix it.
  return {
    action: "go-back",
    station: target,
    missing: need.missing,
    kind: "not-enough",
    because: `${label(i.station)} has ${need.missing} and still could not finish ${MAX_STATION_ATTEMPTS} times, so what ${label(target)} filed is not enough to work from.`,
  };
}

/**
 * The hold to record for a correction outcome.
 *
 * Every one of these is its own `HoldReason` rather than another shade of
 * `stalled`, for the reason `produced-nothing` was split from `stalled` in the
 * first place: they have different causes and different fixes, and a record that
 * flattens them tells a person a word instead of an answer.
 */
export function holdForCorrection(d: CorrectionDecision): HoldReason | null {
  switch (d.action) {
    case "retry":
      return null;
    case "go-back":
      return null;
    case "escalate":
      return d.reason;
    case "give-up":
      return "given-up";
  }
}

/**
 * What the station being sent back to is told, and why it is told anything.
 *
 * A station that receives corrected work and is not told what went wrong will
 * file the same thing again, which turns the correction loop into an expensive
 * retry. This is the deterministic half of the learning: it applies to THIS
 * track on the very next tick, with no model call and no recall involved.
 * `rememberCorrection` in ./correction.server.ts is the compounding half, which
 * reaches every future track.
 */
export function correctionNote(
  from: AgentStation,
  to: AgentStation,
  kind: "absent" | "not-enough" = "absent",
): string {
  const need = STATION_NEEDS[from];
  const head = `This work came BACK to ${label(to)} from ${label(from)}, which could not proceed.`;
  const why =
    kind === "not-enough"
      ? `${label(from)} had ${need.missing} and still could not work from it, so what is on the record is not enough.`
      : `${label(from)} needs ${need.missing} and it is not on the record.`;
  return `${head} ${why} Fix exactly that and file it. Do not restate what is already on the record, and do not hand ${label(from)} the same thing again.`;
}

/**
 * The sentence written to memory so the NEXT piece of work does not repeat this.
 *
 * Written as guidance rather than as an incident report, because it is recalled
 * by semantic match into an agent's prompt and an agent reading "track 4a8f
 * failed" learns nothing it can act on. Naming both stations is what makes it
 * useful: the agent that receives it at Plan is being told what Build will need.
 */
export function correctionMemory(input: {
  title: string;
  from: AgentStation;
  to: AgentStation;
  missing: string;
  kind: "absent" | "not-enough";
}): string {
  const cause =
    input.kind === "not-enough"
      ? `${label(input.from)} had ${input.missing} and still could not work from it`
      : `${label(input.from)} did not have ${input.missing}`;
  return `Correction on "${input.title}": ${cause}, so the work went back to ${label(input.to)}. Before handing work from ${label(input.to)} to ${label(input.from)}, make sure ${input.missing} is filed and is specific enough to work from.`;
}

/** The same lesson once it is known to have worked. Written on the way forward. */
export function correctionFixMemory(input: {
  title: string;
  from: AgentStation;
  to: AgentStation;
  missing: string;
}): string {
  return `Correction closed on "${input.title}": ${label(input.from)} could not proceed without ${input.missing}, the work went back to ${label(input.to)}, and once that was filed ${label(input.from)} finished. The fix for that failure is at ${label(input.to)}, not a retry at ${label(input.from)}.`;
}

/**
 * Did the dispatch fail for a reason that was never the station's?
 *
 * A LIVE DEFECT, not a hypothetical. `assertCredits` in
 * src/lib/ai/runtime.server.ts throws `CreditExhaustedError` BEFORE a single
 * token is spent. `driveTrackOnce` caught it in the same `catch` as a genuine
 * station failure, counted an attempt and recorded `stalled`, so three ticks of
 * an empty account burned a station's entire attempt budget in thirty minutes
 * and froze the track for good, having never once run the station. Three of the
 * nine tracks frozen on 2026-08-02 were exactly that: `spend_used_usd = 0` and
 * nothing behind them but credit refusals.
 *
 * DELIBERATELY NARROW. It matches the credit refusals this runtime raises and
 * nothing else. A broad "looks transient" match would swallow real station
 * failures into a hold that never counts an attempt, which would replace a track
 * that freezes with a track that runs forever, and that is the more expensive of
 * the two bugs by a wide margin.
 *
 * IT MATCHES THE ERROR'S IDENTITY FIRST, AND ITS PROSE ONLY AS A FALLBACK.
 * The original version tested `message.includes("credit balance")`, which is a
 * guard on a sentence rather than on a fact. The runtime raises the same refusal
 * in two wordings: `CreditExhaustedError` says "Account credit balance (0) is
 * below the projected cost (2)." and the ai_events row it logs beside it says
 * "credit_exhausted: account <id> balance 0 below projected 2". The second
 * contains both words and never adjacently, so the substring test reads false on
 * it. Any caller reading the refusal back off the run rather than catching the
 * throw therefore got `stalled`, counted an attempt, and froze the track in
 * three ticks -- the exact defect this function exists to prevent, reachable
 * again through a different door.
 *
 * `CreditExhaustedError.code` is "CREDIT_EXHAUSTED" and `CreditCapError.code` is
 * "CREDIT_CAP_REACHED". Those are declared readonly on the classes and are what
 * this should always have been testing. The prose match stays for the case where
 * only a string survived, but it is now the second question rather than the only
 * one, and it recognises both wordings.
 */
const ENVIRONMENT_CODES: ReadonlySet<string> = new Set(["CREDIT_EXHAUSTED", "CREDIT_CAP_REACHED"]);

export function isEnvironmentFailure(failure: unknown): boolean {
  if (!failure) return false;

  // An Error carrying the runtime's own code, which is the stable fact.
  if (typeof failure === "object") {
    const code = (failure as { code?: unknown }).code;
    if (typeof code === "string" && ENVIRONMENT_CODES.has(code)) return true;
    const name = (failure as { name?: unknown }).name;
    if (name === "CreditExhaustedError" || name === "CreditCapError") return true;
  }

  const message =
    typeof failure === "string"
      ? failure
      : typeof (failure as { message?: unknown })?.message === "string"
        ? (failure as { message: string }).message
        : null;
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    // CreditExhaustedError: "Account credit balance (N) is below the projected cost (M)."
    m.includes("credit balance") ||
    // The ai_events wording of the same refusal, which the substring above misses.
    m.includes("credit_exhausted") ||
    m.includes("below projected") ||
    // CreditCapError, raised by assertCreditCaps for a per-product or per-member ceiling.
    m.includes("credit cap") ||
    m.includes("credit_cap_reached") ||
    m.includes("out of credit")
  );
}

/**
 * How much a correction memory is worth to the decay sweep.
 *
 * Four, the same as a decisive outcome. `memory-tick` prunes importance <= 2
 * when unused for 30 days, and a lesson about how the loop fails is exactly the
 * kind of thing that is not recalled for weeks and then saves a whole track.
 */
export const CORRECTION_MEMORY_IMPORTANCE = 4;

/** agent_memory.kind for a correction. Its own kind so the store stays readable. */
export const CORRECTION_MEMORY_KIND = "correction";
