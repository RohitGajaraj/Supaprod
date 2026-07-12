/**
 * RPT-37: the agent scorecard server fn, the thin adapter over the pure core.
 *
 * User-scoped (GET, no input) to match its neighbour in the same roster panel:
 * TrustDial reads getAllAgentTrust user-wide, so the scorecard must too, or the
 * two would disagree on a shared agent's numbers. It fetches the same decided
 * `agent_approvals` history the governance overview reads, plus the same
 * learnings->decisions outcome join, and hands both to computeAgentScorecard.
 * RLS keeps every read to the caller's own rows.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeAgentScorecard,
  type AgentScorecard,
  type ScorecardApprovalRow,
} from "@/lib/agent-scorecard";
import type { DecidedLearningRow } from "@/lib/agent-track-record";

export type AgentScorecardResult = { scorecards: AgentScorecard[] };

async function loadAgentScorecard(
  db: SupabaseClient,
  userId: string,
): Promise<AgentScorecardResult> {
  // Decided approval history (RLS-scoped). decided_at filter drops the pending
  // backlog before transfer; the summarizer would drop it anyway.
  const { data: approvalRows } = await db
    .from("agent_approvals")
    .select("agent_slug,tool_name,status")
    .eq("user_id", userId)
    .not("decided_at", "is", null)
    .limit(2000);

  // Outcome join, same idiom as getGovernanceOverview: no FK between learnings
  // and decisions (both key off prd_id), so it is two reads joined in JS.
  let decidedLearningRows: DecidedLearningRow[] = [];
  const { data: learningRows } = await db
    .from("learnings")
    .select("prd_id,verdict")
    .eq("user_id", userId)
    .in("verdict", ["validated", "missed"])
    .not("prd_id", "is", null)
    .limit(2000);
  const prdIds = [
    ...new Set(
      ((learningRows ?? []) as { prd_id: string | null; verdict: string | null }[])
        .map((l) => l.prd_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (prdIds.length) {
    const { data: decisionRows } = await db
      .from("decisions")
      .select("prd_id,decided_by_agent_slug")
      .eq("user_id", userId)
      .in("prd_id", prdIds);
    const slugByPrd = new Map<string, string>(
      ((decisionRows ?? []) as { prd_id: string | null; decided_by_agent_slug: string | null }[])
        .filter((d) => d.prd_id && d.decided_by_agent_slug)
        .map((d) => [d.prd_id as string, d.decided_by_agent_slug as string]),
    );
    decidedLearningRows = (
      (learningRows ?? []) as { prd_id: string | null; verdict: string | null }[]
    ).map((l) => ({
      agent_slug: l.prd_id ? (slugByPrd.get(l.prd_id) ?? null) : null,
      verdict: l.verdict,
    }));
  }

  return {
    scorecards: computeAgentScorecard(
      (approvalRows ?? []) as ScorecardApprovalRow[],
      decidedLearningRows,
    ),
  };
}

export const getAgentScorecard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AgentScorecardResult> => {
    const { supabase, userId } = context;
    return loadAgentScorecard(supabase as unknown as SupabaseClient, userId);
  });
