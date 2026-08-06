/**
 * AN ANSWER THAT HAS NOT ARRIVED IS NOT THE ANSWER "NONE".
 *
 * SEEN ON PRODUCTION, 2026-08-06, on /discover. A workspace holding 97 signals,
 * 41 themes and 34 opportunities rendered the FIRST-RUN screen -- "No
 * opportunities found yet.", "Which source should it read first?", "Connect a
 * source" -- while the spine above it read "79 runs waiting on you" and the
 * right column listed five live sources with counts. It settles into the real
 * ranking a second later, so it is a flash; it is also the worst possible first
 * frame, because it tells a returning user their record is empty.
 *
 * WHY `isLoading` DOES NOT COVER IT. In react-query v5 `isLoading` is
 * `isPending && isFetching`. That is false in three states this product hits:
 *
 *   1. PENDING BUT NOT FETCHING -- a query paused with no network, or one that
 *      has not started. Pending, not loading, `data` undefined.
 *   2. THE INSTANT A FETCH RESOLVES, before dependent state catches up.
 *   3. RESOLVED SUCCESSFULLY WITH NOTHING -- a read that lands before the
 *      Supabase session is restored is scoped by RLS to nothing and resolves
 *      with `{ rows: [] }`. No error, so `isError` is false too.
 *
 * In all three the surface has NO answer and every `length === 0` branch below
 * it reads as "the workspace is empty".
 *
 * `isPending` asks the right question -- has an answer ever arrived -- rather
 * than "is a request in flight". The `data === undefined` clause is belt and
 * braces for case 3, where a query can be settled and still hold nothing worth
 * rendering a verdict on. Both must agree before a surface is willing to tell
 * someone they have nothing.
 *
 * WHY THIS IS SHARED. Eleven surfaces derived a `loading` flag from `isLoading`
 * and each of them owns a first-run or empty state. Six of those are the
 * stations themselves. Fixed in six places it drifts; fixed here it cannot.
 *
 * This is the same defect the repo has paid for repeatedly in other clothes: an
 * empty read treated as a fact about the world rather than as "not known yet".
 */

/** The shape this needs from a react-query result. Structural on purpose, so it
 *  works with useQuery, useSuspenseQuery and a hand-rolled stub in a test. */
export type AnswerableQuery = { isPending: boolean; data: unknown };

/**
 * True while ANY of the given queries has yet to produce an answer.
 *
 * Pass every query whose data the surface's empty state depends on. Passing
 * fewer is the bug this function exists to prevent: a headline that counts one
 * dataset while branching on another can still claim "none" the moment the
 * dataset it did NOT wait for is undefined.
 */
export function stillWaiting(...queries: AnswerableQuery[]): boolean {
  return queries.some((q) => q.isPending || q.data === undefined);
}
