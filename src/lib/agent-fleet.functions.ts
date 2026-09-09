/**
 * AGENT-FLEET-VIEW (v11 #30) — the RLS adapter for the by-agent fleet surface.
 *
 * Reads the workspace's recent agent_runs (RLS-scoped via the request's authed
 * Supabase client) plus the agent roster, then composes the fleet server-side via
 * the PURE `agent-fleet.ts` model. The roster is best-effort — if it fails, the
 * fleet still renders from the runs (idle roster-only agents just won't show).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";
import {
  computeAgentFleet,
  type AgentFleet,
  type FleetRosterInput,
  type FleetRunInput,
} from "@/lib/agent-fleet";

export const getAgentFleet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { workspaceId?: string | null } | undefined) => input ?? {})
  .handler(async ({ context, data }): Promise<{ fleet: AgentFleet }> => {
    const { supabase } = context;
    // PC-29 fix: agent_runs carries a workspace_id (WM-F1); without this filter
    // a user who belongs to 2+ workspaces (the default - every account gets a
    // seeded Demo workspace plus an empty one) sees another workspace's runs
    // merged into whichever workspace is on screen. Fall back to the caller's
    // default workspace the same way getSwarmHud does, so an omitted id still
    // scopes to something rather than silently reading cross-workspace.
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = defaultWorkspaceId(ws);
    }

    // A recent window of runs is enough for a live fleet snapshot. No workspace
    // at all (a brand-new account with none yet) reads as an empty fleet rather
    // than every workspace's runs merged together.
    const { data: runs, error } = workspaceId
      ? await supabase
          .from("agent_runs")
          .select("agent_slug,agent_name,status,created_at")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(500)
      : { data: [], error: null };
    if (error) throw new Error(error.message);

    let roster: FleetRosterInput[] = [];
    try {
      const { data: agents } = await supabase.from("agents").select("slug,name");
      roster = (agents ?? [])
        .filter((a): a is { slug: string; name: string | null } => typeof a?.slug === "string")
        .map((a) => ({ slug: a.slug, name: a.name }));
    } catch (e) {
      console.error("[agent-fleet] roster fetch failed (degrading to runs-only):", e);
    }

    return { fleet: computeAgentFleet((runs ?? []) as FleetRunInput[], roster) };
  });
