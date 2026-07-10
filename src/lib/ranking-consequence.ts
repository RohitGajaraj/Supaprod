/**
 * The shared consequence comparator (PC-32): the one hierarchy every surface's
 * page-level lists sort by, so "what's on top" means the same thing everywhere
 * -- needs-human-now, then a closing window, then stakes, then recency.
 *
 * Pure and deterministic: no React, no side effects, same order on server or
 * client. Domain-specific rankings (e.g. the opportunity comparator in
 * `src/components/discover/ranking.ts`) stay domain-specific; this is for
 * surfaces whose items don't share a domain shape (goals, loops, missions,
 * decisions) but still need one consistent "most consequential first" order.
 */

export interface ConsequenceInputs {
  /** An open approval/gate blocks on this item right now. */
  needsHumanNow: boolean;
  /** An outcome window or expiry this item is racing, if any. */
  windowClosesAt: string | null;
  /** A normalized stakes signal (ICE band, spend, blast radius). Higher = higher stakes. */
  stakes: number;
  /** Fallback timestamp once every other tier ties. */
  recencyAt: string;
}

// A sentinel later than any real timestamp, so "no window" sorts last -- but
// finite, so two absent windows subtract to 0 rather than `Infinity - Infinity`
// (NaN), which would violate the comparator contract `Array.sort` relies on.
const NO_WINDOW = Number.MAX_SAFE_INTEGER;

function timeOf(iso: string | null): number {
  if (!iso) return NO_WINDOW;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NO_WINDOW : t;
}

/**
 * Returns a negative number when `a` should sort before `b`. Tie-break chain:
 *   1. needs-human-now   (true first)
 *   2. window-closing    (soonest close first; no window sorts last)
 *   3. stakes            (higher first)
 *   4. recency           (most recent first)
 */
export function compareByConsequence(a: ConsequenceInputs, b: ConsequenceInputs): number {
  if (a.needsHumanNow !== b.needsHumanNow) return a.needsHumanNow ? -1 : 1;

  const byWindow = timeOf(a.windowClosesAt) - timeOf(b.windowClosesAt);
  if (byWindow !== 0) return byWindow;

  const byStakes = b.stakes - a.stakes;
  if (byStakes !== 0) return byStakes;

  return timeOf(b.recencyAt) - timeOf(a.recencyAt);
}

/** Sorts a copy of `items` by consequence; `toInputs` maps a domain item to the shared shape. */
export function sortByConsequence<T>(items: T[], toInputs: (item: T) => ConsequenceInputs): T[] {
  return [...items].sort((a, b) => compareByConsequence(toInputs(a), toInputs(b)));
}
