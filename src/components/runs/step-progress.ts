import { missionProgress } from "@/lib/delegate-desk";

/**
 * "STEP 6 OF 8" WHEN TWO OF THE SIX WERE SKIPPED.
 *
 * ── THE OVERSTATEMENT, SIZED ───────────────────────────────────────────────
 * `STEP_DONE` in `delegate-desk.ts:138-151` contains `"skipped"`, so
 * `missionProgress` counts a skipped step toward `done`. Measured against the
 * live database on 2026-08-27 (S4, service-role):
 *
 *   done 179 · SKIPPED 69 · planned 54 · failed 31 · running 8
 *   dispatched 8 · waiting_approval 7 · cancelled 4        (360 total)
 *
 * So 248 steps are presented as done and **69 of them were performed by
 * nobody. Better than one in four.** The reading a person takes from "step 6 of
 * 8" is "six of these eight were carried out", and it is wrong most of the time
 * it matters.
 *
 * ── WHY THE NUMERATOR IS NOT CHANGED ───────────────────────────────────────
 * The other repair was to exclude skipped from `done`, and it is worse. A
 * skipped step is genuinely BEHIND the run rather than ahead of it: the run is
 * not going back to it, and dropping it out of the numerator would make a
 * finished run read as "step 6 of 8" forever and look stalled. `missionProgress`
 * is not wrong about position. It is silent about composition.
 *
 * So the count stands and the omission is named: **"step 6 of 8, 2 skipped"**.
 * One clause, no arithmetic changed, and the reader gets the fact that decides
 * whether the number means what they think.
 *
 * ── WHY THIS LIVES HERE AND NOT IN `missionProgress` ───────────────────────
 * `delegate-desk.ts` is `src/lib/**` and belongs to S0, and `missionProgress`
 * has several consumers that ask a different question of it (a desk lane count
 * does not want this clause). Adding a field there to serve one surface would
 * put a display concern in a shared derivation. This wraps it instead, and the
 * `done`/`total` it returns are `missionProgress`'s own, unmodified, so the two
 * can never disagree about position.
 */

export interface StepProgress {
  /** Steps behind the run. Exactly `missionProgress().done`, never recomputed. */
  done: number;
  total: number;
  /** How many of `done` nobody performed. Zero renders no clause. */
  skipped: number;
}

/** Case and whitespace match `STEP_DONE`'s own normalisation. */
function isSkipped(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "skipped";
}

/**
 * Position from `missionProgress`, composition counted here.
 *
 * A non-array is treated as no steps rather than throwing, because this feeds a
 * card subtitle and a malformed payload must not take a surface down.
 */
export function stepProgress(steps: { status: string }[] | null | undefined): StepProgress {
  const list = Array.isArray(steps) ? steps : [];
  const { done, total } = missionProgress(list);
  return { done, total, skipped: list.filter((s) => isSkipped(s?.status)).length };
}

/**
 * The clause, or null when there is nothing to disclose.
 *
 * Null rather than "0 skipped": a run where every step was performed should say
 * nothing extra, and printing a zero would make the honest case the noisy one.
 */
export function skippedClause(progress: Pick<StepProgress, "skipped"> | undefined): string | null {
  if (!progress || progress.skipped <= 0) return null;
  return `${progress.skipped} skipped`;
}
