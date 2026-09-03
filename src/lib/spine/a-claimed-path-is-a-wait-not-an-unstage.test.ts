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

/**
 * ── AND THE TRACK HAS TO DO SOMETHING SENSIBLE TOO ────────────────────────
 *
 * Fixing the prompt and the refusal stops the seat routing around the wall. It
 * does not help the seat that correctly STOPS: before this, the track then took
 * `tools-refused`, which is TERMINAL, so a path another run happened to hold
 * ENDED a piece of work for good -- over a condition that clears by itself when
 * that run's pull request merges or closes.
 *
 * The other existing answer was no better. `refusalIsAboutTheWork` sends a
 * refusal back to be rebuilt, and `refusal-kind.ts` has always excluded the
 * claim case from it for the right reason: rebuilding does not help, because the
 * other mission still holds the path.
 *
 * So a claim is a third kind, and it needed its own hold.
 */
import {
  claimedPathFrom,
  refusalIsAboutTheWork,
  refusalIsAClaimedPath,
} from "@/lib/spine/refusal-kind";
import {
  CLAIMED_PATH_HOLD,
  pathFromWaitingSentence,
} from "@/lib/spine/a-claimed-path-is-a-wait-not-an-unstage";
import { wayOut } from "@/components/track/way-out";
import { HOLD_LINE } from "@/lib/spine/driver";
import { RESUMABLE_HOLDS, TERMINAL_HOLDS, CORRECTABLE_HOLDS } from "@/lib/spine/correction";
import { HOLDS_THAT_WAIT_ON_A_DATE } from "@/lib/spine/waiting-on-a-date-is-not-waiting-in-a-queue";

const REFUSAL = `BuilderFileConflict: ${claimedPathRefusal(HELD)}`;

describe("the three kinds of refusal stay apart", () => {
  it("a claim is recognised as a claim", () => {
    expect(refusalIsAClaimedPath("studio.commit", REFUSAL)).toBe(true);
  });

  it("and is NOT read as a branch that has moved on", () => {
    /*
     * THE ONE THAT WOULD BITE SILENTLY. The refusal sentence contains the word
     * "conflict" through its own `BuilderFileConflict` prefix, and
     * `refusalIsAboutTheWork` matches on the bare word "conflict". If its tool
     * gate ever grew to include studio.commit, a correct change would be sent
     * back to be rewritten against a wall that is about to come down.
     */
    expect(refusalIsAboutTheWork("studio.commit", REFUSAL)).toBe(false);
  });

  it("a real merge conflict is still read as one", () => {
    // The claim rule must not have eaten the case that was already working.
    expect(
      refusalIsAboutTheWork(
        "studio.pr.merge",
        "GitHub merge 405: Pull Request has merge conflicts",
      ),
    ).toBe(true);
    expect(
      refusalIsAClaimedPath(
        "studio.pr.merge",
        "GitHub merge 405: Pull Request has merge conflicts",
      ),
    ).toBe(false);
  });

  it("a locked door is neither", () => {
    for (const err of ["GitHub 401: Bad credentials", "Repository is not bound"]) {
      expect(refusalIsAClaimedPath("studio.commit", err)).toBe(false);
      expect(refusalIsAboutTheWork("studio.commit", err)).toBe(false);
    }
  });

  it("needs the tool gate as well as the phrase", () => {
    // Our own prefix appearing in an unrelated tool's error is not a claim.
    expect(refusalIsAClaimedPath("calendar.create", REFUSAL)).toBe(false);
    expect(refusalIsAClaimedPath(null, REFUSAL)).toBe(false);
  });
});

describe("what the driver reads back out of the refusal", () => {
  it("recovers the path and the holder from the sentence", () => {
    // The refusal reaches the driver as a plain string through `tool_calls.error`,
    // with no structure left on it.
    expect(claimedPathFrom(REFUSAL)).toEqual({
      path: "src/checkout/AddressStep.tsx",
      missionTitle: "The tablet layout",
    });
  });

  it("returns nulls rather than throwing on a shape it cannot read", () => {
    // The hold is still right without them; a sentence saying "another run" is
    // worse than one naming the file and far better than no hold at all.
    expect(claimedPathFrom("something else entirely")).toEqual({
      path: null,
      missionTitle: null,
    });
    expect(claimedPathFrom(null).path).toBeNull();
  });
});

describe("the hold it takes, and the one it must not", () => {
  it("is not terminal, because the wall comes down on its own", () => {
    /*
     * `tools-refused` is what this took before, and it is terminal: a claim
     * lasting twenty minutes ended a piece of work for good.
     */
    expect(TERMINAL_HOLDS).not.toContain(CLAIMED_PATH_HOLD);
    expect(RESUMABLE_HOLDS.has(CLAIMED_PATH_HOLD)).toBe(true);
  });

  it("is not correctable, because there is nothing to redo", () => {
    // Correcting sends the work upstream to be rewritten. The change is right;
    // the only thing missing is somebody else's merge.
    expect(CORRECTABLE_HOLDS.has(CLAIMED_PATH_HOLD)).toBe(false);
  });

  it("is NOT needs-evidence, and that is a defect this nearly shipped with", () => {
    /*
     * THE ONE WORTH READING. The first draft reused `needs-evidence` to avoid
     * adding a word to the vocabulary. `HOLDS_THAT_WAIT_ON_A_DATE` contains
     * `needs-evidence`, and the sweep reads a track holding it as "waiting until
     * its FORECAST HORIZON". A Build-station track has almost always passed
     * Decide and carries a forecast, so a twenty-minute claim would have
     * deferred the work until October -- and since P-03a, written that date into
     * `deferred_until` so the sweep stopped fetching the row at all.
     *
     * Waiting on a date nobody can bring forward and waiting on a run that is
     * minutes away are the same shape and opposite urgency. Only a separate word
     * keeps the sweep from confusing them.
     */
    expect(CLAIMED_PATH_HOLD).toBe("waiting-on-another-run");
    expect(HOLDS_THAT_WAIT_ON_A_DATE).not.toContain(CLAIMED_PATH_HOLD);
  });
});

