/**
 * SEVEN STATIONS SHARE THE ROW. THEY DO NOT QUEUE UP AND WALK OFF THE EDGE.
 *
 * ── MEASURED ON THE SHIPPED TRACK'S RUN SCREEN, 2026-09-04 ───────────────
 * All seven cells were in the DOM -- Discover through Ship "Released" and Learn
 * "Running" -- and at a 1512px viewport the last three sat at x 1450, 1622 and
 * 1794. Past the pane's edge, overflow visible, no wrap. A person looking at
 * the first successful end-to-end run could not see that it had ended.
 *
 * ── WHY THE PREVIOUS FIX DID NOT HOLD ────────────────────────────────────
 * G3 (2026-08-25) gave each stop a fixed 168px and put `overflow-x-auto` on the
 * list, so the spine scrolled inside its own container. That is a real answer to
 * "the page must never scroll sideways", and it depends on every ancestor
 * actually clipping. One that does not, and the fixed cells simply keep going --
 * which is what the founder photographed on 09-02 for the old strip and what
 * A1 measured again on 09-04 for this one. The same shape twice is a sign the
 * mechanism is wrong rather than the value.
 *
 * ── SO THE ARITY BECOMES THE LAYOUT ──────────────────────────────────────
 * A route has seven stations. Not "up to seven", not "as many as fit": seven,
 * fixed by `AGENT_STATION_ORDER`, every time. A row of seven equal columns
 * cannot overflow, because the columns are defined as shares of whatever width
 * there is. Nothing to clip, nothing to scroll, and no ancestor has to
 * cooperate.
 *
 * Below the width where a share stops being readable, the row WRAPS -- four
 * and three -- rather than shrinking to illegibility or reintroducing a
 * scrollbar. `auto-fit` does that with no breakpoint and no measurement.
 *
 * This file holds the arithmetic so it can be checked at real widths without a
 * browser, and the component holds the same numbers once.
 */

/** The narrowest a stop may be and still read. Below it, the row wraps. */
export const MIN_STOP_PX = 112;

/** The gap between stops, in px. Matches `gap-1` in the component. */
export const STOP_GAP_PX = 4;

/** Every route has exactly this many stations. */
export const ROUTE_STATIONS = 7;

/**
 * How many columns a CSS `repeat(auto-fit, minmax(MIN, 1fr))` row yields.
 *
 * Mirrors the browser's own rule: as many columns of at least `MIN` as fit,
 * capped at the number of items, and never fewer than one -- a single column
 * narrower than the minimum is what a browser does rather than clip, and it is
 * what this must do too.
 */
export function columnsAt(widthPx: number, items = ROUTE_STATIONS): number {
  if (items <= 0) return 0;
  const fits = Math.floor((widthPx + STOP_GAP_PX) / (MIN_STOP_PX + STOP_GAP_PX));
  return Math.max(1, Math.min(items, fits));
}

/** How many rows the route occupies at this width. */
export function rowsAt(widthPx: number, items = ROUTE_STATIONS): number {
  return Math.ceil(items / columnsAt(widthPx, items));
}

/**
 * Does the route fit without anything leaving the box?
 *
 * TRUE AT EVERY WIDTH, and that is the assertion rather than a tautology: it is
 * false for the geometry this replaced, where seven fixed cells needed 1176px
 * and got whatever the pane had.
 */
export function overflowsAt(widthPx: number, items = ROUTE_STATIONS): boolean {
  const cols = columnsAt(widthPx, items);
  /* One column below the minimum is the browser shrinking the share, not the
     content escaping: a `minmax(0, 1fr)` track can go under its floor and its
     contents truncate. The row still ends where the box ends. */
  if (cols === 1) return false;
  return cols * MIN_STOP_PX + (cols - 1) * STOP_GAP_PX > widthPx;
}

/** The grid template the component uses. One definition, checked below. */
export const ROUTE_GRID_TEMPLATE = `repeat(auto-fit,minmax(${MIN_STOP_PX}px,1fr))`;
