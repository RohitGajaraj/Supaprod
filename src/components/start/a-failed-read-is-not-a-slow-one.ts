/**
 * ── WHEN THE ENTRY MAY DRAW ITS HEADLINE ──────────────────────────────────
 *
 * The hero waits for the reads that fill it, so it says its sentence once
 * rather than changing subject under a reader. That is right, and it had one
 * failure mode nobody had met until 2026-09-10:
 *
 * **A POLLING READ THAT ALWAYS FAILS IS NEVER "FINISHED FAILING".** `runs`
 * carries `refetchInterval: 10_000`. Every ten seconds it goes back to
 * `fetchStatus: "fetching"` with no data, which is byte-for-byte the state of
 * a read that has not answered yet. So the gate never opened, and the entry
 * sat on *"Reading your workspace. Still reading."* -- for a read that had
 * definitively failed, on every attempt, with a Try again that re-ran it.
 *
 * The founder's own bar names this exactly: *"Empty, slow and wrong are the
 * states that decide whether it is trusted, and they are the ones that get
 * designed last."* This was WRONG rendering as SLOW, and the difference
 * matters more than any other pair on the page: slow asks you to wait, wrong
 * asks you to act, and the product was asking a person to wait for something
 * that was never coming. `Hero` has taken a `failed` flag all along and never
 * got the chance to use it.
 *
 * ── THE READ LOGIC IS NOT HERE, AND THAT IS THE POINT ─────────────────────
 * `stillWaiting` (`@/lib/query-state`) has owned "has an answer arrived" since
 * 2026-08-06 and has been repaired three times by three surfaces meeting the
 * same shape from different angles -- an error that never settled, a disabled
 * query that never fired, an empty read read as an empty workspace. Its own
 * docstring states the rule this file obeys: *"Fixed in six places it drifts;
 * fixed here it cannot."*
 *
 * So the `failureCount` clause went THERE, where eleven surfaces get it, and
 * what stays here is the only part that is the entry's own: which reads the
 * headline rests on, and the two conditions that are not about reads at all.
 */
import { stillWaiting, type AnswerableQuery } from "@/lib/query-state";

/**
 * May the entry draw its headline?
 *
 * `seeded` is the caller's own condition: the composite has answered for this
 * workspace, either way. It stays the caller's because it depends on whether a
 * workspace exists at all, which is not a question about reads.
 */
export function heroCanDraw(input: {
  workspaceLoading: boolean;
  seeded: boolean;
  queue: AnswerableQuery;
  runs: AnswerableQuery;
}): boolean {
  if (input.workspaceLoading || !input.seeded) return false;
  return !stillWaiting(input.queue, input.runs);
}
