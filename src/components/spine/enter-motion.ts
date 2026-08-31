/**
 * THE MOTION SWITCH WORKS EVERYWHERE EXCEPT THE SCREEN IT MATTERS ON.
 *
 * ── WHAT WAS SHIPPING ──────────────────────────────────────────────────────
 * `use-motion-preference.ts` gives a person an in-product motion toggle that
 * writes `html[data-motion="off"]`, and its own header says the product "already
 * obeyed" it. The product obeys it in CSS, and CSS can only reach what CSS
 * selects: `styles.css` gates exactly five things on that attribute, the lift
 * press, the sketch draw, the sketch dot, the agent-live pulse and the AI pulse
 * text.
 *
 * Every animation on the run screen is an INLINE STYLE, and an inline style is
 * not reachable by any of them. There is a blanket rule for the OS preference,
 * `styles.css:452`, and it works precisely because it carries `!important`:
 *
 *     @media (prefers-reduced-motion: reduce) {
 *       *, *::before, *::after { animation-duration: 0.001ms !important; ... }
 *     }
 *
 * There is NO equivalent blanket for `html[data-motion="off"]`. So the OS
 * preference stopped the run screen and the product's own switch did not.
 *
 * ── WHY THAT IS THE WORST PLACE FOR IT TO FAIL ─────────────────────────────
 * The person who turns motion off in Settings is told it is off. What they then
 * watch is the transcript animating every arriving entry, the Discover pane
 * animating every pattern and every finding that joins one, and the character
 * mark running `mrd-attention ... infinite` in four of its states, which never
 * stops at all. R-19 says accessibility is not deferred, and a switch that
 * reports success and changes nothing is worse than no switch: it spends the
 * person's trust and their only route back is an operating-system preference,
 * which is exactly what the toggle was built to save them.
 *
 * ── GATED AT THE SOURCE, NOT NEUTERED AFTERWARDS ───────────────────────────
 * The fix is not another `!important` blanket. A blanket still runs the
 * animation and then squashes its duration, and it would silently catch motion
 * nobody has thought about. These callers simply do not ask for motion when
 * motion is not wanted, which is legible in the component that decides it.
 *
 * `usePrefersReducedMotion` is REUSED rather than rewritten: it already watches
 * the media query and the attribute together, with a MutationObserver so the
 * toggle takes effect without a reload. It lives in
 * `components/knowledge/graph-visual.ts`, which is the wrong home for a general
 * motion reader; it belongs beside `use-motion-preference` in `src/hooks/`.
 * Moving it is a separate change because four surfaces import it from there.
 */

import type { CSSProperties } from "react";

/**
 * The run screen's one arrival animation.
 *
 * It was this exact string written out seven times across three files. A
 * duplicated literal is how two of them drift apart and nobody notices, and the
 * transcript and the Discover pane are supposed to feel like one surface.
 */
export const ENTER_MOTION = "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both";

/**
 * The style for something arriving, or nothing at all.
 *
 * `undefined` rather than an empty object so the element carries no `style` it
 * did not need, and so a caller cannot accidentally spread a falsy animation
 * over one it meant to keep.
 *
 * @param arriving whether this thing is new on screen this render
 * @param reduced  what `usePrefersReducedMotion()` says right now
 */
export function enterMotion(arriving: boolean, reduced: boolean): CSSProperties | undefined {
  if (!arriving || reduced) return undefined;
  return { animation: ENTER_MOTION };
}
