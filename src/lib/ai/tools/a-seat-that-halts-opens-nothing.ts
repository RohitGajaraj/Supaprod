/**
 * ── R-40: A SEAT THAT HALTS OPENS NOTHING (P-72) ─────────────────────────
 *
 * The product's first change to reach Ship was 90 lines of CSS for
 * `.address-summary` selectors, plus one line in `AddressStep.tsx`, in a repo
 * with no address summary component. The Build seat's own transcript on that
 * track says it plainly:
 *
 *   "there is no address summary component ... I must halt and state plainly
 *    that the work belongs elsewhere"
 *
 * It then opened a pull request and merged it on a green check.
 *
 * ── THE SEAT WAS RIGHT AND HAD NO WAY TO SAY SO ──────────────────────────
 *
 * That is the whole finding. The seat reached the correct conclusion, wrote it
 * in prose, and prose is not a control: the loop had no tool for "the target is
 * not here", so the only shapes available to it were to produce something or to
 * fail. It produced something.
 *
 * `build.halt` is the missing verb, and the refusal below is what makes it more
 * than a note: once a seat has halted in a run, the writing tools in that same
 * run refuse. A halt that only records a sentence would be the prose again.
 */

/** Tool names that put a change into the world. Refused after a halt. */
export const WRITES_AFTER_A_HALT = [
  "studio.commit",
  "studio.fix.commit",
  "studio.pr.open",
  "studio.pr.merge",
  "github.commit.append",
  "github.pr.open",
  "release.publish",
] as const;

/** What the halted seat is told when it reaches for one of them anyway. */
export function refusalAfterHalt(reason: string): string {
  return (
    `You halted this build: "${reason}" A halt is a conclusion about the work, not a pause, ` +
    "so nothing is committed, opened or merged after it in this run. If the halt was wrong, say " +
    "why it was wrong rather than working around it; if it was right, this run is finished and " +
    "the person will read your reason."
  );
}

/**
 * The hold a halted Build takes.
 *
 * `waiting-on-a-person` rather than `produced-nothing`, and the distinction is
 * the point: `produced-nothing` reads "the run worked and its output went
 * nowhere", which points at the crew. A seat that halted did its job correctly
 * and the next move is a person's -- bind another repository, or amend the spec.
 */
export const HALTED_BUILD_HOLD = "waiting-on-a-person" as const;

/**
 * The sentence the run screen shows, which is the SEAT'S OWN, not a template.
 *
 * The seat has already explained the problem better than any fixed string
 * could: it names the component, the repository and what it looked for. A
 * generic "the build could not proceed" would throw that away and send a person
 * to the transcript to find out what this line was supposed to say.
 */
export function haltedBuildLine(reason: string): string {
  const said = reason.trim().replace(/\s+/g, " ");
  return said
    ? `Build stopped and did not open anything: ${said}`
    : "Build stopped and did not open anything, and gave no reason for it.";
}
