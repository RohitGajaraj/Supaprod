/**
 * THREE DRIVES INTO THE SAME WALL DO NOT EARN A FOURTH TEN MINUTES LATER.
 *
 * ── WHAT IT COST, MEASURED ───────────────────────────────────────────────
 * The demo account spent 5,398 credits in one night for five sentences and one
 * track churning Build to Ship every ten minutes on a fault that was not the
 * crew's. Since the regrant it spent 2,566 more in under three hours, 2,469 of
 * them on `agent` -- and 36 of the 47 runs were a probe workspace whose five
 * tracks had nothing left to prove. A1 deferred those five by hand at 07:02
 * UTC. This is the rule that makes the hand unnecessary.
 *
 * ── WHY THE EXISTING CEILINGS DO NOT CATCH IT ────────────────────────────
 * `MAX_STATION_ATTEMPTS` counts attempts, and the expensive holds deliberately
 * do not count as attempts -- `out-of-time` costs the station nothing by
 * design, which is right. F-43's `MAX_STATION_DRIVES` catches a station that
 * never converges, at twelve drives, which is two hours of spend. Between them
 * sits the case that actually happens: a track that is dispatched, spends, and
 * comes back to the same place, over and over, with every counter behaving
 * exactly as designed.
 *
 * So this counts neither attempts nor dispatches. It asks the only question
 * that matters to a bill: did the last three drives change anything.
 *
 * ── IT DEFERS, IT DOES NOT STOP ──────────────────────────────────────────
 * 10 minutes, then 30, then 90. A track whose wall clears -- a claim released,
 * a credential fixed, a person answering elsewhere -- still recovers on its own
 * without anybody noticing it had been slowed down. That is the difference
 * between a backoff and the terminal parks this repo already has too many of,
 * and it is why `going-in-circles` is not what this reaches for.
 *
 * ── AND IT NEVER TOUCHES A HOLD THAT SPENDS NOTHING ──────────────────────
 * A track waiting on a person is not costing anything: the sweep already skips
 * it, and deferring it would only delay the moment it notices they answered. A
 * calendar wait is the same, and already has `deferred_until` for its own
 * reason. Backing either off would be this rule taking credit for silence.
 */

/** How many identical, fruitless drives before the first backoff. */
export const SAME_HOLD_BEFORE_BACKOFF = 3;

/** The ladder, in minutes. The last rung repeats. */
export const BACKOFF_MINUTES: readonly number[] = [10, 30, 90];

/**
 * Holds that cost nothing to leave alone.
 *
 * The first two are a person's to answer and the sweep already excludes them.
 * `needs-evidence` is the calendar wait: it owns `deferred_until` for its own
 * horizon, and a second writer on that column would be two rules arguing about
 * one date.
 */
export const NEVER_BACKED_OFF: ReadonlySet<string> = new Set([
  "waiting-on-a-person",
  "the-call-is-yours",
  "needs-evidence",
]);

/** One drive, as `track_drives` records it. */
export type DriveEntry = {
  /** `entry_hold`: the hold the drive STARTED with. */
  hold: string | null;
  /** `at`, ISO. */
  at: string;
};

/**
 * How long to hold this track back, or null to drive it as usual.
 *
 * `recent` is newest-first and may be shorter than three, in which case the
 * answer is always null: a track without three drives behind it has not
 * demonstrated anything yet.
 */
export function stuckBackoffMinutes(input: {
  recent: readonly DriveEntry[];
  /** The newest artifact this track has filed, ISO, or null for none. */
  newestArtifactAt: string | null;
}): number | null {
  const recent = input.recent;
  if (recent.length < SAME_HOLD_BEFORE_BACKOFF) return null;

  const hold = recent[0]?.hold ?? null;
  /* No hold is a track that moved. Nothing to back off. */
  if (!hold) return null;
  if (NEVER_BACKED_OFF.has(hold)) return null;

  /* How many of the most recent drives entered on this same hold. */
  let same = 0;
  for (const d of recent) {
    if (d.hold !== hold) break;
    same += 1;
  }
  if (same < SAME_HOLD_BEFORE_BACKOFF) return null;

  /*
   * AND IT MUST HAVE PRODUCED NOTHING. Three identical entry holds with an
   * artifact filed among them is a track that IS moving and happens to keep
   * arriving at the same gate -- Build committing to the same branch across
   * three drives, say. Backing that off would slow down work that is working.
   *
   * The window is the oldest of the drives being counted: anything filed since
   * then is progress, whoever filed it.
   */
  const since = recent[same - 1]?.at ?? recent[recent.length - 1]?.at ?? null;
  if (since && input.newestArtifactAt && input.newestArtifactAt > since) return null;

  const rung = Math.min(same - SAME_HOLD_BEFORE_BACKOFF, BACKOFF_MINUTES.length - 1);
  return BACKOFF_MINUTES[rung]!;
}

/** When the backoff lifts, as an ISO string. */
export function deferUntil(minutes: number, now: Date): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

/**
 * What the hold card says while a track is held back.
 *
 * Names the number and the time, because "this is paused" without either reads
 * as a fault. It is not a fault: the work is fine, the wall is real, and the
 * only thing being saved is money.
 *
 * Null once the time has passed, so a stale row never claims a wait that is
 * over.
 */
export function triedAgainLine(
  deferredUntil: string | null | undefined,
  now: Date,
  formatTime: (iso: string) => string = (iso) => iso.slice(11, 16),
): string | null {
  const iso = (deferredUntil ?? "").trim();
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at) || at <= now.getTime()) return null;
  return `Tried ${SAME_HOLD_BEFORE_BACKOFF} times with the same result; trying again at ${formatTime(iso)}.`;
}