/**
 * ══ THE WALL IS THE FACT, AND SEVEN WRITERS WANTED TO SAY OTHERWISE ═══════
 *
 * This was fixed twice, one live tick apart, and both fixes were right about
 * their own branch and wrong about the shape:
 *
 *   23:50 UTC 2026-09-02  the claim lost to `out-of-time`. Fixed in the
 *                         deadline branch.
 *   00:50 UTC 2026-09-03  the claim lost to `self-check-failed`, which runs
 *                         after the crew and therefore after that fix. The same
 *                         defect, the next writer along.
 *
 * A1's ruling, and it is the general form rather than a third patch: a claim
 * refusal seen during the run sets `waiting-on-another-run` and NO later writer
 * in the same drive replaces it. Everything those writers would have said is
 * true and none of it is the point — the drive did run long, the checks are red,
 * the station did file nothing new — and all of it is downstream of a file this
 * run may not write. A person told "the checks are red" goes and looks at the
 * checks instead of at the run holding the file.
 *
 * So the claim is established ONCE, where the crew's steps first exist, and the
 * function returns. A writer that cannot run cannot overwrite, which is the only
 * version of this that the eighth writer cannot break.
 */
describe("no later writer in the same drive replaces the claim", () => {
  const SRC = readFileSync("src/lib/spine/driver.server.ts", "utf8");
  const code = SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
  const claimAt = code.indexOf("const claimRefusal = refusedTool(steps);");

  it("establishes the claim once, not once per branch", () => {
    // Two checks in two branches is what this replaced. One is the fix.
    expect([...code.matchAll(/refusalIsAClaimedPath\(/g)]).toHaveLength(1);
    expect(claimAt).toBeGreaterThan(-1);
  });

  /*
   * A1: "test each writer in turn". Every one of these writes a hold and would
   * have overwritten the claim; each is asserted to sit after the return rather
   * than trusted to.
   */
  const writers: Array<[string, string]> = [
    ["out-of-time", 'last_hold: "out-of-time"'],
    ["over-budget", 'last_hold: "over-budget"'],
    ["self-check-failed", 'last_hold: "self-check-failed"'],
    ["tools-refused", 'last_hold: "tools-refused"'],
    ["waiting-on-a-person", 'last_hold: "waiting-on-a-person"'],
    ["nothing-to-hand-on", 'last_hold: "nothing-to-hand-on"'],
  ];

  for (const [name, marker] of writers) {
    it(`${name} cannot run before the claim has returned`, () => {
      const at = code.indexOf(marker);
      expect(at, `${marker} is no longer in the driver`).toBeGreaterThan(-1);
      expect(at).toBeGreaterThan(claimAt);
    });
  }

  it("the correction loop refuses a claim-held track, since it runs BEFORE the crew", () => {
    /*
     * The one writer ordering cannot cover. `correctIfPossible` runs before any
     * seat, so the general rule above -- which reads this drive's steps -- has
     * nothing to see yet. The claim it must respect is the one already on the
     * row from a previous drive.
     *
     * And it has to read the STORED hold, not the computed one: `decideDrive`
     * returns `stalled` at the attempts ceiling, which IS correctable, and that
     * substitution is what sent `2fdf93b6` back to Define four times under
     * P-03c.
     */
    expect(code).toContain(
      "if ((row.last_hold as string | null) === CLAIMED_PATH_HOLD) return null;",
    );
    const guardAt = code.indexOf("=== CLAIMED_PATH_HOLD) return null;");
    const decideAt = code.indexOf("const decision = decideCorrection({");
    expect(guardAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(decideAt);
  });

  it("returns rather than falling through, which is what makes the order enough", () => {
    const branch = code.slice(claimAt, code.indexOf('last_hold: "out-of-time"'));
    expect(branch).toContain("hold: CLAIMED_PATH_HOLD");
    expect(branch).toContain("return {");
  });

  it("counts no attempt, and still records the money", () => {
    /*
     * Nothing this station did was wrong and there is nothing to do differently
     * until the other run merges. The spend write sits ABOVE the claim return on
     * purpose: the money was spent whatever the drive concluded.
     */
    const branch = code.slice(claimAt, code.indexOf('last_hold: "out-of-time"'));
    expect(branch).not.toContain("attempts:");
    expect(code.indexOf("spend_used_usd: spent")).toBeLessThan(claimAt);
  });

  it("writes the sentence that names the other run", () => {
    const branch = code.slice(claimAt, code.indexOf('last_hold: "out-of-time"'));
    expect(branch).toContain("waitingOnAnotherRun({");
    expect(branch).toContain("last_hold_because: because");
  });

  it("and the sentence a person reads is never empty, whichever hold wins", () => {
    /*
     * F-127 keeps the COLUMN null for a generic hold, and two guards enforce it.
     * What must never be empty is what a person reads, which comes from
     * `HOLD_LINE` when the column is null.
     */
    expect(HOLD_LINE["out-of-time"]).toBeTruthy();
    expect(HOLD_LINE[CLAIMED_PATH_HOLD]).toBeTruthy();
  });
});
