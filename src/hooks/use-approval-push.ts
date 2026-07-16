import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * PC-36 gap fix: approval gates reach the Ask panel by push, not polling.
 * Subscribes to the signed-in user's agent_approvals changes (RLS enforced
 * per subscriber; migration 20260716120000 added the table to the realtime
 * publication) and pokes the panel's queries to refetch. The event payload
 * is never trusted or read; server functions stay the single read path.
 * Polling remains as a slow safety net because realtime drops silently on
 * network blips.
 */
export function useApprovalPush(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["ask-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["ask-mission-canvas"] });
    };

    void supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled) return;
      channel = supabase
        .channel(`ask-approvals-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "agent_approvals",
            filter: `user_id=eq.${userId}`,
          },
          invalidate,
        )
        .subscribe((status) => {
          // A (re)connect may have missed events while the socket was down;
          // one refetch on every successful subscribe closes that window.
          if (status === "SUBSCRIBED") invalidate();
        });
    });

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
