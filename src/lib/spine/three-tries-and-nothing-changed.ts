/**
 * THREE DRIVES THAT CHANGED NOTHING DO NOT EARN A FOURTH TEN MINUTES LATER.
 *
 * Named for the rule it ended up with. It shipped as "three of the same" and
 * the measurement below retired that question within the hour; a filename that
 * still asked it would be the first thing to mislead the next reader.
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
 * ── AND IT ASKS THAT, NOT "WAS IT THE SAME WALL" (P-113b) ────────────────
 * The first version required the three drives to have entered on the SAME
 * hold. Simulated against the night it was written for -- the tablet track,
 * 26 drives, 11 runs, $0.3971 -- it prevented TWO drives and saved 8%, because
 * the churn alternates: `self-check-failed`, `out-of-time`,
 * `self-check-failed`, `out-of-time`, four times in the last hour alone. It
 * caught the one genuine run of six identical drives at 23:00 and let the rest
 * of the night through.
 *
 * A1's call, on those numbers: the claim worth making is "nothing is changing",
 * not "the same thing keeps happening". A track failing in two ways alternately
 * is still a track filing nothing and spending every ten minutes. Same
 * exemptions, same ladder; only the question is wider, and it takes the
 * measured saving from 8% to 31% on the same window.
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

import { clockInZone, monthDayInZone, sameCalendarDay } from "@/lib/time-of-day";

/** How many fruitless drives before the first backoff. */
export const DRIVES_BEFORE_BACKOFF = 3;

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
  if (recent.length < DRIVES_BEFORE_BACKOFF) return null;

  const hold = recent[0]?.hold ?? null;
  /* No hold is a track that moved. Nothing to back off. */
  if (!hold) return null;
  if (NEVER_BACKED_OFF.has(hold)) return null;

  /*
   * How many of the most recent drives got nowhere -- any hold, not this one.
   *
   * The run ends at the first drive that MOVED (no hold) or that stopped on a
   * hold this rule does not price. Both are the same statement: the track
   * stopped being a thing that spends for nothing, so the count starts again.
   */
  let stuck = 0;
  for (const d of recent) {
    if (!d.hold || NEVER_BACKED_OFF.has(d.hold)) break;
    stuck += 1;
  }
  if (stuck < DRIVES_BEFORE_BACKOFF) return null;

  /*
   * AND IT MUST HAVE PRODUCED NOTHING. Three held drives with an artifact filed
   * among them is a track that IS moving and happens to keep stopping -- Build
   * committing to the same branch across three drives, say. Backing that off
   * would slow down work that is working, which is the one cost this rule must
   * not impose.
   *
   * The window is the oldest of the drives being counted: anything filed since
   * then is progress, whoever filed it.
   */
  const since = recent[stuck - 1]?.at ?? recent[recent.length - 1]?.at ?? null;
  if (since && input.newestArtifactAt && input.newestArtifactAt > since) return null;

  const rung = Math.min(stuck - DRIVES_BEFORE_BACKOFF, BACKOFF_MINUTES.length - 1);
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
 *
 * ── THE DAY, NOT JUST THE CLOCK (P-143) ───────────────────────────────────
 * A raw UTC slice read *at 00:00* for a track deferred seventeen days out --
 * the moment was real, the sentence just described it as a coin flip on
 * tonight. `zone` (P-130's `dateTimeInZone`) makes a same-day retry read the
 * clock (*at 12:40*) and a later one read the day (*on Sep 21*), never a bare
 * clock a reader would place today.
 *
 * ── AND THE FORECAST HORIZON IS NOT A RETRY (P-143) ───────────────────────
 * `deferred_until` also carries the calendar wait's own horizon (P-113b's own
 * comment: `needs-evidence` owns that column for its own reason). Three tries
 * never happened there -- nothing drove the track three times, it is waiting
 * on a date -- so `isForecastHorizon` swaps the sentence for the one this
 * repo already uses for that wait (`calendarWaitLine`'s own wording) instead
 * of claiming a retry count that has no drives behind it.
 */
export function triedAgainLine(
  deferredUntil: string | null | undefined,
  now: Date,
  options?: { zone?: string; isForecastHorizon?: boolean },
): string | null {
  const iso = (deferredUntil ?? "").trim();
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at) || at <= now.getTime()) return null;
  const zone = options?.zone ?? "UTC";
  if (options?.isForecastHorizon) {
    return `Learn returns on ${monthDayInZone(iso, zone)}.`;
  }
  const when = sameCalendarDay(iso, now.toISOString(), zone)
    ? `at ${clockInZone(iso, zone)}`
    : `on ${monthDayInZone(iso, zone)}`;
  /* "and nothing changed", not "with the same result": the three drives may
     have stopped on different holds, and claiming they were identical would be
     a sentence the record does not support (P-113b). */
  return `Tried ${DRIVES_BEFORE_BACKOFF} times and nothing changed; trying again ${when}.`;
}
