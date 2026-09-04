/**
 * WHAT LEARN IS ACTUALLY WAITING FOR, IN ONE SENTENCE THAT DOES NOT CONTRADICT
 * THE ONE BESIDE IT.
 *
 * ── THE TWO SENTENCES THAT DISAGREED ──────────────────────────────────────
 * Served together on the shipped track, 2026-09-04:
 *
 *   the hold  "The forecast this work is graded against comes due on
 *              2026-09-09. Learn returns when it does; nothing here is
 *              waiting on a person."
 *   the spec  "None of the 2 success metrics on this spec have a source that
 *              could produce a number, so this release cannot be graded yet."
 *              ... with a Record a reading press beside each metric.
 *
 * One says nobody is waited on. The other says a person typing a number is the
 * only way this is ever graded. Both are on screen, and the first is the one
 * the run page shows: the Learn panel renders the decision's claim, its
 * observable and "Graded on Mon, Sep 21", and never the spec's sentence, which
 * lives one click away on the artifact.
 *
 * A person who reads the hold line does nothing, correctly by its own words,
 * and waits seventeen days for a station that would have had nothing to grade.
 *
 * ── SO THE HOLD LINE IS COMPOSED FROM THE SAME FACTS AS THE SENTENCE ──────
 * Both take `SourceState[]` from `what-would-measure-this.ts`. There is no
 * second rule about what counts as a source and no second vocabulary for
 * saying so, which is the only way two sentences on one screen stay agreed
 * once somebody edits one of them. The hold line was ALSO duplicated verbatim
 * at two call sites in `driver.server.ts` (:2440 and :3691), so "one composer"
 * is closing three copies rather than two.
 *
 * ── AND IT NEVER TELLS A PERSON NOTHING IS WAITED ON WHEN SOMETHING IS ────
 * The old line's second clause is true only when a source exists. Where none
 * does, the honest sentence names the date AND the gap, because the date alone
 * is what made the wait look like patience rather than a dead end.
 */

import { canProduceAReading, type SourceState } from "./what-would-measure-this";

/** The date, as the hold lines have always rendered it. */
function onDate(dueIso: string): string {
  return dueIso.slice(0, 10);
}

/**
 * The hold line for a track sitting at Learn.
 *
 * `states` is every STANDING clause's source state, in the spec's order. An
 * empty list means the spec promises no outcome, which is a different fact
 * from "the metrics have no source" and gets its own sentence rather than
 * being folded into the pessimistic one.
 */
export function whatLearnIsWaitingFor(
  dueIso: string,
  states: readonly SourceState[] | null,
): string {
  const due = onDate(dueIso);
  const head = `The forecast this work is graded against comes due on ${due}.`;

  /*
   * NULL IS "WE COULD NOT READ THE CONTRACT", AND IT SAYS ONLY THE DATE.
   *
   * The tempting fallback is the old sentence, since it is what stood here
   * before. It is also a CLAIM -- that nobody is waited on -- and a failed
   * read is not evidence for it. This is the same trap as an empty list
   * standing in for "no sources": the honest answer to "I could not tell" is
   * the half of the line we still know, and silence on the half we do not.
   */
  if (states === null) return head;

  if (states.length === 0) {
    /*
     * No standing metric at all. The forecast may still be gradable from its
     * own observable -- a decision carries `forecast_how_we_will_know`
     * independently of the spec's contract -- so this does NOT claim the
     * release cannot be graded. It says only what it knows.
     */
    return `${head} Learn returns when it does; nothing here is waiting on a person.`;
  }

  const measurable = states.filter(canProduceAReading).length;

  if (measurable === 0) {
    return (
      `${head} Nothing connected to this workspace can produce a number for ` +
      `${states.length === 1 ? "its success metric" : "any of its success metrics"}, so until a source is connected or a reading is recorded, Learn will have nothing to grade it with.`
    );
  }

  if (measurable === states.length) {
    return `${head} Learn returns when it does; nothing here is waiting on a person.`;
  }

  return (
    `${head} ${measurable} of ${states.length} success metrics can produce a number; ` +
    `the rest need a source connected or a reading recorded before Learn can grade them.`
  );
}

/**
 * Whether the person is the only route to a number.
 *
 * Exported separately because a caller that needs to DECIDE something -- draw
 * the press, keep the track out of an unattended sweep -- must not do it by
 * matching on the sentence above. A surface that greps prose is how the two
 * copies of the hold line drifted in the first place.
 */
export function onlyAPersonCanGradeThis(states: readonly SourceState[] | null): boolean {
  return states !== null && states.length > 0 && !states.some(canProduceAReading);
}
