/**
 * ── A RUN'S TITLE INSIDE A SENTENCE IS QUOTED AND BOUNDED ─────────────────
 *
 * Run titles are written by agents and run past a hundred characters --
 * *"Spec: Homeowners cannot distinguish between scheduled firmware reboots and
 * unplanned production outages due to identical UI"*. One of those dropped
 * unquoted into a sentence reads as the product's own prose rather than as the
 * name of a thing.
 *
 * ── AND THE WORSE CASE IS A TITLE THAT ENDS IN A VERB ─────────────────────
 * Read on the served home, 2026-09-10, from a line that did not use this:
 *
 *   Warn a homeowner before an installer visit is cancelled reached Build.
 *
 * The title is itself a sentence, so a reader parses *"…is cancelled reached
 * Build"* and stumbles. Quotation marks are not decoration here; they are the
 * only thing telling a reader where the name ends and the claim begins.
 *
 * ── SHARED, BECAUSE IT WAS PRIVATE TO `Hero` AND A SECOND CALLER APPEARED ─
 * `Hero.tsx` has held this rule since 2026-09-08 as a local helper. The moment
 * a second surface needed it the choice was to copy it or to move it, and a
 * copied rule is one that drifts on the day somebody tunes the length.
 *
 * It is a `.ts` module rather than an export from the component for the same
 * reason `forecast-words.ts` is: a component file that also exports constants
 * breaks Fast Refresh for every component in it, and the lint rule saying so is
 * right.
 */

/**
 * Past this, a title is cut with an ellipsis.
 *
 * 72 is `Hero`'s own number and it is kept exactly, because changing it here
 * would silently re-wrap a line that has been reviewed on a screen.
 */
export const TITLE_IN_SENTENCE_MAX = 72;

/** A run's title, safe to drop into the middle of a sentence. */
export function quotedTitle(title: string): string {
  const t =
    title.length <= TITLE_IN_SENTENCE_MAX
      ? title
      : `${title.slice(0, TITLE_IN_SENTENCE_MAX).trimEnd()}...`;
  return `"${t}"`;
}
