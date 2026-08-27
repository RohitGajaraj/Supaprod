/**
 * HOW OFTEN A LIVE READ ASKS AGAIN, IN ONE PLACE.
 *
 * ── THREE CONCERNS THAT WERE SOLVED SEPARATELY AND NEVER TOGETHER ──────────
 * Counted across `src/` on 2026-08-27, this product had forty-odd polling
 * queries and three different partial answers to the same question:
 *
 *   pause when nobody is looking   `livePoll` (AppFrame) and `pollWhenVisible`
 *                                  (LivePulse) both check `visibilityState`;
 *                                  a dozen other call sites instead set
 *                                  `refetchIntervalInBackground: false`.
 *   slow down when idle            only `livePoll`, 4s working / 20s idle.
 *   BACK OFF WHEN IT IS FAILING    nowhere, until the station strip.
 *
 * The third is the one that costs. In TanStack Query the interval and `retry`
 * are independent: `retry` bounds the attempts inside ONE fetch, while the
 * interval keeps scheduling NEW fetches whatever state the query is in. A bare
 * `refetchInterval` is therefore an unbounded retry loop against a backend that
 * is not answering, and it is hardest exactly when that backend is least able
 * to serve it.
 *
 * ── WHY THIS COMPOSES RATHER THAN REPLACES ────────────────────────────────
 * The two existing helpers are not wrong, they are incomplete, and each was
 * right about the concern it named. This takes all three so a call site states
 * its cadence once and gets the other two for free:
 *
 *     refetchInterval: (q) => pollMs(15_000, q.state.fetchFailureCount)
 *
 * ── IT BACKS OFF, IT NEVER STOPS ──────────────────────────────────────────
 * Returning a permanent `false` on error is the easy fix and the wrong one. A
 * surface whose live read gives up stays wrong until the person navigates, so a
 * backend that came back would go unnoticed. One success resets
 * `fetchFailureCount` to zero and the cadence returns immediately, rather than
 * walking back down the ramp. The cap is what stops doubling drifting into
 * hours on a long outage.
 *
 * `false` is returned for ONE reason only, and it is not failure: the tab is
 * hidden, so there is nobody to show an answer to.
 */

/** Doubling stops here. Two minutes still notices a recovery promptly. */
const MAX_POLL_MS = 120_000;

/** Beyond this many failures the interval is pinned at the cap. */
const MAX_DOUBLINGS = 4;

/** Server-side, and in a hidden tab, there is nobody to show an answer to. */
function nobodyIsLooking(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/**
 * The interval for a live read, or `false` while the tab is hidden.
 *
 * @param baseMs   the cadence when answers are arriving. The caller owns this:
 *                 it is a statement about how fast the underlying fact moves,
 *                 which only the caller knows.
 * @param failures `query.state.fetchFailureCount`. Zero whenever the last read
 *                 succeeded, so recovery is immediate.
 */
export function pollMs(baseMs: number, failures: number): number | false {
  if (nobodyIsLooking()) return false;
  if (failures <= 0) return baseMs;
  return Math.min(MAX_POLL_MS, baseMs * 2 ** Math.min(failures, MAX_DOUBLINGS));
}
