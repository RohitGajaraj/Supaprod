/**
 * JNY-01: the strategy head — read-side for the competitor + trend registry.
 *
 * Gives the scout_targets watch list (previously invisible — Signal Fabric
 * shipped dark) and the weekly synthesized briefs (competitor-tick) their
 * first UI surface. Both are plain RLS-scoped reads through the caller's
 * authed client: scout_targets carries a member-read policy, signals its
 * usual workspace-scoped RLS.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { WatchKind, Cadence } from "@/lib/scout/kinds";

export type TrackedEntity = {
  id: string;
  kind: WatchKind;
  label: string;
  url: string | null;
  cadence: Cadence;
  enabled: boolean;
  last_checked_at: string | null;
  consecutive_unchanged: number;
};

export type StrategyBrief = {
  id: string;
  kind: "competitor" | "tech_shift";
  title: string;
  content: string;
  created_at: string;
};

const TRACKED_KINDS = ["competitor-surface", "tech-platform-shift"] as const;
const BRIEF_SOURCES: Record<string, StrategyBrief["kind"]> = {
  strategy_competitor_brief: "competitor",
  strategy_tech_shift_brief: "tech_shift",
};

async function resolveWorkspaceId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.rpc("current_user_default_workspace");
  return (data as string | null) ?? null;
}

export const listTrackedEntities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrackedEntity[]> => {
    const supabase = context.supabase as SupabaseClient;
    const workspaceId = await resolveWorkspaceId(supabase);
    if (!workspaceId) return [];

    const { data, error } = await supabase
      .from("scout_targets" as never)
      .select("id,kind,label,url,cadence,enabled,last_checked_at,consecutive_unchanged")
      .eq("workspace_id", workspaceId)
      .in("kind", TRACKED_KINDS)
      .order("label", { ascending: true })
      .limit(200);
    if (error) return [];
    return (data ?? []) as unknown as TrackedEntity[];
  });

export const listStrategyBriefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StrategyBrief[]> => {
    const supabase = context.supabase as SupabaseClient;
    const workspaceId = await resolveWorkspaceId(supabase);
    if (!workspaceId) return [];

    const { data, error } = await supabase
      .from("signals")
      .select("id,source,title,content,created_at")
      .eq("workspace_id", workspaceId)
      .in("source", Object.keys(BRIEF_SOURCES))
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return [];
    return (
      (data ?? []) as Array<{
        id: string;
        source: string;
        title: string;
        content: string | null;
        created_at: string;
      }>
    ).map((r) => ({
      id: r.id,
      kind: BRIEF_SOURCES[r.source] ?? "competitor",
      title: r.title,
      content: r.content ?? "",
      created_at: r.created_at,
    }));
  });
