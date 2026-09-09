/**
 * PLAYBOOK-REGISTRY (v11 #17) — server adapter for the playbook registry + per-outcome rank.
 *
 * `getPlaybooks` returns the code registry grouped by station, each station's methods ranked
 * by their per-outcome track record IN THIS WORKSPACE (joined from `playbook_runs`). This is
 * the institutional-judgment payoff: the method that keeps validating here rises to the top.
 * `recordPlaybookRun` logs an application so the registry can learn (reversible, write-only
 * audit). The ranking math is PURE (registry.ts); the handler is a thin RLS adapter.
 * Migration: 20260624060000_playbook_runs.sql. No AI/chokepoint.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";
import {
  PLAYBOOK_REGISTRY,
  rankPlaybooksByOutcome,
  findPlaybook,
  type PlaybookStation,
  type PlaybookRanking,
  type PlaybookRun,
} from "@/lib/playbooks/registry";

const STATIONS: readonly PlaybookStation[] = [
  "discovery",
  "prioritization",
  "prd",
  "positioning",
  "validation",
];

const GetSchema = z.object({ station: z.string().optional() }).strip();

export type StationPlaybooks = { station: PlaybookStation; playbooks: PlaybookRanking[] };
export type GetPlaybooksResult = { stations: StationPlaybooks[] };

export const getPlaybooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GetSchema.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<GetPlaybooksResult> => {
    const supabase = context.supabase as SupabaseClient;
    const { data: wsRpc } = await supabase.rpc("current_user_default_workspace");
    const workspaceId = defaultWorkspaceId(wsRpc);

    // Load this workspace's recorded runs (best-effort: pre-migration the table is absent, so
    // the registry still renders with null/empty rankings).
    let runs: PlaybookRun[] = [];
    if (workspaceId) {
      const res = await supabase
        .from("playbook_runs")
        .select("playbook_id,verdict,station")
        .eq("workspace_id", workspaceId)
        .limit(5000);
      if (!res.error) runs = (res.data ?? []) as unknown as (PlaybookRun & { station: string })[];
    }

    const want =
      data?.station && STATIONS.includes(data.station as PlaybookStation)
        ? [data.station as PlaybookStation]
        : STATIONS;

    const stations: StationPlaybooks[] = want.map((station) => ({
      station,
      playbooks: rankPlaybooksByOutcome(
        station,
        runs.filter((r) => (r as { station?: string }).station === station || !("station" in r)),
      ),
    }));

    return { stations };
  });

const RecordSchema = z
  .object({
    playbookId: z.string().min(1),
    decisionId: z.string().uuid().optional(),
  })
  .strip();

export type RecordPlaybookRunResult = { ok: boolean; id: string | null };

export const recordPlaybookRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RecordSchema.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<RecordPlaybookRunResult> => {
    const supabase = context.supabase as SupabaseClient;
    const def = findPlaybook(data.playbookId);
    if (!def) throw new Error(`Unknown playbook: ${data.playbookId}`);

    // workspace_id + user_id default at the DB layer (current_user_default_workspace / auth.uid).
    const insert: Record<string, unknown> = {
      playbook_id: def.id,
      playbook_version: def.version,
      station: def.station,
    };
    if (data.decisionId) insert.decision_id = data.decisionId;

    const res = await supabase.from("playbook_runs").insert(insert).select("id").maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return { ok: true, id: ((res.data as { id?: string } | null)?.id as string) ?? null };
  });

/**
 * RF-05: server-internal counterpart to `recordPlaybookRun`, for the
 * deterministic mission-advance engine (src/lib/ai/mission-advance.server.ts)
 * — NOT a createServerFn, since it runs admin-client-side from another
 * server module, not from an authenticated client request, so `workspace_id`
 * and `user_id` must be passed explicitly rather than defaulted at the DB
 * layer (there is no `auth.uid()` under the admin client). Never throws: a
 * best-effort analytics write must not break the deterministic mission loop.
 */
