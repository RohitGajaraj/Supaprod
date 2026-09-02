/**
 * A CLAIMED PATH IS A HOLD. IT IS NOT A THING TO UNSTAGE AROUND.
 *
 * ── WHAT THE SEAT DID, 2026-09-02 22:00 UTC, ON A CUSTOMER'S REPOSITORY ───
 * `studio.commit` refused `src/checkout/AddressStep.tsx`: the tablet track's
 * mission held the claim. The refusal said *"Wait or release the claim."*
 *
 * The seat called `studio.unstage` on the claimed file, committed the two test
 * files that were left, opened pull request #5, and ran the checks. Typecheck,
 * test and lint all came back red -- because the tests it had just shipped
 * describe a component change that had been unstaged out from under them.
 *
 * So the refusal worked, the seat routed around it, and the result was a red
 * pull request on the bound repository. That is worse than the stall the
 * refusal was preventing.
 *
 * ── WHY THE SEAT WAS RIGHT TO THINK UNSTAGING WAS AN OPTION ───────────────
 * Because we told it so. `FILE_IT.build` says, of a DIFFERENT case: *"If
 * studio.commit refuses a path it may not write, call studio.unstage on that
 * path and commit the rest rather than stopping."* That is F-67 and it is
 * correct for a FORBIDDEN path -- a file outside the Build lane's write
 * boundary, which was never going to be committed by anyone and whose removal
 * leaves a coherent change behind.
 *
 * A CLAIM IS THE OPPOSITE SHAPE. The path is not forbidden; it is spoken for,
 * by work that is going to commit it shortly. Unstaging it does not leave a
 * coherent change, it leaves half of one -- and the half that remains is the
 * half that describes the missing half.
 *
 * ── SO THE TWO REFUSALS MUST NOT SOUND ALIKE ──────────────────────────────
 * "Wait or release the claim" reads like advice a seat may weigh against other
 * advice. It has to say what NOT to do, name the run that holds the path, and
 * say what will clear it -- because a seat that knows the claim clears when the
 * other run merges can stop and be right, and a seat that does not will keep
 * finding clever ways through.
 *
 * One writer for the sentence, so the tool's refusal and the seat's brief say
 * the same thing. Two copies is how the brief keeps telling a seat to unstage
 * after the tool stopped allowing it.
 */

/** What holds the path, as much of it as the record can name. */
export type ClaimHolder = {
  path: string;
  /** The other mission's title, when we could read it. */
  missionTitle?: string | null;
};

/**
 * The refusal a seat reads when a path is spoken for.
 *
 * Names the file, names the holder where we know it, forbids the escape by
 * name, and says what clears the claim. A refusal that only says "wait" is a
 * refusal that gets routed around, which is measured rather than supposed.
 */
export function claimedPathRefusal(held: ClaimHolder): string {
  const who = held.missionTitle ? ` by "${held.missionTitle}"` : " by another run";
  return (
    `This change touches ${held.path}, which is claimed${who} right now. ` +
    `Do NOT call studio.unstage on it and commit the rest: unstaging is for a path this lane may never write, ` +
    `and a claimed path is one that another run is about to write. Removing it would leave a change that describes work that is not there, ` +
    `which is how a pull request goes red on somebody's repository. ` +
    `Stop here and say so. The claim clears when the other run's pull request merges or closes, and this work continues then.`
  );
}

/**
 * The same rule, in the words a seat is briefed with before it runs.
 *
 * Appended to Build's filing instruction, immediately after the `studio.unstage`
 * sentence it has to be read against: the two cases sit together or the seat
 * meets the permissive one alone and generalises it.
 */
export const A_CLAIM_IS_NOT_A_FORBIDDEN_PATH =
  "That applies to a path this lane MAY NEVER WRITE, and to nothing else. " +
  "If studio.commit refuses a path because another run has CLAIMED it, do not unstage it and do not commit the rest: " +
  "the other run is about to write that file, and a commit without it ships tests and specs describing a change that is not there. " +
  "Stop, say which run holds it, and say that this continues when that run's pull request merges or closes.";

/**
 * The hold a track takes when a path it needs is spoken for.
 *
 * Its OWN reason, and the first draft's reuse of `needs-evidence` was a live
 * defect rather than a style choice: `HOLDS_THAT_WAIT_ON_A_DATE` contains that
 * one, so the sweep would have read a twenty-minute claim as "waiting until this
 * track's forecast horizon" and -- since P-03a -- written that date into
 * `deferred_until` and stopped fetching the row. Waiting on a date nobody can
 * bring forward and waiting on a run that is minutes away are the same shape and
 * opposite urgency.
 */
export const CLAIMED_PATH_HOLD = "waiting-on-another-run" as const;

/**
 * What the Start row and the track say while it waits.
 *
 * Names the other run, because "waiting on another change" that does not say
 * WHICH change sends a person to press Run it now and hit the same wall. That
 * is the failure this sentence exists to prevent, and it is the same reason the
 * refusal above names the holder.
 */
/**
 * The path back out of the sentence above.
 *
 * The hold carries the path and nothing else that a lookup cannot re-derive, so
 * this is the one thing the door has to parse rather than query. Written beside
 * the composer on purpose: a reader changing the sentence meets the parser that
 * depends on it, which is the only way two halves of a round trip stay in step.
 */
export function pathFromWaitingSentence(sentence: string | null | undefined): string | null {
  const m = /also changes ([^\s]+?)\.(?:\s|$)/.exec(sentence ?? "");
  return m?.[1] ?? null;
}

export function waitingOnAnotherRun(held: ClaimHolder & { prNumber?: number | null }): string {
  const who = held.missionTitle ? `the ${held.missionTitle} run` : "another run";
  const pr = held.prNumber ? ` (pull request #${held.prNumber})` : "";
  return `Waiting on another change: ${who}${pr} also changes ${held.path}. This continues when it merges or closes.`;
}
