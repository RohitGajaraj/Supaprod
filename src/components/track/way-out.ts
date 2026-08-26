import type { HoldReason } from "@/lib/spine/driver";

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
  paused: "Nothing on this screen will move it until the pause is lifted for the whole workspace.",
  "no-agent": "Nobody on your team covers this step yet, so no amount of trying will fill it.",
  stalled: "It has come back with nothing several times, so another try lands in the same place.",
  "going-in-circles": "It has been round this many times without moving, so trying again changes nothing.",
  "tools-refused": "A door it needs is locked, and no step can unlock it for itself.",
  "station-cannot-finish": "It has everything it needs and still cannot finish, so this one needs you rather than another try.",
  "corrections-spent": "It has been sent back for this same fix as often as it is allowed.",
  "given-up": "Nothing more will be tried here on its own.",
};

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
): WayOut {
  if (!hold) return NOTHING;
  const diagnosis = DIAGNOSIS[hold as HoldReason];
  if (!diagnosis) return NOTHING;

  const wanted = OFFERS[hold as HoldReason] ?? [];
  const can = (o: Offer) =>
    o === "undo" ? available.undo : o === "handback" ? available.handback : true;

  const usable = wanted.filter(can);
  if (usable.length === 0) {
    // Honest, and it is the whole point: this screen cannot clear this one, so
    // it does not pretend otherwise. The hold's own line already said what
    // happened; adding a false door would be worse than adding nothing.
    return { next: diagnosis, onThisScreen: false };
  }

  const offer =
    usable.includes("undo") && usable.includes("handback")
      ? BOTH
      : SENTENCE[usable[0] as Offer];

  return {
    next: `${diagnosis} ${offer}`,
    // The steer box is on this screen too, but it is not under Take it over, so
    // a steer-only way out must not borrow that pointer.
    onThisScreen: usable.some((o) => o === "undo" || o === "handback"),
  };
}
