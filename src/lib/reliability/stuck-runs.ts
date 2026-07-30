/**
 * The ceiling on a run that says it is working and is not. Pure, no I/O.
 *
 * WHY THIS EXISTS. The founder found a run on his own workspace that had been
 * `status='running'` for fifteen days: zero tokens, zero spend, no checkpoint,
 * no worker. The header reported it as live the entire time, because the
 * header was faithfully reading a record that was wrong.
 *
 * `resume-runs` already sweeps for evicted workers, and it could not help,
 * because its only give-up path is scoped to missions that never planned:
 *
 *     if (stepCount > 0) continue;
 *     if (activeRuns > 0) continue;
 *     if (m.created_at < abandonCutoff) toAbandon.push(m.id);
 *
 * A mission WITH steps, or WITH an active run, is exempt from the only age
 * guard in the system. So the exact shape most likely to be genuinely stuck,
 * a planned mission whose worker died mid-step, had no ceiling at all and
 * could sit forever. Founder ruling 2026-07-30: "let's put it with the sweeper
 * ceiling so that any agent that's being stuck for a while would be killed
 * after a while with some notice or a message, and notifying the next agent or
 * a human that this happened due to this."
 *
 * THE MEASURE IS PROGRESS, NEVER AGE. A run that checkpointed a minute ago is
 * working, whether it started ten minutes or ten days back. Killing on total
 * age would murder exactly the long, valuable runs this product exists to make
 * possible. So the clock is time since the last sign of life, and a run resets
 * it every time it proves it is alive.
 *
 * AND THE EXCLUSION THAT MATTERS MOST: `waiting_approval` is never stuck. It is
 * waiting on a HUMAN, legitimately, possibly for days, and a person who comes
 * back on Monday to find the product killed their work over the weekend for
 * not answering fast enough has learned never to trust it with anything. The
 * governance canon puts the human's judgment above the machine's impatience:
 * the gate is the exception, and the exception does not get a timer.
 */

/** Statuses that claim the system is doing something right now. */
const IN_FLIGHT = new Set(["running", "queued"]);

/**
 * How long a run may show no sign of life before it is presumed dead.
 *
 * Deliberately far above `resume-runs`' own 2-minute eviction window, so the
 * sweeper gets roughly sixty attempts to bring a run back before anything is
 * given up on. Killing a run that resume would have rescued is the expensive
 * mistake here; waiting an extra half hour to be sure is the cheap one.
 */
export const DEFAULT_STUCK_MS = 60 * 60_000;

export type StuckCandidate = {
  status: string;
  /** Last time the run proved it was alive. Null means it never did. */
  last_checkpoint_at: string | null;
  created_at: string;
};

/** Milliseconds since this run last showed a sign of life. Null if unreadable. */
export function silentFor(run: StuckCandidate, nowMs: number): number | null {
  const stamp = run.last_checkpoint_at ?? run.created_at;
  const t = Date.parse(stamp);
  // An unparseable timestamp is not evidence of death. Returning null here
  // means the caller leaves the run alone, which is the right direction to
  // fail for a control whose action is destructive.
  if (Number.isNaN(t)) return null;
  return nowMs - t;
}

/**
 * True when a run claiming to be in flight has shown no sign of life past the
 * ceiling. Fails SAFE: anything unreadable, or any status outside the in-flight
 * set, is not stuck.
 */
export function isRunStuck(
  run: StuckCandidate,
  nowMs: number,
  ceilingMs: number = DEFAULT_STUCK_MS,
): boolean {
  if (!IN_FLIGHT.has(run.status)) return false;
  const silent = silentFor(run, nowMs);
  if (silent === null) return false;
  return silent > ceilingMs;
}

/** Whole hours, floored, for a sentence a person reads rather than a duration. */
function hoursSilent(ms: number): number {
  return Math.max(1, Math.floor(ms / 3_600_000));
}

/**
 * What the record will say happened, and why.
 *
 * This is the "notice" half of the founder's ruling, and it is written for two
 * readers at once. A PERSON sees it on the stopped run. The NEXT AGENT sees it
 * too: `advanceMissionCore` copies `halted_reason` onto the failed step, so the
 * mission's own plan carries the reason forward rather than a bare "failed".
 *
 * It says what was observed, never what it assumes. "No checkpoint" and "last
 * checkpoint 3h ago" are different failures (one never started, one died
 * mid-flight) and a person debugs them differently, so they are never collapsed
 * into one sentence.
 */
export function stuckReason(run: StuckCandidate, nowMs: number): string {
  const silent = silentFor(run, nowMs) ?? 0;
  const h = hoursSilent(silent);
  const window = h === 1 ? "an hour" : `${h} hours`;
  return run.last_checkpoint_at
    ? `Stopped automatically: no progress for ${window}. The run checkpointed and then went quiet, so its worker is presumed gone. Nothing it had already done was undone.`
    : `Stopped automatically: never started. The run was ${run.status} for ${window} without reaching its first checkpoint, so it never reached a model. Nothing was spent.`;
}
