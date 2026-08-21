/**
 * A URL flag, parsed for whichever of four shapes actually arrives.
 *
 * WRITTEN BECAUSE THE OBVIOUS PARSER IS WRONG, and it was wrong in the tree for
 * long enough to be measured in a browser (2026-08-21, K-37). `?capture=1` was
 * parsed with `search.capture === "1"`, which reads correctly, matches the link
 * that generated it, and NEVER FIRES: TanStack Router runs each search value
 * through `JSON.parse` before a validator sees it, so `capture=1` arrives as the
 * NUMBER 1 and `capture=true` as the BOOLEAN true. A string comparison misses
 * both. `validateSearch` is a whitelist -- anything it does not return is
 * dropped from the URL -- so the param vanished and the landing it controlled
 * silently did nothing. That is the exact defect
 * `_authenticated.discover.tsx`'s own header was written about, reproduced by
 * the repair for it.
 *
 * NO UNIT TEST COULD HAVE CAUGHT IT WHERE IT LIVED, which is the other half of
 * the lesson: an inline `validateSearch` is only ever exercised by the router,
 * so the only instrument that reads it is a browser. Hence this function, which
 * a test can call.
 *
 * All four spellings are accepted deliberately. A generated link and a
 * hand-typed one should behave the same, and the router normalises whatever it
 * is given on the way back out, so a flag has to survive its own round trip.
 *
 * Returns `true` or `undefined`, never `false`: an absent flag and a flag set to
 * nothing are the same state, and `undefined` is the one that drops out of the
 * URL rather than sitting in it saying nothing.
 */
export function searchFlag(value: unknown): true | undefined {
  return value === true || value === 1 || value === "1" || value === "true" ? true : undefined;
}
