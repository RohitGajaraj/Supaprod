import type { SwarmHandoff } from "@/lib/swarm.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { withinLastDay } from "./when";

/**
 * WHERE A RUNNING PIECE OF WORK JUST CAME FROM.
 *
 * The founder's ruling, asked for twice and built twice at run level before
 * this existed on the board: "show visually which agent is working, the
 * handoff, the outcome." The board's half of that is one line under a running
 * row naming who handed the work over and what they passed on — because
 * "Planner · running" is ownership, and "handed over by Scout 4m ago" is the
 * event a person actually wants to have been told about.
 *
 * THE ROW IT READS. Every hop between teammates lands an `agent_messages` row
 * (`src/lib/ai/handoff.server.ts`) whose payload carries the task headline the
 * sender wrote for the receiver. `getSwarmHud` already reads the last fifty of
 * them per workspace; nothing new is queried and nothing here invents a fact:
 * if the row does not exist, no line draws.
 *
 * ONLY `kind === "handoff"` COUNTS. Steers ("use the shorter verify step")
 * are instructions to a run still held by the same teammate, not a change of
 * hands, and drawing them here would say work moved when it did not.
 */

export const DAY_MS = 86_400_000;

/** True when the message is an actual change of hands. */
export function isHandover(m: Pick<SwarmHandoff, "kind">): boolean {
  return m.kind === "handoff";
}

/**
 * The newest handover per mission, inside the surface's own 24-hour window
 * (`withinLastDay`, the same boundary the page states out loud). Ties break
 * to the later `created_at`; a mission with none gets none, and a stale
 * handover from yesterday is old news on a morning brief, so it drops rather
 * than reading as current.
 */
export function newestHandoverByMission(
  messages: readonly SwarmHandoff[] | undefined,
  now: number,
): Map<string, SwarmHandoff> {
  const byMission = new Map<string, SwarmHandoff>();
  if (!messages) return byMission;
  for (const m of messages) {
    if (!isHandover(m)) continue;
    const t = Date.parse(m.created_at);
    // A future timestamp is a clock skew, not an event that has happened.
    if (!Number.isFinite(t) || t < 0 || t > now || now - t >= DAY_MS) continue;
    const held = byMission.get(m.mission_id);
    const heldT = held ? Date.parse(held.created_at) : Number.NEGATIVE_INFINITY;
    if (!held || t > heldT) byMission.set(m.mission_id, m);
  }
  return byMission;
}

/**
 * THE LINE, in the words a colleague would use, and three honest absences:
 * an unknown sender stays unnamed rather than becoming "the agent"; a missing
 * elapsed time drops the clock rather than printing a wrong one; a handover
 * with no task headline shows only the change of hands, because a sentence we
 * composed to fill the gap is exactly what this product must never write.
 */
export function handoverLine(
  m: SwarmHandoff | undefined,
  whenAgo: string | null,
): string | null {
  if (!m) return null;
  const from = m.from_agent_slug ? agentDisplayName(m.from_agent_slug) : null;
  const handed = from ? `Handed over by ${from}` : "Handed over";
  const clock = whenAgo ? ` ${whenAgo} ago` : "";
  const task = typeof m.task === "string" ? m.task.trim() : "";
  return task.length > 0 ? `${handed}${clock}: “${task}”` : `${handed}${clock}.`;
}
