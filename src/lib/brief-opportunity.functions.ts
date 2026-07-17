/**
 * RPT-47 (finish): server fns for the opportunity <-> top-bet link.
 *
 * getBriefAlignment reads the state the ranking needs: every STANDING top-bet
 * brief item and whether any of its watched assumptions is challenged.
 * setOpportunityBriefLink is the human action that ties (or unties) an
 * opportunity to a bet. Both are RLS-scoped through the request client, so a
 * caller only ever touches its own workspaces' rows.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { BriefAlignmentMap } from "@/lib/brief-opportunity";

export type BriefAlignmentResult = { alignment: BriefAlignmentMap };

/**
 * The standing top bets and their assumption health. A bet appears in the map
 * iff it is a standing top_bet; `challenged` is true when at least one of its
 * watched assumptions has flipped to 'challenged' (FS-02 watch cron).
 */
export const getBriefAlignment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BriefAlignmentResult> => {
    const db = context.supabase as unknown as SupabaseClient;

    const { data: bets } = await db
      .from("brief_items")
      .select("id")
      .eq("kind", "top_bet")
      .eq("status", "standing")
      .limit(100);
    const ids = ((bets ?? []) as { id: string }[]).map((b) => b.id);
    if (ids.length === 0) return { alignment: {} };

    const { data: challengedRows } = await db
      .from("assumptions")
      .select("brief_item_id")
      .in("brief_item_id", ids)
      .eq("status", "challenged");
    const challenged = new Set(
      ((challengedRows ?? []) as { brief_item_id: string | null }[])
        .map((a) => a.brief_item_id)
        .filter((x): x is string => Boolean(x)),
    );

    const alignment: BriefAlignmentMap = {};
    for (const id of ids) alignment[id] = { challenged: challenged.has(id) };
    return { alignment };
  });

const SetLinkSchema = z.object({
  opportunityId: z.string().uuid(),
  // null unties the opportunity from any bet.
  briefItemId: z.string().uuid().nullable(),
});

/**
 * Tie an opportunity to a top bet, or untie it (briefItemId = null). A human
 * action only: the link is never inferred from text. RLS restricts the update
 * to the caller's own opportunity rows; a briefItemId that is not one of the
 * caller's standing top bets is rejected rather than stored, so the FK can never
 * point at another workspace's bet or a non-bet item.
 */
export const setOpportunityBriefLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SetLinkSchema.parse(i))
  .handler(async ({ context, data }): Promise<{ ok: boolean }> => {
    const db = context.supabase as unknown as SupabaseClient;

    if (data.briefItemId) {
      const { data: bet } = await db
        .from("brief_items")
        .select("id")
        .eq("id", data.briefItemId)
        .eq("kind", "top_bet")
        .eq("status", "standing")
        .maybeSingle();
      if (!bet) throw new Error("That bet is not a standing top bet in your workspace.");
    }

    const { error } = await db
      .from("opportunities")
      .update({ linked_brief_item_id: data.briefItemId })
      .eq("id", data.opportunityId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
