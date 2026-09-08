import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * THE TRANSCRIPT MOVES THE MOMENT A SEAT ON ITS TRACK DOES.
 *
 * The transcript polls `getTrackActivity` every ten seconds until it has seen
 * a live turn, then every half second (TrackActivity.tsx). Ten seconds is a
 * fifth of a fifty-second seat, and the sweep starts seats nobody pressed for,
 * so the first turn of a run is the one most likely to be watched and the one
 * most likely to be late. `agent_runs` is in the realtime publication; this
 * subscribes to INSERT and UPDATE on rows carrying this track's id and
 * invalidates the two keys the transcript reads under, so the first row is
 * on screen when it is written and its checkpoints refresh the calls beside
 * it. The payload is never read: the filter is on the socket and the server
 * functions stay the single read path. Polling stays as the safety net.
 *
 * Mount once per run screen, beside the transcript's own query.
 */
export function useTrackActivityPush(
  trackId: string | null | undefined,
  client: Pick<typeof supabase, "channel" | "removeChannel"> = supabase,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!trackId || typeof window === "undefined") return;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["track-activity", trackId] });
      void queryClient.invalidateQueries({ queryKey: ["track-tool-calls", trackId] });
    };
    const match = {
      schema: "public",
      table: "agent_runs",
      filter: `track_id=eq.${trackId}`,
    } as const;
    const channel = client
      .channel(`track-activity-${trackId}`)
      .on("postgres_changes", { ...match, event: "INSERT" }, invalidate)
      .on("postgres_changes", { ...match, event: "UPDATE" }, invalidate);
    channel.subscribe((status) => {
      // A (re)connect may have missed a row while the socket was down.
      if (status === "SUBSCRIBED") invalidate();
    });

    return () => {
      void client.removeChannel(channel);
    };
  }, [trackId, queryClient, client]);
}
