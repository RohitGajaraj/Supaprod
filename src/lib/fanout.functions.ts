/**
 * PC-12: parallel fan-out to one review queue. "Explore this from all
 * sides" on a bet (opportunity) or a spec (PRD): one dispatch, up to 3
 * parallel children (draft/eval/risks) via the EXISTING agent.spawn seam
 * (enqueueFanout, src/lib/ai/fanout.server.ts) -- nothing new spawned or
 * orchestrated, just a human-initiated call into the same fan-out plumbing
 * agent.spawn already uses, plus a `fanout_batches` row to reconcile the 3
 * children into ONE composite review card instead of 3 separate
 * notifications (fanout-reconcile-tick.ts does the reconciling).
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createMission } from "@/lib/ai/handoff.server";
import { enqueueFanout, fanoutEnabled } from "@/lib/ai/fanout.server";

const EXPLORE_AGENT_SLUG = "critic";

const db = <T extends SupabaseClient>(c: T) => c as unknown as SupabaseClient;

export const dispatchExploration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        targetKind: z.enum(["opportunity", "prd"]),
        targetId: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<{ batchId: string }> => {
    if (!fanoutEnabled()) {
      throw new Error("Exploration is not enabled on this workspace yet.");
    }
    const { supabase, userId } = context;
    const table = data.targetKind === "opportunity" ? "opportunities" : "prds";
    const { data: target, error: targetErr } = await supabase
      .from(table)
      .select("id,title,workspace_id")
      .eq("id", data.targetId)
      .maybeSingle();
    if (targetErr) throw new Error(targetErr.message);
    if (!target) throw new Error(`${data.targetKind} not found`);
    const workspaceId = (target as { workspace_id: string }).workspace_id;
    const title = (target as { title: string }).title;

    const mission = await createMission(supabase, userId, workspaceId, {
      title: `Explore from all sides: ${title.slice(0, 160)}`,
      goal: `Explore "${title}" from three angles for a human decision: a draft path forward, an honest evaluation of the idea, and the real risks.`,
      starting_agent_id: EXPLORE_AGENT_SLUG,
    });

    const kindLabel = data.targetKind === "opportunity" ? "bet" : "spec";
    const items = [
      {
        task: `Draft a concrete path forward for this ${kindLabel}: "${title}". What would shipping it actually look like, in 3-5 sentences?`,
        context: {
          fanout_section: "draft",
          target_kind: data.targetKind,
          target_id: data.targetId,
        },
      },
      {
        task: `Give an honest evaluation of this ${kindLabel}: "${title}". Is it worth doing? What is the strongest case for and against, in 3-5 sentences?`,
        context: { fanout_section: "eval", target_kind: data.targetKind, target_id: data.targetId },
      },
      {
        task: `Name the real risks in this ${kindLabel}: "${title}". What could make it fail or backfire, in 3-5 sentences?`,
        context: {
          fanout_section: "risks",
          target_kind: data.targetKind,
          target_id: data.targetId,
        },
      },
    ];

    const { spawned } = await enqueueFanout(supabase, userId, {
      mission_id: mission.id,
      workspace_id: workspaceId,
      from_agent_id: null,
      from_agent_slug: null,
      to_agent_slug: EXPLORE_AGENT_SLUG,
      items,
      parent_depth: 0,
      source_run_id: null,
      source_trace_id: null,
    });
    if (spawned.length === 0) {
      throw new Error("Exploration dispatch failed: no children were queued.");
    }

    const { data: batch, error: batchErr } = await db(supabase)
      .from("fanout_batches")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        mission_id: mission.id,
        target_kind: data.targetKind,
        target_id: data.targetId,
        target_title: title,
        child_run_ids: spawned.map((s) => s.queued_run_id),
        status: "pending",
      })
      .select("id")
      .single();
    if (batchErr) throw new Error(batchErr.message);

    return { batchId: (batch as { id: string }).id };
  });

export type FanoutComposite = {
  draft: string | null;
  eval: string | null;
  risks: string | null;
  synthesis: string | null;
};

export type FanoutBatch = {
  id: string;
  targetKind: "opportunity" | "prd";
  targetId: string;
  targetTitle: string;
  status: "pending" | "ready" | "decided";
  composite: FanoutComposite | null;
  decision: "accepted" | "dismissed" | null;
  createdAt: string;
};

export const listFanoutBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FanoutBatch[]> => {
    const { supabase } = context;
    const { data: workspaceId } = await supabase.rpc("current_user_default_workspace");
    if (!workspaceId) return [];
    const { data, error } = await db(supabase)
      .from("fanout_batches")
      .select("id,target_kind,target_id,target_title,status,composite,decision,created_at")
      .eq("workspace_id", workspaceId)
      .in("status", ["ready", "pending"])
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string,
      targetKind: r.target_kind as "opportunity" | "prd",
      targetId: r.target_id as string,
      targetTitle: r.target_title as string,
      status: r.status as "pending" | "ready" | "decided",
      composite: (r.composite as FanoutComposite | null) ?? null,
      decision: (r.decision as "accepted" | "dismissed" | null) ?? null,
      createdAt: r.created_at as string,
    }));
  });

export const decideFanoutBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ batchId: z.string().uuid(), decision: z.enum(["accepted", "dismissed"]) }).parse(i),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await db(supabase)
      .from("fanout_batches")
      .update({
        status: "decided",
        decision: data.decision,
        decided_by: userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.batchId)
      .eq("status", "ready");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
