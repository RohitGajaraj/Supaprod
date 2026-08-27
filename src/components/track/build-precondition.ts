import type { RepoResolution } from "@/lib/build/repo-gate";

/**
 * WHEN A STATION CANNOT SUCCEED, THE SCREEN SHOULD SAY SO RATHER THAN PROMISE
 * ANOTHER TRY.
 *
 * ── WHAT A PERSON SAW, ON A REAL RUN ──────────────────────────────────────
 * Track `6199f3df` sat at Build under this hold:
 *
 *     "This station ran but filed nothing, so there is nothing to hand to the
 *      next one. It will try again."
 *
 * It had tried six times. Every attempt is in the transcript directly below,
 * and every one says the same thing in the agent's own words: *"GitHub is not
 * connected, so I cannot access the repository structure or files needed to
 * implement the fix."* The work cannot move, nothing on the hold line says why,
 * and the one sentence a person reads is a promise that it will happen again.
 *
 * ── THE COST, MEASURED ────────────────────────────────────────────────────
 * 11 runs across 5 tracks carry that message, 373,096 tokens between them, the
 * earliest on 2026-07-20 and the latest at 00:20 today. That is a loop the
 * product knew was futile: `canDispatchToRepo` has existed the whole time and
 * `ReadyToBuild` already gates its own button on it. The run screen never
 * asked.
 *
 * ── WHY THIS IS NOT "BRANCHING ON WORDING" ────────────────────────────────
 * TrackRun's own rule is that a hold's meaning is read from the RAW reason and
 * never from prose, because branching on wording is how every hold once painted
 * amber. This obeys that. It does not read the agent's sentence and it does not
 * read the hold's. It asks the same server function the dispatch path asks --
 * `resolveGitHub`, via `classifyRepoResolution` -- and acts on a three-valued
 * verdict that is a fact about the workspace's bindings.
 *
 * ── AND IT SPEAKS ONLY WHEN IT KNOWS ──────────────────────────────────────
 * `unknown` is silent. A check that cannot resolve a repo because the check
 * itself failed must not tell somebody their repository is missing: that is the
 * shape `new-build.functions.ts` records as "the worst shape a pre-flight check
 * can take -- it does not merely fail to help, it contradicts the truth and
 * talks a person out of" the thing that would have worked.
 */
export function buildBlocked(input: {
  station: string;
  /** True only when the run screen is actually showing a hold. */
  held: boolean;
  /** The verdict from `canDispatchToRepo`, or null while it is unread. */
  resolution: RepoResolution | null | undefined;
}): { line: string; door: string } | null {
  if (!input.held) return null;
  // Build is the only station that opens a pull request. Ship promotes one that
  // already exists, and a missing binding there fails differently.
  if (input.station !== "build") return null;
  if (input.resolution !== "not_connected") return null;

  return {
    /*
     * Two facts and no instruction, because the door beside it is the
     * instruction. The first says what is missing; the second says why the
     * retry the hold promises cannot work, which is the thing the person
     * cannot work out from the screen they are looking at.
     */
    line: "Build has no repository to open a pull request in, so nothing it tries here can land. That is why it keeps filing nothing.",
    door: "Connect a repository",
  };
}
