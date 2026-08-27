/**
 * WHICH OF A MISSION'S MESSAGES BELONG IN THE TRANSCRIPT.
 *
 * -- THE DEFECT THIS FIXES -------------------------------------------------
 * `TrackActivity` read a mission's messages and kept `kind === "handoff"`. The
 * comment beside the track-scoped read said steers "carry a `track_id` and no
 * `mission_id`, so the mission read above cannot see them", and that is true of
 * the composer and false of the rest.
 *
 * Measured over the 4 rows in `agent_messages` with `kind = 'steer'`: ONE
 * carries a `track_id`, and THREE carry a `mission_id` instead, addressed to
 * `builder`. The three were fetched by the mission read and then dropped by
 * that filter. So the transcript showed one steer in four, and the surface
 * whose entire job is showing a person what happened to their work was hiding
 * three instructions the person themselves had typed.
 *
 * The steer is the one row on the transcript that is not the product talking.
 * Dropping it is worse than dropping a machine line, because a person who
 * steered and sees no trace of it has been given evidence that the product did
 * not hear them.
 *
 * -- WHY `kickoff` IS NOT DRAWN, WHICH IS A DECISION AND NOT AN OVERSIGHT ---
 * 14 rows, all on missions. The payload is `{goal, priority, due}` and the goal
 * is already the mission goal on the artifact pane, so drawing it would put the
 * same sentence twice on one screen: exactly the doubling `said-once.ts` was
 * written to remove, arriving by a different door.
 *
 * `priority` and `due` are real facts that appear nowhere else on the run
 * screen and they deserve a home. This is not it. A transcript answers what
 * HAPPENED to this work, and a brief is what was asked before anything did.
 * Putting it in the stream would make the first row of every run a restatement
 * of the heading above it.
 *
 * -- AND NOTHING IS FILTERED BY WORDING ------------------------------------
 * Every decision here reads `kind`, which is a column. This file exists partly
 * so that stays true: the moment a rule like this is written inline it starts
 * reaching into payloads for a phrase, which is how every hold once painted
 * amber.
 */

/** The kinds a mission's stream contributes to the transcript. */
const DRAWN: ReadonlySet<string> = new Set(["handoff", "steer"]);

/** The messages from a mission that the transcript should be given. */
export function carriedByMission<T extends { kind: string }>(messages: readonly T[]): T[] {
  return messages.filter((m) => DRAWN.has(m.kind));
}

/**
 * The same message once, whichever read found it.
 *
 * Nothing in this database carries both a `track_id` and a `mission_id` today,
 * so this changes no row now. A message written with both would otherwise be
 * drawn twice, and a transcript that repeats a person's own sentence back to
 * them reads as a fault in the run rather than a fault in the query.
 */
export function oncePerId<T extends { id: string }>(messages: readonly T[]): T[] {
  return [...new Map(messages.map((m) => [m.id, m])).values()];
}
