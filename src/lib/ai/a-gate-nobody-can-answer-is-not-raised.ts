/**
 * A GATE NOBODY CAN ANSWER IS NOT RAISED.
 *
 * ── THIS GUARDS A GAP, AND IT IS NOT THE ONE WE THOUGHT WE SAW ───────────
 * Said plainly because the near-miss is the useful part: on 2026-09-04 a merge
 * gate rose on the tablet track and two of us, separately, reported it as a
 * gate raised over red CI. It was not. The trace settles it:
 *
 *   05:51:27  studio.checks.run   typecheck failed
 *   05:52:57  studio.commit       the seat fixed them
 *   05:53:44  studio.checks.run   typecheck failed again
 *   05:54:14  studio.commit       the seat fixed them again
 *   05:54:33  studio.checks.run   PASSED
 *   05:54:40  the gate rose
 *
 * Seven seconds after green. Both reports came from reading a checks result
 * that was two commits stale, which is the same mistake in miniature that this
 * file exists to prevent at a larger scale, and the rule it produced is: read
 * the checks at the HEAD before any merge read or press.
 *
 * ── SO WHY KEEP IT ───────────────────────────────────────────────────────
 * Because `mergeReadinessFromCi` already refuses a merge while CI is red, and
 * that refusal fires AFTER the press. A gate raised in that state asks a person
 * a question with two non-answers: approving spends the press and hits the
 * block, declining says no to a change nobody objects to.
 *
 * And while the gate stands the run is `waiting_approval`, which P-114 found
 * was counted as a live worker -- so the CI fix loop skipped the changeset, and
 * the one process that could turn the checks green was held by the question
 * that needed them green. P-114 breaks that circle from the other side. This
 * stops it forming.
 *
 * NO MEASURED INSTANCE. The seat fixed its own checks here, which is the loop
 * working. This is the cheap guard on the case where it does not.
 *
 * ── THE ASYMMETRY THAT DECIDES WHEN IT IS SAFE TO REFUSE ─────────────────
 * Only a RED result refuses. Green and pending and unknown all raise the gate
 * as before, and the tool re-proves the checks at the head sha when it
 * executes, so nothing here is trusted as permission -- it is only ever used to
 * decline to ask.
 *
 * That is the whole safety argument. A stale red is at worst a gate raised one
 * cycle later, when the seat re-runs the checks and they pass. A stale green
 * would be a merge on evidence nobody re-read, which is why this file cannot
 * approve anything and does not try.
 */

/** The gates whose answer the product has already decided when CI is red. */
export const CI_GATED_TOOLS: ReadonlySet<string> = new Set(["studio.pr.merge"]);

/** The shape `studio.checks.run` returns, as much of it as this needs. */
export type ChecksResult = {
  checks?: Array<{ name?: string | null; passed?: boolean | null }> | null;
} | null;

/**
 * The checks this run last saw fail, or an empty list.
 *
 * An absent or unreadable result yields NOTHING FAILING, deliberately: this
 * decides whether to withhold a question from a person, and withholding one on
 * a payload we could not parse would hide a real decision behind a parser bug.
 */
export function failingCheckNames(result: ChecksResult): string[] {
  const checks = result?.checks;
  if (!Array.isArray(checks)) return [];
  return checks
    .filter((c) => c && c.passed === false)
    .map((c) => (c?.name ?? "a check").trim())
    .filter((n) => n.length > 0);
}

/**
 * Should this gate be withheld, and what does the seat need to hear?
 *
 * Returns null when the gate should go up exactly as before.
 */
export function refusalForRaisingOverRedChecks(input: {
  toolName: string;
  /** The newest `studio.checks.run` result on this run, if there is one. */
  lastChecks: ChecksResult;
}): string | null {
  if (!CI_GATED_TOOLS.has(input.toolName)) return null;
  const failing = failingCheckNames(input.lastChecks);
  if (failing.length === 0) return null;
  return (
    `${input.toolName} was not put in front of a person, because the checks you just ran are red: ` +
    `${failing.join(", ")}. The merge would be refused for exactly that reason, so asking would ` +
    `spend somebody's attention on a decision this product has already made. Fix the failing ` +
    `checks and commit again; the gate goes up on its own once they pass.`
  );
}
