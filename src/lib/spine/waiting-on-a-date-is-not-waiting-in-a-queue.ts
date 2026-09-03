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

/**
 * ── P-03b. A HOLD ONLY A PERSON CAN CLEAR DOES NOT TAKE A SLOT EVERY TICK ──
 *
 * The other side of this file's own finding. A track waiting on a DATE is
 * skipped by `deferred_until` (P-03a); a track waiting on a PERSON was still
 * fetched and driven every ten minutes, costing a slot each time to reach the
 * same refusal.
 *
 * MEASURED 2026-09-02. `6199f3df` holds `needs-a-waived-station` -- Plan is
 * waived on its route, so nothing will file a spec until somebody puts Plan back
 * or files one. Six consecutive sweep drives, 22:50 through 23:40 UTC, every one
 * with zero `agent_runs`, while the live acceptance candidate sat behind it.
 *
 * ── THE SET IS ONE HOLD, AND THE REASON MATTERS MORE THAN THE ENTRY ───────
 * A1 named `HOLD_NEEDS_PERSON`. That set is the right IDEA and the wrong list
 * for this mechanism, checked hold by hold:
 *
 *   given-up, station-cannot-finish,   already in `TERMINAL_HOLDS`, which the
 *   tools-refused, going-in-circles    sweep excludes before it gets here.
 *                                      Skipping them again buys nothing.
 *   waiting-on-a-person                has a pending gate by definition, and
 *                                      A1's own ruling keeps any track with a
 *                                      gate in the sweep. Correctly excluded.
 *   corrections-spent                  CLEARED BY FILING THE MISSING THING,
 *                                      which writes `prds` and
 *                                      `spine_track_members` and NOT
 *                                      `spine_tracks`. `updated_at` would not
 *                                      move, so skipping it strands the track --
 *                                      the exact failure this packet exists to
 *                                      avoid, arriving through its own fix.
 *
 * What is left is `needs-a-waived-station`, which is also the case that produced
 * the packet, and it is safe for a reason that had to be checked rather than
 * assumed: the only thing that clears it is a route change, and `steerRoute`
 * writes `waived` AND `updated_at` on `spine_tracks` in the same update
 * (`track.functions.ts`). So the signal moves the moment a person acts.
 *
 * `HOLD_NEEDS_PERSON` deliberately EXCLUDES this hold, and its header says why:
 * it groups `needs-a-waived-station` with `no-agent` and `paused` as "a roster,
 * a route or a kill switch has to change somewhere else". That is the right
 * reading for the question that set answers -- which chip a person sees -- and
 * the wrong one for this question, which is whether the sweep can tell that
 * nothing has changed. Two different questions, and reusing one set for both is
 * how the wrong tracks get skipped.
 */
export const HOLDS_A_PERSON_CLEARS_ELSEWHERE = ["needs-a-waived-station"] as const;

/**
 * Track ids to leave out of this sweep because nothing has changed since the
 * last time it looked.
 *
 * ── A GATE ALWAYS KEEPS ITS PLACE (A1's ruling, 2026-09-03) ───────────────
 * A person answering a gate writes to `agent_approvals`, never to
 * `spine_tracks`, so `updated_at` does not move and a skip on it alone would
 * strand a track the moment its gate was answered. Any track with an open gate
 * is therefore fetched regardless. It costs nothing: `pending_gates` is already
 * the column `decideDrive` reads to decide whether the work is waiting on
 * somebody.
 *
 * ── AND THE COMPARISON IS ONLY TRUE BECAUSE OF WHAT WRITES `updated_at` ───
 * Verified against `pg_trigger`: `spine_tracks` carries no `updated_at` trigger,
 * and the driver writes that column ONLY on a station move. Every hold write
 * sets `driven_at` alone. So `driven_at > updated_at` means "this track has not
 * changed since we last drove it", and it stops meaning that the moment
 * somebody adds `updated_at` to a hold write.
 */
export function unchangedSinceLastDrive(
  t: {
    id: string;
    last_hold?: string | null;
    driven_at?: string | null;
    updated_at?: string | null;
    pending_gates?: unknown;
  },
  now: Date = new Date(),
): boolean {
  void now;
  const hold = t.last_hold ?? null;
  if (!hold || !HOLDS_A_PERSON_CLEARS_ELSEWHERE.includes(hold as never)) return false;
  // An open gate always keeps its place. See the block above.
  const gates = Array.isArray(t.pending_gates) ? t.pending_gates.length : 0;
  if (gates > 0) return false;
  const driven = t.driven_at ? Date.parse(t.driven_at) : NaN;
  const updated = t.updated_at ? Date.parse(t.updated_at) : NaN;
  // Either date unreadable means we cannot say nothing changed, and a track we
  // cannot judge keeps its slot. The same direction every refusal here takes.
  if (Number.isNaN(driven) || Number.isNaN(updated)) return false;
  return driven > updated;
}
