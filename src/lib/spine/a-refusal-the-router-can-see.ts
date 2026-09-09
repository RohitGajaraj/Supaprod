/**
 * ── WAS THE CALL A REFUSAL? ──────────────────────────────────────────────────
 *
 * The driver waives Define, Design, Build and Ship when Decide's call was not
 * to build. It asked `decisions.status === 'declined'`, and that was the wrong
 * column: `decision.record` sets `declined` only when the call was
 * `do-not-build` AND the approval gate had already approved it. A refusal
 * written while the gate was pending kept a `pending` status, the router saw
 * nothing, and the track walked on to specify, design and build the thing the
 * station had just refused.
 *
 * ── THE MEASUREMENT THAT FOUND IT (worktree-1-68, 2026-09-09) ───────────────
 * 31 runs decided decline-or-wait at Decide and 11 of them filed a spec, a
 * design or a code change afterwards. Eleven of 121 tracks did work they had
 * already decided against. On production today one decision carries
 * `call = 'do-not-build'` with a status the old check could not see, and 33
 * more carry no direction at all because they predate the column.
 *
 * ── SO IT ASKS THE COLUMN THAT MEANS IT ─────────────────────────────────────
 * `call` is the direction, added 2026-09-09 (`20260909101200`), written by the
 * tool unconditionally. `status` is the approval state and is kept as a second
 * witness, because 33 rows have no `call` and their refusals, where the gate
 * approved them, are still visible in `status`. Either one saying refusal is a
 * refusal: they cannot disagree except by one of them not knowing.
 */

/** What the router could learn about a decision before it routes past it. */
export type DecisionAsRead = {
  /** `decisions.call`: the direction. Null on rows written before the column. */
  call: string | null;
  /** `decisions.status`: the approval state of the record. */
  status: string | null;
};

/**
 * True only when the record SAYS it was a refusal.
 *
 * A row with neither signal is not a refusal, and that is the honest reading
 * rather than a safe one: 33 rows carry no direction, and waiving four
 * stations on a row that never recorded one would stop work nobody refused.
 * The direction those rows lost is the reason the column exists.
 */
export function callWasARefusal(d: DecisionAsRead): boolean {
  return d.call === "do-not-build" || d.status === "declined";
}

/** The columns the router needs, so the select and the predicate cannot drift. */
export const DECISION_ROUTING_COLUMNS = "status,call";
