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

describe("the driver takes it", () => {
  const DRIVER_SERVER = readFileSync("src/lib/spine/driver.server.ts", "utf8");
  const driverCode = DRIVER_SERVER.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

  it("checks for a claim BEFORE it asks whether the branch moved on", () => {
    // Order is the correctness: both would match on the word "conflict" if the
    // other rule's tool gate ever widened.
    expect(driverCode.indexOf("refusalIsAClaimedPath(")).toBeLessThan(
      driverCode.indexOf("refusalIsAboutTheWork("),
    );
  });

  it("counts no attempt, so waiting cannot walk the work to given-up", () => {
    const branch = driverCode.slice(
      driverCode.indexOf("if (claimed) {"),
      driverCode.indexOf("const refusal ="),
    );
    expect(branch).toContain("last_hold: CLAIMED_PATH_HOLD");
    expect(branch).not.toContain("attempts:");
  });

  it("writes the sentence that names the other run", () => {
    const branch = driverCode.slice(
      driverCode.indexOf("if (claimed) {"),
      driverCode.indexOf("const refusal ="),
    );
    expect(branch).toContain("waitingOnAnotherRun({");
    expect(branch).toContain("last_hold_because: because");
  });
});

/**
 * ── THE DOOR, WHICH HAS TO BE REAL OR ABSENT AND NEVER DECORATIVE ─────────
 *
 * A1's ruling, 2026-09-03: a person told "waiting on the tablet run's PR #4"
 * wants exactly that door, so it is threaded rather than described.
 *
 * `way-out.ts` has one rule and it governs this: never point at a door that is
 * not there. So the door is returned ONLY with an id the caller actually
 * resolved, and the id is resolved LIVE -- the claim releases the moment the
 * other run's pull request merges, and a stored id would keep offering a door
 * onto a run that is no longer holding anything, at exactly the moment this
 * track starts moving again.
 */
describe("the way out that is somewhere else", () => {
  it("offers the other run when the caller resolved it", () => {
    const w = wayOut(CLAIMED_PATH_HOLD, { undo: true, handback: true }, "Build", {
      trackId: "6817e386-28e9-4a57-9ed1-0c24328af93a",
      title: "The tablet layout",
    });
    expect(w.door).toEqual({
      label: "Open The tablet layout",
      trackId: "6817e386-28e9-4a57-9ed1-0c24328af93a",
    });
  });

  it("offers NOTHING when it could not, rather than a label that goes nowhere", () => {
    /*
     * The whole rule of the file it lives in. A claim that has just released
     * resolves to null, and this must render nothing rather than a door onto a
     * run that is no longer holding the file.
     */
    const w = wayOut(CLAIMED_PATH_HOLD, { undo: true, handback: true }, "Build", null);
    expect(w.door).toBeUndefined();
    expect(w.next).toBeNull();
    expect(w.onThisScreen).toBe(false);
  });

  it("does not offer this screen's controls, because neither of them clears it", () => {
    /*
     * `undo` and `handback` are both on screen here and both would be false
     * doors: sending the work back a step does not release another run's claim,
     * and doing the step yourself runs into the same wall.
     */
    const w = wayOut(CLAIMED_PATH_HOLD, { undo: true, handback: true }, "Build", {
      trackId: "t",
      title: "x",
    });
    expect(w.onThisScreen).toBe(false);
    expect(w.next).toBeNull();
  });

  it("adds no sentence, because the hold's own line already says what happens", () => {
    // This file speaks only where the record goes quiet, and it is not quiet:
    // HOLD_LINE says the work continues when the other run's PR merges.
    expect(HOLD_LINE[CLAIMED_PATH_HOLD]).toContain("merges or closes");
  });
});

