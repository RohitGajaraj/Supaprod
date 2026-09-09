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

/**
 * The shape this needs from a react-query result. Structural on purpose, so it
 * works with useQuery, useSuspenseQuery and a hand-rolled stub in a test.
 *
 * `isError` IS OPTIONAL, AND ITS ABSENCE USED TO MAKE THE RIGHT ANSWER
 * UNREPRESENTABLE. Without it the type cannot tell "the read FAILED" from "the
 * answer has not arrived": both are `isPending: false, data: undefined`. That is
 * not a missing convenience, it is the reason every call site had to reach around
 * this helper — and two of them did not, and hung.
 *
 * Optional rather than required so the hand-rolled stubs below and in
 * `an-empty-read-is-not-an-empty-workspace.test.ts` keep compiling and keep
 * meaning what they meant: an omitted `isError` is falsy, so every existing
 * assertion in that file returns exactly what it returned before.
 */
export type AnswerableQuery = {
  isPending: boolean;
  data: unknown;
  isError?: boolean;
  /**
   * `fetchStatus` FROM REACT-QUERY, AND WITHOUT IT A DISABLED QUERY HANGS FOREVER.
   *
   * A query with `enabled: false` is `isPending: true, isError: false, data:
   * undefined` for the whole life of the component. That is case 1 in the
   * docblock above, and it satisfies every clause of `stillWaiting`, so a
   * surface built on this helper waits on an answer that is never coming.
   *
   * Measured on production 2026-08-14: Today's three reads are all
   * `enabled: Boolean(workspaceId)`, and `activeWorkspaceId` resolves to null
   * for a user who belongs to zero workspaces. `needsOnboarding` keys on
   * `profiles.onboarded` rather than on membership, and returns false on a read
   * error, so that user reaches Today and sits in front of three permanent
   * spinners with no error text and no retry.
   *
   * react-query separates the two questions: `isPending` is "has an answer ever
   * arrived", `fetchStatus` is "is one on its way". Only `'idle'` while pending
   * means nobody is coming. Optional, so every existing caller and every
   * hand-rolled stub keeps meaning exactly what it meant.
   */
  fetchStatus?: "fetching" | "paused" | "idle";
  /**
   * ── `isError` IS NOT THE DISCRIMINATOR ON A POLLING READ ──────────────────
   *
   * A query with a `refetchInterval` spends its retries again on every tick.
   * So a read that fails on EVERY attempt does not settle into error and stay
   * there: it settles, then the next tick puts it back to `isPending: true,
   * fetchStatus: "fetching", data: undefined`, which is byte-for-byte the state
   * of a read that has simply not answered yet. Every clause above is satisfied
   * and the surface waits again, forever, one tick at a time.
   *
   * MEASURED ON THE SERVED ENTRY, 2026-09-10. `listRunsForStart` polls at 10s.
   * With it failing, the home's headline gate never opened and the page held
   * *"Reading your workspace. Still reading."* for a read that was never going
   * to answer -- with a Try again that re-ran the same failure. `Hero` has
   * taken a `failed` flag all along and never got the chance to use it.
   *
   * `failureCount` is the one field that REMEMBERS an attempt has already come
   * back empty-handed, and it resets to 0 on success, which is exactly the
   * question a surface needs answered. Optional, so every existing caller and
   * every hand-rolled stub keeps meaning what it meant.
   *
   * THIS ADDS NO NEW HAZARD, and the hazard is real enough to say so. The
   * docblock on `stillWaiting` warns that ending a wait on failure renders the
   * EMPTY state, which is only safe where an error arm is reachable. That is
   * already true of `isError` here; this clause only makes a POLLING read
   * behave the way a one-shot read has behaved since 2026-08-11, rather than
   * escaping the rule by never settling.
   */
  failureCount?: number;
};

