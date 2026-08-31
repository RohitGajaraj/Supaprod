/**
 * THE TWO FIELDS OF A HANDOFF THAT NOBODY COULD READ, NARROWED ONCE.
 *
 * `agent_messages.payload` is free-form `jsonb` written by the loop.
 * `HandoffPayload` (`src/lib/ai/handoff.server.ts:36`) declares `open_questions`
 * and `constraints` as `string[]`, and **nothing enforces that shape at the
 * database** — so a surface reading the column raw is one malformed write away
 * from rendering an object as `[object Object]`. S1 refused to read it
 * client-side for exactly that reason and asked for the narrowing to live on the
 * server, once, beside the type that declares it. This is that.
 *
 * ── ABSENT AND EMPTY ARE DIFFERENT ANSWERS AND BOTH ARE KEPT ────────────────
 * `null` means **the station never filed the field**. `[]` means **it filed the
 * field and said there are none.** Measured 2026-08-31 across all 143 handoffs:
 *
 *   carries an `open_questions` key at all ..........   3   (2 filled, 1 empty)
 *   carries a `constraints` key at all .............   13   (13 filled, 0 empty)
 *
 * So **140 of 143 do not claim emptiness — they say nothing at all**, and the
 * one row that files `[]` is the only station that has ever answered the
 * question. `SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.1 rules that an empty
 * *Open questions* is *a defect, not a clean bill*; collapsing absent into empty
 * would turn 140 silences into 140 clean bills. It is the same law as F-76 (a
 * failed read and an empty result are different values) and as the schema rule
 * adopted from S1 the same day: **never let a default stand in for an answer.**
 */

/**
 * A `string[]` from free-form json, or `null` when the field is absent or is not
 * a list of strings at all.
 *
 * Non-string members are dropped rather than stringified: a receiver shown
 * `[object Object]` learns nothing, and a list that silently loses a malformed
 * member is still an honest list of what could be read. A field that is present
 * but not an array returns `null` — that is a WRITER defect, and reporting it as
 * "the station filed none" would hide it.
 */
export function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

/** One handoff, narrowed for a surface. */
export type TrackHandoff = {
  id: string;
  createdAt: string;
  fromAgentSlug: string | null;
  toAgentSlug: string | null;
  task: string | null;
  /** `null` = the sender never filed the field. `[]` = it filed none. */
  openQuestions: string[] | null;
  /** `null` = the sender never filed the field. `[]` = it filed none. */
  constraints: string[] | null;
  /** True once a run has read this handoff — `consumed_by_run_id` is set. */
  pickedUp: boolean;
};

/** The row shape this reads, kept here so the pure half is testable alone. */
export type HandoffRow = {
  id: string;
  created_at: string;
  from_agent_slug: string | null;
  to_agent_slug: string | null;
  payload: unknown;
  consumed_by_run_id: string | null;
};

export function narrowHandoff(row: HandoffRow): TrackHandoff {
  // A payload that is not an object at all is a writer defect, not an empty
  // handoff: every field then reads `null` rather than `[]`, which is the
  // distinction this module exists to keep.
  const p = (row.payload ?? null) as Record<string, unknown> | null;
  const task = p && typeof p.task === "string" ? p.task : null;
  return {
    id: row.id,
    createdAt: row.created_at,
    fromAgentSlug: row.from_agent_slug,
    toAgentSlug: row.to_agent_slug,
    task,
    openQuestions: p ? stringList(p.open_questions) : null,
    constraints: p ? stringList(p.constraints) : null,
    pickedUp: row.consumed_by_run_id !== null,
  };
}
