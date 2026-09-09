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
 * a read that has not answered yet. So the gate below never opened, and the
 * entry sat on *"Reading your workspace. Still reading."* -- for a read that
 * had definitively failed, on every attempt, for as long as anybody looked.
 *
 * The founder's own bar names this exactly: *"Empty, slow and wrong are the
 * states that decide whether it is trusted, and they are the ones that get
 * designed last."* This was WRONG rendering as SLOW, and the difference
 * matters more than any other pair on the page: slow asks you to wait, wrong
 * asks you to act, and the product was asking a person to wait for something
 * that was never coming.
 *
 * ── `failureCount` IS THE DISCRIMINATOR, NOT `isError` ────────────────────
 * A query that has failed and is now retrying reports `isPending` with no
 * data; `isError` only settles once the retries are spent, and a poll spends
 * them again on the next tick. `failureCount` is the one field that remembers
 * an attempt has already come back empty-handed, and it resets on success --
 * which is the exact question the gate needs answered.
 */
export type ReadState = {
  /** No data yet. */
  isPending: boolean;
  /** A request is in flight right now. */
  isFetching: boolean;
  /** Attempts that have come back with an error since the last success. */
  failureCount: number;
};

/** A read the hero must wait on: still working, and it has not failed yet. */
export function stillWorth(read: ReadState): boolean {
  return read.isPending && read.isFetching && read.failureCount === 0;
}

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
  queue: ReadState;
  runs: ReadState;
}): boolean {
  if (input.workspaceLoading || !input.seeded) return false;
  return !stillWorth(input.queue) && !stillWorth(input.runs);
}
