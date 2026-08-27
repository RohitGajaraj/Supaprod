/**
 * WHAT WAS ACTUALLY ASKED WHEN THE WORK CHANGED HANDS.
 *
 * ── THE GAP, AND IT IS THE FIRST ITEM IN THIS SESSION'S BRIEF ─────────────
 * SESSION-1 puts "handoff made visible" first and says why: "the station
 * transition already IS a handoff and nothing says WHAT WAS HANDED OVER." The
 * transcript draws the moment — a glyph, and the two teammates' marks — and the
 * line beside it is INFERRED from a station changing between two turns.
 *
 * Meanwhile the product has been writing the real thing all along. 143 rows in
 * `agent_messages` with `kind = 'handoff'`, every one carrying a payload like:
 *
 *     task:    "Draft a Product Requirements Document detailing the
 *              functionality, user stories and technical requirements for
 *              enabling saved delivery address reuse."
 *     context: { rationale: "Translate the strategic decision into a clear,
 *              detailed specification for implementation." }
 *
 * from `orchestrator` to `prd-writer`. None of it has ever been on a screen.
 *
 * ── WHY THE ROWS LOOKED UNREACHABLE AND ARE NOT ──────────────────────────
 * All 143 carry a null `track_id`, so a track-scoped query finds nothing, which
 * is what makes this look like a server gap. It is not: they carry a
 * `mission_id`, a track's missions are `spine_track_members` rows with
 * `artifact_kind = 'mission'`, `getTrackChain` already returns those members,
 * and `getMission` already returns a mission's messages with exactly these
 * fields. Joining through missions reaches 8 tracks. Nothing new is needed
 * anywhere — this is the brief's own "the default move is always: wire what
 * exists".
 *
 * ── AND IT IS AN ENTRY, NOT A CAPTION ON A TURN ──────────────────────────
 * The first version hung the instruction off the turn that received it, matched
 * by `consumed_by_run_id`. That is the exact join the database keeps, and it
 * still rendered nothing anywhere: 131 of the consuming runs exist and NOT ONE
 * carries a `track_id`, so no turn the run screen draws has ever consumed a
 * handoff. The brief had already said the right shape -- "it renders as a
 * transcript entry" -- and as its own row it needs no turn at all: it has a
 * time, a sender, a receiver and the instruction that travelled.
 * `activity-rows.ts` owns that row; this owns the one thing it needs read.
 *
 * ── WHAT THIS REFUSES TO DO ──────────────────────────────────────────────
 * It never composes a sentence. If the payload has no task written in it, this
 * returns null and the row keeps the line it already had. A handoff row that
 * invented a plausible instruction would be worse than one that stays quiet,
 * and it is the exact shape SPEC-PRESENCE forbids: a state the data cannot
 * prove is a state you do not draw.
 */

const str = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
};

/**
 * The instruction the sender wrote, or null.
 *
 * `task` is the field the dispatcher fills and the only one that is a sentence
 * ABOUT THE WORK. `context.rationale` explains why the hop happened rather than
 * what was wanted, so it is the fallback and never the first choice.
 */
export function taskAsked(payload: unknown): string | null {
  /*
   * A STRING IS STILL A PAYLOAD. `agent_messages.payload` is jsonb and arrives
   * as an object through PostgREST, but it reaches this function through a
   * server-function boundary that serialises, and a caller holding the raw
   * column would hand over the text. Parsing it here costs one try/catch and
   * removes a whole class of "the data was right there and the screen dropped
   * it", which is the exact failure this file exists to end.
   */
  let value: unknown = payload;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text.startsWith("{")) return null;
    try {
      value = JSON.parse(text);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  const task = str(p.task);
  if (task) return task;
  const context = p.context;
  if (context && typeof context === "object") {
    return str((context as Record<string, unknown>).rationale);
  }
  return null;
}
