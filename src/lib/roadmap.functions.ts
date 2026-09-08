/**
 * H2 · Outcome roadmap (Now/Next/Later).
 *
 * The commitment layer over the agent-ranked opportunities: the human commits an
 * opportunity to a Now/Next/Later bucket with a declared outcome + measure, and
 * the agent's ICE ranking orders within each bucket (continuous re-ranking, per
 * the v6 positioning — this is outcome curation, not a manual task kanban).
 *
 * Read is `select("*")` so it is pre-migration tolerant: until the next sync
 * applies the roadmap columns, every opportunity reads as unplaced (bucket null)
 * and the board shows them all in the backlog; writes wait on the migration.
 * RLS-scoped via the existing "own opportunities all" policy.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { governanceGapCount, type RoadmapBucket } from "@/lib/roadmap-governance";
import {
  buildAuditInsert,
  type RoadmapAuditAction,
  type RoadmapAuditRow,
} from "@/lib/roadmap-audit";

export type { RoadmapBucket };

/** Coerce a raw DB bucket value to the typed bucket (migration-tolerant, mirrors getRoadmap). */
const asBucket = (b: unknown): RoadmapBucket | null =>
  b === "now" || b === "next" || b === "later" ? b : null;

/**
 * H2-AUDIT: record a roadmap decision, best-effort. Never throws into the caller
 * (a failed audit must not fail the roadmap write); the insert runs under the
 * user's RLS context, and `user_id` defaults to auth.uid() at the DB so the actor
 * cannot be spoofed. `workspace_id` is read back from the just-updated row.
 */
async function recordRoadmapDecision(
  supabase: { from: (t: string) => { insert: (rows: unknown) => Promise<{ error: unknown }> } },
  input: {
    opportunityId: string;
    workspaceId: string | null;
    action: RoadmapAuditAction;
    fromBucket?: RoadmapBucket | null;
    toBucket: RoadmapBucket | null;
    outcome?: string | null;
    measure?: string | null;
  },
): Promise<void> {
  try {
    await supabase.from("roadmap_audit").insert(buildAuditInsert(input));
  } catch {
    // best-effort: the audit is supplementary; never break the write it describes.
  }
}

export type RoadmapItem = {
  id: string;
  title: string;
  ice_score: number | null;
  bucket: RoadmapBucket | null;
  outcome: string | null;
  measure: string | null;
  /** Dim 17: the bet's last-changed time, for the card's trace-and-time tail. */
  updated_at: string | null;
  /** PC-10: true when a prior placement was captured, so a one-key Rewind applies. */
  hasSnapshot: boolean;
  /** Raw lifecycle state; not the lane. See the mapper. */
  status: string | null;
};

export const getRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: RoadmapItem[]; governanceGaps: number }> => {
    // KI-32: exclude terminal-lifecycle opportunities from the board. The
    // opportunities.status column ('backlog'|'now'|'next'|'later'|'shipped'|
    // 'dropped', NOT NULL default 'backlog') carries the lifecycle state that
    // discovery's updateOpportunity writes; without this filter, shipped and
    // dropped items permanently reappear on the Now/Next/Later board.
    // P-35: named columns, embedding excluded.
    const { data, error } = await context.supabase
      .from("opportunities")
      .select(
        "confidence,created_at,critic_review,ease,embedding_model,goal_id,hypothesis,ice_score,id,impact,is_public,is_sample,linked_brief_item_id,posthog_event,problem,product_id,project_id,roadmap_bucket,roadmap_last_agent_slug,roadmap_measure,roadmap_outcome,roadmap_snapshot_before,share_slug,status,target_user,theme_id,title,updated_at,user_id,workspace_id",
      )
      .not("status", "in", "(shipped,dropped)")
      .order("ice_score", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    const items: RoadmapItem[] = (data ?? []).map((o) => {
      const r = o as {
        id: string;
        title: string;
        ice_score?: number | string | null;
        roadmap_bucket?: string | null;
        roadmap_outcome?: string | null;
        roadmap_measure?: string | null;
        roadmap_snapshot_before?: unknown;
        updated_at?: string | null;
        status?: string | null;
      };
      const bucket =
        r.roadmap_bucket === "now" || r.roadmap_bucket === "next" || r.roadmap_bucket === "later"
          ? r.roadmap_bucket
          : null;
      return {
        id: r.id,
        title: r.title,
        ice_score: r.ice_score != null ? Number(r.ice_score) : null,
        bucket,
        outcome: r.roadmap_outcome ?? null,
        measure: r.roadmap_measure ?? null,
        updated_at: r.updated_at ?? null,
        hasSnapshot: r.roadmap_snapshot_before != null,
        /**
         * The bet's LIFECYCLE state, which is not the same thing as its lane.
         *
         * Carried since 2026-08-03 because dropping it made two stations
         * contradict each other in plain English: Decide showed two bets tagged
         * "committed" (their status) while Plan's headline read "Nothing is
         * committed yet" (no roadmap_bucket). Both were correct about their own
         * column; the word meant two different things one click apart.
         *
         * Note also that the comment above documents this column as
         * backlog|now|next|later|shipped|dropped, and the live data holds
         * "committed", "discovery" and "killed" as well. Passing the raw value
         * through rather than mapping it keeps this honest instead of silently
         * bucketing a state the code has never heard of.
         */
        status: r.status ?? null,
      };
    });
    // H2-WRITES: surface how many commitments sit in a bucket without a declared
    // outcome + measure (ungoverned), so the board can nudge toward the H2 rule.
    return { items, governanceGaps: governanceGapCount(items) };
  });

/**
 * H2-AUDIT · read an opportunity's roadmap-decision history (newest first), so the
 * board / a "why is this here" surface can show who committed it, when, and the
 * outcome promised at that time. RLS-scoped (own rows or a workspace you belong to).
 */
export const getRoadmapHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ opportunityId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ events: RoadmapAuditRow[] }> => {
    const { data: rows, error } = await context.supabase
      .from("roadmap_audit")
      .select(
        "id, opportunity_id, user_id, workspace_id, action, from_bucket, to_bucket, outcome, measure, created_at",
      )
      .eq("opportunity_id", data.opportunityId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { events: (rows ?? []) as RoadmapAuditRow[] };
  });
