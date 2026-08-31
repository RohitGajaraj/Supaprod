/**
 * THE THREE CHECKS THIS PRODUCT COUNTS AS "DONE", AS DATA A SURFACE CAN READ.
 *
 * ── WHY THEY MOVED OUT OF `e2b.server.ts` (gap #18, 2026-08-31) ───────────
 * The names lived inside `defaultChecks()` in a `.server.ts`, so a component
 * that wanted to SHOW a customer what we run before a pull request could not
 * import them. The tempting fix is to type the three words again in the
 * component. That is the one-idea-two-vocabularies defect — the same one that
 * put four names on the boundary concept and three on a station — and the
 * second copy is always the one that goes stale, silently, because nothing
 * fails when they disagree.
 *
 * So the NAMES are the shared fact and the COMMANDS stay server-side. A surface
 * importing this cannot learn how to run anything, which is the right split:
 * the shell line is a deployment detail, the promise is not.
 *
 * ── WHAT THIS LIST DOES AND DOES NOT CLAIM (F-148) ────────────────────────
 * It says what we RUN. It does not say the run is enforced. `studio.checks.run`
 * is implemented and briefed, and the Build-to-Ship advance is not yet refused
 * on a red verdict — that gate is F-148 and it is open. **Any surface built on
 * this list must describe it as what gets run, never as what must pass**, until
 * F-148 lands. Naming the three honestly is worth shipping before the gate;
 * claiming they block a release is not.
 */

/** One check, named for a person rather than for a shell. */
export interface CheckName {
  /** The identifier the runner reports results under. */
  name: string;
  /** What it answers, in words a customer reads without a tour. */
  says: string;
}

/**
 * In the order they run, because a typecheck failure makes the other two noise.
 *
 * `as const` so a caller gets the literal union rather than `string`, and the
 * runner's own spec list is built FROM this — see `defaultChecks()`.
 */
export const CHECK_NAMES = [
  { name: "typecheck", says: "The types line up." },
  { name: "test", says: "The tests pass." },
  { name: "lint", says: "The code matches the house style." },
] as const satisfies readonly CheckName[];

/** Just the identifiers, for a caller matching a result row to a name. */
export const CHECK_ORDER = CHECK_NAMES.map((c) => c.name);
