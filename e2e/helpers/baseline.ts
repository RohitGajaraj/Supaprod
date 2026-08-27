/**
 * THE BASELINE COMPARISON, PULLED OUT SO IT CAN BE TESTED WITHOUT A BROWSER.
 *
 * It lived inside the Playwright spec, where the only way to exercise it was a
 * dev server, a dead database and ninety seconds. I tried to mutation-test it
 * there, another lane took port 8080 mid-run, and I was about to commit a check
 * I had not seen work.
 *
 * That is the same shape as everything else this harness has caught tonight: a
 * thing that cannot be tested cheaply does not get tested. Here it is a pure
 * function of two objects, so `bun test` covers it on every lane's machine with
 * no server at all, and the spec keeps only the part that genuinely needs a
 * browser.
 */
export type SurfaceNumbers = {
  /** Distinct failure sentences a person reads for ONE dead read. */
  failureSentences: number;
  /** "Try again" controls on the page. */
  retries: number;
  /** Control shapes a screen reader cannot name. */
  unnamed: number;
  /** Prose lines past 76ch, or capped inline in pixels. */
  wideProse: number;
  /** Text elements below WCAG AA contrast on the surface. */
  contrastBelow: number;
};

/**
 * WHICH RUN PRODUCED A NUMBER, because the same path is two different pages.
 *
 * `/learn` signed out is the LOGIN page: 0 below AA of 11 judged. Signed in
 * against a dead backend it is the real surface: 2 of 62. One baseline entry
 * per path cannot hold both, and comparing across the two reports an
 * improvement or a regression that is really just a redirect.
 *
 * This was already true of every other check here and nothing recorded it. It
 * surfaced when two stability runs of the same command disagreed with the
 * signed-in sweep, which is the cheapest possible way to find it.
 */
export type RunMode = "public" | "signed-in";

/**
 * AND THE VIEWPORT, FOR THE SAME REASON AS THE RUN MODE.
 *
 * A baseline entry records whether it was taken signed in, because the same
 * path signed out is the login page. It did NOT record the WIDTH, and a
 * responsive layout at 390 is a different set of elements from the same page
 * at 1280 -- different components, different counts, sometimes different
 * colours.
 *
 * Measured 2026-08-28: contrast at 390 matched the desktop numbers exactly on
 * all six public surfaces checked (`/` 83 below of 233 judged against 83 of
 * 248), so nothing was being hidden. **That is a fact about today's CSS, not a
 * property of the check.** The ratchet was comparing a phone run to desktop
 * numbers and getting the right answer by luck.
 *
 * So the width is recorded and a mismatch refuses to compare, exactly like the
 * mode. An entry with no viewport recorded still compares, so existing
 * baselines keep working.
 */
export type Viewport = string;

/**
 * IS THIS THE SAME PAGE THE BASELINE SAW?
 *
 * A signed-in surface does not render the same number of elements every run.
 * `/learn` on its own judges 34 and has no station strip; warmed after five
 * other routes it judges 62 and has one. `/brain` moved 31 to 59 between two
 * IDENTICAL batch runs.
 *
 * That matters because the contrast check is a ratchet that fails a build on a
 * rising count, and a page rendering more elements can raise one without
 * anything having regressed. Failing a lane's build for that would burn the
 * check's credibility on its first week.
 *
 * So the count is only compared when the POPULATION is close. A surface that
 * rendered materially differently is reported as not compared, which is the
 * same rule as the run mode: say the measurement does not apply rather than
 * guess with it.
 *
 * The tolerance is deliberately generous. This is a guard against comparing two
 * different pages, not a second precision instrument.
 */
export function populationComparable(now: number, was: number, tolerance = 0.15): boolean {
  if (was <= 0) return now <= 0;
  return Math.abs(now - was) / was <= tolerance;
}

export const CHECKS = [
  "failureSentences",
  "retries",
  "unnamed",
  "wideProse",
  "contrastBelow",
] as const;

/**
 * One line naming every check that moved, or null when nothing did.
 *
 * A missing baseline entry is reported rather than treated as zero. Treating it
 * as zero would make every new surface look like a regression on its first run,
 * which is how a report gets ignored.
 */
export function compareToBaseline(
  path: string,
  now: SurfaceNumbers,
  baseline: Record<string, Partial<SurfaceNumbers> & { mode?: RunMode; viewport?: Viewport }>,
  mode?: RunMode,
  viewport?: Viewport,
): string | null {
  const was = baseline[path];
  if (!was) return `  ${path}: no baseline entry. Add it once this surface settles.`;

  /*
   * A number taken signed out is not comparable to one taken signed in, and
   * saying so is the only honest answer. Silence would read as "unchanged" and
   * a diff would name a regression that is a redirect.
   */
  if (was.mode && mode && was.mode !== mode) {
    return `  ${path}: baseline was taken ${was.mode}, this run is ${mode}. Not compared.`;
  }

  if (was.viewport && viewport && was.viewport !== viewport) {
    return `  ${path}: baseline was taken at ${was.viewport}, this run is ${viewport}. Not compared.`;
  }

  const moved: string[] = [];
  for (const key of CHECKS) {
    const before = was[key] ?? 0;
    const after = now[key];
    if (after === before) continue;
    moved.push(`${key} ${before} -> ${after} ${after > before ? "REGRESSED" : "IMPROVED"}`);
  }
  return moved.length ? `  ${path}: ${moved.join(", ")}` : null;
}
