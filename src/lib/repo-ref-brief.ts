/**
 * THE ONE SENTENCE THAT TELLS AN AGENT WHICH COPY OF THE PROJECT TO READ.
 *
 * ── WHY THIS IS A MODULE AND NOT A STRING IN A BRIEF ──────────────────────
 * F-54 established the rule: a station working on a branch must pass `ref` to
 * the repository reads, or every read it makes answers a question about the
 * default branch instead. That ruling was written into ONE brief — the Build
 * station's, in `spine/driver.ts` — and on 2026-08-31 it cost us the thing it
 * was written to prevent, at a different brief that never heard about it.
 *
 * ── WHAT IT COST, MEASURED (F-153) ────────────────────────────────────────
 * Two CI fix runs dispatched against PRs #2 and #3. Both called
 * `repo.read {"paths":[...]}` with no `ref`, so both read the DEFAULT branch,
 * where the code compiles fine. Finding nothing wrong, each staged back exactly
 * what it had read — `md5(new_content) = md5(base_content)`, byte for byte, on
 * `AddressStep.tsx` and `checkout.test.ts`. Because `base_content` is the
 * pristine snapshot taken at first stage, that staged each file back to its
 * ORIGINAL PRE-CHANGE STATE: a full revert of the changeset's own work, filed
 * under a summary claiming *"restoring syntactic validity"*.
 *
 * The sharpest detail is that the evidence was in the room. `ci.logs` for PR #2
 * returned the compiler's own error text, which CONTAINS `&gt;` — the F-149
 * damage sitting on the branch. The run had the error in front of it, read a
 * different branch's copy of the file, concluded that copy was fine, and wrote
 * it back.
 *
 * ── SO IT LIVES IN ONE PLACE ──────────────────────────────────────────────
 * F-32's lesson is that a defect is a SHAPE rather than a location, and this is
 * the second time this exact shape has been paid for. Any brief that puts an
 * agent in front of a branch imports this. A third site that forgets is then a
 * missing import rather than a missing paragraph, which is the kind of mistake
 * a reader can see.
 */

/**
 * The instruction, or an empty string when there is no branch to name.
 *
 * Returns a leading blank line so it appends onto a brief without the caller
 * having to remember the spacing — the caller forgetting a detail is the whole
 * failure mode this module exists for.
 */
export function readOnBranchInstruction(branch: string | null | undefined): string {
  if (!branch) return "";
  return `\n\nThe work on this track is on branch \`${branch}\`, not on the default branch. Pass \`ref: "${branch}"\` to repo.tree, repo.read and repo.search, or you will be reading a copy of the project that does not contain it.`;
}
