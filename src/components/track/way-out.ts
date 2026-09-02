import type { HoldReason } from "@/lib/spine/driver";
import { nothingIsComing } from "@/components/track/nothing-is-coming";

/**
 * WHEN A RUN STOPS, THE SCREEN SAYS WHAT WILL START IT AGAIN. NO DEAD END, EVER.
 *
 * ── THE DEFECT THIS FIXES ──────────────────────────────────────────────────
 * A held run showed its reason and one control: let this station try again. For
 * most reasons that control cannot be the answer, and for eight of the eighteen
 * the reason names no way out at all. A person reads "it keeps arriving back
 * where it started", sees a button that will do the same thing again, and has
 * been told nothing about what to actually do. That is a dead end wearing a
 * button, which R-20 section 5 forbids outright.
 *
 * ── WHY MOST REASONS GET NOTHING FROM THIS FILE ────────────────────────────
 * Ten of them already end with the action, in the driver's own words, and a
 * second sentence repeating it would be noise:
 *
 *   over-budget            "Raise the ceiling to let it carry on."
 *   out-of-credit          "Top the account up and it carries on from here."
 *   needs-evidence         "Connect a source, or file the missing input by hand."
 *   waiting-on-another-run "...continues when that run's pull request merges or
 *                          closes", and the driver names the run, the file and
 *                          the pull request in `last_hold_because` above it.
 *   needs-a-waived-station "Put that station back on the route, or file it yourself."
 *   produced-nothing       "It will try again."
 *   nothing-to-hand-on     "It will try again."
 *   self-check-failed      "...examined again the next time this station runs."
 *   out-of-time            "...the rest of the work carries on next time."
 *   waiting-on-a-person    the call itself is the way out, and it renders above.
 *   done                   not a hold.
 *
 * So this file speaks only where the record goes quiet.
 *
 * ── AND IT DOES NOT REMOVE THE RETRY CONTROL ───────────────────────────────
 * The tempting move is to hide "try again" wherever it cannot clear the hold.
 * It is wrong for at least one real case: a person who has just unlocked a
 * refused tool somewhere else comes back to this screen wanting exactly that
 * button. The dead end was never the button's presence, it was the ABSENCE of a
 * stated next step. So the sentence is added and the control is left alone.
 *
 * ── `Record<HoldReason, ...>` IS THE POINT OF THE TYPE ─────────────────────
 * A nineteenth hold reason added to the driver breaks this file at compile time
 * rather than shipping a stop with nothing to do about it.
 */

export type WayOut = {
  /** What clears this, when the hold's own sentence names nothing. */
  next: string | null;
  /** Whether the way out is a control on this very screen, under Take it over. */
  onThisScreen: boolean;
  /**
   * A door that is somewhere ELSE, when the thing that clears this hold is
   * another piece of work rather than a control here.
   *
   * A fourth kind, and it had to be: every `Offer` above is something this
   * screen can do to this run. "Open the other run" is a navigation, and
   * modelling it as an offer would have put it in a list whose sentences all
   * begin with an instruction to act on the run you are looking at.
   *
   * Only ever present when the caller HAS the id. A label with nowhere to go is
   * the false door this file's header is about.
   */
  door?: { label: string; trackId: string };
};

/**
 * What this screen can offer, in the order it is worth offering for a reason.
 *
 * `steer` is last on purpose and it is not a consolation prize: for a run that
 * will not converge it is often the ONLY thing that changes the outcome, since
 * sending it back to the same instruction produces the same circle.
 */
type Offer = "undo" | "handback" | "steer";

/** Which controls the run screen is actually showing right now. */
export type Available = { undo: boolean; handback: boolean };

const NOTHING: WayOut = { next: null, onThisScreen: false };

/**
 * The diagnosis, which is true whatever the screen is showing, kept apart from
 * the OFFER, which depends on what this track can actually do. They were one
 * string until the first drive of this feature put "send it back a step" on a
 * track sitting at the first station on its route, with the section below it
 * saying in as many words that there was nothing to send it back to. Pointing
 * at a door that is not there is the same defect as pointing at none.
 */
