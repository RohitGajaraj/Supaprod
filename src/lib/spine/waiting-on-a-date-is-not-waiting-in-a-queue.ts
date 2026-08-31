/**
 * A TRACK WAITING ON A KNOWN DATE SHOULD NOT TAKE A DRIVE SLOT UNTIL THAT DATE
 * (F-183, proposed by S4 as S4-179).
 *
 * ── WHAT IT COSTS TODAY, MEASURED ────────────────────────────────────────────
 * Drives since 18:00 UTC on 2026-08-31, four live tracks:
 *
 *   6817e386  build  waiting-on-a-person      6
 *   6199f3df  build  needs-a-waived-station   5
 *   d2263583  learn  needs-evidence           5     <- waiting until 2026-10-15
 *   060bc5ff  sense  (working)                2     <- the acceptance candidate
 *
 * **Ten of eighteen drives went to two tracks that cannot progress**, and the
 * one piece of work that can got two. The sweep is sequential against a shared
 * 45-second deadline, so a slot spent on a track that will hold is a slot the
 * live one does not get.
 *
 * ── THIS IS A SCHEDULE, NOT A HOLD CLASSIFICATION, AND THAT IS THE POINT ─────
 * The tempting fix is to add these holds to `TERMINAL_HOLDS` so the sweep skips
 * them. **That is refused and S4 refused it first:** a terminal hold means "the
 * sweep will never act on this again", and marking a track terminal deletes the
 * only signal that it exists. `d2263583` is not stuck and nothing is wrong with
 * it — it is **correctly** waiting for a forecast horizon, and it has a DATE.
 * Work with a known return date does not need to be called dead; it needs to be
 * told *not before then*. `needs-a-waived-station` is a genuinely different
 * question (F-155, a hold only a person can clear) and is deliberately NOT
 * handled here.
 *
 * ── WHY THIS IS A FILTER AND NOT A COLUMN, WHICH IS NOT THE DESIGN I WANTED ──
 * The right shape is `spine_tracks.not_before timestamptz`, set by the driver
 * when it holds with a known date, and one `.or()` in the sweep's own query.
 * **`ALTER TABLE` is refused on this database (F-180)** — verified four times,
 * three statements — so the column cannot be added today. This over-fetches and
 * filters in code instead, which costs one extra read per tick and is honest
 * about being the second-best shape. **When F-180 clears, replace this.**
 */

/** What the filter needs from a candidate row, and nothing more. */
export type ScheduleCandidate = {
  id: string;
  last_hold?: string | null;
};

/**
 * The holds that can carry a return date. Deliberately one entry: every other
 * hold either clears on the next tick or needs a person, and neither is a
 * schedule. A hold added here without a date source silently never skips, which
 * is safe but pointless — so add the date source in the same commit.
 */
export const HOLDS_THAT_WAIT_ON_A_DATE = ["needs-evidence"] as const;

/**
 * Track ids to leave out of this sweep because they are waiting on a date that
 * has not arrived.
 *
 * A candidate with no entry in `dueByTrackId` is NEVER skipped: `needs-evidence`
 * also means "no source is connected and no station can make one", which has no
 * date and must keep its slot. **Absent is not the same as future**, which is
 * the same law as F-76 and the reason this takes a map rather than a nullable.
 */
export function scheduledAwayIds(
  candidates: readonly ScheduleCandidate[],
  dueByTrackId: ReadonlyMap<string, string | null>,
  now: Date,
): Set<string> {
  const out = new Set<string>();
  for (const c of candidates) {
    const hold = c.last_hold ?? null;
    if (!hold || !HOLDS_THAT_WAIT_ON_A_DATE.includes(hold as never)) continue;
    const due = dueByTrackId.get(c.id);
    if (!due) continue;
    const at = Date.parse(due);
    // An unparseable date is not a future date. Skipping on one would strand a
    // track for ever on a typo, which is strictly worse than driving it.
    if (Number.isNaN(at)) continue;
    if (at > now.getTime()) out.add(c.id);
  }
  return out;
}

/**
 * Keep the sweep's own ordering and take the first `limit` that are not
 * scheduled away. Separate from the predicate so the ordering guarantee — the
 * `driven_at ASC nullsFirst` fairness the sweep depends on — is asserted on its
 * own rather than inside a filter.
 */
export function pickDrivable<T extends ScheduleCandidate>(
  ordered: readonly T[],
  skip: ReadonlySet<string>,
  limit: number,
): T[] {
  return ordered.filter((c) => !skip.has(c.id)).slice(0, limit);
}
