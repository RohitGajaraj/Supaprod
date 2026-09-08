import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { APPROVALS_QUEUE_PREFIX } from "@/lib/query-keys";

/**
 * A RUN'S POSITION MOVES THE MOMENT IT CHANGES.
 *
 * The home's run rows draw each run as a position on the seven-station road
 * (`Journey`), the hero counts what is waiting, held and moving, and both
 * read `listRunsForStart` under `["start-runs", ws]` on a poll. A poll is a
 * promise to be late by up to one interval: a station that finishes, a hold
 * that lands or a call that opens shows up to ten seconds after it happened,
 * and ten seconds of a row not moving reads as the machine being idle. For
 * a product whose claim is that the machine's work is seen as it happens,
 * that interval is the gap (Lane 1, 2026-09-08; the standing goal).
 *
 * This subscribes to UPDATE on `spine_tracks` for the active workspace and
 * invalidates the two keys a change to a track can move: the home's runs,
 * and the shell's queue read (a track that starts needing a person is one
 * more call waiting; one that stops needing them is one fewer). The payload
 * is never read: server functions stay the single read path, and RLS on the
 * subscription keeps another tenant's rows out. Same posture as
 * `useRunningNowPush`: polling stays as the slow safety net, and a resubscribe
 * refetches once so nothing that happened in the gap is missed.
 *
 * INERT UNTIL `spine_tracks` IS IN THE REALTIME PUBLICATION (Lane 3's half,
 * one migration). Until then the socket subscribes and hears nothing, and
 * the poll carries on; no surface changes shape.
 *
 * MOUNT ONCE, beside `RunningNowPush` in the authenticated shell.
 */
export type TrackChangeClient = Pick<typeof supabase, "channel" | "removeChannel">;

export function trackChangeKeys(workspaceId: string) {
  return [
    ["start-runs", workspaceId] as const,
    [...APPROVALS_QUEUE_PREFIX, "shell", workspaceId] as const,
  ];
}

/**
 * The subscription itself, apart from React so it can be proved with a fake
 * client: one channel per workspace, UPDATE only (a track is inserted by the
 * press that also refetches, and never hard-deleted while it shows), and a
 * refetch on every SUBSCRIBED.
 */
export function subscribeTrackChanges(
  client: TrackChangeClient,
  workspaceId: string,
  queryClient: Pick<QueryClient, "invalidateQueries">,
) {
  const invalidate = () => {
    for (const queryKey of trackChangeKeys(workspaceId)) {
      /* A change that lands while the read is in flight joins that read
         rather than cancelling it: a burst of row updates restarted the
         page's largest read on each one and it never finished (Lane 2,
         2026-09-08). The poll is the safety net for what the flight missed. */
      void queryClient.invalidateQueries({ queryKey }, { cancelRefetch: false });
    }
  };
  const channel = client.channel(`track-changes-${workspaceId}`).on(
    "postgres_changes",
    {
      schema: "public",
      table: "spine_tracks",
      filter: `workspace_id=eq.${workspaceId}`,
      event: "UPDATE",
    },
    invalidate,
  );
  /* A RECONNECT refetches once, so a gap while the socket was down is closed.
     The FIRST connect has no gap: the rows were read moments ago, and this
     refetched the page's largest read on every arrival (read live on
     72c04f6e, 2026-09-08). The poll carries anything between that read and
     the socket coming up. */
  let connected = false;
  channel.subscribe((status) => {
    if (status !== "SUBSCRIBED") return;
    if (connected) invalidate();
    connected = true;
  });
  return () => {
    void client.removeChannel(channel);
  };
}

export function useTrackChangePush(
  workspaceId: string | null | undefined,
  client: TrackChangeClient = supabase,
) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!workspaceId || typeof window === "undefined") return;
    return subscribeTrackChanges(client, workspaceId, queryClient);
  }, [workspaceId, queryClient, client]);
}