const DIAGNOSIS: Partial<Record<HoldReason, string>> = {
  paused: "Nothing on this screen can lift it.",
  /*
   * TWO FALSE CLAIMS, AND THE SECOND WAS THE DAMAGING ONE.
   *
   * This read "Nobody on your team covers this step yet, so no amount of
   * trying will fill it." Traced against the running code, both halves are
   * wrong in the only state that produces them.
   *
   * `no-agent` has two sources. The driver raises it when
   * `leadAgentFor(station)` is null, and that cannot happen: all seven
   * stations have a lead today, which the test beside this file now pins so a
   * later station cannot quietly make this sentence a lie. The other source is
   * the live one. `loop.server.ts` sees `agent.enabled === false`, cancels the
   * run, and halts with kind `agent-disabled`, which `HALT_HOLD` maps here.
   * 27 of the 283 agents in this database are switched off right now, so this
   * is a state a person reaches rather than a theoretical branch.
   *
   * In that state somebody DOES cover the step. The agent exists, it is
   * assigned to the station, and it was turned off. And trying is exactly what
   * fills it: turning it back on is one control on the Agents screen. Telling a person
   * their situation is unfixable when the fix is a toggle is worse than saying
   * nothing, which is what this file was written to stop.
   *
   * -- AND IT NO LONGER RESTATES THE LINE ABOVE IT ------------------------
   * S0 fixed their half of F-134 while I was fixing mine, and the two then
   * said the same thing eight lines apart. `HOLD_LINE["no-agent"]` now reads
   * "No agent is picking this step up, so it needs you", which is the EFFECT,
   * correctly and without the false cause it used to give. This sentence
   * opened by restating that effect before reaching the cause.
   *
   * Two sentences agreeing at that distance are worse than two contradicting,
   * because a contradiction at least tells a reader something is wrong, while
   * agreement leaves them unable to tell which line is the surface's own claim
   * and no reason to look. So this one now carries only what the line above
   * cannot: WHICH thing is off, and the door that turns it back on.
   *
   * It says Agents and not Crew on purpose. The route is `/crew` and the label
   * has been Agents since 2026-08-15, and a sentence that points at a door by
   * a name the product no longer prints is the same dead end in a nicer coat.
   *
   * The record already holds the true sentence and the screen never gets it:
   * the loop stores "<slug> is switched off, so this run was cancelled instead
   * of resumed", while `last_hold_because` on this path is null by F-127, so
   * "Why it stopped" renders only the two derived lines. S0 owns the other one
   * (`HOLD_LINE["no-agent"]`, which still says "No agent serves this station
   * yet") and has the reproduction.
   */
  "no-agent":
    "The agent that covers it is switched off, and turning it back on under Agents is what starts this again.",
  stalled: "Another try lands in the same place.",
  "going-in-circles": "Trying again changes nothing.",
  "tools-refused": "A door it needs is locked, and no step can unlock it for itself.",
  /*
   * THE CAUSE, BECAUSE S0'S LINE NOW CARRIES ONLY THE EFFECT.
   *
   * Their guard caught `corrections-spent` restating itself and we each fixed
   * it from one side in the same hour: `HOLD_LINE` became "Nothing further will
   * be spent on this until you look", and I had deleted this entry as a
   * restatement. Both edits were right on their own and the composition lost
   * the cause altogether -- nothing on the screen said the work had been sent
   * back for the same fix as often as it is allowed.
   *
   * That is the third artifact S0 named: when two lanes write to one screen
   * region, the composed text is a thing neither owns, and removing an overlap
   * from both sides at once leaves a hole exactly as easily as leaving one
   * leaves a repeat. Their division is the one to follow, and it is now
   * written where a reader of either file will meet it: the hold line carries
   * WHAT IS HAPPENING, this file carries WHY and WHAT TO DO.
   */
  "corrections-spent":
    "It has been sent back for this same fix as often as it is allowed and is still short of it.",
  "given-up": "Nothing more will be tried here on its own.",
};

