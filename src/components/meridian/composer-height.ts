/**
 * How tall the composer may grow before it scrolls.
 *
 * Its own module because Meridian splits non-component exports out (`use-elapsed.ts`,
 * `graph-slider.tsx`), and because a pure function of the type scale is worth testing
 * without mounting anything.
 */

/**
 * The ceiling, in lines.
 *
 * Three, because one line is the common case, two is a normal sentence with a
 * clause, and past three the field stops being a composer and starts being a
 * document -- at which point growing further only pushes the rest of the page
 * off the screen.
 */
export const COMPOSER_MAX_LINES = 3;

/**
 * That ceiling in pixels, DERIVED rather than measured once and pasted in.
 *
 * The build this was promoted from carried a bare `112`, which is correct for
 * today's type scale and silently wrong the moment `--mrd-prose` or
 * `--mrd-lh-prose` moves. Reading the line height off the element means the
 * ceiling follows the scale instead of drifting away from it -- the same reason
 * Meridian has a scale at all.
 *
 * FALLS BACK TO THE ELEMENT'S OWN HEIGHT when the computed values cannot be
 * read, which is what happens anywhere there is no layout. **A ceiling that
 * cannot be computed must never become zero**: that would collapse the field to
 * nothing, which is far worse than letting it grow one line too far.
 */
export function composerMaxHeight(el: HTMLTextAreaElement, lines = COMPOSER_MAX_LINES): number {
  const cs = typeof getComputedStyle === "function" ? getComputedStyle(el) : null;
  const lh = cs ? Number.parseFloat(cs.lineHeight) : Number.NaN;
  if (!Number.isFinite(lh) || lh <= 0) return el.scrollHeight;
  const top = cs ? Number.parseFloat(cs.paddingTop || "0") : 0;
  const bottom = cs ? Number.parseFloat(cs.paddingBottom || "0") : 0;
  const padding = (Number.isFinite(top) ? top : 0) + (Number.isFinite(bottom) ? bottom : 0);
  return Math.round(lh * lines + padding);
}
