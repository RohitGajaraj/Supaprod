/**
 * RPT-33: the value-receipts attribution meter. Two objectively countable
 * facts about a workspace's use of Supaprod - decisions closed and PRs
 * shipped - not a fabricated "hours saved" estimate. Honesty rule
 * (claim-never-outruns-wiring): no real methodology exists yet for a
 * defensible time-automated figure, so this deliberately does not invent
 * one; that third figure is a documented follow-up, not silently assumed.
 */

import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ValueReceipts = {
  decisionsClosed: number;
  prsShipped: number;
};

export const getValueReceipts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ValueReceipts> => {
    const { supabase, userId } = context;
    const db = supabase as unknown as SupabaseClient;

    const { data: memberRows } = await db
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1);
    const workspaceId = memberRows && memberRows.length > 0 ? memberRows[0].workspace_id : null;
    if (!workspaceId) return { decisionsClosed: 0, prsShipped: 0 };

    const [decisionsRes, changesetsRes] = await Promise.all([
      // "Closed" = a real decision was actually made and stands (status
      // moved past pending), not merely drafted.
      db
        .from("decisions")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .neq("status", "pending"),
      // "Shipped" = every merged changeset, a raw count - deliberately
      // looser than the changelog's own shouldPublishChangelog gate
      // (src/lib/changelog.ts), which also requires release notes before
      // showing an entry. A PR can ship with no written notes and still
      // count here; it just would not get its own changelog entry.
      db
        .from("studio_changesets")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "merged"),
    ]);
    if (decisionsRes.error) throw new Error(decisionsRes.error.message);
    if (changesetsRes.error) throw new Error(changesetsRes.error.message);

    return {
      decisionsClosed: decisionsRes.count ?? 0,
      prsShipped: changesetsRes.count ?? 0,
    };
  });