/*
 * ── WHY THESE SENTENCES ARE SO SHORT ──────────────────────────────────────
 *
 * Each one renders directly under `HOLD_LINE[reason]`, which has already said
 * what happened. Three of them used to open by saying it again:
 *
 *   paused            "Everything is paused for this workspace, so nothing ran."
 *                     "Nothing on this screen will move it until the pause is
 *                      lifted for the whole workspace."
 *   stalled           "...ran and produced nothing several times..."
 *                     "It has come back with nothing several times, so..."
 *   going-in-circles  "...been run many times over and the work has not moved..."
 *                     "It has been round this many times without moving, so..."
 *
 * Two sentences AGREEING a line apart are worse than two contradicting. A
 * contradiction tells a reader something is wrong; agreement leaves them unable
 * to tell which line is the surface's own claim, and no reason to look for the
 * problem. S2 named that after removing a count printed twice 190px apart, and
 * F-134 produced the same shape across two lanes when S0 and I each fixed one
 * half of `no-agent` correctly.
 *
 * So each of these now carries ONLY what the line above cannot: for `paused`,
 * that no control here reaches a workspace-wide switch; for the other two, that
 * repetition is what makes another attempt pointless, which is the premise the
 * offers below rest on.
 *
 * THE OFFER SENTENCE IS APPENDED SEPARATELY, so what looks terse here is not
 * what a person reads. `stalled` renders as "Another try lands in the same
 * place. Send it back a step so it starts from different ground."
 */
/** What is worth offering for each, best first. Empty means nothing here helps. */
const OFFERS: Partial<Record<HoldReason, Offer[]>> = {
  paused: [],
  "no-agent": ["handback"],
  stalled: ["undo", "handback", "steer"],
  "going-in-circles": ["undo", "handback", "steer"],
  "tools-refused": ["handback"],
  "station-cannot-finish": ["handback", "undo", "steer"],
  "corrections-spent": ["handback", "undo", "steer"],
  "given-up": ["handback", "undo", "steer"],
};

const SENTENCE: Record<Offer, string> = {
  undo: "Send it back a step so it starts from different ground.",
  handback: "Do this step yourself and hand the result in.",
  steer: "Say what to change in the box below, and it reaches whoever picks this up next.",
};

/**
 * A STEER ALONE IS NOT A WAY OUT OF A TERMINAL HOLD, AND SAYING IT IS WOULD BE
 * WORSE THAN THE DEAD END THIS FILE REMOVED.
 *
 * `steerTrack` inserts one row. It does not touch `last_hold`, `attempts` or
 * `station_drives`, so it changes nothing about whether the work will run. On a
 * hold in `TERMINAL_HOLDS` the sweep removes the track from selection entirely
 * (`track-tick.ts`), so the message is stored and **nothing ever arrives to
 * consume it**. The person would have written an instruction, been told it
 * reaches whoever picks this up next, and had it sit there forever. That failure
 * looks like success, which is the one shape worse than saying nothing.
 *
 * Undo and handback do NOT need this pairing: both clear `last_hold`, `attempts`
 * and `station_drives` themselves, so the track becomes drivable again as part
 * of the same act.
 *
 * Caught by S4 on the drive trace, against my own claim: the press that consumed
 * my steer carried `entry_hold = out-of-time`, which is not terminal. The track
 * read `going-in-circles` by the time I looked, and I read the state at read
 * time as the state at the moment the steer landed.
 */
/*
 * ONE PREDICATE, FIVE SURFACES. This file narrowed `TERMINAL_HOLDS` to a Set of
 * its own first, and on 2026-08-31 three more surfaces needed the same answer
 * and each reached for its own copy. `nothing-is-coming.ts` is that Set with the
 * reasoning attached, and this file reads it rather than keeping a fourth.
 */

function steerSentence(hold: string, stationName: string | null): string {
  if (!nothingIsComing(hold)) return SENTENCE.steer;
  const press = stationName ? `press Let ${stationName} try again` : "start it again yourself";
  return `Say what to change in the box below, then ${press}. Nothing will pick this up on its own while it is stopped here.`;
}

