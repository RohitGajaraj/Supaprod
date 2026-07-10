/**
 * PC-34: the Brain front door. Composes existing data (learnings, the FS-01
 * insights table, decisions + their supersession chain) into the three
 * things a person sees before choosing a lens: what changed, a couple of
 * volunteered insights, and (via markBrainSeen) a real per-workspace visit
 * marker so "since you last looked" is honest, not a fabricated recency
 * label. brain_last_seen is the only new table this row adds (migration
 * 20260710220000_pc34_brain_last_seen.sql); everything else reads tables
 * that already exist.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizeCalibration } from "@/lib/brain/calibrate-insights.server";
import { resolveGoverningForNodes } from "@/lib/ai/governing-decision.server";

const WorkspaceInput = z.object({ workspaceId: z.string().uuid() });

export type WhatChangedItem = {
  id: string;
  headline: string;
  createdAt: string;
};

/** The most recent record changes since the caller's last Brain visit (or
 *  the 5 most recent, on a first visit -- there is nothing to diff against).
 *  Sourced from `learnings` only for now: it is the one table that already
 *  carries a plain-language `summary` per row, so a headline never needs a
 *  second lookup. */
export const getWhatChanged = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof WorkspaceInput>) => WorkspaceInput.parse(d))
  .handler(async ({ context, data }): Promise<WhatChangedItem[]> => {
    const { supabase, userId } = context;
    const { data: seenRow } = await supabase
      .from("brain_last_seen" as never)
      .select("seen_at")
      .eq("user_id", userId)
      .eq("workspace_id", data.workspaceId)
      .maybeSingle();
    const seenAt = (seenRow as { seen_at: string } | null)?.seen_at ?? null;

    const { data: rows } = await supabase
      .from("learnings")
      .select("id,summary,verdict,new_ice,created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const learnings = (rows ?? []) as {
      id: string;
      summary: string | null;
      verdict: string | null;
      new_ice: number | null;
      created_at: string;
    }[];

    const filtered = seenAt ? learnings.filter((l) => l.created_at > seenAt) : learnings;
    return filtered.slice(0, 5).map((l) => ({
      id: l.id,
      headline: l.summary?.trim() || `Re-scored a bet (${l.verdict ?? "reviewed"})`,
      createdAt: l.created_at,
    }));
  });

/** Marks this workspace as seen by this user right now. Call this once the
 *  front door has rendered "what changed" for the CURRENT visit, so this
 *  visit's own changes stay visible and the next visit starts the clock
 *  from here, never from itself. */
export const markBrainSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof WorkspaceInput>) => WorkspaceInput.parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    await supabase
      .from("brain_last_seen" as never)
      .upsert(
        {
          user_id: userId,
          workspace_id: data.workspaceId,
          seen_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id,workspace_id" },
      );
    return { ok: true };
  });

export type VolunteeredInsight = {
  id: string;
  kind: "prediction" | "risk" | "cost_of_inaction" | "hidden_connection";
  headline: string;
  detail: string;
  calibrationLabel: string | null;
};

/** Up to 2 open insights (FS-01..04's `insights` table), the highest-scoring
 *  first. A thin, workspace-parameterized sibling of `getInsightRail`
 *  (`src/lib/brain/insights.functions.ts`), which resolves the caller's
 *  single default workspace internally and can't take an explicit id -- the
 *  front door needs whichever workspace is active in the switcher, not
 *  necessarily the default one. */
export const getVolunteeredInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof WorkspaceInput>) => WorkspaceInput.parse(d))
  .handler(async ({ context, data }): Promise<VolunteeredInsight[]> => {
    const { supabase } = context;
    const { data: rows } = await supabase
      .from("insights")
      .select("id,kind,headline,detail,score,created_at")
      .eq("workspace_id", data.workspaceId)
      .eq("status", "open")
      .neq("kind", "next_best_action")
      .order("score", { ascending: false, nullsFirst: false })
      .limit(2);

    const items = (rows ?? []) as {
      id: string;
      kind: VolunteeredInsight["kind"];
      headline: string;
      detail: string;
    }[];

    const calibratedKinds = Array.from(
      new Set(
        items
          .map((r) => r.kind)
          .filter((k): k is "prediction" | "risk" => k === "prediction" || k === "risk"),
      ),
    );
    const labelByKind = new Map<string, string | null>(
      await Promise.all(
        calibratedKinds.map(async (kind) => {
          const summary = await summarizeCalibration(supabase, data.workspaceId, kind);
          return [kind, summary.resolved > 0 ? summary.recentLabel : null] as const;
        }),
      ),
    );

    return items.map((row) => ({
      ...row,
      calibrationLabel: labelByKind.get(row.kind) ?? null,
    }));
  });

export type JudgmentEntry = {
  id: string;
  title: string;
  rationale: string | null;
  status: "pending" | "approved" | "rejected";
  decidedBy: string | null;
  createdAt: string;
  supersededByTitle: string | null;
  contradicted: boolean;
};

export type JudgmentTimelineResult = {
  entries: JudgmentEntry[];
  /** "Cadence called N of the last M {kind}s" -- null when nothing has
   *  resolved yet, never a fabricated placeholder. */
  calibrationLine: string | null;
};

const JUDGMENT_LIMIT = 30;

/** Decisions + their supersession chain, composed (not stored) from
 *  `decisions` and the existing `artifact_lineage` walk in
 *  `governing-decision.server.ts` -- the same machinery the Critic already
 *  reuses. Best-effort: if a decision has no lineage edges (most won't yet),
 *  it simply renders with no supersession, never an error. */
export const getJudgmentTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<JudgmentTimelineResult> => {
    const { supabase, userId } = context;

    const { data: rows } = await supabase
      .from("decisions")
      .select("id,title,rationale,status,decided_by_agent_slug,created_at")
      .order("created_at", { ascending: false })
      .limit(JUDGMENT_LIMIT);
    const decisions = (rows ?? []) as {
      id: string;
      title: string;
      rationale: string | null;
      status: JudgmentEntry["status"];
      decided_by_agent_slug: string | null;
      created_at: string;
    }[];

    const governing = await resolveGoverningForNodes(
      supabase,
      userId,
      decisions.map((d) => ({ kind: "decision", id: d.id })),
    );
    const governingByFromId = new Map(governing.map((g) => [g.fromId, g]));

    const entries: JudgmentEntry[] = decisions.map((d) => {
      const g = governingByFromId.get(d.id);
      return {
        id: d.id,
        title: d.title,
        rationale: d.rationale,
        status: d.status,
        decidedBy: d.decided_by_agent_slug,
        createdAt: d.created_at,
        supersededByTitle: g?.superseded ? (g.governingTitle ?? null) : null,
        contradicted: Boolean(g?.contradicted),
      };
    });

    const { data: ws } = await supabase.rpc("current_user_default_workspace");
    const workspaceId = (ws as string | null) ?? null;
    let calibrationLine: string | null = null;
    if (workspaceId) {
      for (const kind of ["prediction", "risk"] as const) {
        const summary = await summarizeCalibration(supabase, workspaceId, kind);
        if (summary.resolved > 0) {
          calibrationLine = summary.recentLabel;
          break;
        }
      }
    }

    return { entries, calibrationLine };
  });