/**
 * True while ANY of the given queries has yet to produce an answer.
 *
 * Pass every query whose data the surface's empty state depends on. Passing
 * fewer is the bug this function exists to prevent: a headline that counts one
 * dataset while branching on another can still claim "none" the moment the
 * dataset it did NOT wait for is undefined.
 *
 * AN ERROR IS AN ANSWER, and until 2026-08-11 this function disagreed.
 *
 * react-query v5 settles a query that fails with NO cached data into
 * `status: 'error'` — so `isPending` goes false while `data` STAYS undefined.
 * The old body was `isPending || data === undefined`, which therefore returned
 * true FOREVER after a cold failure. Every call site that asked this before its
 * error arm rendered a permanent skeleton, its `<Failed>` sentence and retry
 * became unreachable dead code, and any `refetchInterval` on the query kept
 * failing silently behind the spinner. Two surfaces hit it independently
 * (`build.index.tsx`, `HeldClaims.tsx`), and `ship.tsx` had already worked around
 * it locally at its `docReading` line — three encounters with one defect, which
 * is what a wrong SHAPE looks like from the outside. A workaround repeated at
 * every call site is a defect that has learned to look like a convention.
 *
 * WHY THIS IS NOT SIMPLY "RETURN FALSE ON ERROR AND MOVE ON". The change is only
 * safe where an error arm is reachable. At a surface shaped
 * `waiting → empty → content`, making the wait end on failure renders the EMPTY
 * state — telling a user with data that they have none, which is the exact
 * production defect at the top of this file. So this landed with every call site
 * audited for a reachable error arm, not on the strength of the helper alone.
 *
 * The local `&& !q.isError` guards that predate this (ship.tsx, plan.index.tsx)
 * are now redundant. They are also still correct, and left in place deliberately:
 * removing them is a separate, wider edit than the one that fixes the defect.
 */
export function stillWaiting(...queries: AnswerableQuery[]): boolean {
  return queries.some(
    (q) => !hasFailed(q) && !isNeverComing(q) && (q.isPending || q.data === undefined),
  );
}

/**
 * The read has come back empty-handed at least once since its last success.
 *
 * `isError` alone was the test until 2026-09-10 and it is right for a one-shot
 * read. On a POLLING read it keeps settling back, because the next tick spends
 * the retries again -- so a read failing on every attempt reports `isError:
 * false` for most of its life while never once producing an answer. See
 * `failureCount` above for where that was measured.
 */
function hasFailed(q: AnswerableQuery): boolean {
  return q.isError === true || (q.failureCount ?? 0) > 0;
}

/**
 * A query that is switched off, and will therefore never answer.
 *
 * `enabled: false` in react-query v5 leaves a query pending and idle forever. It
 * is not slow, it is not failing, and it is not going to arrive: the surface
 * asked for nothing. Treating that as "still waiting" is what turns a missing
 * precondition into a spinner nobody can escape.
 *
 * DELIBERATELY NARROW, and the narrowness is the safety. `paused` (offline, will
 * retry) and `fetching` are both genuinely coming, so only `idle` counts. And a
 * query that has ALREADY answered goes idle too, which is why `isPending` has to
 * be true as well: without that clause this would report every settled query as
 * never-coming and end the wait one render early, which is the original defect
 * at the top of this file in reverse.
 */
function isNeverComing(q: AnswerableQuery): boolean {
  return q.isPending === true && q.fetchStatus === "idle";
}

/**
 * The state a disabled query actually means: the surface is missing something it
 * needs before it can ask anything at all.
 *
 * Exported because ending the wait is only half the fix. `stillWaiting` going
 * false renders the surface's EMPTY state, and telling a user with no workspace
 * that their workspace is empty is a different wrong answer from the spinner it
 * replaces. A surface that can be reached without its precondition should ask
 * this and say so plainly. This is the seam; what it looks like is Lane 1's.
 */
export function waitingOnNothing(...queries: AnswerableQuery[]): boolean {
  return queries.length > 0 && queries.every(isNeverComing);
}
