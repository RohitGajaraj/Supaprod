/**
 * WHO SAYS THE STATION FILED NOTHING, WHEN BOTH LINES CAN.
 *
 * -- WHAT IS ON SCREEN -----------------------------------------------------
 * A station panel with no artifacts renders its own sentence and then the
 * track's hold line, in the same box, one under the other. On a track held at
 * `produced-nothing` that reads:
 *
 *     Plan ran and filed no spec.
 *     This station ran but filed nothing, so there is nothing to hand to the
 *     next one. It will try again.
 *
 * Measured: 12 tracks are held at `produced-nothing` and ALL TWELVE have no
 * member at their current station, so this is not an edge case, it is every
 * single one of them.
 *
 * -- AND TWO HOLD LINES SAY THE OPPOSITE, WHICH IS WORSE -------------------
 * `nothing-to-hand-on` and `self-check-failed` both open "This station filed
 * something". Against a panel saying "filed no spec" that is not a repetition,
 * it is a contradiction, and a reader has no way to tell which is true.
 *
 * It is latent rather than live: the one `nothing-to-hand-on` track has a
 * member at its station, so the panel takes a different branch. Latent is worth
 * closing anyway, because what makes it unreachable today is a coincidence
 * about one row rather than anything in the code.
 *
 * -- THE RULE, KEYED ON THE REASON AND NEVER ON THE PROSE ------------------
 * These three hold lines already report what this station did or did not file.
 * Where one of them is showing, the panel's own sentence is not drawn: the hold
 * line says the same thing and more, because it also says whether it will try
 * again, which the panel cannot know.
 *
 * Read from the RAW `last_hold` value, which is a column. Matching on the
 * wording of the hold line is how every hold once painted amber, and it would
 * also break the moment S0 rewrites a sentence that is theirs to rewrite.
 *
 * Every other hold reason still draws both, because they are then two different
 * facts: "Plan ran and filed no spec" beside "Everything is paused for this
 * workspace" is a station and a cause, and a person needs both.
 */

/**
 * Hold reasons whose own line already reports what the station filed.
 *
 * `produced-nothing` says it filed nothing, which is the same claim the panel
 * makes. The other two say it filed SOMETHING, which is the opposite claim, and
 * they are here for that reason rather than despite it.
 */
const HOLD_REPORTS_THE_FILING: ReadonlySet<string> = new Set([
  "produced-nothing",
  "nothing-to-hand-on",
  "self-check-failed",
]);

/**
 * Whether the panel should say the station filed nothing, given the hold.
 *
 * True with no hold at all, which is the common case and the one where the
 * panel is the only thing that can speak.
 */
export function panelSaysItFiledNothing(holdReason: string | null | undefined): boolean {
  return !holdReason || !HOLD_REPORTS_THE_FILING.has(holdReason);
}
