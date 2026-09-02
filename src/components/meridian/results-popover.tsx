/**
 * A RESULTS PANEL THAT IS AS WIDE AS ITS CONTENT NEEDS, NOT AS WIDE AS ITS FIELD.
 *
 * ── THE DEFECT THIS EXISTS FOR ────────────────────────────────────────────
 * `FindAnything` sits in the rail. Its results panel was `absolute left-0
 * right-0`, so it inherited the rail's 204px and every result truncated at
 * three or four words. Walked on `supaprod.ai` 2026-09-03, searching *address*:
 *
 *   Let returning custom…      Running
 *   Homeowners aband…          Abandoned
 *   The saved address …        Running
 *   Checkout asks a ho…        Running
 *   Homeowners aband…          (cut off by the panel's own max-height)
 *
 * Two of those rows are the same four words. The search had found the right
 * things and the surface could not show which was which -- and the row a person
 * needed was the one the ellipsis ate.
 *
 * ── WHY A POPOVER AND NOT A `Search` VARIANT ──────────────────────────────
 * The packet offered "a results variant on Meridian `Search`". `Search` is an
 * INLINE field that narrows a client-side list it is handed; this is an async,
 * grouped, floating listbox over the whole workspace. Bolting the second onto
 * the first would put two components in one file that share a name and nothing
 * else. What is genuinely shared, and what was missing from Meridian, is the
 * FLOATING PANEL: a box anchored to a control that must be wider than the
 * control, and must not be clipped by whatever narrow thing it lives in.
 *
 * ── IT ESCAPES ITS CONTAINER, AND THAT IS THE WHOLE JOB ───────────────────
 * `left-0` with a `min-width` wider than the anchor, so the panel starts at the
 * field's left edge and grows RIGHT, over the content column. This works
 * because `.sp-rail` and `.sp-railhead` set no `overflow`, which was checked
 * before relying on it rather than assumed: an `overflow: hidden` anywhere in
 * the chain would clip this back to the rail and reintroduce the defect
 * silently.
 *
 * The width is a floor and a ceiling, not a fixed number. `min-w` guarantees
 * the titles have room; `max-w` keeps the panel inside the window on a narrow
 * screen, where a fixed 480px would push a scrollbar onto the page.
 */
import type { ReactNode } from "react";

/**
 * The floor, in pixels. Below this a run title truncates again, which is the
 * defect. Measured against the live titles this searches: *"What we expected did
 * not happen: Decline shipping of 'Improve onboarding flow…'"* wraps to two
 * readable lines at this width and to five at the rail's.
 */
export const RESULTS_MIN_WIDTH = 480;

export function ResultsPopover({
  children,
  label,
  id,
}: {
  children: ReactNode;
  /** What this list is, for a reader who arrives on it by keyboard. */
  label: string;
  /** So the field can point `aria-controls` and `aria-activedescendant` at it. */
  id?: string;
}) {
  return (
    <div
      id={id}
      role="listbox"
      aria-label={label}
      className="absolute left-0 top-[calc(100%+6px)] z-[var(--shell-z-menu)] flex max-h-[min(460px,calc(100vh-160px))] flex-col gap-mrd-1 overflow-y-auto overscroll-contain rounded-mrd-card border border-mrd-line bg-mrd-float p-mrd-2 shadow-mrd-float"
      style={{
        minWidth: `${RESULTS_MIN_WIDTH}px`,
        /* Never past the window. `100vw` minus the rail and a margin on both
           sides; `min()` with the floor means a window narrower than the floor
           gets the window rather than a horizontal scrollbar. */
        maxWidth: `max(${RESULTS_MIN_WIDTH}px, calc(100vw - var(--shell-rail-w) - 3rem))`,
      }}
    >
      {children}
    </div>
  );
}

export default ResultsPopover;
