/**
 * PC-33: the product context layer. Composes the workspace's identity from
 * the existing Brief (workspace_briefs + brief_items, JNY-02) so a PM
 * switching between products is re-grounded in each one's story -- no new
 * tables, this is a read-composition over what already exists.
 *
 * Scope note (spec vs. schema): the coherence-cluster spec names "north-star"
 * and "stage" as identity fields. Neither exists anywhere in the schema (no
 * column, no brief_items kind) and adding one would violate the spec's own
 * "no new tables" constraint, so this composes only the fields that are real:
 * name, the standing positioning brief_item as the one-liner (falling back to
 * workspace_briefs.mission when no positioning item has been written yet),
 * current_focus, and the most recent standing top_bet.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProductContext = {
  workspaceId: string;
  name: string;
  oneLiner: string;
  currentFocus: string;
  topBet: string | null;
};

export const getProductContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) =>
    z.object({ workspaceId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<ProductContext> => {
    const { supabase } = context;
    const { workspaceId } = data;

    const [{ data: ws }, { data: brief }, { data: items }] = await Promise.all([
      supabase.from("workspaces").select("name").eq("id", workspaceId).maybeSingle(),
      supabase
        .from("workspace_briefs")
        .select("mission,current_focus")
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
      supabase
        .from("brief_items")
        .select("kind,title,body,created_at")
        .eq("workspace_id", workspaceId)
        .eq("status", "standing")
        .order("created_at", { ascending: false }),
    ]);

    const positioning = (items ?? []).find((i) => i.kind === "positioning") ?? null;
    const topBet = (items ?? []).find((i) => i.kind === "top_bet") ?? null;

    return {
      workspaceId,
      name: ws?.name ?? "Untitled product",
      oneLiner: positioning?.body || brief?.mission || "",
      currentFocus: brief?.current_focus ?? "",
      topBet: topBet?.title ?? null,
    };
  });

export type WorkspacePortfolioCard = {
  workspaceId: string;
  name: string;
  oneLiner: string;
  currentFocus: string;
  /** Open assumption challenges + proposed playbooks for this workspace.
   *  Deliberately narrower than Today's full "N calls need you" badge: that
   *  badge also folds in agent_approvals (user-scoped, not per-workspace) and
   *  prds/opportunities counts that today's schema leaves unscoped to a single
   *  workspace, so replicating it per-card would either repeat one number on
   *  every card or fabricate a workspace split that does not exist in the
   *  data. This counts only what genuinely belongs to this workspace alone. */
  callsWaiting: number;
};

/** One round trip per underlying table regardless of workspace count, so a
 *  5-product portfolio costs the same 4 queries a 1-product one does. */
export const getWorkspacePortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkspacePortfolioCard[]> => {
    const { supabase, userId } = context;

    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId);
    const workspaceIds = [...new Set((memberships ?? []).map((m) => m.workspace_id as string))];
    if (workspaceIds.length === 0) return [];

    const [
      { data: workspaces },
      { data: briefs },
      { data: items },
      { data: challenges },
      { data: proposals },
    ] = await Promise.all([
      supabase.from("workspaces").select("id,name").in("id", workspaceIds),
      supabase
        .from("workspace_briefs")
        .select("workspace_id,mission,current_focus")
        .in("workspace_id", workspaceIds),
      supabase
        .from("brief_items")
        .select("workspace_id,kind,body,created_at")
        .in("workspace_id", workspaceIds)
        .eq("status", "standing")
        .eq("kind", "positioning")
        .order("created_at", { ascending: false }),
      supabase
        .from("assumption_challenges")
        .select("workspace_id")
        .in("workspace_id", workspaceIds)
        .eq("status", "open"),
      supabase
        .from("playbook_proposals")
        .select("workspace_id")
        .in("workspace_id", workspaceIds)
        .eq("status", "proposed"),
    ]);

    const briefByWs = new Map<string, { mission: string | null; current_focus: string | null }>(
      (briefs ?? []).map((b) => [b.workspace_id as string, b]),
    );
    const positioningByWs = new Map<string, string>();
    for (const item of items ?? []) {
      // Rows arrive newest-first; keep only the first (most recent) per workspace.
      if (!positioningByWs.has(item.workspace_id as string)) {
        positioningByWs.set(item.workspace_id as string, item.body as string);
      }
    }
    const tally = (rows: { workspace_id: string }[] | null) => {
      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        counts.set(row.workspace_id, (counts.get(row.workspace_id) ?? 0) + 1);
      }
      return counts;
    };
    const challengeCounts = tally(challenges);
    const proposalCounts = tally(proposals);

    return (workspaces ?? []).map((ws) => {
      const brief = briefByWs.get(ws.id as string);
      return {
        workspaceId: ws.id as string,
        name: ws.name as string,
        oneLiner: positioningByWs.get(ws.id as string) || brief?.mission || "",
        currentFocus: brief?.current_focus ?? "",
        callsWaiting:
          (challengeCounts.get(ws.id as string) ?? 0) + (proposalCounts.get(ws.id as string) ?? 0),
      };
    });
  });
