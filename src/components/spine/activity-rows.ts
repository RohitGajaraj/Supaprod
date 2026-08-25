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
import type { Turn } from "@/lib/spine/activity";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

/** The quiet line a leg carries, or nothing when the record cannot say. */
export function transitionLine(via: TrackTransition["drivenVia"]): string | null {
  if (via === "press") return "you pressed run here";
  if (via === "sweep") return "the run moved on its own";
  if (via === "continuation") return "it carried on by itself";
  return null;
}

export type ActivityRow =
  | { kind: "turn"; at: number; turn: Turn; key: string }
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
export function mergeActivityRows(turns: Turn[], transitions: TrackTransition[]): ActivityRow[] {
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
  return rows.sort((a, b) => b.at - a.at);
}
