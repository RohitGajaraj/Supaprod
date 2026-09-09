import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackToolCalls, type TrackToolCall } from "@/lib/spine/track.functions";

/*
 * ── `useCurrentTool` IS DELETED, AND IT WAS THE DEFECT ─────────────────────
 *
 * It returned the newest call on the WHOLE track from ANY run, including runs
 * that had already finished, and the Now card paired it with a seat name taken
 * from the transcript's live rows. So the card could read "Engineer is reading
 * the spec" about a call Critique made twenty minutes earlier: two true facts
 * joined into a sentence nobody wrote.
 *
 * `useNewestCallByRun` below is the same read keyed the way it has to be, and
 * `liveSeats` now carries the `runId` that joins them. Removed rather than left
 * for reuse, because a whole-track "current tool" has no honest caller: any
 * sentence that names a seat needs that seat's own run.
 */

/**
 * The newest call each live seat made, by run id, on the same cache entry.
 * For the Now card's presences: "Scribe is drafting the spec “Show the
 * arrival window”" rather than "Scribe is working", and empty once nothing
 * runs, for the reason `useCurrentTool` gives.
 */
export function useNewestCallByRun(trackId: string, running: boolean): Map<string, TrackToolCall> {
  const fetchCalls = useServerFn(getTrackToolCalls);
  const q = useQuery({
    queryKey: ["track-tool-calls", trackId],
    queryFn: () => fetchCalls({ data: { trackId } }),
    refetchInterval: running ? 500 : 10_000,
  });
  const calls = q.data?.calls;
  return useMemo(() => {
    const byRun = new Map<string, TrackToolCall>();
    if (!running) return byRun;
    /* Oldest first, so the last write for a run is its newest call. */
    for (const c of calls ?? []) if (c.runId) byRun.set(c.runId, c);
    return byRun;
  }, [calls, running]);
}
