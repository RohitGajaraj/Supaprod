/**
 * WHO CAUSED EACH LEG (queue 65's component half).
 *
 * `stage_events.driven_via` is the record of who asked for a station move:
 * `press` is the person, `sweep` is the loop walking on its own,
 * `continuation` is the client carrying on past a closed window. The
 * transcript renders those three distinctly, because "watchable" means you
 * can SEE what moved without SQL.
 *
 * `foreground` and NULL claim NOTHING about a person -- rows written before
 * the split or before the column existed. They render no marker at all: an
 * unknown driver drawn as a known one is the invention this product refuses.
 */
import type { TrackTransition } from "@/lib/spine/track.functions";
import { taskAsked } from "@/components/spine/handoff-said";
import type { Turn } from "@/lib/spine/activity";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

/** The quiet line a leg carries, or nothing when the record cannot say. */
export function transitionLine(via: TrackTransition["drivenVia"]): string | null {
  if (via === "press") return "you pressed run here";
  if (via === "sweep") return "the run moved on its own";
  if (via === "continuation") return "it carried on by itself";
  return null;
}

/** The handoff fields `getMission` already returns, and nothing more. */
export type HandoffRow = {
  id: string;
  kind: string;
  from_agent_slug: string | null;
  to_agent_slug: string | null;
  payload: unknown;
  created_at: string;
  consumed_by_run_id: string | null;
};

export type ActivityRow =
  | { kind: "turn"; at: number; turn: Turn; key: string }
  /**
   * A HANDOFF, WHICH IS AN EVENT AND NOT AN ANNOTATION ON A TURN.
   *
   * SESSION-1's first unit is "handoff made visible", and its shape is stated:
   * "it renders as a transcript entry with from- and to-chips". An entry, not a
   * caption. That turned out to be the only honest shape as well as the
   * specified one -- see `handoff-said.ts` for the measurement, but the short
   * version is that `agent_messages.consumed_by_run_id` names the run that took
   * each handoff, 131 of those runs exist, and NOT ONE of them carries a
   * track_id. So no turn the run screen draws has ever consumed a handoff, and
   * hanging the instruction off a turn would have rendered nothing on every
   * track in the database.
   *
   * As its own row it needs no turn at all: it has a time of its own, a sender,
   * a receiver and the instruction that travelled.
   */
  | {
      kind: "handoff";
      at: number;
      key: string;
      from: string | null;
      to: string | null;
      /** The sender's own words. Never composed; see `taskAsked`. */
      task: string;
      /** True when no run has picked it up, which the row says out loud. */
      waiting: boolean;
    }
  | {
      kind: "move";
      at: number;
      key: string;
      to: string;
      toName: string;
      line: string;
      from: string | null;
    };

/**
 * One chronological stream of turns and station moves, newest first -- the
 * order the transcript draws, so a marker sits between the rows it belongs
 * between rather than in a second list a reader must correlate by hand.
 * Timestamp ties keep turns ahead of moves: a seat that landed as the station
 * flipped reads as part of the new station, which is what happened.
 */
export function mergeActivityRows(
  turns: Turn[],
  transitions: TrackTransition[],
  handoffs: readonly HandoffRow[] = [],
): ActivityRow[] {
  const rows: ActivityRow[] = [];
  for (const t of turns) {
    rows.push({ kind: "turn", at: Date.parse(t.at), turn: t, key: `turn:${t.runId}` });
  }
  for (const tr of transitions) {
    const line = transitionLine(tr.drivenVia);
    if (!line) continue;
    // Display names come from the ONE map, never the raw slug -- same rule as
    // every station word on this surface.
    rows.push({
      kind: "move",
      at: Date.parse(tr.at),
      key: `move:${tr.at}:${tr.to}`,
      to: tr.to,
      toName: AGENT_STATIONS[tr.to as keyof typeof AGENT_STATIONS]?.name ?? tr.to,
      from: tr.from,
      line,
    });
  }
  for (const h of handoffs) {
    const task = taskAsked(h.payload);
    // No instruction written means there is nothing to show a person. The row
    // is dropped rather than drawn empty: a handoff entry that says only that a
    // handoff happened is the caption this was built to replace.
    if (!task) continue;
    rows.push({
      kind: "handoff",
      at: Date.parse(h.created_at),
      key: `handoff:${h.id}`,
      from: h.from_agent_slug,
      to: h.to_agent_slug,
      task,
      waiting: h.consumed_by_run_id === null,
    });
  }
  return rows.sort((a, b) => b.at - a.at);
}
