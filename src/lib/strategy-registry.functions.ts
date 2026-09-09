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
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

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
  return defaultWorkspaceId(data);
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

/**
 * RPT-46: the daily upstream intelligence brief, surfaced with receipts.
 *
 * The researcher-tick / scout-tick machinery already writes these briefs into
 * `signals` (market, competitor, and tech-shift kinds) and links every
 * contributing raw signal into `artifact_lineage` (relation `derived-from`,
 * brief = child, raw signal = parent). This read is the surface delta: no
 * migration, no new tables, no touching the tick. It stays gate-resilient by
 * returning [] whenever nothing has fired yet.
 */
export type IntelBriefKind = "market" | "competitor" | "tech_shift";

export type IntelBriefReceipt = {
  /** The contributing raw signal's id. */
  id: string;
  /** The raw signal's own title (what the reveal shows). */
  title: string;
};

export type IntelBrief = {
  id: string;
  kind: IntelBriefKind;
  title: string;
  content: string;
  created_at: string;
  /** How many raw signals this brief was synthesized from. */
  receiptCount: number;
  /** The contributing raw signals, titled, for the receipts reveal. */
  receipts: IntelBriefReceipt[];
};

const INTEL_SOURCES: Record<string, IntelBriefKind> = {
  competitive_research: "market",
  strategy_competitor_brief: "competitor",
  strategy_tech_shift_brief: "tech_shift",
};

export const listIntelligenceBriefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntelBrief[]> => {
    const supabase = context.supabase as SupabaseClient;
    const workspaceId = await resolveWorkspaceId(supabase);
    if (!workspaceId) return [];

    // Read 1: the latest intelligence briefs for this workspace (RLS-scoped).
    const { data: briefData, error: briefErr } = await supabase
      .from("signals")
      .select("id,source,title,content,created_at")
      .eq("workspace_id", workspaceId)
      .in("source", Object.keys(INTEL_SOURCES))
      .order("created_at", { ascending: false })
      .limit(6);
    if (briefErr || !briefData || briefData.length === 0) return [];

    const briefs = briefData as Array<{
      id: string;
      source: string;
      title: string | null;
      content: string | null;
      created_at: string;
    }>;
    const briefIds = briefs.map((b) => b.id);

    // Read 2: every contributing raw signal for these briefs in one batched
    // query (no N+1). The brief is the child; each `derived-from` parent is a
    // raw signal it was synthesized from.
    const { data: lineageData } = await supabase
      .from("artifact_lineage" as never)
      .select("child_id,parent_id")
      .eq("workspace_id", workspaceId)
      .eq("relation", "derived-from")
      .in("child_id", briefIds);

    const lineage = (lineageData ?? []) as unknown as Array<{
      child_id: string;
      parent_id: string;
    }>;
    const parentsByBrief = new Map<string, string[]>();
    const parentIds = new Set<string>();
    for (const row of lineage) {
      const list = parentsByBrief.get(row.child_id);
      if (list) list.push(row.parent_id);
      else parentsByBrief.set(row.child_id, [row.parent_id]);
      parentIds.add(row.parent_id);
    }

    // Read 3: titles for the contributing raw signals. Titles live on the
    // `signals` row (not on `artifact_lineage`), so the reveal needs one more
    // batched `in` lookup. Still zero N+1: a single query regardless of count.
    const titleById = new Map<string, string>();
    if (parentIds.size > 0) {
      const { data: parentData } = await supabase
        .from("signals")
        .select("id,title")
        .eq("workspace_id", workspaceId)
        .in("id", Array.from(parentIds));
      for (const row of (parentData ?? []) as Array<{ id: string; title: string | null }>) {
        titleById.set(row.id, row.title ?? "Untitled signal");
      }
    }

    return briefs.map((b) => {
      const parents = parentsByBrief.get(b.id) ?? [];
      return {
        id: b.id,
        kind: INTEL_SOURCES[b.source] ?? "market",
        title: b.title ?? "Untitled brief",
        content: b.content ?? "",
        created_at: b.created_at,
        receiptCount: parents.length,
        receipts: parents.map((pid) => ({
          id: pid,
          title: titleById.get(pid) ?? "Untitled signal",
        })),
      };
    });
  });
