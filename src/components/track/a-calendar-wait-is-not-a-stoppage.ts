/**
 * ── A CALENDAR WAIT IS NOT A STOPPAGE, AND IT IS NOT AN AGENT EITHER ──────
 *
 * A track parked at Learn on a forecast whose horizon has not arrived is
 * waiting on the calendar. **No agent is coming**, and a person cannot grade a
 * forecast whose horizon has not arrived either. It is a third thing.
 *
 * ── WHY IT IS A SHARED PREDICATE AND NOT A LOCAL ONE ──────────────────────
 *
 * `tracks-feed.ts` has known this since S1's ruling ("a learn hold whose reason
 * is an undated forecast is a calendar wait, not a stoppage") and says
 * *"waiting on time"* on the board. The run screen did not know it, and said
 * FOUR things about the same state at once (A1, walked 17:28 IST):
 *
 *   an "On hold" chip
 *   the character: "I've stopped, the reason is on the hold line"
 *   the footer: "Stopped, and not on you."
 *   a "Run it now" button, which on a date wait does nothing useful
 *
 * Three statements of one fact and a control that cannot change it. §12's own
 * stated failure is a state named two ways on two surfaces; this was a state
 * named four ways on one.
 *
 * So the predicate moves here, where both surfaces read it, rather than being
 * written a second time with a second name.
 */

/**
 * ── THE HORIZON IS PART OF THE QUESTION WHEN IT IS KNOWN ──────────────────
 *
 * The first version of this asked only `needs-evidence` at `learn`, and that is
 * a real bug rather than a simplification: a track at Learn whose horizon has
 * ALREADY PASSED satisfies both and is not waiting on the calendar at all. It
 * is overdue, and telling that person "Learn returns when the forecast comes
 * due" is telling them to wait for something that already happened.
 *
 * `TrackRun`'s chip has always known this. Its `isCalmHold` asks the same two
 * things AND that the horizon is in the future, which is why the chip and the
 * footer could disagree: not because they read different facts, as it first
 * appeared, but because the footer read two of the three.
 *
 * `horizon` is OPTIONAL and the two answers differ honestly:
 *
 *   a caller that has it   gets the strict answer, and an overdue track falls
 *                          through to whatever the ordinary hold arms say
 *   a caller without it    gets the broad answer, because the alternative is
 *                          calling a calendar wait a stoppage on every surface
 *                          that has not plumbed the date yet, which is the
 *                          louder wrong
 *
 * The difference is narrow and it is written down here rather than discovered:
 * only a track at Learn on `needs-evidence` whose horizon has passed is read
 * differently by the two, and the strict reading is the correct one.
 */
export function waitingOnTime(t: {
  station: string | null | undefined;
  holdReason: string | null | undefined;
  /** The forecast's horizon, when the caller has read one. */
  horizon?: string | null;
  /** Injectable so this is deterministic in a test. */
  now?: number;
}): boolean {
  if (t.holdReason !== "needs-evidence" || t.station !== "learn") return false;
  if (t.horizon == null) return true;
  const at = Date.parse(t.horizon);
  /* An unparseable date is not evidence the horizon passed, so it reads as the
     broad case rather than silently turning a calendar wait into a stoppage. */
  if (Number.isNaN(at)) return true;
  return at > (t.now ?? Date.now());
}

/**
 * What the footer says instead of "Stopped, and not on you."
 *
 * ONE SENTENCE AND NO DOOR. The chip beside it already says the state, so this
 * says only what a person actually wants: WHEN it comes back. The date is the
 * whole content, which is why it is the only variable part.
 *
 * `null` when the horizon is not known. A date wait whose date nobody recorded
 * is a real state, and inventing "soon" for it would be the substitution this
 * repo keeps paying for.
 */
export function calendarWaitLine(returnsOn: string | null): string {
  return returnsOn ? `Learn returns ${returnsOn}.` : "Learn returns when the forecast comes due.";
}
