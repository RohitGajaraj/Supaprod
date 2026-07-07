/**
 * SW-5 deliverable C — pure GitHub signal helpers (client-safe, no server
 * imports), so the milestone logic is unit-testable without pulling the signal
 * sink / supabaseAdmin. The I/O fetchers live in github-ingest.server.ts.
 */

/** The star-milestone ladder: the highest crossed milestone at or below
 * `count`, or null below the first rung. Because the signal's external_id keys
 * on the returned milestone (not the raw star count), crossing a new rung emits
 * exactly ONE new signal and every re-poll in between dedups on external_id. */
export function starMilestone(count: number): number | null {
  const ladder = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  let hit: number | null = null;
  for (const rung of ladder) {
    if (count >= rung) hit = rung;
    else break;
  }
  return hit;
}
