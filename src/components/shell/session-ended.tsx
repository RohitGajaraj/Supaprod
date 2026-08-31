/**
 * THE ONE FACT ABOUT THE TAB, CARRIED FROM THE SHELL TO THE SURFACE INSIDE IT.
 *
 * ── THE DEFECT (S4-167) ───────────────────────────────────────────────────
 * On `/today` against a dead backend a person got **two remedies for one
 * condition**: the shell said *"Your session ended. Sign in again and this will
 * load"* with a Sign in door, and the body underneath said *"This could not be
 * read…"* with **Try again**. **If the session ended, Try again retries into the
 * same failure** — an offer the product cannot honour, which is the shape this
 * lane has been removing all day.
 *
 * ── WHY THE REGION COULD NOT SIMPLY DETECT IT ITSELF ──────────────────────
 * The arm that renders is `workspacesUnreadable`, and in that state **every
 * board query is `enabled: Boolean(workspaceId)` and therefore idle** — no
 * error to read. The failure lives on `useWorkspace`'s own query, which does
 * not expose one (its context returns `workspaces`, `activeWorkspace`,
 * `isLoading`, `refreshWorkspaces` and no `error`), and `src/hooks/**` is not
 * my prefix.
 *
 * **The shell already has the fact.** `AppFrame` derives `sessionEnded` from
 * five reads that are NOT workspace-gated, so they do error, which is why the
 * banner S4 saw was correct. This carries that one string down. **No new read,
 * no new request** — the same derivation, shared instead of recomputed.
 *
 * ── AND IT IS THE DESIGN ALREADY WRITTEN DOWN, NOT A NEW ONE ──────────────
 * `AppFrame`'s own comment rules it: *"A dead token fails every read in the tab
 * at once… a person needs ONE door. So the shell says it once, above
 * everything, and the regions go back to naming which read failed, which is the
 * thing they know and the shell does not."*
 *
 * That was implemented for the regions that pass an `error`. **The region that
 * has no error to pass was left offering the second door**, and this closes the
 * gap the same way rather than a different one: the shell keeps the door, the
 * region keeps the naming.
 */
import * as React from "react";

/**
 * The sentence, or null when the session is fine.
 *
 * A string rather than a boolean **on purpose**: `sessionEndedMessage` owns the
 * wording, and a consumer that wanted to render it would otherwise write a
 * second copy of a sentence `error-copy.ts` is the single source of. Today the
 * only consumers need its presence; tomorrow's can print it.
 */
const SessionEndedContext = React.createContext<string | null>(null);

export function SessionEndedProvider({
  value,
  children,
}: {
  value: string | null;
  children: React.ReactNode;
}) {
  return <SessionEndedContext.Provider value={value}>{children}</SessionEndedContext.Provider>;
}

/**
 * Has this tab's session ended, as the shell sees it?
 *
 * **Defaults to null outside the shell**, which is the safe direction: a
 * surface rendered without the provider keeps whatever remedy it already
 * offered, so this can never REMOVE a retry from somewhere the shell is not
 * watching. It only ever suppresses one where the shell has already put a
 * better door on screen.
 */
export function useSessionEnded(): string | null {
  return React.useContext(SessionEndedContext);
}

/**
 * The retry a region should offer, or nothing — as a value, so it can be TESTED
 * rather than read.
 *
 * ── WHY THIS IS A FUNCTION AND NOT A TERNARY AT THE CALL SITE ─────────────
 * It was a ternary. S4 verified the fix (S4-178) and named the one weakness:
 * every guard on it was a source scan, and **the load-bearing assertion — that
 * the retry is KEPT when the session is fine — is the one standing between this
 * fix and a silent deletion of the remedy.** A `toContain` proves the shape of a
 * line; it does not prove the behaviour, and it breaks on a rename without
 * breaking anything real.
 *
 * So the decision moves here, where a test can call it with both inputs and
 * assert on what comes back. **The scan that remains only has to prove the
 * component asks this question** — which is a claim about code shape, and
 * therefore the one thing a scan is actually good for.
 *
 * ── THE DIRECTION IS THE POINT ────────────────────────────────────────────
 * `null` in means the retry survives. A surface outside the shell, a healthy
 * session, and a shell that has not answered yet all produce `null` — so
 * **every uncertain state keeps the remedy**, and only a positively-known ended
 * session removes it. A helper that defaulted the other way would strip working
 * controls off surfaces nothing is watching.
 */
export function retryUnlessSessionEnded(
  sessionEnded: string | null,
  retry: () => void,
): (() => void) | undefined {
  return sessionEnded ? undefined : retry;
}
