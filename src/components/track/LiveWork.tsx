import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackToolCalls } from "@/lib/spine/track.functions";

/**
 * The newest tool an agent on this track has called, or null.
 *
 * ── WHY A SEPARATE HOOK RATHER THAN A PROP OUT OF THE COMPONENT ───────────
 * The character sits at the TOP of the left pane and the stream sits in the
 * right one, so there is no parent that owns both without lifting state
 * through the whole surface. They share a react-query KEY instead, which is
 * the pattern this file's neighbours already use for exactly this
 * ("one fact about one run must not have two freshnesses"): the same cache
 * entry, the same beat, one request.
 *
 * ONLY WHILE RUNNING. A settled run's last tool call is a fact about the past,
 * and feeding it to the character would have Supa announce "I'm reading the
 * repository" about something it finished yesterday. `verbForTool` is present
 * tense, so its input has to be too.
 */
export function useCurrentTool(trackId: string, running: boolean): string | null {
  const fetchCalls = useServerFn(getTrackToolCalls);
  const q = useQuery({
    queryKey: ["track-tool-calls", trackId],
    queryFn: () => fetchCalls({ data: { trackId } }),
    refetchInterval: running ? 500 : 10_000,
  });
  if (!running) return null;
  const calls = q.data?.calls ?? [];
  return calls.length > 0 ? (calls[calls.length - 1]?.tool ?? null) : null;
}
