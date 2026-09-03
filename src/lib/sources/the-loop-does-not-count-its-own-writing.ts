/**
 * ── A ROW THE LOOP WROTE ABOUT ITSELF IS NOT EVIDENCE ─────────────────────
 *
 * R-37 / P-41. On the founder's own run at 14:41 IST the Researcher called
 * `signals.log` twice and wrote two rows into Helio Labs (`source: "agent"`,
 * `source_kind: "manual"`, no product) restating a theme that was already
 * there, having read nothing outside the workspace. The 14:50 sweep found them,
 * counted them as this track's only evidence, and advanced it to Decide, while
 * another seat reading the same two rows by id still reported there was no
 * evidence for the sentence. **The run was carried on evidence the run had
 * just written about itself.**
 *
 * This is not new and that is the point. `signals.log`'s own header measured it
 * a week earlier in workspace `0b792d52`: 54 of 75 rows agent-authored, at least
 * 16 of them notes about absence, one genuine customer request buried under
 * fifty-two of the loop's own reports of failure. Every Discover pass reads
 * those as evidence, which makes it self-reinforcing: the more the loop fails to
 * find something, the more it writes about failing, the harder the real customer
 * voice is to see.
 *
 * TWO HALVES, AND BOTH ARE NEEDED.
 *
 *   the write   `signals.log` now refuses a row that cannot name a source
 *               outside this loop, so no new row can be born this way.
 *   the read    this rule, because the rows already written are still there and
 *               still being counted, and deleting a customer's data to fix our
 *               bug is not ours to do.
 *
 * WHY `source` AND NOT `source_kind`. `source_kind: "manual"` is honest and is
 * shared with rows a PERSON pasted in by hand, which are real evidence and the
 * most valuable kind in a young workspace. The thing that makes a row ours is
 * that nothing outside named it, and `source` is where that is recorded.
 */

/** The value `signals.log` used to default to when no source was named. */
export const LOOP_AUTHORED_SOURCE = "agent";

/**
 * Applied to any PostgREST query over `signals` that COUNTS or SURFACES
 * evidence. Not applied to reads that exist to show a person their whole
 * record: hiding a row from its owner is a different decision from refusing to
 * count it as proof, and this rule is only the second one.
 */
export function excludeLoopAuthored<T extends { neq: (col: string, val: string) => T }>(q: T): T {
  return q.neq("source", LOOP_AUTHORED_SOURCE);
}
