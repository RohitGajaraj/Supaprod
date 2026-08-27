/**
 * A LOCKED DOOR, OR WORK THAT NEEDS UPDATING? THE HOLD DEPENDS ON IT.
 *
 * ── F-41 IS RIGHT, AND ITS PREMISE DOES NOT COVER EVERY REFUSAL ────────────
 * `driver.server.ts` treats a refused tool as a thing "that has nothing to do
 * with the work", and everything that follows is correct on that premise: no
 * attempt is counted, no correction is triggered, and the hold names the tool.
 * It was written against a GitHub 401, and it stopped the loop throwing a
 * correct spec, six good tasks and a real prototype back at Plan to be rewritten
 * against a locked door.
 *
 * `tools-refused` is then TERMINAL, and `correction.ts` gives the exact reason:
 * *"there is no cheap way to test whether the ask has been met. 'Is GitHub
 * reachable again' can only be answered by dispatching a paid run."*
 *
 * ── THE ONE CLASS THAT FAILS BOTH TESTS ────────────────────────────────────
 * **A merge conflict has everything to do with the work**, and it is cheaply
 * re-checkable — GitHub answers `mergeable` on a plain GET. So both the premise
 * and the terminality argument are false for it, and the consequence is severe:
 * one of the most ordinary and most fixable things in software **permanently
 * ends a piece of work**.
 *
 * MEASURED BY S4 across this product's whole life: eight real merge failures,
 * of which **five are `GitHub merge 405: Pull Request has merge conflicts`**.
 * Not an edge case — the single most common way a real merge has failed here.
 *
 * ── WHAT THIS CHANGES, AND WHAT IT DELIBERATELY DOES NOT ───────────────────
 * A refusal that is about the work falls through to the ORDINARY path: the
 * attempt counts, and after three of them `decideCorrection` routes the work
 * back to be redone. That is the right answer for a conflict, because
 * `studio.commit` branches off the CURRENT default-branch head, so rebuilding
 * the change resolves it without anyone rebasing anything.
 *
 * Nothing else moves. A credential refusal, a permission refusal, a policy
 * refusal: all still take F-41's path, because for those the premise holds.
 *
 * ── THE LIST IS NARROW ON PURPOSE ──────────────────────────────────────────
 * Only conflicts. "CI is still running" is transient and would be WRONG to
 * correct — the work is fine and the answer is to wait — and one wrong entry
 * here sends good work back to be rewritten, which is the exact damage F-41 was
 * written to stop. Adding a case is a deliberate edit with a measured reason,
 * never a widening to catch more.
 */

/** Tools whose refusal can be about the work rather than about a door. */
const MERGE_TOOLS: ReadonlySet<string> = new Set(["studio.pr.merge"]);

/**
 * Does this refusal mean the WORK needs updating, rather than a door being shut?
 *
 * Both halves are required. The tool must be one whose refusal can be about the
 * work at all, and the message must actually say conflict — so a 401, a rate
 * limit or a policy refusal from the same tool still takes F-41's path.
 */
export function refusalIsAboutTheWork(
  toolName: string | null | undefined,
  error: string | null | undefined,
): boolean {
  if (!toolName || !MERGE_TOOLS.has(toolName)) return false;
  const text = (error ?? "").toLowerCase();
  if (!text) return false;
  /*
   * "conflict" and nothing cleverer. GitHub phrases this several ways across
   * API versions ("Pull Request has merge conflicts", "Pull Request is not
   * mergeable"), and matching the word they all share beats maintaining a list
   * of sentences someone else controls. The tool gate above is what keeps this
   * from firing on an unrelated message that happens to contain the word.
   */
  return text.includes("conflict");
}

/**
 * The sentence a person reads, and the one the record keeps.
 *
 * Says what happened, why it is not a dead end, and what will happen next, in
 * that order. A hold that says only "it conflicted" leaves a person deciding
 * whether to intervene; this one tells them they need not.
 */
export function conflictLine(): string {
  return "The change could not merge because the branch it was built on has moved on. That is not a dead end: the work goes back to be rebuilt on what is there now.";
}