export async function recordPlaybookRunInternal(
  supabase: SupabaseClient,
  params: { userId: string; workspaceId: string; playbookId: string; decisionId?: string | null },
): Promise<void> {
  const def = findPlaybook(params.playbookId);
  if (!def) return; // unknown/stale playbook id — silently skip, never break the caller
  try {
    const { error } = await supabase.from("playbook_runs").insert({
      user_id: params.userId,
      workspace_id: params.workspaceId,
      playbook_id: def.id,
      playbook_version: def.version,
      station: def.station,
      decision_id: params.decisionId ?? null,
    });
    // Supabase-js resolves DB-level failures (RLS denial, missing table
    // pre-migration, constraint violation) as {error}, it does not throw for
    // them — so this check is load-bearing, not the catch below. Logged, not
    // thrown: a best-effort analytics write must not break mission advancement,
    // but a silently-failing insert forever (e.g. an RLS misconfiguration)
    // must not be invisible either.
    if (error) console.error("recordPlaybookRunInternal insert failed:", error.message);
  } catch (e) {
    // Genuine thrown exception (e.g. a network-layer failure before the
    // promise settles) — same non-fatal posture, still logged.
    console.error("recordPlaybookRunInternal threw:", e);
  }
}

/**
 * Mission 3.8b (SEAM-3): playbook proposals, the compounding pass's output.
 *
 * When >= 3 same-shaped learnings repeat, the outcome-tick sweep
 * (src/lib/ai/learning-compound.server.ts) writes a playbook_proposals row in
 * status 'proposed' with the source learning ids as provenance. These two
 * functions are the human half: list the workspace's proposals and confirm or
 * dismiss one (never auto-confirmed; mirrors decideHouseRule in
 * house-rules.functions.ts). playbook_proposals postdates the generated
 * Database types; the plain SupabaseClient cast above already admits it.
 */
export type PlaybookProposalStatus = "proposed" | "confirmed" | "dismissed";

export type PlaybookProposal = {
  id: string;
  workspace_id: string;
  group_key: string;
  title: string;
  body: string;
  status: PlaybookProposalStatus;
  source_learning_ids: string[];
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  // PC-11: confidence-gated execution. New column, defaults 'medium' for
  // rows written before this shipped.
  confidence: "high" | "medium" | "low";
};

const PROPOSAL_COLUMNS =
  "id,workspace_id,group_key,title,body,status,source_learning_ids,decided_by,decided_at,created_at,confidence";

export type ListPlaybookProposalsResult = { proposals: PlaybookProposal[] };

export const listPlaybookProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({})
      .strip()
      .parse(i ?? {}),
  )
  .handler(async ({ context }): Promise<ListPlaybookProposalsResult> => {
    const supabase = context.supabase as SupabaseClient;
    const { data: wsRpc } = await supabase.rpc("current_user_default_workspace");
    const workspaceId = defaultWorkspaceId(wsRpc);
    if (!workspaceId) return { proposals: [] };
    const { data, error } = await supabase
      .from("playbook_proposals")
      .select(PROPOSAL_COLUMNS)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { proposals: (data ?? []) as unknown as PlaybookProposal[] };
  });

const DecideProposalSchema = z.object({
  proposalId: z.string().uuid(),
  decision: z.enum(["confirm", "dismiss"]),
});

export type DecidePlaybookProposalResult = { ok: boolean };

export const decidePlaybookProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DecideProposalSchema.parse(i))
  .handler(async ({ context, data }): Promise<DecidePlaybookProposalResult> => {
    const supabase = context.supabase as SupabaseClient;
    const status: PlaybookProposalStatus = data.decision === "confirm" ? "confirmed" : "dismissed";
    const { data: updated, error } = await supabase
      .from("playbook_proposals")
      .update({ status, decided_by: context.userId, decided_at: new Date().toISOString() })
      .eq("id", data.proposalId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    // A zero-row update means the proposal is gone or (via RLS) out of the
    // caller's workspaces; fail loudly rather than render a no-op as success.
    if (!updated) throw new Error("decidePlaybookProposal: proposal not found or not accessible");
    return { ok: true };
  });

/** Re-export the registry for client surfaces that render method detail. */
export { PLAYBOOK_REGISTRY };
