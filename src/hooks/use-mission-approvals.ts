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
    const { data: rows, error } = await db
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

/**
 * PC-29 layer 7 (2026-07-17 repair pass): the spec-scoped sibling, for cards
 * that know a prd_id but not a mission_id (Plan's SpecList). `missions`
 * carries no `prd_id` column - the established join is
 * `studio_changesets.mission_id -> studio_changesets.prd_id`, already relied
 * on by test-station.functions.ts and outcome.functions.ts. A spec can have
 * more than one changeset/mission over its life, so this collects pending
 * approvals across all of them rather than assuming a single active run.
 */
const getSpecApprovalsServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }: { context: any; data: { prdId: string } }) => {
    const { supabase } = context;
    const db = supabase as unknown as SupabaseClient;

    const { data: changesetRows, error: csError } = await db
      .from("studio_changesets")
      .select("mission_id")
      .eq("prd_id", data.prdId)
      .not("mission_id", "is", null);
    if (csError) throw new Error(csError.message);
    const missionIds = [
      ...new Set(
        (changesetRows ?? [])
          .map((r: { mission_id: string | null }) => r.mission_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (!missionIds.length) return { approvals: [] as MissionApprovalRow[] };

    const { data: rows, error } = await db
      .from("agent_approvals")
      .select("id,agent_slug,tool_name,rationale,status,expires_at")
      .in("mission_id", missionIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { approvals: (rows ?? []) as MissionApprovalRow[] };
  });

export function useSpecApprovals(prdId: string) {
  const fGetApprovals = useServerFn(getSpecApprovalsServerFn);
  return useQuery({
    queryKey: ["spec-approvals", prdId],
    queryFn: () => fGetApprovals({ data: { prdId } }).then((r) => r.approvals),
  });
}