/** Both doors open, and saying so in one clause reads better than two. */
const BOTH = "Send it back a step, or do this step yourself.";

/**
 * Tolerant of an unknown string, the same way `holdTone` is and for the same
 * reason: `last_hold` is a text column, so a value written by a newer deploy has
 * to come out as silence rather than as a confident wrong instruction.
 *
 * `available` is what the Take it over region is drawing at this moment. Passing
 * it is what stops this sentence promising a control that is not on the screen.
 */
export function wayOut(
  hold: string | null | undefined,
  available: Available = { undo: false, handback: false },
  /** Named so a terminal hold can point at the exact control that restarts it. */
  stationName: string | null = null,
  /**
   * The run holding the file this one is waiting for, when there is one and the
   * caller could resolve it. Resolved LIVE by `whoHoldsThePath`, so it is absent
   * the moment the claim releases -- which is the same moment this track starts
   * moving and the door stops being true.
   */
  waitingOn: { trackId: string; title: string } | null = null,
): WayOut {
  if (!hold) return NOTHING;

  /*
   * -- THE ONE HOLD WHOSE WAY OUT IS ANOTHER PIECE OF WORK ----------------
   *
   * `waiting-on-another-run` has no entry in DIAGNOSIS or OFFERS, and that is
   * right: its own `HOLD_LINE` already says what happens next, so by this file's
   * rule there is nothing to add. What it DOES have is somewhere to go, and a
   * person told "waiting on the tablet run's pull request #4" wants exactly that
   * door.
   *
   * Returned only with an id. Without one this falls through to NOTHING rather
   * than rendering a label that goes nowhere, which is the same refusal the rest
   * of this file makes about controls that are not on screen.
   */
  if (hold === "waiting-on-another-run") {
    return waitingOn
      ? {
          next: null,
          onThisScreen: false,
          door: { label: `Open ${waitingOn.title}`, trackId: waitingOn.trackId },
        }
      : NOTHING;
  }

  /*
   * A MISSING DIAGNOSIS IS NOT A MISSING WAY OUT, AND IT USED TO BE.
   *
   * This returned nothing at all without a diagnosis, which forced every hold
   * that wanted to offer a control to also carry a sentence. Two of them had
   * nothing left to say: for `station-cannot-finish` and `corrections-spent`,
   * `HOLD_LINE` already states the cause, the repetition and that it needs a
   * person, so the diagnosis could only restate it. On the largest hold in the
   * database that produced the same fact three times in one box, counting the
   * specific line stored in `last_hold_because` above both.
   *
   * The offer IS a way out. Where the record has already explained itself, the
   * honest thing to add is the door and nothing else.
   *
   * With neither a diagnosis nor a usable offer this still returns NOTHING,
   * which is the original contract: a hold this screen cannot help with says
   * nothing rather than inventing a door.
   */
  const diagnosis = DIAGNOSIS[hold as HoldReason] ?? null;

  const wanted = OFFERS[hold as HoldReason] ?? [];
  const can = (o: Offer) =>
    o === "undo" ? available.undo : o === "handback" ? available.handback : true;

  const usable = wanted.filter(can);
  if (usable.length === 0 && !diagnosis) return NOTHING;
  if (usable.length === 0) {
    // Honest, and it is the whole point: this screen cannot clear this one, so
    // it does not pretend otherwise. The hold's own line already said what
    // happened; adding a false door would be worse than adding nothing.
    return { next: diagnosis, onThisScreen: false };
  }

  const first = usable[0] as Offer;
  const offer =
    usable.includes("undo") && usable.includes("handback")
      ? BOTH
      : first === "steer"
        ? steerSentence(hold, stationName)
        : SENTENCE[first];

  return {
    next: diagnosis ? `${diagnosis} ${offer}` : offer,
    // The steer box is on this screen too, but it is not under Take it over, so
    // a steer-only way out must not borrow that pointer.
    onThisScreen: usable.some((o) => o === "undo" || o === "handback"),
  };
}
