/**
 * A VALUE IDENTICAL ON EVERY ROW DISTINGUISHES NOTHING.
 *
 * This repo has now removed that defect from eleven places and written the
 * same three lines of comparison each time. Sixteen agent cards ending "Runs
 * on its own", every armed switch reading "Running on its own.", forty audit
 * rows printing the word "agent", sixteen Brand rows ending "Learned",
 * twenty-four Insights rows leading "An outcome memo", every handoff row
 * saying "the run moved on its own", one CI verdict stamped on every
 * expectation, four of seven strip chips carrying nothing, twelve trace rows
 * leading "Critique", nine forecast rows ending "the evidence did not settle
 * it", and six decision rows ending "hold".
 *
 * So the comparison lives here once. What to DO about a constant is never
 * general and stays at the call site: on the agent roster it leaves, because
 * the heading above already said it; on the forecast desk it moves up into
 * the region's sub, because nothing else on the page says it at all.
 *
 * ── THE RULE ─────────────────────────────────────────────────────────────
 * Computed over the RENDERED set, never over the query. Two workspaces' rows
 * that would discriminate if drawn together must discriminate when they are.
 *
 * ── AND THE THREE CASES IT REFUSES ───────────────────────────────────────
 * A set of one, which cannot repeat anything. A set with any gap, because
 * "eight have this and one does not" makes the value the fastest fact on the
 * page rather than the most redundant. And a set that is entirely gaps, which
 * is an absence and not a shared value.
 *
 * NEVER SUPPRESS AN EXCEPTION is the other half of this rule and it cannot be
 * enforced here, because only the caller knows which of its values is one. A
 * caller with exceptional values partitions first and asks about the steady
 * ones, the way `AgentCards` does.
 */
export function theValueEveryRowShares<T extends string | number>(
  values: readonly (T | null | undefined)[],
): T | null {
  if (values.length < 2) return null;
  const first = values[0];
  if (first === null || first === undefined) return null;
  return values.every((v) => v === first) ? first : null;
}
