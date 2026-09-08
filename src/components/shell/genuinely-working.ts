/**
 * Which missions the shell's live line may call present-tense "working".
 *
 * P-18 (A-QUEUE.md), the defect A1 found live on `supaprod.ai`, 2026-09-03:
 * `missions.status` is a stored column and can go stale independently of the
 * work it describes. One track read `status='running'` since `08-31` while
 * its only builder run had long since moved to `waiting_approval`, so the
 * header said "Engineer is working... started 1d ago" over a run nobody was
 * touching -- present-tense work claimed on nothing moving, the exact defect
 * P-18 exists to end, one branch over from the one it already fixed
 * (`movingRuns`, the driven-tracks fallback this file's own header covers).
 *
 * Pure so the fix is provable without rendering the shell -- `AppFrame.tsx`
 * needs a router, a query client and a workspace provider to mount at all,
 * and this repo's own convention (`rail-presence.ts`'s `deriveRailPresence`)
 * is to pull a precedence rule like this one out and test it directly rather
 * than pay for that scaffolding to pin one filter.
 */

/**
 * `WORKING.has(status)` narrows to candidates; a mission counts as genuinely
 * working only once its own track also appears in the moving set -- the real
 * `agent_runs.status IN ('running','queued','in_progress')` read
 * (`listMovingTracks`), never the mission's own possibly-stale status alone.
 *
 * A mission with no track at all cannot be confirmed this way and is
 * excluded here too: every new mission is created by a run (R-35, RULINGS.md),
 * so a trackless "running" claim today is exactly the kind of stale claim
 * this function exists to refuse.
 */
export function genuinelyWorkingMissions<T extends { trackId: string | null }>(
  candidates: readonly T[],
  movingTrackIds: ReadonlySet<string>,
): T[] {
  return candidates.filter((m) => !!m.trackId && movingTrackIds.has(m.trackId));
}
