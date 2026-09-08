import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { runningNowKey } from "@/lib/query-keys";
import { trackChangeKeys } from "@/hooks/use-track-change-push";

/**
 * THE LIVE WORK MOVES THE MOMENT A SEAT DOES.
 *
 * `listRunningNow` answers "which seats are working, on what, doing what this
 * second". Every surface that draws it polls on the shell's cadence, and a poll
 * is a promise to be late by up to one interval: a seat that starts the moment
 * after a fetch is invisible until the next one. For a product whose claim is
 * that the machine's work is seen as it happens, the interval is the gap.
 *
 * `agent_runs` is in the realtime publication since migration 20260909100300
 * (the 20260618182608 row did not survive whatever rebuilt the database, so
 * this socket was silent in production for its first hours; read off
 * pg_publication_tables, 2026-09-08). This subscribes to INSERT and UPDATE on it for the active
 * workspace and invalidates the one key the live work is read under, so a seat
 * appears when its row is written and its `now` refreshes when the loop stamps
 * a checkpoint. The payload is never read: server functions stay the single
 * read path, and RLS on the subscription keeps another tenant's rows out.
 *
 * Polling stays as the slow safety net, the same posture as
 * `useApprovalPush`: realtime drops silently on a network blip, and a resubscribe
 * refetches once so nothing that happened in the gap is missed.
 *
 * MOUNT ONCE, in the authenticated shell beside `useApprovalPush`. One socket
 * serves every surface; a second mount would be a second channel saying the
 * same thing.
 */
export function useRunningNowPush(
  workspaceId: string | null | undefined,
  client: Pick<typeof supabase, "channel" | "removeChannel"> = supabase,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId || typeof window === "undefined") return;

    const invalidate = () => {
      /* Every key that reads agent_runs, not only the seat list: the moment a
         seat finished, the strip cleared and the row, the road's node and the
         hero kept it working for up to ten seconds (third review, 2026-09-08). */
      void queryClient.invalidateQueries({ queryKey: runningNowKey(workspaceId) });
      for (const queryKey of trackChangeKeys(workspaceId)) {
        /* Joins an in-flight read rather than restarting it (Lane 2, 2026-09-08). */
        void queryClient.invalidateQueries({ queryKey }, { cancelRefetch: false });
      }
    };

    /*
     * Filtered by workspace on the socket, not only by RLS: the key is
     * per-workspace, and an event from another workspace the person belongs to
     * would refetch a cache that cannot have changed. DELETE is not bound, on
     * the same reasoning as the approvals socket: a run row is never hard
     * deleted while it runs, and a delete cannot be column-filtered.
     */
    const match = {
      schema: "public",
      table: "agent_runs",
      filter: `workspace_id=eq.${workspaceId}`,
    } as const;
    const channel = client
      .channel(`running-now-${workspaceId}`)
      .on("postgres_changes", { ...match, event: "INSERT" }, invalidate)
      .on("postgres_changes", { ...match, event: "UPDATE" }, invalidate);
    channel.subscribe((status) => {
      // A (re)connect may have missed events while the socket was down.
      if (status === "SUBSCRIBED") invalidate();
    });

    return () => {
      void client.removeChannel(channel);
    };
  }, [workspaceId, queryClient, client]);
}
