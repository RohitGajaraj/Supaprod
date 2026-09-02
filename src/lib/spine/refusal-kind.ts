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
 * A THIRD KIND, AND IT IS THE ONE THIS FILE ALREADY DESCRIBED WITHOUT NAMING.
 *
 * The header above uses the claim conflict as its worked example of something
 * that must NOT match `refusalIsAboutTheWork`, and the reason it gives is right:
 * *"a path held by another mission is not fixed by rebuilding, because the other
 * mission still holds it."* Rebuilding is the wrong remedy.
 *
 * But falling through to `tools-refused` is the wrong answer too, and worse.
 * That hold is TERMINAL, so a claimed path PERMANENTLY ENDS a piece of work --
 * over a condition that clears by itself, usually within the hour, when the
 * other run's pull request merges or closes.
 *
 * So the two existing kinds are:
 *
 *   about the work        rebuild it        (conflict, stale branch)
 *   a locked door         stop for good     (401, policy, permission)
 *
 * and a claim is neither. It is WORK WAITING ON WORK: nothing to redo, nothing
 * to escalate, and a known event that releases it. Both existing answers are
 * damaging -- one burns three attempts rewriting a change that was correct, the
 * other throws the change away.
 *
 * ── WHAT IT COST BEFORE THIS EXISTED, 2026-09-02 22:00 UTC ────────────────
 * The seat was refused, and rather than stop it unstaged the claimed component,
 * committed the tests that described it, opened a pull request and ran the
 * checks -- red, on a customer's repository. That is fixed at the prompt and in
 * the refusal text, but a seat that correctly stops still needs the TRACK to do
 * something sensible, and what the track did was take a terminal hold.
 *
 * ── THE GATE IS THE SAME SHAPE AS THE ONE ABOVE, FOR THE SAME REASON ──────
 * A tool gate and a phrase, both required. `BuilderFileConflict` is our own
 * prefix, written by our own tools in exactly three places, so it is a far
 * stronger signal than the borrowed English `refusalIsAboutTheWork` has to match
 * -- and it is checked as a whole rather than by the word "conflict", which the
 * header above already warns is the trap.
 */
const CLAIM_TOOLS: ReadonlySet<string> = new Set([
  "studio.commit",
  "studio.stage",
  "studio.pr.open",
  "github.pr.open",
]);

/** Our own prefix, written by our own tools. Not a borrowed phrase. */
const CLAIM_MARK = "builderfileconflict";

/**
 * Is this refusal a path another run is holding?
 *
 * Checked BEFORE `refusalIsAboutTheWork` by every caller, because a claim
 * refusal contains the word "conflict" and the two must not both fire. The tool
 * gates make them disjoint today; the ordering is what keeps that true if either
 * list grows.
 */
export function refusalIsAClaimedPath(
  toolName: string | null | undefined,
  error: string | null | undefined,
): boolean {
  if (!toolName || !CLAIM_TOOLS.has(toolName)) return false;
  return (error ?? "").toLowerCase().includes(CLAIM_MARK);
}

/**
 * The path another run is holding, read back out of the refusal.
 *
 * The refusal sentence is composed by `claimedPathRefusal`, which puts the path
 * after "This change touches " and the holder in quotes. Parsed rather than
 * passed because the refusal reaches the driver as a plain error STRING through
 * `tool_calls.error`, with no structure left on it.
 *
 * Returns nulls rather than throwing on a shape it cannot read: the hold is
 * still right, and a sentence that says "another run" is worse than one naming
 * the file but far better than no hold at all.
 */
export function claimedPathFrom(error: string | null | undefined): {
  path: string | null;
  missionTitle: string | null;
} {
  const text = error ?? "";
  const path = /This change touches ([^\s,]+)/.exec(text)?.[1] ?? null;
  const title = /claimed by "([^"]+)"/.exec(text)?.[1] ?? null;
  return { path, missionTitle: title };
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
