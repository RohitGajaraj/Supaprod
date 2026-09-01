/**
 * What a surface scored, and whether anything behind that figure is failing.
 *
 * ── PULLED OUT BECAUSE THE BUG WAS UNREACHABLE WHERE IT LIVED (2026-09-01) ─
 * This arithmetic sat inline in `EvalCalibrationPanel`, and it printed
 * `Math.round(avgScore * 100)` with a per-cent sign. `avg_score` is a JUDGE
 * SCORE OUT OF 100 -- production that day: 19 scored runs, min 68, max 91,
 * mean 84.63 -- so every guarded surface on Quality > By surface showed a
 * figure two orders of magnitude wrong, and nothing in the repo could see it,
 * because a number computed inside a component's render body has no seam a
 * test can reach.
 *
 * It is the same lesson `src/lib/search-flag.ts` was written for eleven days
 * earlier, in a different shape: the untestable place is where the wrong thing
 * survives.
 */

/** One suite's latest result, as the panel has it. */
export type SuiteResult = {
  /** Mean judge score of the latest run, out of 100. Null when it never ran. */
  score: number | null;
  /** This suite's own bar, `eval_suites.pass_threshold`. 70 to 80 in production. */
  passThreshold: number;
};

export type SurfaceScore = {
  /** Mean of the suites that have a score. Out of 100, NEVER a ratio. */
  avgScore: number | null;
  /** How many scored suites met their own threshold. */
  clearing: number;
  /** How many suites had a score at all. */
  runCount: number;
};

/**
 * EACH SUITE AGAINST ITS OWN THRESHOLD, and that is the part the old code could
 * not have done at all. It compared one aggregate against a hardcoded 90.
 * Thresholds are per suite and range 70 to 80, so averaging them and comparing
 * once lets a lenient suite carry a strict one -- a surface reads "clear" while
 * the suite that actually guards it is failing.
 */
export function scoreSurface(results: readonly SuiteResult[]): SurfaceScore {
  const scored = results.filter((r): r is SuiteResult & { score: number } => r.score != null);
  if (scored.length === 0) return { avgScore: null, clearing: 0, runCount: 0 };
  return {
    avgScore: scored.reduce((a, r) => a + r.score, 0) / scored.length,
    clearing: scored.filter((r) => r.score >= r.passThreshold).length,
    runCount: scored.length,
  };
}

/**
 * Green only when nothing behind the figure is failing.
 *
 * The rule it replaces was `Math.round(score * 100) >= 90`, defended in a
 * comment as "green only where it is an OUTCOME worth reporting: a surface
 * passing at or above ninety". Against a 0-100 score multiplied by 100 that is
 * true for anything at or above 0.9, so every surface in the product was green,
 * permanently, whatever it scored. A verdict that cannot come out the other way
 * is not a verdict.
 */
export function allSuitesClear(s: SurfaceScore): boolean {
  return s.runCount > 0 && s.clearing === s.runCount;
}
