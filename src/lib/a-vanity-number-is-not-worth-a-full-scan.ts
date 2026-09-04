/**
 * P-135: the waitlist count is a social-proof number, and it was costing a
 * full scan on the critical path of every anonymous page view.
 *
 * MEASURED 2026-09-04, fourteen live reads of "/": `landing-data` was 100% of
 * `worker-total` on every single one -- 271-285ms warm, 484-572ms cold. The
 * whole of the Worker's warm time was one `count: exact` on
 * `waitlist_signups`, which Postgres answers by scanning the table, repeated
 * in full for every visitor, to render a number that is deliberately floored
 * and rounded before anyone sees it.
 *
 * So the reading is cached in the isolate rather than re-derived. Two rules
 * make the cache honest, and both come from what the count is FOR:
 *
 * 1. Only a successful read is cached. Caching a failure would take one blip
 *    and hide the social-proof nudge for the whole TTL, turning a momentary
 *    census failure into a five-minute one.
 *
 * 2. On a failed read we serve the last good value if we have one, and null
 *    only if we never had one. Today a blip always hides the nudge; this is
 *    strictly better, and it keeps `getWaitlistCount`'s existing contract that
 *    a failure is null rather than 0 -- a failed census must never publish
 *    itself as a real "0 in line".
 *
 * The TTL is per-isolate, not global, so a deploy is never pinned: a new
 * isolate starts with an empty cache and reads fresh. Staleness is bounded by
 * TTL and the number is floored before display, so a five-minute-old count is
 * not distinguishable from a live one at the surface that renders it.
 */
export const WAITLIST_COUNT_TTL_MS = 5 * 60 * 1000;

export type CountReading = { readonly value: number; readonly at: number };

/**
 * Fresh means "read within the TTL". Exported because the decision to re-read
 * is the whole behaviour worth testing, and a boundary that is wrong by one
 * millisecond in the wrong direction re-reads on every request.
 */
export function isFresh(
  reading: CountReading | undefined,
  now: number,
  ttlMs: number = WAITLIST_COUNT_TTL_MS,
): reading is CountReading {
  if (!reading) return false;
  const age = now - reading.at;
  // A negative age means the clock moved backwards between the write and this
  // read. Treat it as stale rather than as infinitely fresh: re-reading costs
  // one query, trusting it could pin a number until the isolate dies.
  if (age < 0) return false;
  return age < ttlMs;
}

/**
 * What to serve, and what to remember, after an attempted read. Kept pure and
 * separate from the query so the stale-on-error rule is testable without a
 * database: it is the rule that decides whether a census blip is visible to a
 * visitor, and it should not be provable only by breaking Supabase.
 */
export function resolveReading(
  prior: CountReading | undefined,
  fetched: number | null,
  now: number,
): { readonly served: number | null; readonly remember: CountReading | undefined } {
  if (fetched === null) {
    // Stale-on-error: the last good number beats no number, and beats zero.
    return { served: prior?.value ?? null, remember: prior };
  }
  const remember = { value: fetched, at: now } as const;
  return { served: fetched, remember };
}
