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
  baseline: Record<string, Partial<SurfaceNumbers> & { mode?: RunMode }>,
  mode?: RunMode,
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

  const moved: string[] = [];
  for (const key of CHECKS) {
    const before = was[key] ?? 0;
    const after = now[key];
    if (after === before) continue;
    moved.push(`${key} ${before} -> ${after} ${after > before ? "REGRESSED" : "IMPROVED"}`);
  }
  return moved.length ? `  ${path}: ${moved.join(", ")}` : null;
}
