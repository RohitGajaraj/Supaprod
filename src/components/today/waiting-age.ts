/**
 * HOW LONG THE OLDEST THING WAITING ON YOU HAS BEEN WAITING.
 *
 * ── THE HOLE THIS FILLS, MEASURED ──────────────────────────────────────────
 * Queried live 2026-08-26: this workspace holds **89 proposed missions waiting
 * on a person, and 85 of them are between 8 and 30 days old.** The oldest —
 * *"Watch: review recent signals"* — has been sitting for 21 days.
 *
 * The board caps a lane at three standing rows and folds the rest behind an
 * overflow control, which is the right call for a morning surface and is why
 * `standingRows` exists. But the cap means those 86 hidden rows are represented
 * by one number, and a count cannot say that most of them are rotting. A person
 * reads "Waiting on you 89", sees three fresh-looking rows, and has no way to
 * learn that the backlog behind them is three weeks deep.
 *
 * So the lane's own sentence says it once. One clause, no new row, no second
 * control: the section already claims *"Nothing moves on these until you
 * answer"*, and this is the other half of that fact.
 *
 * ── WHY THE OLDEST AND NOT A BUCKET COUNT ──────────────────────────────────
 * "85 have been waiting over a week" is the more complete fact and it was the
 * other candidate. It is not used, because it needs a threshold nobody has
 * ruled — a week is invented here — and an invented boundary printed as a fact
 * is the thing this product must not do. The oldest is an observation with no
 * parameter in it: something has waited this long, and that is checkable.
 *
 * ── ZERO IS A REAL VALUE HERE AND IT IS NOT A DATE ─────────────────────────
 * `feedInstant` returns **0 for a row nobody can date**, deliberately — its own
 * comment calls epoch "the honest floor" so an undated row sorts oldest rather
 * than landing unpredictably. Ask this file for the oldest age without knowing
 * that and it reports **twenty thousand days** with total confidence. Undated
 * rows are therefore excluded from the measurement, and excluded silently:
 * "the oldest has been waiting 21 days" stays true of the rows that carry a
 * date, and no sentence here claims to have measured the ones that do not.
 *
 * A future timestamp is refused for the same reason `ElapsedRunning` refuses
 * one — a clock ahead of ours would otherwise produce a negative age that
 * floors to a confident "0 days".
 */

/** A row as the board holds it: epoch ms, where 0 means nobody could date it. */
interface Datable {
  at: number;
}

/**
 * Whole days the oldest dated row has been waiting, or null when there is
 * nothing honest to say.
 *
 * NULL RATHER THAN ZERO on purpose. Under a day is not worth a clause on a
 * surface whose whole job is allocating attention, and "waiting 0 days" reads
 * as a bug even when it is arithmetic.
 */
export function oldestWaitingDays(rows: readonly Datable[], now: number): number | null {
  let oldest: number | null = null;
  for (const row of rows) {
    // 0 is "undated", not 1970. Future is a skewed clock, not a wait.
    if (!Number.isFinite(row.at) || row.at <= 0 || row.at > now) continue;
    if (oldest === null || row.at < oldest) oldest = row.at;
  }
  if (oldest === null) return null;

  const days = Math.floor((now - oldest) / 86_400_000);
  return days >= 1 ? days : null;
}

/**
 * The lane's sentence, with the age clause when there is one.
 *
 * The base sentence ALWAYS stands on its own. Nothing here can turn the note
 * into silence, because the note is what tells a person whose move it is, and
 * a read that has not answered must never be able to delete that.
 */
export function waitingNote(base: string, rows: readonly Datable[], now: number): string {
  const days = oldestWaitingDays(rows, now);
  if (days === null) return base;
  return `${base} The oldest has been waiting ${days} ${days === 1 ? "day" : "days"}.`;
}
