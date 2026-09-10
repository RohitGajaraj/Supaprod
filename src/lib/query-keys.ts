/**
 * Canonical React Query keys for the reads that more than one surface makes.
 *
 * WHY THIS FILE EXISTS. Measured on the live app 2026-08-03: the page shell
 * painted in 857ms and then the content sat empty for over five seconds, and two
 * of the slowest server functions were being fetched TWICE per page load.
 *
 *   missions.functions          5147ms and again 3433ms
 *   approvals-queue.functions   3271ms and again 2944ms
 *
 * The cause was not the queries being slow, though they are. It was that the
 * same server function was requested under three different key families, so
 * React Query could not see them as the same read and deduplicated nothing:
 *
 *   ["shell", "approvals", ws]   AppFrame, AskPane
 *   ["approvals", "queue", ws]   LivePulse, RoomChrome, MissionShell
 *   ["today", "queue", ws]       the Today route
 *
 * The shell is mounted on every page and LivePulse sits in its header, so on
 * Today that is three concurrent fetches of identical data, each paying the full
 * latency, before the user sees one number.
 *
 * LivePulse's own comment already claimed the fix was in place: "same query key
 * the rail badge, the Today hero, and the /inbox page all read - one shared
 * cache, one number, everywhere." That was the intent and never the code. A
 * shared cache cannot be maintained by convention across five files, because the
 * sixth caller writes a key that reads fine and silently doubles the load. So the
 * key becomes a function nobody has to remember.
 *
 * A SECOND BUG THIS CLOSES. Three key families also meant three caches of one
 * number, so invalidating after an approval refreshed some of them and left the
 * others showing a stale count. The header could say 27 while the page said 26.
 */

/** The approvals queue, scoped to a workspace. `getApprovalsQueue`. */
export function approvalsQueueKey(workspaceId: string | null | undefined) {
  return ["approvals-queue", workspaceId ?? null] as const;
}

/**
 * Every seat working in the workspace this second. `listRunningNow`.
 *
 * ONE KEY FOR THE LIVE WORK, because the shell's line, the home's "working
 * now" strip and the run screen all draw the same seats, and the founder's
 * standard is that the machine's work is seen the same everywhere. A second
 * key would be a second cache that can lag the first, which is how the header
 * said "Nothing running" over a working seat (P-127). `useRunningNowPush`
 * invalidates exactly this key when `agent_runs` changes.
 */
export function runningNowKey(workspaceId: string | null | undefined) {
  return ["running-now", workspaceId ?? null] as const;
}

/** The workspace's missions, as the shell and Today both read them. `listMissions`. */
export function missionsKey(workspaceId: string | null | undefined) {
  return ["missions-list", workspaceId ?? null] as const;
}

/** The workspace's mission marks: what the shell's mark stack and the
 *  live-agents hook draw, seven fields per mission. `listMissionMarks`. */
export function missionMarksKey(workspaceId: string | null | undefined) {
  return ["mission-marks", workspaceId ?? null] as const;
}

/**
 * The studio sessions the strip, the board and the board panel all read.
 * `listStudioSessions`.
 *
 * ── WHY THIS GREW A WORKSPACE ─────────────────────────────────────────────
 * The key was `["studio-sessions", false]` for all three, and the read behind
 * it was `.eq("user_id", userId)` with no workspace filter anywhere (F-141).
 * So the station strip - the primary "where is the work" control - tallied
 * every workspace the user belongs to and drew the result directly under a
 * breadcrumb naming one, above a board whose every other number is scoped.
 * Switching workspace did not change it.
 *
 * S0 gave the read an optional `workspaceId` whose absence is byte-for-byte the
 * old behaviour. The key has to move with it: one cache entry cannot hold two
 * workspaces' answers, and whichever surface mounted first would decide what
 * the others saw. That failure has already happened once in this repo, which is
 * the whole reason this module exists.
 *
 * ALL THREE READERS MOVE TOGETHER, which is why this is a function rather than
 * three literals. `MissionOrchestratorDetail` invalidates the `["studio-sessions"]`
 * PREFIX, so it still matches and needs no change.
 */
export function studioSessionsKey(workspaceId: string | null | undefined, includeArchived = false) {
  return ["studio-sessions", includeArchived, workspaceId ?? null] as const;
}

/**
 * The prefix to invalidate after anything that settles a gate.
 *
 * Deliberately the whole family rather than one workspace's key: approving in one
 * workspace can retire a gate the user is looking at from another surface, and an
 * over-broad invalidation costs one refetch while a narrow one costs trust in the
 * number on screen.
 */
export const APPROVALS_QUEUE_PREFIX = ["approvals-queue"] as const;

/** The prefix for every workspace's mission list. */
export const MISSIONS_PREFIX = ["missions-list"] as const;

/**
 * Refresh everything the app shell shows after work has moved.
 *
 * Callers used to invalidate the literal `["shell"]`, which worked only because
 * the shell's keys happened to start with that word. Canonicalising the keys
 * would have silently broken every one of those call sites: the header count and
 * the station rail would have kept rendering a stale number with no error
 * anywhere, which is the quietest kind of regression and the hardest to notice
 * in review. This is the one place that knows what the shell reads.
 *
 * `["shell"]` is still invalidated because other shell-local queries continue to
 * use it. Over-invalidating costs a refetch; under-invalidating costs the user's
 * belief in the number.
 */
export function invalidateShellReads(qc: {
  invalidateQueries: (f: { queryKey: readonly unknown[] }) => unknown;
}): void {
  void qc.invalidateQueries({ queryKey: APPROVALS_QUEUE_PREFIX });
  void qc.invalidateQueries({ queryKey: MISSIONS_PREFIX });
  void qc.invalidateQueries({ queryKey: ["shell"] });
}
