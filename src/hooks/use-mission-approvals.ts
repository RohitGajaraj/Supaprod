/**
 * PC-29 Layer 7a: fetch pending approvals for a specific mission.
 * Wires the inline gate marker on Build cards.
 * Pre-migration tolerant: if mission_id is not in agent_approvals yet,
 * returns empty array rather than erroring.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn, createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface MissionApprovalRow {
  id: string;
  agent_slug: string | null;
  tool_name: string;
  rationale: string | null;
  status: string;
  expires_at: string | null;
}

const getMissionApprovalsServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }: { context: any; data: { missionId: string } }) => {
    const { supabase } = context;
    const db = supabase as unknown as SupabaseClient;

    // Pre-migration tolerant: try with mission_id column first.
    let { data: rows, error } = await db
      .from("agent_approvals")
      .select("id,agent_slug,tool_name,rationale,status,expires_at")
      .eq("mission_id", data.missionId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // If mission_id doesn't exist, return empty (pre-migration).
    if (error && /mission_id/.test(error.message)) {
      return { approvals: [] as MissionApprovalRow[] };
    }
    if (error) throw new Error(error.message);

    return { approvals: (rows ?? []) as MissionApprovalRow[] };
  });

export function useMissionApprovals(missionId: string) {
  const fGetApprovals = useServerFn(getMissionApprovalsServerFn);
  return useQuery({
    queryKey: ["mission-approvals", missionId],
    queryFn: () => fGetApprovals({ data: { missionId } }).then((r) => r.approvals),
  });
}
