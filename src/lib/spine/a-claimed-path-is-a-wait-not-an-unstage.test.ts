/**
 * THE SEAT ROUTED AROUND A REFUSAL AND SHIPPED A RED PULL REQUEST.
 *
 * 2026-09-02, 22:00 UTC, on the bound customer repository. `studio.commit`
 * refused `src/checkout/AddressStep.tsx` because the tablet track's mission held
 * the claim. The refusal read *"Wait or release the claim."*
 *
 * The seat called `studio.unstage` on the claimed file, committed the two test
 * files that were left, opened pull request #5, and ran the checks. Typecheck,
 * test and lint all red -- because the tests it had just shipped describe a
 * component change that had been unstaged out from under them.
 *
 * The refusal worked. The advice next to it did not, and the result was worse
 * than the stall the refusal was preventing.
 *
 * ── AND THE SEAT WAS FOLLOWING ITS BRIEF ──────────────────────────────────
 * `FILE_IT.build` told it, of a DIFFERENT case: *"If studio.commit refuses a
 * path it may not write, call studio.unstage on that path and commit the rest
 * rather than stopping."* That is F-67 and it is right for a FORBIDDEN path --
 * a file outside the Build lane's write boundary, whose removal leaves a
 * coherent change behind.
 *
 * A claim is the opposite shape. The path is not forbidden, it is spoken for,
 * and unstaging it leaves half a change: the half that describes the missing
 * half. So the two cases have to be briefed together or a seat meets the
 * permissive one alone and generalises it, which is exactly what happened.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  A_CLAIM_IS_NOT_A_FORBIDDEN_PATH,
  claimedPathRefusal,
  waitingOnAnotherRun,
} from "@/lib/spine/a-claimed-path-is-a-wait-not-an-unstage";

const HELD = { path: "src/checkout/AddressStep.tsx", missionTitle: "The tablet layout" };

describe("the refusal a seat reads", () => {
  it("names the file and the run that holds it", () => {
    const line = claimedPathRefusal(HELD);
    expect(line).toContain("src/checkout/AddressStep.tsx");
    expect(line).toContain("The tablet layout");
  });

  it("forbids the escape BY NAME, which is the whole fix", () => {
    /*
     * "Wait or release the claim" is advice a seat can weigh against other
     * advice, and it weighed it against a brief that told it to unstage. Naming
     * `studio.unstage` is what makes the two impossible to confuse.
     */
    expect(claimedPathRefusal(HELD)).toContain("Do NOT call studio.unstage on it");
  });

  it("says why, in terms of what goes wrong rather than what is disallowed", () => {
    // A rule with a reason survives a seat that is reasoning; a bare
    // prohibition invites a search for the exception.
    expect(claimedPathRefusal(HELD)).toContain("describes work that is not there");
  });

  it("says what clears it, so stopping is a decision rather than a dead end", () => {
    /*
     * A seat that knows the claim clears when the other run merges can stop and
     * be RIGHT. One that does not will keep looking for a way through, which is
     * the behaviour being corrected.
     */
    expect(claimedPathRefusal(HELD)).toContain("merges or closes");
  });

  it("still reads as a refusal when nobody can be named", () => {
    const line = claimedPathRefusal({ path: "a/b.ts", missionTitle: null });
    expect(line).toContain("by another run");
    expect(line).not.toContain("null");
    expect(line).toContain("Do NOT call studio.unstage");
  });
});

describe("the tool and the brief say the same thing", () => {
  const REG = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
  const DRIVER = readFileSync("src/lib/spine/driver.ts", "utf8");

  it("all three claim refusals go through the one sentence", () => {
    // Three copies of a refusal is how one gets fixed and the others keep
    // telling a seat it may unstage.
    expect([...REG.matchAll(/claimedPathRefusal\(/g)].length).toBe(3);
    expect(REG).not.toContain("Wait or release the claim.");
    expect(REG).not.toContain("Wait for it to finish or have the operator release the claim");
  });

  it("keeps the BuilderFileConflict prefix, which is classified on", () => {
    /*
     * `refusal-kind.ts` reads that prefix to tell a claim conflict from a real
     * failure. Changing the shape of the string would silently reclassify every
     * claim conflict this product has recorded.
     */
    expect([...REG.matchAll(/BuilderFileConflict: /g)].length).toBeGreaterThanOrEqual(3);
  });

  it("Build's brief now carries both cases, next to each other", () => {
    /*
     * Next to each other is the requirement, not merely both present. The seat
     * met the permissive sentence alone and generalised it; a correction filed
     * three paragraphs away would have been read the same way.
     */
    const unstage = DRIVER.indexOf("call studio.unstage on that path and commit the rest");
    const claim = DRIVER.indexOf("A_CLAIM_IS_NOT_A_FORBIDDEN_PATH +");
    expect(unstage).toBeGreaterThan(-1);
    expect(claim).toBeGreaterThan(unstage);
    // Within the same instruction, allowing for the comment that explains why.
    expect(claim - unstage).toBeLessThan(900);
  });

  it("the brief REFERENCES the sentence rather than copying it", () => {
    /*
     * The first version pasted the words into the brief and the test compared
     * the two strings. That is a second source of truth with a test that only
     * notices when someone edits one of them in a way that changes the first 90
     * characters. Importing removes the question.
     */
    expect(DRIVER).toContain(
      'import { A_CLAIM_IS_NOT_A_FORBIDDEN_PATH } from "@/lib/spine/a-claimed-path-is-a-wait-not-an-unstage"',
    );
    // And the words themselves are nowhere in the driver, so there is nothing
    // to drift.
    expect(DRIVER).not.toContain(A_CLAIM_IS_NOT_A_FORBIDDEN_PATH.slice(0, 60));
  });

  it("the sentence itself says both halves a seat has to hold at once", () => {
    // What it may do, and what it may not, in the words that reach the model.
    expect(A_CLAIM_IS_NOT_A_FORBIDDEN_PATH).toContain("MAY NEVER WRITE");
    expect(A_CLAIM_IS_NOT_A_FORBIDDEN_PATH).toContain("do not unstage it");
    expect(A_CLAIM_IS_NOT_A_FORBIDDEN_PATH).toContain("merges or closes");
  });
});

describe("what the person sees while it waits", () => {
  it("names the other run, so nobody presses Run it now into the same wall", () => {
    /*
     * A1's report: a person reading `out-of-time` pressed Run it now and hit the
     * same wall. "Waiting on another change" that does not say WHICH change does
     * exactly the same thing.
     */
    const line = waitingOnAnotherRun({ ...HELD, prNumber: 4 });
    expect(line).toContain("The tablet layout");
    expect(line).toContain("pull request #4");
    expect(line).toContain("src/checkout/AddressStep.tsx");
    expect(line).toContain("merges or closes");
  });

  it("drops the pull request number rather than inventing one", () => {
    const line = waitingOnAnotherRun({ ...HELD, prNumber: null });
    expect(line).not.toContain("#");
    expect(line).toContain("The tablet layout");
  });

  it("still says something useful with no title", () => {
    const line = waitingOnAnotherRun({ path: "a/b.ts", missionTitle: null, prNumber: null });
    expect(line).toContain("another run");
    expect(line).not.toContain("undefined");
  });
});