describe("the sentence and the parser are one round trip", () => {
  it("reads back the path the driver wrote", () => {
    /*
     * The hold carries the path and nothing else a lookup cannot re-derive, so
     * this is the one fact the door parses rather than queries. Composer and
     * parser live in the same file for exactly this reason: a reader changing
     * the sentence meets the thing that depends on it.
     */
    const sentence = waitingOnAnotherRun({ ...HELD, prNumber: 4 });
    expect(pathFromWaitingSentence(sentence)).toBe("src/checkout/AddressStep.tsx");
  });

  it("round-trips without a pull request number too", () => {
    expect(pathFromWaitingSentence(waitingOnAnotherRun({ ...HELD, prNumber: null }))).toBe(
      "src/checkout/AddressStep.tsx",
    );
  });

  it("returns null rather than a guess on anything else", () => {
    for (const s of [null, undefined, "", "Stopped at Build", "also changes"]) {
      expect(pathFromWaitingSentence(s)).toBeNull();
    }
  });
});

/**
 * ── THE NAMED HOLD EXISTED AND LOST TO THE CLOCK ──────────────────────────
 *
 * MEASURED 00:20 UTC, 2026-09-03. The builder ran in fix mode, staged, and
 * `studio.commit` was refused because another run held the path — every part of
 * that working as intended. The drive then took 1m40s against the 45-second
 * budget, the deadline branch fired first, and the track was written
 * `out-of-time` with an empty because-sentence.
 *
 * Both facts were true and they are not equal. `out-of-time` says "come back and
 * we will carry on", which is a promise this track cannot keep: the wall is
 * still there and the next drive meets it again. A person reading it presses Run
 * it now and hits the same refusal — the exact failure `waitingOnAnotherRun` was
 * written to prevent, arriving one branch earlier than the code that prevents it.
 *
 * The wall is the fact. The clock is not.
 */
describe("a claim refusal outlives the deadline", () => {
  const DRIVER_SRC = readFileSync("src/lib/spine/driver.server.ts", "utf8");
  const driverOnly = DRIVER_SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

  it("checks for a claim before the out-of-time hold is written", () => {
    /*
     * Order is the entire fix. That branch RETURNS, which is why the claim
     * handling further down never saw the refusal.
     */
    const claimAt = driverOnly.indexOf("refusalIsAClaimedPath(claimedNow.tool");
    const outOfTimeAt = driverOnly.indexOf('last_hold: "out-of-time"');
    expect(claimAt).toBeGreaterThan(-1);
    expect(claimAt).toBeLessThan(outOfTimeAt);
  });

  it("ends on the claim hold, with the sentence, not on the clock", () => {
    const branch = driverOnly.slice(
      driverOnly.indexOf("const claimedNow = refusedTool(steps);"),
      driverOnly.indexOf('last_hold: "out-of-time"'),
    );
    expect(branch).toContain("last_hold: CLAIMED_PATH_HOLD");
    expect(branch).toContain("last_hold_because: because");
    expect(branch).toContain("waitingOnAnotherRun({");
  });

  it("counts no attempt there either", () => {
    // Same reasoning as the claim branch below it: nothing this station did was
    // wrong, and there is nothing to do differently until the other run merges.
    const branch = driverOnly.slice(
      driverOnly.indexOf("const claimedNow = refusedTool(steps);"),
      driverOnly.indexOf('last_hold: "out-of-time"'),
    );
    expect(branch).not.toContain("attempts:");
  });

  it("and the sentence a person reads is never empty, whichever hold wins", () => {
    /*
     * A1 asked for "the because-sentence is never empty". The COLUMN is null for
     * `out-of-time` and that is deliberate — F-127, enforced by two guards: a
     * generic line stored in a column meant for specifics reads as a specific
     * reason to every surface that shows it. What must never be empty is what a
     * person reads, and that comes from `HOLD_LINE` when the column is null.
     *
     * So this asserts the thing that actually matters, on the hold that was
     * observed empty and on the one that now wins.
     */
    expect(HOLD_LINE["out-of-time"]).toBeTruthy();
    expect(HOLD_LINE["out-of-time"].length).toBeGreaterThan(20);
    expect(HOLD_LINE[CLAIMED_PATH_HOLD]).toBeTruthy();
  });
});
