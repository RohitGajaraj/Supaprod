/**
 * A ROW THAT IS A DEMO FIXTURE SAYS SO, ON THE ONE SURFACE THE MOAT IS CASHED.
 *
 * ── THE FINDING, AND IT IS S4'S ───────────────────────────────────────────
 * `docs/lanes/verify/S4-166-six-of-seven-forecast-desks-are-entirely-demo-fixtures.md`.
 * Measured 2026-08-31 against the live database:
 *
 * | | |
 * | --- | --- |
 * | forecasts past their horizon with no verdict | 24 |
 * | of those, sitting on an `is_sample` workspace | **20** |
 * | genuinely real | 4 |
 * | with `decisions.is_sample` set | **0** |
 *
 * **Six of the seven accounts that have a non-empty forecast desk see a desk in
 * which every single row is a fixture.** Not a count inflated by seed data, a
 * count made entirely of it. And the accounts are not throwaways: all seven
 * carry an email, five have signed in, and each has between 34 and 624
 * `agent_runs`. It is what anyone demonstrating this product would open.
 *
 * The canon says *the moat is the forecast captured at decision time*. The due
 * desk is the one surface where that claim is cashed, and for six of seven
 * accounts it was cashing seed rows silently.
 *
 * ── WHY THE ROW CANNOT ANSWER THIS ABOUT ITSELF ───────────────────────────
 * **`decisions.is_sample` is 0 on every one of them**, so the row's own flag
 * says "real" for all 24. Only the WORKSPACE it sits on distinguishes them, and
 * `listDueForecasts` is deliberately cross-workspace ("every call anywhere that
 * needs settling", `forecast.functions.ts:88-100` — sound reasoning, not the
 * defect). So provenance is a fact about the row's workspace, resolved against
 * the workspaces this caller belongs to.
 *
 * ── AND WHY IT IS NOT A BANNER OVER THE WHOLE DESK ────────────────────────
 * The tempting cheap version is one line reading the ACTIVE workspace's
 * `is_sample`. It is wrong, and measured wrong rather than theoretically wrong:
 * **2 of the 16 accounts belong to a sample workspace AND a real one**, and the
 * desk is cross-workspace, so their desk genuinely mixes. A banner derived from
 * the active workspace would mislabel every row on it in one direction or the
 * other. That is the same substitution defect this lane filed twice today: a
 * claim about one population derived from a different one.
 *
 * ```sql
 * select count(*) from (
 *   select m.user_id from workspace_members m join workspaces w on w.id = m.workspace_id
 *   group by m.user_id
 *   having bool_or(coalesce(w.is_sample,false)) and bool_or(not coalesce(w.is_sample,false))
 * ) x;   -- 2
 * ```
 */

/** What we can honestly say about where a row came from. */
export type Provenance = "real" | "example" | "unknown";

/** The shape this needs from `useWorkspace().workspaces`, and nothing more. */
export type WorkspaceFlag = { id: string; is_sample?: boolean | null };

/**
 * `unknown` IS A REAL ANSWER AND IT IS THE DEFAULT.
 *
 * A workspace this caller is not a member of cannot be classified, and neither
 * can a row whose workspace we could not read. **Neither is drawn as "real"**,
 * because "real" is the claim on trial here and an unproven claim is exactly
 * what S4 caught. Nor is it drawn as "example": calling a genuine forecast
 * fiction is the worse error of the two, and `OpportunityDetailSheet` already
 * made that call in as many words ("mislabelling a real bet as fiction is worse
 * than leaving one example unmarked"). So `unknown` renders nothing at all.
 */
export function provenanceOf(
  workspaceId: string | null | undefined,
  workspaces: readonly WorkspaceFlag[],
): Provenance {
  if (!workspaceId) return "unknown";
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (!ws) return "unknown";
  // Undefined reads as not-a-sample: the column arrived after the read schema
  // did, and `use-workspace.tsx:21` types it optional for exactly that reason.
  return ws.is_sample === true ? "example" : "real";
}

/**
 * The words, and they are the caller's rather than the component's, which is
 * `AgentSession.activity`'s own stated contract: "only the caller knows what the
 * agent is actually touching, and inventing a generic sentence per group is how
 * ten screens end up with one sentence between them."
 *
 * Deliberately short. It rides on the end of a row's existing activity line, so
 * a sentence here would push the thing the row is actually about off the end.
 */
export function exampleNote(p: Provenance): string | null {
  return p === "example" ? "an example, not your product" : null;
}

/**
 * How many of a drawn set are fixtures, for the one line above the group.
 *
 * A per-row mark alone fails the case that actually happens: **a desk where
 * every row is an example** reads as a full desk of real work until you check
 * each row. The count is what makes "all of these" visible at a glance, and it
 * is a count of what is ON SCREEN rather than of the population, because that is
 * the only thing the reader can check.
 */
export function exampleTally(marks: readonly Provenance[]): {
  examples: number;
  total: number;
  /** The sentence, or null when there is nothing worth saying. */
  line: string | null;
} {
  const total = marks.length;
  const examples = marks.filter((m) => m === "example").length;
  if (examples === 0) return { examples, total, line: null };
  const line =
    examples === total
      ? total === 1
        ? "The one call here is an example that came with your workspace, not your product."
        : "Every call here is an example that came with your workspace, not your product."
      : `${examples} of these ${total} came with your workspace as examples, not from your product.`;
  return { examples, total, line };
}
