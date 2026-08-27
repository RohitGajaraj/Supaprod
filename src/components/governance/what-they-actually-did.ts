/**
 * THE PROOF BESIDE THE POLICY.
 *
 * The boundary screen states what agents MAY do alone. A person asking "what
 * can these agents do without asking me" is entitled to see that it HAS
 * happened, and `tool_calls` carries it: 1,996 rows in the last 30 days across
 * 61 distinct tools, measured on the live database on 2026-08-27.
 *
 * WHAT THE SENTENCE MAY AND MAY NOT CLAIM. `tool_calls` does not record whether
 * an approval gated a call; it records that the call happened. The count is
 * therefore calls to the tools that run alone TODAY, and the copy says exactly
 * that. "These ran unapproved" would be a fact invented out of two facts that
 * do not compose: a tool moved to `auto` last week makes its older calls look
 * unattended. The weaker claim is still the one a person came for, because
 * approvals only ever exist for `confirm` and `review`, so a tool that is `auto`
 * today had no gate today.
 *
 * A NULL COUNT DRAWS NOTHING. Not zero. "Your crew has done nothing without
 * asking" asserted out of a read that did not come back is the reassuring answer
 * arrived at by omission, which R-22 forbids in those words.
 */

export interface DidAlone {
  /** Calls in the window, or null when the read failed. */
  count: number | null;
  /** The most recent one, or null when there were none. */
  newest: { tool: string; at: string } | null;
}

export interface ActuallyDid {
  /** The sentence, or null when nothing can honestly be said. */
  said: string | null;
  /** The tool to name beside it, so the caller can label it properly. */
  tool: string | null;
}

/** The window `getBoundary` reads over. Exported so the copy and the query
 *  cannot disagree about how far back "recently" goes. */
export const WINDOW_DAYS = 30;

export function whatTheyActuallyDid(
  did: DidAlone | null | undefined,
  /** Turns a registry name into the label the rest of the screen uses. */
  toolLabel: (name: string) => string,
): ActuallyDid {
  if (!did || did.count === null) return { said: null, tool: null };

  /*
   * ZERO IS A REAL AND USEFUL ANSWER, and it is not the same as a failed read.
   * A person who set eight tools to run alone and finds none of them has run in
   * a month has learned something: the leverage they think they have is not
   * being used.
   */
  if (did.count === 0) {
    return {
      said: `None of them has run in the last ${WINDOW_DAYS} days.`,
      tool: null,
    };
  }

  const n = did.count;
  const head =
    n === 1
      ? `Your crew has done one of these without asking in the last ${WINDOW_DAYS} days.`
      : `Your crew has done these ${n} times without asking in the last ${WINDOW_DAYS} days.`;

  if (!did.newest) return { said: head, tool: null };
  return { said: head, tool: toolLabel(did.newest.tool) };
}
