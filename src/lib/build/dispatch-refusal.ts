/**
 * WHICH FAILURES OF A BUILD DISPATCH MAY SAY "NOTHING WAS DISPATCHED".
 *
 * PURE, client-safe, no imports. The producer (`dispatchBuilderMission` in
 * build.functions.ts) marks the throws it makes BEFORE anything durable exists;
 * the consumer (ReadyToBuild.tsx) keys its copy on that mark. Both halves are
 * in the Build lane and neither may move without the other.
 *
 * THE DEFECT THIS ENDS. The panel's `onError` said, unconditionally: "Nothing
 * was dispatched, so the spec is still waiting." Its comment argued that "only
 * here is it true", because the handler throws only when no mission was
 * created. That reasoning covers a SERVER THROW and nothing else. `onError`
 * also fires for a gateway timeout, a dropped connection, an edge 5xx and an
 * aborted fetch, and in every one of those the request may well have reached
 * the handler and run it to the end: the GitHub issue is open, the mission
 * exists, and a builder is queued to spend money. Telling the person nothing
 * happened is an invitation to press again, and a second press is a second
 * issue, a second mission and a second billed run.
 *
 * THE FAIL DIRECTION IS DELIBERATE. An unmarked message reads as "we cannot
 * tell", never as "nothing happened". So a sanitised production error, a
 * proxy's HTML error page, or any future throw someone forgets to mark all
 * land on the cautious sentence rather than on the confident false one.
 */

/**
 * The mark. Prepended to a message only where NOTHING durable exists yet: no
 * GitHub issue opened, no mission created, no run queued.
 *
 * It is a readable English sentence opener rather than a machine token because
 * it is not always stripped before display: an unrecognised transport shape may
 * surface the raw string, and a person reading it should meet words rather than
 * a code.
 */
export const DISPATCH_REFUSED_PREFIX = "Build refused this dispatch. ";

/** Mark a message thrown before anything durable happened. */
export function refuseDispatch(message: string): Error {
  return new Error(`${DISPATCH_REFUSED_PREFIX}${message}`);
}

/**
 * True when this error is the handler's own pre-durable refusal, and therefore
 * the ONE case where "nothing was dispatched" is a fact rather than a guess.
 */
export function isDispatchRefusal(message: string | null | undefined): boolean {
  return typeof message === "string" && message.startsWith(DISPATCH_REFUSED_PREFIX);
}

/** The refusal's own words, without the mark. Returns the message unchanged
 *  when it carries no mark, so a caller can print it either way. */
export function dispatchRefusalReason(message: string): string {
  return isDispatchRefusal(message) ? message.slice(DISPATCH_REFUSED_PREFIX.length) : message;
}
