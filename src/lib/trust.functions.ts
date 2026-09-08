/**
 * Agent Trust + Autonomy Dial — TanStack server functions.
 * Read: getAllAgentTrust (batched for the roster page).
 * Write: setAgentArc (operator moves an agent along the trust arc).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { computeAllAgentTrust, type AgentTrust, type Arc } from "@/lib/ai/trust.server";

export type { AgentTrust, Arc };

export const getAllAgentTrust = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const trust = await computeAllAgentTrust(supabase, userId);
    return { trust };
  });

const ArcEnum = z.enum(["observing", "proving", "trusted", "ambient"]);

export const setAgentArc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        agentId: z.string().uuid(),
        arc: ArcEnum,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify the agent belongs to the user (RLS would also block, but this
    // returns a cleaner error to the UI).
    const { data: agent, error: agentErr } = await supabase
      .from("agents")
      .select("id")
      .eq("id", data.agentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (agentErr) throw new Error(agentErr.message);
    if (!agent) throw new Error("Agent not found");

    const { error } = await supabase.from("agent_autonomy").upsert(
      {
        user_id: userId,
        agent_id: data.agentId,
        arc: data.arc,
        set_by: userId,
        set_at: new Date().toISOString(),
      },
      { onConflict: "user_id,agent_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, arc: data.arc };
  });

// ---------------------------------------------------------------------------
// SW-4 / mission 3.10 TRUST RAMP: graduation proposals per (agent, tool).
// The system proposes review -> confirm -> auto after N clean approvals
// (generator in reflection.server.ts); nothing changes until a human accepts
// here. Acceptance writes the per-(agent, tool) mode that loop.server.ts
// overlays at run start; its safety floors still bind afterward.
// ---------------------------------------------------------------------------

export interface TrustGraduationProposal {
  id: string;
  agent_slug: string;
  tool_name: string;
  from_mode: "auto" | "confirm" | "review";
  to_mode: "auto" | "confirm" | "review";
  clean_streak: number;
  rationale: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  decided_at: string | null;
}

export const listTrustGraduationProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrustGraduationProposal[]> => {
    const { supabase } = context;
    return readTrustGraduationProposals(supabase);
  });

/** The read behind `listTrustGraduationProposals`, callable with a client you
 *  already hold (the approvals queue). */
export async function readTrustGraduationProposals(
  supabase: SupabaseClient<Database>,
): Promise<TrustGraduationProposal[]> {
  const { data, error } = await supabase
    .from("trust_graduation_proposals" as never)
    .select(
      "id, agent_slug, tool_name, from_mode, to_mode, clean_streak, rationale, status, created_at, decided_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  // Pre-migration window: no table yet means no proposals, not a crash.
  if (error) return [];
  return (data ?? []) as unknown as TrustGraduationProposal[];
}

export const decideTrustGraduation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ proposalId: z.string().uuid(), accept: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: proposal, error: readErr } = await supabase
      .from("trust_graduation_proposals" as never)
      .select("id, agent_slug, tool_name, from_mode, to_mode, status")
      .eq("id", data.proposalId)
      .single();
    if (readErr || !proposal) throw new Error(readErr?.message ?? "Proposal not found");
    const p = proposal as unknown as TrustGraduationProposal;
    if (p.status !== "pending") throw new Error("This proposal was already decided");

    if (data.accept) {
      // The ONLY write path for a graduated mode: human acceptance.
      const { error: upErr } = await supabase.from("agent_tool_modes" as never).upsert(
        {
          user_id: userId,
          agent_slug: p.agent_slug,
          tool_name: p.tool_name,
          mode: p.to_mode,
          source: "graduation",
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id,agent_slug,tool_name" },
      );
      if (upErr) throw new Error(upErr.message);
    }

    const { error: updErr } = await supabase
      .from("trust_graduation_proposals" as never)
      .update({
        status: data.accept ? "approved" : "rejected",
        decided_at: new Date().toISOString(),
        decided_by: userId,
      } as never)
      .eq("id", data.proposalId)
      .eq("status", "pending");
    if (updErr) throw new Error(updErr.message);

    return { ok: true as const, applied: data.accept ? p.to_mode : null };
  });
