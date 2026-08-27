/**
 * A SENTENCE THE RECORD HOLDS TWICE IS STILL SHOWN ONCE.
 *
 * ── WHAT IS ON SCREEN ─────────────────────────────────────────────────────
 * The run screen's artifact pane renders a mission's goal, and on `6199f3df`
 * that goal is:
 *
 *   "The saved address dropdown shows deleted addresses after a customer
 *    removes one. The saved address dropdown shows deleted addresses after a
 *    customer removes one"
 *
 * The same sentence, twice, on the screen the product is judged by.
 *
 * ── WHY THIS IS A RENDER FIX AND NOT A BRIDGE OVER A LIVE DEFECT ──────────
 * The write path is already correct. `driver.server.ts` composed the goal as
 * `${title}. ${origin}`, which doubles whenever a track's origin IS its title,
 * and S0 fixed that at the source through `trackGoalSentence` after I found the
 * same duplication in the run header. So nothing new can be written this way.
 *
 * What remains is two historical rows, measured: 2 of 397 missions carrying a
 * goal repeat themselves. S0 decided against a backfill and I agree with the
 * reasoning -- it is cosmetic, and the write path is what decides whether the
 * number grows. But "cosmetic" is not "invisible": one of the two is on the
 * most-opened track in the database, and a person reading it has no way to know
 * they are looking at a fixed bug's leftovers rather than at a product that
 * repeats itself.
 *
 * This is therefore the narrow case where rendering may correct the record: the
 * source is fixed, the population is closed, and every one of them is a screen
 * somebody can still open.
 *
 * ── DELIBERATELY NARROW ───────────────────────────────────────────────────
 * It removes a whole repeated tail and nothing else. It does not summarise, it
 * does not de-duplicate paragraphs, and it does not touch text that merely
 * repeats a phrase -- a goal that legitimately says the same noun twice reads
 * exactly as it was written. If the two halves differ by so much as a word, both
 * are shown, because at that point they are not a duplicate and the difference
 * may be the point.
 */

/**
 * The text with an exactly-repeated tail removed, or the text unchanged.
 *
 * Matches the two shapes the composition bug produced: "X. X" and "X. X." --
 * the second half is the same sentence with or without its full stop, because
 * the join added one the origin did not have.
 */
export function saidOnce(text: string | null | undefined): string | null {
  if (typeof text !== "string") return null;
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return null;

  // Split on the first sentence end that has more text after it.
  const m = /^(.+?[.!?])\s+(.+)$/.exec(t);
  if (!m) return t;

  const first = m[1];
  const rest = m[2];
  const bare = first.replace(/[.!?]+$/, "");

  // Only an exact repeat, case-insensitively, with or without the terminator.
  const restBare = rest.replace(/[.!?]+$/, "");
  if (restBare.toLowerCase() === bare.toLowerCase()) return first;

  return t;
}
