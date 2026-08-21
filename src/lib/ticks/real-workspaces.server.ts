/**
 * WHICH WORKSPACES A TICK MAY SPEND MONEY ON.
 *
 * Measured 2026-08-21: 89% of a day's AI spend was autonomous agents working on
 * demo fixtures, and real workspaces drew zero agent calls. The first fix added
 * `.eq("is_sample", false)` to the fourteen hooks that select from `workspaces`.
 *
 * IT WAS NOT ENOUGH, AND THIS FILE EXISTS BECAUSE OF HOW IT WAS CAUGHT. Six new
 * agent runs appeared on sample workspaces AFTER that fix, and `researcher` was
 * among them: `researcher-tick` chooses its work from `workspace_briefs`, not
 * from `workspaces`, so a filter on the workspaces table never applied to it.
 *
 * The shape is one level up from where it was first fixed: a tick selects work
 * from a WORKSPACE-SCOPED table, and those tables carry `workspace_id` rather
 * than `is_sample`. So the exclusion has to travel by id.
 *
 * WHY THE SAMPLE IDS RATHER THAN THE REAL ONES. `is_sample` is NOT NULL DEFAULT
 * false, so a workspace created a second from now is real. Excluding a known
 * sample list keeps that new workspace included; selecting a known real list
 * would silently drop it until the next fetch. Fail toward doing the work.
 */

/** Minimal shape so this can be called with either admin or request-scoped client. */
type Queryable = {
  from: (t: string) => {
    select: (c: string) => {
      eq: (c: string, v: boolean) => Promise<{ data: { id: string }[] | null; error: unknown }>;
    };
  };
};

/**
 * The workspace ids a tick must NOT spend on. Empty array means "nothing to
 * exclude", which is the correct answer for a fresh database and is also what a
 * failed read returns: a tick that cannot read this list should still run rather
 * than silently stop, because stopping every tick on a transient read error is a
 * worse failure than one extra fixture run.
 */
export async function sampleWorkspaceIds(db: Queryable): Promise<string[]> {
  try {
    const { data, error } = await db.from("workspaces").select("id").eq("is_sample", true);
    if (error || !data) return [];
    return data.map((r) => r.id);
  } catch {
    return [];
  }
}

/** PostgREST list literal for `.not(col, "in", ...)`. Null when there is nothing to exclude. */
export function notInList(ids: string[]): string | null {
  return ids.length === 0 ? null : `(${ids.join(",")})`;
}
