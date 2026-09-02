import { describe, expect, test } from "bun:test";

import {
  DISPATCH_REFUSED_PREFIX,
  dispatchRefusalReason,
  isDispatchRefusal,
  refuseDispatch,
} from "./dispatch-refusal";

/**
 * "NOTHING WAS DISPATCHED" WAS SAID ON EVERY FAILURE, INCLUDING THE ONES WHERE
 * EVERYTHING WAS.
 *
 * The Build Console's `onError` appended "Nothing was dispatched, so the spec is
 * still waiting." to whatever it caught, and the comment above it argued the
 * sentence was safe because `dispatchBuilderMission` throws only where nothing
 * durable happened. That reasoning covers a SERVER THROW and nothing else.
 * `onError` also fires for a gateway timeout, a dropped connection, an edge 5xx
 * and an aborted fetch, and in every one of those the request may have reached
 * the handler and run it to the end: the GitHub issue open, a mission created, a
 * builder queued and about to spend. The natural response to being told nothing
 * happened is to press again, and a second press is a second issue, a second
 * mission and a second billed run.
 *
 * This file pins the mark and, more importantly, its FAIL DIRECTION: anything
 * unmarked must read as "we cannot tell", never as "nothing happened".
 */
describe("only the handler's own pre-durable refusal may claim nothing happened", () => {
  test("a marked message is recognised, and gives back its own words", () => {
    const e = refuseDispatch("Need a GitHub issue: link a PRD with one.");
    expect(isDispatchRefusal(e.message)).toBe(true);
    expect(dispatchRefusalReason(e.message)).toBe("Need a GitHub issue: link a PRD with one.");
  });

  test("every transport shape is NOT a refusal", () => {
    // The four the panel actually meets. None of them is evidence about what
    // the handler did or did not do.
    for (const m of [
      "Failed to fetch",
      "504 Gateway Timeout",
      "<html><title>502 Bad Gateway</title></html>",
      "The operation was aborted.",
    ]) {
      expect({ m, refusal: isDispatchRefusal(m) }).toEqual({ m, refusal: false });
    }
  });

  test("an unmarked message keeps its words when printed", () => {
    // The panel prints `dispatchRefusalReason` on both branches, so a message
    // with no mark must survive it unchanged rather than come back empty.
    expect(dispatchRefusalReason("Failed to fetch")).toBe("Failed to fetch");
  });

  test("null, undefined and the empty string are not refusals", () => {
    expect(isDispatchRefusal(null)).toBe(false);
    expect(isDispatchRefusal(undefined)).toBe(false);
    expect(isDispatchRefusal("")).toBe(false);
  });

  test("the mark is a PREFIX, not a substring anywhere in the message", () => {
    // A server message that quoted the sentence back (an echoed error, a log
    // line) must not be mistaken for the handler's own refusal.
    expect(isDispatchRefusal(`upstream said: ${DISPATCH_REFUSED_PREFIX}nope`)).toBe(false);
  });

  test("the mark leaves the repo gate's own matcher working", () => {
    /**
     * `resolveGitHub`'s not-connected refusal is classified everywhere by
     * `isRepoNotConnectedError`, a case-insensitive test for "github is not
     * connected" ANYWHERE in the message. Marking that throw must not hide it,
     * or the connect-a-repo dialog stops opening and the person meets a raw
     * error instead of the two real paths.
     */
    const marked = refuseDispatch("GitHub is not connected for this workspace.");
    expect(/github is not connected/i.test(marked.message)).toBe(true);
  });
});

/**
 * "BOTH HALVES OF THE MARK ARE WIRED" LEFT THIS FILE (P-14, A-QUEUE.md,
 * R-34). It read `dispatchBuilderMission` in build.functions.ts against its
 * one real consumer, `components/build/ReadyToBuild.tsx` -- deleted with
 * `/build`, and `dispatchBuilderMission` now has no caller left to wire
 * either half of the mark to. The mark's own pure contract (above) still
 * holds regardless of who dispatches a build.
 */
