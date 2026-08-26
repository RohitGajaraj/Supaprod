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

const NOTHING: WayOut = { next: null, onThisScreen: false };
const elsewhere = (next: string): WayOut => ({ next, onThisScreen: false });
const here = (next: string): WayOut => ({ next, onThisScreen: true });

const WAY_OUT: Record<HoldReason, WayOut> = {
  paused: elsewhere("Nothing on this screen will move it until the pause is lifted for the whole workspace."),
  "no-agent": here("Nobody on your team covers this step yet, so no amount of trying will fill it. You can do this step yourself and hand the result in."),
  stalled: here("It has come back with nothing several times, so another try lands in the same place. Send it back a step so it starts from different ground, or do this step yourself."),
  "going-in-circles": here("It has been round this many times without moving, so trying again changes nothing. Send it back a step, or do this step yourself."),
  "tools-refused": here("A door it needs is locked, and no step can unlock it for itself. Open it, or do this step yourself and hand the result in."),
  "station-cannot-finish": here("It has everything it needs and still cannot finish, so this one needs you rather than another try. Send it back a step, or do it yourself."),
  "corrections-spent": here("It has been sent back for this same fix as often as it is allowed. Doing this step yourself is the way out."),
  "given-up": here("Nothing more will be tried here on its own. Doing this step yourself is the way out."),

  // The ten that already end with their own next step. See the header.
  "waiting-on-a-person": NOTHING,
  done: NOTHING,
  "produced-nothing": NOTHING,
  "self-check-failed": NOTHING,
  "nothing-to-hand-on": NOTHING,
  "out-of-time": NOTHING,
  "over-budget": NOTHING,
  "out-of-credit": NOTHING,
  "needs-evidence": NOTHING,
  "needs-a-waived-station": NOTHING,
};

/**
 * Tolerant of an unknown string, the same way `holdTone` is and for the same
 * reason: `last_hold` is a text column, so a value written by a newer deploy has
 * to come out as silence rather than as a confident wrong instruction.
 */
export function wayOut(hold: string | null | undefined): WayOut {
  if (!hold) return NOTHING;
  return WAY_OUT[hold as HoldReason] ?? NOTHING;
}
