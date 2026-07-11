/**
 * RPT-50 (deterministic slice): server adapter for the self-improvement engine.
 *
 * Reads three of Cadence's own quality signals for a workspace and hands them to
 * the PURE `composeProposals` (src/lib/self-improve.ts). No AI, no chokepoint:
 * every proposal is a deterministic flag on a real number over a real sample.
 *
 * The read+compose is factored into `computeSelfImprovementForWorkspace`, a plain
 * async helper that takes a supabase client + the owner/workspace ids, so BOTH
 * the authenticated server fn (user-scoped client) and the scheduled tick
 * (service-role admin client, no auth.uid()) run the exact same logic. Each of
 * the three reads is wrapped so a missing table or a failed query yields an empty
 * signal for that kind (an honest partial), never a thrown 500.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  composeProposals,
  type SelfImprovementProposal,
  type EvalSignal,
  type AgentSignal,
  type PlaybookSignal,
} from "@/lib/self-improve";
import { getEvalHealthImpl } from "@/lib/eval-health.functions";
import { summarizeGateSignals } from "@/lib/gate-signals";
import { rankPlaybooksByOutcome, type PlaybookStation } from "@/lib/playbooks/registry";

const PLAYBOOK_STATIONS: readonly PlaybookStation[] = [
  "discovery",
  "prioritization",
  "prd",
  "positioning",
  "validation",
];

export type SelfImprovementResult = {
  proposals: SelfImprovementProposal[];
  generated_at: string;
};

/**
 * Read the workspace's eval suites and fold each into an EvalSignal. Eval suites
 * are user-scoped in the schema (no workspace_id column), so we read by the
 * owner's user id via the shared `getEvalHealthImpl`, the same query eval-health
 * already uses. A suite with no completed runs (null pass rate) is dropped, not
 * flagged. Never throws: any read failure returns an empty signal.
 */
async function readEvalSignals(supabase: SupabaseClient, userId: string): Promise<EvalSignal[]> {
  try {
    const { health } = await getEvalHealthImpl(supabase, userId);
    return health.suites
      .filter((s) => s.passRate !== null && s.runs > 0)
      .map((s) => ({
        suite_id: s.suiteId,
        name: s.title ?? s.suiteId,
        pass_rate: s.passRate as number,
        total: s.runs,
      }));
  } catch {
    return [];
  }
}

/**
 * Read the workspace's human-at-gate events (RPT-32) and roll them up per agent
 * with the existing pure `summarizeGateSignals`. The unattributed bucket is
 * skipped (a proposal needs a real agent to name). Never throws.
 */
async function readAgentSignals(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<AgentSignal[]> {
  try {
    const { data: rows, error } = await supabase
      .from("human_gate_events")
      .select("gate_type,agent_slug")
      .eq("workspace_id", workspaceId)
      .limit(5000);
    if (error || !rows) return [];
    const { perAgent } = summarizeGateSignals(rows);
    return Object.entries(perAgent)
      .filter(([slug]) => slug !== "(unattributed)")
      .map(([slug, stats]) => ({
        agent_slug: slug,
        correction_rate: stats.correctionRate,
        total: stats.total,
      }));
  } catch {
    return [];
  }
}

/**
 * Read the workspace's playbook runs and fold each station's ranking into a
 * PlaybookSignal, reusing the same pure `rankPlaybooksByOutcome` the registry
 * surface uses. Only playbooks with a decisive track record (non-null win rate)
 * become a signal. Never throws.
 */
async function readPlaybookSignals(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<PlaybookSignal[]> {
  try {
    const { data: rows, error } = await supabase
      .from("playbook_runs")
      .select("playbook_id,verdict,station")
      .eq("workspace_id", workspaceId)
      .limit(5000);
    if (error || !rows) return [];
    const runs = rows as Array<{
      playbook_id: string;
      verdict: string | null;
      station?: string | null;
    }>;
    const out: PlaybookSignal[] = [];
    for (const station of PLAYBOOK_STATIONS) {
      // Only this station's runs. A run with no recorded station is dropped, not
      // attributed to every station (that would 5x its count and duplicate the
      // proposal id `playbook:<key>` across stations).
      const stationRuns = runs.filter((r) => r.station === station);
      for (const ranked of rankPlaybooksByOutcome(station, stationRuns)) {
        if (ranked.winRate === null) continue;
        out.push({
          playbook_key: ranked.playbook.id,
          station,
          win_rate: ranked.winRate,
          runs: ranked.runs,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * The shared read+compose. Takes any supabase client (user-scoped or admin) plus
 * the owner user id and the workspace id, gathers the three signals (each an
 * honest partial on failure), and returns the deterministic proposals. Same
 * function drives the server fn and the scheduled tick.
 */
export async function computeSelfImprovementForWorkspace(
  supabase: SupabaseClient,
  params: { userId: string; workspaceId: string },
): Promise<SelfImprovementResult> {
  const [evals, agents, playbooks] = await Promise.all([
    readEvalSignals(supabase, params.userId),
    readAgentSignals(supabase, params.workspaceId),
    readPlaybookSignals(supabase, params.workspaceId),
  ]);
  const proposals = composeProposals({ evals, agents, playbooks });
  return { proposals, generated_at: new Date().toISOString() };
}

const GetSchema = z.object({ workspaceId: z.string().uuid() });

/**
 * Authenticated read: recompute the calling user's proposals for one workspace
 * and return them. Deterministic, no AI, no writes (the tick materializes them).
 */
export const getSelfImprovementProposals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GetSchema.parse(i))
  .handler(async ({ context, data }): Promise<SelfImprovementResult> => {
    const { supabase, userId } = context;
    return computeSelfImprovementForWorkspace(supabase as SupabaseClient, {
      userId,
      workspaceId: data.workspaceId,
    });
  });
