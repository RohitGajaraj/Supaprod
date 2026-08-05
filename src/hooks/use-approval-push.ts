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

    /**
     * THE PUSH REACHED TWO PANELS AND NOT THE ONE PEOPLE WATCH.
     *
     * Found 2026-08-05. This hook is complete and correctly mounted, so an
     * audit calling it "built and mounted nowhere" was wrong in the letter. It
     * was right in the effect: it invalidated `ask-pending-approvals` and
     * `ask-mission-canvas`, while `AskRunCard` reads under `["ask-canvas",
     * missionId]`, which neither prefix matches. So a gate could be written and
     * pushed to the browser in milliseconds, and the card a person is actually
     * staring at went on polling for up to POLL_MS (4s) before it admitted
     * anything was waiting.
     *
     * That is the worst shape this can take: the expensive half (a live socket,
     * an RLS-filtered subscription, a reconnect sweep) was paid for, and the
     * cheap half (naming the right key) was missing, so the cost was carried
     * with none of the benefit.
     *
     * Fixed at the source rather than by mounting a second copy of the hook:
     * one subscription per user still serves every surface, and any future
     * reader of a gate gets the push by adding its key here.
     */
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["ask-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["ask-mission-canvas"] });
      queryClient.invalidateQueries({ queryKey: ["ask-canvas"] });
    };

    void supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled) return;
      // INSERT + UPDATE only (review fix 2026-07-16): DELETE events cannot
      // be filtered by column regardless of replica identity, so an
      // event:"*" binding would fire on every tenant's deletions. Gates are
      // never hard-deleted in the decide flow, so nothing real is lost.
      const match = {
        schema: "public",
        table: "agent_approvals",
        filter: `user_id=eq.${userId}`,
      } as const;
      channel = supabase
        .channel(`ask-approvals-${userId}`)
        .on("postgres_changes", { ...match, event: "INSERT" }, invalidate)
        .on("postgres_changes", { ...match, event: "UPDATE" }, invalidate)
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
