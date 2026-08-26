import type { StudioSessionListItem } from "@/lib/studio.functions";

/**
 * WHICH "RUNNING" WORK IS ACTUALLY WAITING ON YOU.
 *
 * THE MISLABEL THIS FIXES, found by driving the board: a mission held at a
 * tool-approval gate keeps `status = "running"`, so Today's feed showed it
 * under Running with the sentence "waiting on an agent, not on you" — while
 * /runs, reading the same rows through `listStudioSessions`, correctly said
 * it is waiting on YOU. Two surfaces, one piece of work, two contradictory
 * sentences; and on the board it was the wrong one.
 *
 * THE JOIN. `listStudioSessions` aggregates `agent_approvals` per mission
 * (`pending_approvals`). The board already holds that read under the shared
 * app-wide key, so this costs no new request: map mission id → open-call
 * count, and the route reclassifies those rows into Waiting-on-you with the
 * count in plain words.
 */

export function callsWaitingByMission(
  sessions: readonly Pick<StudioSessionListItem, "mission_id" | "pending_approvals">[] | undefined,
): Map<string, number> {
  const byMission = new Map<string, number>();
  if (!sessions) return byMission;
  for (const s of sessions) {
    if (s.pending_approvals > 0 && s.mission_id) {
      byMission.set(s.mission_id, s.pending_approvals);
    }
  }
  return byMission;
}
