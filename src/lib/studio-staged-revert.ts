/**
 * IS THIS STAGED CHANGE A FIX, OR IS IT AN UNDO WEARING A FIX'S SUMMARY?
 *
 * ── WHY THIS IS ITS OWN MODULE (F-154, 2026-08-31) ────────────────────────
 * The rule is three lines and the argument for it is thirty, so it lives where
 * both can be read and where the rule can be TESTED rather than described. The
 * caller is `studio.fix.commit`, which sits inside a tool whose `run` needs a
 * live Supabase client; a predicate that needs nothing can be proven directly.
 *
 * ── WHAT HAPPENED ─────────────────────────────────────────────────────────
 * Two dispatched CI repair runs each staged a file byte-identical to its
 * `base_content` -- md5 equal on `AddressStep.tsx` (cf0adcc1) and
 * `checkout.test.ts` (4faac4ea) -- and both finished `completed`, `failure_kind`
 * null, summarising a fix as *"restoring syntactic validity"*. Committing that
 * would have written the pristine file over the changeset's own work and turned
 * CI green because the CHANGE was undone rather than the BUG fixed.
 *
 * The proximate cause was F-153: no `ref` on `repo.read`, so both runs read the
 * default branch, where the code compiles, and wrote back what they read. That
 * is fixed at the brief. This predicate is deliberately NOT that fix -- it
 * catches the class whatever causes it, which is what lets the loop run
 * unattended without an approval gate standing in front of it by accident.
 *
 * ── THE ONE THING NOT TO "CORRECT" ────────────────────────────────────────
 * `base_content` is captured on the FIRST stage of a path, so it is the pristine
 * pre-changeset snapshot rather than the current branch head. A later reader
 * will want to compare against the branch instead. Do not: equality against the
 * original snapshot on a path that was already fixed once means this run undid
 * the earlier fix too, which is still a revert and must still refuse. The
 * snapshot is the stronger comparison, not a stale one.
 */

/** The staged-row shape this rule needs, and nothing more. */
export interface StagedChangeLike {
  path: string;
  /** Null for a file this changeset CREATED, where "unchanged" is meaningless. */
  base_content?: string | null;
  new_content?: string | null;
}

/**
 * The paths whose staged content would put the file back exactly as this change
 * found it. Empty means nothing staged is an undo.
 *
 * A row with no `base_content` is a file the changeset created; there is no
 * "before" for it to be identical to, so it is excluded rather than guessed at.
 */
export function stagedRevertPaths(rows: readonly StagedChangeLike[] | null | undefined): string[] {
  return (rows ?? [])
    .filter((r) => typeof r.base_content === "string" && r.base_content === r.new_content)
    .map((r) => r.path);
}

/**
 * What the agent is told when its commit is refused.
 *
 * It names the branch confusion explicitly, because that is the failure that
 * produced this and the agent cannot see it from where it stands: on the default
 * branch the code genuinely does compile, so "I read it and it was fine" is a
 * true sentence about the wrong file. A refusal that only said "identical" would
 * send it back to stage the same thing again.
 */
export function revertRefusalMessage(paths: readonly string[]): string {
  const subject = paths.length === 1 ? "the staged file is" : "these staged files are";
  return `Refusing this commit: ${subject} identical to the version this change started from (${paths.join(", ")}), so committing would undo this change's own work rather than fix it. Check that you read the BRANCH named in your brief and not the default branch: on the default branch this code compiles, which is why it looks correct. Re-read the failing file with repo.read passing ref, stage a real fix, and try again. If the file genuinely needs no change, say that in your summary instead of staging it back unchanged.`;
}
