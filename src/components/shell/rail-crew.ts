import { verbForTool } from "@/lib/presence/character";
import type { Anchor } from "@/lib/presence/collision";

/**
 * WHO IS WORKING, AND WHAT EACH ONE IS DOING RIGHT NOW.
 *
 * SPEC-MULTIPLAYER-PRESENCE section 3.4: "The persistent rail carries a stack
 * of the active teammates' marks - one glance, on any surface, answers how many
 * are working and on what. Click one, go to what it is doing."
 *
 * ── THE IRON LAW IS SATISFIED BY THE READ, NOT BY THIS FILE ────────────────
 * Section 2: "A cursor that moves when nothing is happening is theatre, and
 * theatre is the one regression that deletes a feature rather than fixing it."
 * Every position must trace to a row.
 *
 * `getWorkspaceAnchors` makes that structural rather than careful.
 * `agent_runs` is filtered to `status IN ('running','in_progress')` and
 * `tool_calls` is joined only to those runs' traces, so an `Anchor` IS a live
 * run and its newest named action. There is no code path here that can produce
 * a teammate without one, because there is no input that carries one.
 *
 * So this file invents nothing. It groups, it names, and it orders.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ──────────────────────────────────────
 * IT STATES NO TOTAL. The shell's live line already says "3 agents are
 * working", derived from missions. This is derived from runs. Two counts of one
 * idea, six inches apart on the same rail, is the defect this lane has spent
 * the week removing everywhere else - and they genuinely can differ, because a
 * live run whose newest tool call fell outside the read's 400-row window has no
 * anchor. So the line says HOW MANY and the stack says WHO and ON WHAT, and
 * neither repeats the other.
 *
 * IT DRAWS NO ONE IT CANNOT NAME AN ACTION FOR. A run that has started and
 * called no tool yet is genuinely working and we genuinely cannot say at what.
 * Drawing it with a generic "working" would be the invented position section 2
 * forbids, one field across.
 */

export interface RailCrewMember {
  /** The teammate. Null slugs are dropped: a mark with no identity is furniture. */
  slug: string;
  /** Plain words, from the tool-slug verb map. Never a tool name on its own. */
  verb: string;
  /** Where clicking goes. Null when the run carries no mission. */
  missionId: string | null;
  /** The run the verb came from, so a caller can trace it. */
  runId: string;
  /** Epoch ms of the call this describes. Ordering only. */
  at: number;
}

/**
 * One row per teammate, newest action first.
 *
 * DEDUPED BY TEAMMATE, NOT BY RUN, and the newest call wins. Two runs held by
 * the same agent are ONE working teammate - the rule `AppFrame` already applies
 * to its own marks, kept identical here so the stack and the line cannot
 * disagree about how many faces there are.
 */
export function crewFromAnchors(anchors: readonly Anchor[] | undefined): RailCrewMember[] {
  const newest = new Map<string, RailCrewMember>();
  for (const a of anchors ?? []) {
    if (!a.agentSlug) continue;
    const at = Date.parse(a.createdAt);
    // An unparseable stamp cannot be ordered against anything, and ordering is
    // the only thing this number is for. Treated as the oldest possible rather
    // than dropped: the teammate IS working, and losing the row would understate
    // the crew to tidy up a timestamp.
    const when = Number.isFinite(at) ? at : 0;
    const held = newest.get(a.agentSlug);
    if (held && held.at >= when) continue;
    newest.set(a.agentSlug, {
      slug: a.agentSlug,
      verb: verbForTool(a.toolName),
      missionId: a.missionId,
      runId: a.runId,
      at: when,
    });
  }
  return [...newest.values()].sort((x, y) => y.at - x.at);
}
