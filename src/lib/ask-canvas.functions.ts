/**
 * CMD-0 (H2 Command Canvas, first increment). Server read for the Ask
 * canvas blocks. When Ask (`AskPanel.tsx`) dispatches a mission, this feeds
 * the live progress / memory-citation / Critic-verdict blocks that replace
 * the old dead-end "Track the mission" link with something legible while
 * the mission runs.
 *
 * READ-ONLY, additive: no `/api/chat` change (that SSE contract is locked
 * per OBS-12 §3), no new table, no write. Deliberately its own lean query
 * rather than reusing `getStudioSession` (the mission slide-over's query),
 * which also fetches changes/CI/constraints/file-policy/steers this compact
 * 420px panel block never renders. Polled every 4s (same interval
 * `MissionSlideOver` already uses), so a lighter payload matters here.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { LoopStep } from "@/lib/ai/loop.server";
import type { CriticReview } from "@/lib/ai/critic.server";
import type { StudioApproval } from "@/lib/studio.functions";

export type AskMemoryRecall = {
  id: string;
  /** Truncated to 140 chars, same display-copy budget as `stepDescription`. */
  content: string;
  kind: string;
};

export type AskMissionCanvasResult = {
  run: { runId: string; status: string; steps: LoopStep[] } | null;
  approvals: StudioApproval[];
  memoryRecalls: AskMemoryRecall[];
  criticVerdict: CriticReview | null;
};

export const getAskMissionCanvas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<AskMissionCanvasResult> => {
    const db = context.supabase as unknown as SupabaseClient;

    const { data: runRow } = await db
      .from("agent_runs")
      .select("id,status")
      .eq("mission_id", data.missionId)
      .eq("agent_slug", "builder")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let run: AskMissionCanvasResult["run"] = null;
    let traceId: string | null = null;
    if (runRow) {
      const r = runRow as { id: string; status: string };
      const { data: cpRow } = await db
        .from("agent_run_checkpoints")
        .select("state")
        .eq("run_id", r.id)
        .order("step_index", { ascending: false })
        .limit(1)
        .maybeSingle();
      const state = (cpRow as { state?: { steps?: LoopStep[]; traceId?: string } } | null)?.state;
      run = { runId: r.id, status: r.status, steps: state?.steps ?? [] };
      traceId = state?.traceId ?? null;
    }

    const { data: approvalRows } = await db
      .from("agent_approvals")
      .select("id,tool_name,args,rationale,status,created_at,expires_at,result,error")
      .eq("mission_id", data.missionId)
      .order("created_at", { ascending: true });

    let memoryRecalls: AskMemoryRecall[] = [];
    if (traceId) {
      const { data: recallRows } = await db
        .from("memory_recall_log")
        .select("memory_id")
        .eq("trace_id", traceId)
        .limit(10);
      const memoryIds = [
        ...new Set(((recallRows ?? []) as Array<{ memory_id: string }>).map((r) => r.memory_id)),
      ];
      if (memoryIds.length) {
        const { data: memoryRows } = await db
          .from("agent_memory")
          .select("id,content,kind")
          .in("id", memoryIds);
        memoryRecalls = ((memoryRows ?? []) as Array<{ id: string; content: string; kind: string }>)
          .filter((m) => m.content)
          .map((m) => ({ id: m.id, content: m.content.slice(0, 140), kind: m.kind }));
      }
    }

    let criticVerdict: CriticReview | null = null;
    const { data: csRow } = await db
      .from("studio_changesets")
      .select("prd_id")
      .eq("mission_id", data.missionId)
      .neq("status", "abandoned")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const prdId = (csRow as { prd_id: string | null } | null)?.prd_id;
    if (prdId) {
      const { data: prdRow } = await db
        .from("prds")
        .select("critic_review")
        .eq("id", prdId)
        .maybeSingle();
      criticVerdict =
        (prdRow as { critic_review: CriticReview | null } | null)?.critic_review ?? null;
    }

    return {
      run,
      approvals: (approvalRows ?? []) as StudioApproval[],
      memoryRecalls,
      criticVerdict,
    };
  });
