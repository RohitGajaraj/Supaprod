import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { APPROVALS_QUEUE_PREFIX } from "@/lib/query-keys";

/**
 * PC-36 gap fix: approval gates reach the Ask panel by push, not polling.
 * Subscribes to the signed-in user's agent_approvals changes (RLS enforced
 * per subscriber; migration 20260716120000 added the table to the realtime
 * publication) and pokes the panel's queries to refetch. The event payload
 * is never trusted or read; server functions stay the single read path.
 * Polling remains as a slow safety net because realtime drops silently on
 * network blips.
 */
export function useApprovalPush(
  enabled: boolean,
  /**
   * Defaults to the real client; a test passes its own fake instead. Not a
   * `mock.module` on `@/integrations/supabase/client`, on purpose --
   * `a-module-mock-is-process-wide.test.ts` freezes which modules more than
   * one test file may replace, `AskPane.test.tsx` already claims this one,
   * and `mock.module` is process-wide in Bun regardless of which test file
   * runs first. A parameter costs this hook one default value; a second
   * process-wide mock of the same module costs every OTHER file that
   * imports it after this one's test runs.
   */
  client: Pick<typeof supabase, "auth" | "channel" | "removeChannel"> = supabase,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;
    let channel: ReturnType<typeof client.channel> | null = null;

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
    /*
     * ── THE RUN SCREEN AND THE BOARD JOINED THE PUSH (2026-09-01) ──────────
     *
     * The note above ends "any future reader of a gate gets the push by adding
     * its key here", and there were two readers doing without it.
     *
     * `track-gates` is the RUN SCREEN's inline question -- the card that asks
     * a person to approve or decline mid-run. It polls every 10s
     * (`TrackConsent.tsx:92`), so a gate the socket already knew about took up
     * to ten seconds to appear on the one surface a person is watching while it
     * happens. That is the worst place in the product to be late.
     *
     * `approvals-queue` is what the BOARD's review queue and the rail's count
     * read, so the number on the door and the cards behind it now move together
     * with the run rather than on their own timers.
     *
     * The cost is nothing: the socket, the RLS filter and the reconnect sweep
     * were already paid for. These are three more cache keys on an event that
     * was already firing.
     */
    /*
     * ── FOUR MORE TABLES JOINED THE SOCKET (P-83, A-QUEUE.md) ──────────────
     *
     * `agent_approvals` alone only ever pushed the "tool_call" family of
     * `getApprovalsQueue`'s ten. A memory candidate, a critic-flagged
     * opportunity, a new theme or a settled decision could all leave the
     * approvals page reading an empty queue while its OWN separate
     * `getLiveActivity` read (a different table, `countNeedsYouCalls`) said
     * something was waiting -- the exact gap that produced "One just came in.
     * Refresh to see it." Migration 20260909090100 adds memory_candidates,
     * opportunities, themes and decisions to the realtime publication.
     *
     * NO `user_id`/`workspace_id` FILTER on these four, on purpose: they carry
     * `workspace_id`, not `user_id`, and RLS already scopes what a subscriber
     * receives to workspaces they are a member of -- the same posture
     * `trust_graduation_proposals`' own read documents ("RLS-wide... across
     * every workspace I'm a member of"). Threading the active workspace id
     * into this hook (mounted once, above `WorkspaceProvider`, at
     * `_authenticated.tsx`) would only narrow an already-safe read.
     *
     * `approvals-live-activity` is invalidated here for the first time -- it
     * was never invalidated by ANYTHING before this, polling on its own timer
     * while the queue it disagrees with had a live push. That mismatch is
     * what wrote "Refresh to see it" in the first place.
     */
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["ask-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["ask-mission-canvas"] });
      queryClient.invalidateQueries({ queryKey: ["ask-canvas"] });
      queryClient.invalidateQueries({ queryKey: ["track-gates"] });
      queryClient.invalidateQueries({ queryKey: APPROVALS_QUEUE_PREFIX });
      queryClient.invalidateQueries({ queryKey: ["approvals-live-activity"] });
      queryClient.invalidateQueries({ queryKey: ["start-home-answers"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    };

    void client.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled) return;
      // INSERT + UPDATE only (review fix 2026-07-16): DELETE events cannot
      // be filtered by column regardless of replica identity, so an
      // event:"*" binding would fire on every tenant's deletions. Gates are
      // never hard-deleted in the decide flow, so nothing real is lost.
      const userMatch = {
        schema: "public",
        table: "agent_approvals",
        filter: `user_id=eq.${userId}`,
      } as const;
      // The four P-83 tables: no column filter (see the header above), RLS
      // does the scoping. Same INSERT+UPDATE-only rule as agent_approvals --
      // a delete off the approvals queue is never the "something new arrived"
      // case this socket exists for.
      const workspaceScopedTables = [
        "memory_candidates",
        "opportunities",
        "themes",
        "decisions",
      ] as const;
      channel = client.channel(`ask-approvals-${userId}`);
      channel
        .on("postgres_changes", { ...userMatch, event: "INSERT" }, invalidate)
        .on("postgres_changes", { ...userMatch, event: "UPDATE" }, invalidate);
      for (const table of workspaceScopedTables) {
        const match = { schema: "public", table } as const;
        channel
          .on("postgres_changes", { ...match, event: "INSERT" }, invalidate)
          .on("postgres_changes", { ...match, event: "UPDATE" }, invalidate);
      }
      channel.subscribe((status) => {
        // A (re)connect may have missed events while the socket was down;
        // one refetch on every successful subscribe closes that window.
        if (status === "SUBSCRIBED") invalidate();
      });
    });

    return () => {
      cancelled = true;
      if (channel) void client.removeChannel(channel);
    };
  }, [enabled, queryClient, client]);
}
