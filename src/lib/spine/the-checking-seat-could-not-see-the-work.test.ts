/**
 * F-54. THE SEAT THAT CHECKS THE WORK COULD NOT SEE THE WORK.
 *
 * MEASURED LIVE, and it is the only reason this was found. Track `48eee889`,
 * 2026-08-25: `builder` committed **449 lines across 6 files** to branch
 * `studio/01306607-acd0f5b0c46f` and opened PR #3 on
 * `RohitGajaraj/relay-homeowner-app` — verified on GitHub, not inferred from a
 * row. Forty-four seconds later the `qa` seat ran `repo.tree` and `repo.search`
 * and filed, in its own words:
 *
 *   "No notification digest implementation was found in the repository. The repo
 *    tree shows only checkout-related files in the src directory, and a search
 *    for notification, alert, digest, or ui terms returned no results. This means
 *    there is no code to verify against the spec at this time."
 *
 * **Every word true about the branch it read, every word false about the work.**
 * `repo.tree`'s `ref` is optional and falls back to
 * `getDefaultBranch(repo, headers)`. That default is right for *"what is in this
 * project"* and exactly wrong for *"check what was just built"*, and **nothing
 * anywhere told the seat a branch existed.**
 *
 * SO IT WAS NEVER ABOUT THIS TRACK. Every Build station on every repo has had a
 * checking seat reading a copy of the project that cannot contain the work it was
 * dispatched to check. It passed review, it passed tests, and it produced a
 * confident, articulate, completely wrong verdict — which is worse than an error,
 * because an error stops the run and this one reads as diligence.
 *
 * The fix names the branch in the brief on `specId`'s precedent: *"an agent told
 * to pass an argument it has to go and find is an agent that spends steps finding
 * it."* The seat cannot derive this one at all.
 */
import { describe, expect, it } from "bun:test";

import { stationGoal } from "./driver";

const TRACK = {
  title: "Homeowners are muting notifications because too many alerts arrive",
  origin: null,
};
const BRANCH = "studio/01306607-acd0f5b0c46f";

const build = (branch: string | null) => stationGoal("build", TRACK, [], null, null, null, branch);

describe("the Build brief names the branch the work is on", () => {
  it("names it, and names it exactly", () => {
    const brief = build(BRANCH);
    expect(brief).toContain(BRANCH);
  });

  /**
   * NAMING IT IS NOT ENOUGH. The seat has to be told what to DO with it, because
   * the argument is optional and its default is the thing that broke: an agent
   * that reads "the branch is X" and calls `repo.tree` with no `ref` gets
   * precisely today's behaviour.
   */
  it("says which argument to pass it as, on the tools that take it", () => {
    const brief = build(BRANCH);
    expect(brief).toContain(`ref: "${BRANCH}"`);
    for (const tool of ["repo.tree", "repo.read", "repo.search"]) {
      expect(brief, `${tool} takes a ref and must be named`).toContain(tool);
    }
  });

  /**
   * AND WHAT IT COSTS TO SKIP IT, because a rule with no consequence attached is
   * the half of an instruction agents drop first. The live failure is the
   * sentence: it read a copy of the project that did not contain the work.
   */
  it("says what happens if it does not", () => {
    expect(build(BRANCH)).toContain("does not contain it");
  });
});

describe("what it does NOT do, which is most of the value", () => {
  /**
   * THE ORDINARY CASE IS NULL. On the first Build tick nothing has been staged,
   * so there is no branch. A brief that invented one, or that talked about
   * branches in the abstract, would be noise on the tick that matters most.
   */
  it("says nothing at all when there is no branch yet", () => {
    const brief = build(null);
    expect(brief).not.toContain("ref:");
    expect(brief).not.toContain("not on the default branch");
    // Asserted on the ADDED sentence, not on the word: `studio.commit`'s own
    // filing instruction already says "put it on its own branch", and a test
    // that banned the word would have failed on a line this fix never touched.
    expect(brief).toContain("put it on its own branch");
  });

  /**
   * BUILD ONLY. Sense through Design have no repo to read; Ship works from the
   * changeset and the merge rather than from a tree. A branch named where it is
   * not needed is one more sentence competing with the instruction that matters —
   * and `stationSubject`'s own history is what that costs: F-30 stopped a run
   * dead because the brief's first sentence disagreed with the spec.
   */
  it.each(["sense", "decide", "define", "design", "ship", "learn"] as const)(
    "leaves %s alone even when a branch exists",
    (station) => {
      const brief = stationGoal(station, TRACK, [], null, null, null, BRANCH);
      expect(brief).not.toContain(BRANCH);
    },
  );

  /**
   * The argument is last and defaulted, so every existing caller — and there are
   * several, including the tests that assert the brief's shape — keeps today's
   * behaviour by not passing it. R-22 applied to a parameter: the absent value
   * resolves to what the system already did.
   */
  it("changes nothing for a caller that does not pass it", () => {
    expect(stationGoal("build", TRACK, [], null, null, null)).toBe(build(null));
  });
});
