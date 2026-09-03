/**
 * ── A DERIVED SPEC TITLE ENDS ON A WORD (P-57) ───────────────────────────
 *
 * `prd.draft` names a brief-path spec from the brief's first sentence, and it
 * cut that at 120 characters with `.slice(0, 120)`. A1 read the result on the
 * served Ask panel:
 *
 *     "Approve the design for Remove the redundant address re-confirmation step
 *      in Relay checkout to increase tablet checkout completion rate from 67 ?"
 *
 * The row is exactly 120 characters and ends in a trailing space, mid-number.
 * Two separate things are wrong and only one of them is the cut.
 *
 * **The limit was wrong.** `prds.title` and the insert both allow 280. The 120
 * came from `attachments` (`registry.server.ts:560`), a different column with a
 * different budget, and nothing here needed it.
 *
 * **And a cut with no marker is a lie about the sentence.** A title ending
 * "from 67" reads as a whole thought that happens to be odd, not as a fragment.
 * If the sentence genuinely runs past the limit the reader has to be told.
 *
 * Deterministic on purpose, and that constraint is not incidental: the comment
 * above the call insists on it, because a second model call to name a spec is a
 * cost the Define station's step budget has already proven it cannot spare.
 */

/** What `prds.title` and the insert actually allow. */
export const TITLE_MAX = 280;

/**
 * Cut on a word boundary at or under `max`, marking the cut when one happened.
 *
 * The ellipsis is INSIDE the budget, not appended past it, because a title that
 * overflows its column to say it was shortened has not been shortened.
 */
export function titleFromSentence(sentence: string, max = TITLE_MAX): string {
  const s = sentence.trim().replace(/\s+/g, " ");
  if (s.length <= max) return s;

  // One character of room for the marker.
  const room = max - 1;
  const cut = s.slice(0, room + 1);
  const lastSpace = cut.lastIndexOf(" ");

  /*
   * A single word longer than the budget has no boundary to fall back to, and
   * a hard cut is then the honest answer rather than an empty title. Falling
   * back to the whole-word rule would return "" and the caller would print
   * "Untitled spec" for a sentence that exists.
   */
  const body = lastSpace > 0 ? cut.slice(0, lastSpace) : s.slice(0, room);
  // Trailing punctuation before the marker reads as a typo ("word,…").
  return `${body.replace(/[\s,;:.!?-]+$/u, "")}…`;
}

/**
 * The first sentence of a brief, as a title.
 *
 * The split is the existing one, kept deliberately: changing what counts as a
 * sentence would change every title this has ever produced, and that is not
 * what this packet was asked to do.
 */
export function derivedSpecTitle(brief: string): string {
  const first = (brief.split(/[\n.!?]/)[0] ?? "").trim();
  return first ? titleFromSentence(first) : "Untitled spec";
}
