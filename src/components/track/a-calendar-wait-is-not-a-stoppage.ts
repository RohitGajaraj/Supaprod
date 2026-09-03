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

/** `spine_tracks.last_hold` and `station`, which is all this asks. */
export function waitingOnTime(t: {
  station: string | null | undefined;
  holdReason: string | null | undefined;
}): boolean {
  return t.holdReason === "needs-evidence" && t.station === "learn";
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
