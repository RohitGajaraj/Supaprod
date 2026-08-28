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
 *
 * ── F-137: THE SAME THING HAPPENS ONE STEP EARLIER, AND WAS NOT COVERED ────
 * A stale branch does not only stop a MERGE. It stops the PR from OPENING, and
 * that failure was taking F-41's terminal path.
 *
 * Both halves measured on 2026-08-28, and they live in two different tables,
 * which is why one read finds only one of them:
 *
 *   `agent_approvals.error`  refusals that passed the approval boundary
 *     5  studio.pr.merge  "GitHub merge 405: Pull Request has merge conflicts"
 *     1  studio.pr.merge  "MergeBlocked: CI is still running"        (excluded)
 *     1  studio.commit    "BuilderFileConflict: path … is claimed"   (excluded)
 *
 *   `tool_calls.error`       refusals that did not
 *     7  github.openPullRequest  "branch … is 14 commits behind main, rebase
 *                                 required before a PR can open"
 *     0  studio.pr.merge         has never failed here at all
 *
 * `github.openPullRequest` is the OLD name for the tool now called
 * `studio.pr.open`, so those seven are this product's own history of the case,
 * under the name it had at the time. Reading either table alone makes the other
 * half look like it never happened.
 *
 * "14 commits behind main, rebase required" is the SAME condition as a merge
 * conflict and takes the SAME remedy: `studio.commit` branches off the current
 * default-branch head, so rebuilding lands on what is there now. Leaving it out
 * meant the one case the fix was written for ended a track for good whenever it
 * arrived one step earlier than expected.
 *
 * ── AND THE GATE EARNS ITS KEEP, WHICH IS NOW PROVABLE ────────────────────
 * `studio.commit`'s "BuilderFileConflict: path … is claimed by another Studio
 * mission" is a REAL recorded refusal containing the word "conflict", and it
 * must not match: a path held by another mission is not fixed by rebuilding,
 * because the other mission still holds it. It is the live proof that the tool
 * gate is doing work rather than being asserted to.
 */

/**
 * Tools whose refusal can be about the work rather than about a door.
 *
 * `studio.pr.open` sits beside `studio.pr.merge` because a branch that has
 * fallen behind stops the PR opening before it ever reaches the merge.
 */
const MERGE_TOOLS: ReadonlySet<string> = new Set(["studio.pr.merge", "studio.pr.open"]);

/**
 * The phrases that mean THE BRANCH HAS MOVED ON, in the words the tools use.
 *
 * Kept as a list rather than one clever regex so each entry can carry the
 * recorded string it was added for. Every one of these is answered by rebuilding
 * on the current head, which is the test for belonging here.
 */
const MOVED_ON = [
  // 5 rows, agent_approvals: "GitHub merge 405: Pull Request has merge conflicts".
  "conflict",
  // 7 rows, tool_calls: "branch … is 14 commits behind main, rebase required".
  "rebase",
  "behind main",
] as const;

/**
 * Does this refusal mean the WORK needs updating, rather than a door being shut?
 *
 * Both halves are required. The tool must be one whose refusal can be about the
 * work at all, and the message must actually say the branch has moved on — so a
 * 401, a rate limit, a repo-binding refusal or a policy refusal from the same
 * tool still takes F-41's path.
 */
export function refusalIsAboutTheWork(
  toolName: string | null | undefined,
  error: string | null | undefined,
): boolean {
  if (!toolName || !MERGE_TOOLS.has(toolName)) return false;
  const text = (error ?? "").toLowerCase();
  if (!text) return false;
  /*
   * The words the tools share, and nothing cleverer. GitHub phrases the merge
   * case several ways across API versions ("Pull Request has merge conflicts",
   * "Pull Request is not mergeable"), and our own PR-open check phrases the
   * stale-branch case as "behind main, rebase required". Matching the words they
   * share beats maintaining a list of sentences someone else controls. The tool
   * gate above is what keeps any of them from firing on an unrelated refusal
   * that happens to contain one.
   */
  return MOVED_ON.some((phrase) => text.includes(phrase));
}

/**
 * The sentence a person reads, and the one the record keeps.
 *
 * Says what happened, why it is not a dead end, and what will happen next, in
 * that order. A hold that says only "it conflicted" leaves a person deciding
 * whether to intervene; this one tells them they need not.
 */
export function conflictLine(): string {
  // "land" and not "merge": the same condition now also stops the pull request
  // OPENING (F-137), and a sentence that names only the merge would be wrong for
  // the case this product has actually recorded seven times.
  return "The change could not land because the branch it was built on has moved on. That is not a dead end: the work goes back to be rebuilt on what is there now.";
}
