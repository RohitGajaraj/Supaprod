/**
 * THE HOME'S ONE READ, AND THE KEYS IT SEEDS.
 *
 * `readHome` (Lane 3, 2026-09-08) answers the four reads the home used to
 * race on arrival in one round trip: the runs, the shell's queue, who is
 * working and the three answers. Whoever runs it seeds each read's own key,
 * so the four observers mount already answered and keep their own cadences
 * after that. This module is the one place that knows which keys, because
 * two callers run it: the layout loader, which starts it the moment `/start`
 * is the destination (concurrently with the onboarding gate rather than
 * after it, P-32 pass 4), and the home itself, which finds that promise in
 * flight and joins it.
 *
 * WHY A STALE TIME ON THE SEED. Lane 2 read the Server-Timing on one load of
 * the home (2026-09-08): `listRunsForStart`, the front door's largest read at
 * 3.3 to 5.3 s, ran FOUR times. The loader fetched it, `readHome` fetched it
 * again, and then both observers on its key refetched on mount because a
 * seeded row is stale the instant it lands under the default stale time of
 * zero. The seed is as fresh as the poll it feeds, so it is fresh for one
 * poll interval, and an observer that mounts inside that window reads it.
 */
import type { QueryClient } from "@tanstack/react-query";
import { APPROVALS_QUEUE_PREFIX, runningNowKey } from "@/lib/query-keys";
import type { readHome } from "@/lib/spine/track.functions";

export type HomeRead = Awaited<ReturnType<typeof readHome>>;

/** One poll interval: the cadence every read on the home already keeps. */
export const HOME_STALE_MS = 10_000;

export function homeKey(workspaceId: string | null) {
  return ["home", workspaceId] as const;
}

/** Each read's own key, seeded from the composite answer. */
export function seedHome(qc: Pick<QueryClient, "setQueryData">, ws: string, r: HomeRead) {
  qc.setQueryData(["start-runs", ws], r.runs);
  qc.setQueryData([...APPROVALS_QUEUE_PREFIX, "shell", ws], r.queue);
  qc.setQueryData(runningNowKey(ws), r.running);
  qc.setQueryData(["start-home-answers", ws], r.answers);
}
