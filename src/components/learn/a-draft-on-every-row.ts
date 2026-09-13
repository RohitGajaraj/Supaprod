/**
 * NINE ROWS, ONE VALUE, ON THE SURFACE WHOSE JOB IS PROVING THE PRODUCT WORKED.
 *
 * ── WHAT `/outcomes` DREW, READ SIGNED IN ON 2026-09-10 ───────────────────
 *
 *   Forecasts due (9)
 *   What you expected, now that the date you set has passed.
 *
 *   Per-user precision scoring cuts false blocks sharply ...
 *     ... due 23 days ago · draft: the evidence did not settle it
 *   Two passes ship faster in total than one ...
 *     ... due 23 days ago · draft: the evidence did not settle it
 *   Crypto wallet parity is a feature nobody churns over ...
 *     ... due 12 days ago · draft: the evidence did not settle it
 *   ... six more, all ending in the same eight words.
 *
 * Nine rows, one string, byte-identical, in the last position the eye reads on
 * every line. Found independently by Lane 1 on the same morning, which is the
 * second reason it is here rather than in a comment: two people walked this
 * page and both stopped on the same line.
 *
 * ── THE RULE, AND IT IS ALREADY THIS REPO'S ───────────────────────────────
 * Print it when it DISCRIMINATES, computed over the rendered set. Sixteen
 * agent cards ending "Runs on its own", forty audit rows printing the word
 * "agent", twelve trace rows leading "Critique": the same defect, fixed the
 * same way, three times already.
 *
 * ── AND THE HALF THAT IS DIFFERENT HERE ───────────────────────────────────
 * On the agent roster the constant LEAVES, because the heading above it
 * already said the same thing. Here nothing else on the page says it, so it
 * cannot leave: it MOVES UP, said once in the region's own sub, where nine
 * repetitions become one sentence with a number in it. Deleting it outright
 * would lose the fact that an agent has already looked at all nine and
 * declined to call any of them, which is the single most useful thing the
 * desk knows.
 *
 * ── WHAT IT REFUSES TO FIRE ON ───────────────────────────────────────────
 * A set where the drafts DIFFER, and a set where some rows have a draft and
 * others do not. In both cases the value on the row is the fastest way to see
 * which is which, which is exactly when it must stay. One row is never a
 * repetition of anything.
 */

import { theValueEveryRowShares } from "@/lib/a-value-on-every-row";

/**
 * The verdict every row shares, or null when the column discriminates.
 *
 * Takes the drafted verdict per row in render order, `null` for a row with no
 * draft. A single row, an empty set, a set with any gap, or a set with two
 * different verdicts all return null and the rows keep their own value.
 *
 * The comparison itself is `theValueEveryRowShares`, which is the eleventh
 * time this repo has written it and the first time it has been written once.
 * What to DO about a constant is never general and stays here.
 */
export function theDraftEveryRowShares(drafts: readonly (string | null)[]): string | null {
  return theValueEveryRowShares(drafts);
}

/**
 * The sentence that carries the nine repetitions, said once.
 *
 * It names the COUNT, because "an agent drafted this verdict" and "an agent
 * drafted this verdict on every one of the nine" are different facts and the
 * second is the one that tells a reader the desk has been looked at already.
 *
 * Reported speech, not a verdict. The desk's whole contract is that a drafted
 * verdict is a draft until a person settles it, and the three buttons below
 * are how they disagree.
 */
export function everyDraftSays(count: number, says: string): string {
  return `An agent has drafted the same verdict on all ${count}: ${says}. None is settled until you say so.`;
}
