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
};

export const CHECKS = ["failureSentences", "retries", "unnamed", "wideProse"] as const;

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
  baseline: Record<string, Partial<SurfaceNumbers>>,
): string | null {
  const was = baseline[path];
  if (!was) return `  ${path}: no baseline entry. Add it once this surface settles.`;

  const moved: string[] = [];
  for (const key of CHECKS) {
    const before = was[key] ?? 0;
    const after = now[key];
    if (after === before) continue;
    moved.push(`${key} ${before} -> ${after} ${after > before ? "REGRESSED" : "IMPROVED"}`);
  }
  return moved.length ? `  ${path}: ${moved.join(", ")}` : null;
}
