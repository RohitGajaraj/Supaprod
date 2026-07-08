/**
 * SW-5 deliverable B (mission 3.11) - the Trust Ledger's UNBROKEN per-mission
 * chain: signal -> decision -> contract -> design gate -> build -> test ->
 * merge -> deploy -> outcome, walked from real rows. This is "the moat made
 * visible": a stranger must SEE the chain walk end to end, and see exactly
 * where a link is absent (the surface never fabricates a link and never hides
 * a hole).
 *
 * The existing Trust Ledger (trust-ledger.functions.ts) is a flat receipt list
 * (decisions + actions, standing/superseded/proven). This adds the orthogonal
 * pipeline-chain read model. Distinct from the tamper hash-chain in
 * trust-verify.ts (SHA-256-chain) - that proves the receipts were not altered;
 * this walks the semantic pipeline.
 *
 * The chain assembler (`assembleChain`) is PURE and unit-tested; the server fn
 * (`getMissionChain`) does the workspace-scoped, RLS-safe loads and hands the
 * evidence to it - mirroring assembleReceipts / loadReceipts.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

/** The nine canonical links, in pipeline order. */
export type ChainLinkKey =
  | "signal"
  | "decision"
  | "contract"
  | "design"
  | "build"
  | "test"
  | "merge"
  | "deploy"
  | "outcome";

/**
 * - present: a real backing row exists.
 * - skipped: structurally not applicable (the design station is founder-gated /
 *   configured off for this workspace) - honest, not a hole.
 * - missing: a GAP - this link is absent but a LATER link is present, so a
 *   receipt that should exist does not. This is the broken-chain signal.
 * - pending: not yet reached (the mission has not progressed this far). Not a
 *   defect.
 */
export type ChainLinkStatus = "present" | "skipped" | "missing" | "pending";

export type ChainStep = {
  key: ChainLinkKey;
  label: string;
  status: ChainLinkStatus;
  detail: string;
  /** ISO timestamp of the backing row, when present. */
  occurredAt: string | null;
  /** The backing row id (for click-through + the trace ref), when present. */
  backingId: string | null;
};

export type MissionChain = {
  missionId: string;
  missionTitle: string;
  steps: ChainStep[];
  /** True when no link before the furthest-reached one is absent. */
  unbroken: boolean;
  /** Index of the furthest link reached (−1 if nothing). */
  reachedIndex: number;
};

const LINK_ORDER: ChainLinkKey[] = [
  "signal",
  "decision",
  "contract",
  "design",
  "build",
  "test",
  "merge",
  "deploy",
  "outcome",
];

const LINK_LABEL: Record<ChainLinkKey, string> = {
  signal: "Signal",
  decision: "Decision",
  contract: "Contract",
  design: "Design gate",
  build: "Build",
  test: "Test",
  merge: "Merge",
  deploy: "Deploy",
  outcome: "Outcome",
};

/** The evidence the pure assembler classifies - one optional backing row per
 * link (already resolved by the server fn). `design.off` marks the design
 * station structurally disabled (no substrate today). */
export type ChainEvidence = Partial<
  Record<ChainLinkKey, { id: string; at: string | null; detail: string } | null>
> & { designOff?: boolean };

/**
 * PURE. Classify each of the nine links into present / skipped / missing /
 * pending from the resolved evidence. A link is:
 *   present  when evidence[key] is set;
 *   skipped  for `design` when designOff and no design evidence;
 *   missing  when absent AND a later link is present (a real gap);
 *   pending  when absent AND no later link is present (not yet reached).
 * Unit-tested in trust-chain.test.ts.
 */
export function assembleChain(
  missionId: string,
  missionTitle: string,
  evidence: ChainEvidence,
): MissionChain {
  const present: boolean[] = LINK_ORDER.map((k) => Boolean(evidence[k]));
  let reachedIndex = -1;
  for (let i = 0; i < present.length; i++) if (present[i]) reachedIndex = i;

  const steps: ChainStep[] = LINK_ORDER.map((key, i) => {
    const row = evidence[key] ?? null;
    let status: ChainLinkStatus;
    let detail: string;
    if (row) {
      status = "present";
      detail = row.detail;
    } else if (key === "design" && evidence.designOff) {
      status = "skipped";
      detail = "Design stage is off for this workspace.";
    } else if (i < reachedIndex) {
      status = "missing";
      detail = "No receipt for this link - a gap in the chain.";
    } else {
      status = "pending";
      detail = "Not yet reached.";
    }
    return {
      key,
      label: LINK_LABEL[key],
      status,
      detail,
      occurredAt: row?.at ?? null,
      backingId: row?.id ?? null,
    };
  });

  // Unbroken = no link before the furthest-reached one is missing.
  const unbroken = !steps.some((s, i) => i < reachedIndex && s.status === "missing");
  return { missionId, missionTitle, steps, unbroken, reachedIndex };
}

// ---------------------------------------------------------------------------
// Server fn - workspace-scoped, RLS-safe evidence loads
// ---------------------------------------------------------------------------

function firstBy<T extends { created_at?: string | null; at?: string | null }>(
  rows: T[] | null | undefined,
): T | null {
  return rows && rows.length > 0 ? rows[0] : null;
}

/** Same active-workspace resolution as trust-ledger.functions.ts: the page is a
 * single-workspace surface, so every read is pinned to one workspace - RLS
 * alone spans EVERY workspace the caller belongs to. */
async function resolveWorkspaceId(db: SupabaseClient): Promise<string | null> {
  const { data: ws } = await db.rpc("current_user_default_workspace");
  return (ws as string | null) ?? null;
}

/** A swallowed read error is indistinguishable from "no rows" and would render
 * a fabricated broken chain - throw so react-query surfaces the error state. */
function must<T>(res: { data: T | null; error: { message: string } | null }): T | null {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export const getMissionChain = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<MissionChain | null> => {
    const { supabase } = context;
    const db = supabase as unknown as SupabaseClient;
    const missionId = data.missionId;

    // Pin to the active workspace (a foreign or cross-workspace id returns null).
    const workspaceId = await resolveWorkspaceId(db);
    if (!workspaceId) return null;
    const mission = must(
      await db
        .from("missions")
        .select("id, title, status")
        .eq("id", missionId)
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
    );
    if (!mission) return null;
    const m = mission as { id: string; title: string | null; status: string | null };

    // Decisions + the prds they point at.
    const decisions = must(
      await db
        .from("decisions")
        .select("id, title, prd_id, created_at")
        .eq("mission_id", missionId)
        .order("created_at", { ascending: true }),
    );
    const decisionRows = (decisions ?? []) as Array<{
      id: string;
      title: string | null;
      prd_id: string | null;
      created_at: string;
    }>;

    // Changesets for this mission (build/merge) + the prds they point at.
    const changesets = must(
      await db
        .from("studio_changesets")
        .select("id, title, status, pr_url, prd_id, created_at, updated_at")
        .eq("mission_id", missionId)
        .order("created_at", { ascending: true }),
    );
    const changesetRows = (changesets ?? []) as Array<{
      id: string;
      title: string | null;
      status: string;
      pr_url: string | null;
      prd_id: string | null;
      created_at: string;
      updated_at: string;
    }>;

    const prdIds = Array.from(
      new Set(
        [...decisionRows.map((d) => d.prd_id), ...changesetRows.map((c) => c.prd_id)].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    );

    // Contract (prd), plus its opportunity for the signal hop.
    type PrdRow = {
      id: string;
      title: string | null;
      created_at: string;
      opportunity_id: string | null;
    };
    let prdRow: PrdRow | null = null;
    if (prdIds.length > 0) {
      const prds = must(
        await db
          .from("prds")
          .select("id, title, created_at, opportunity_id")
          .in("id", prdIds)
          .order("created_at", { ascending: true })
          .limit(1),
      );
      prdRow = firstBy((prds ?? []) as PrdRow[]);
    }

    // Deployments for the changesets. Only a SUCCESSFUL deploy is evidence the
    // thing shipped - a failed/pending row must not render a present link.
    type DeployRow = {
      id: string;
      deploy_url: string | null;
      status: string;
      deployed_at: string | null;
      created_at: string;
    };
    const changesetIds = changesetRows.map((c) => c.id);
    let deployRow: DeployRow | null = null;
    if (changesetIds.length > 0) {
      const deploys = must(
        await db
          .from("deployments")
          .select("id, deploy_url, status, deployed_at, created_at")
          .in("changeset_id", changesetIds)
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(1),
      );
      deployRow = firstBy((deploys ?? []) as DeployRow[]);
    }

    // Outcome: learnings by direct mission_id, else by prd_id (the fragile hop).
    type LearningRow = {
      id: string;
      summary: string | null;
      verdict: string | null;
      created_at: string;
    };
    let learningRow: LearningRow | null = null;
    {
      const byMission = must(
        await db
          .from("learnings")
          .select("id, summary, verdict, created_at")
          .eq("mission_id", missionId)
          .order("created_at", { ascending: false })
          .limit(1),
      );
      learningRow = firstBy((byMission ?? []) as LearningRow[]);
      if (!learningRow && prdIds.length > 0) {
        const byPrd = must(
          await db
            .from("learnings")
            .select("id, summary, verdict, created_at")
            .in("prd_id", prdIds)
            .order("created_at", { ascending: false })
            .limit(1),
        );
        learningRow = firstBy((byPrd ?? []) as LearningRow[]);
      }
    }

    // Signal (best-effort multi-hop): prd.opportunity_id -> opportunity.theme_id
    // -> earliest signal in that theme. Any null hop leaves the link unresolved.
    type SignalRow = { id: string; title: string | null; created_at: string };
    let signalRow: SignalRow | null = null;
    if (prdRow?.opportunity_id) {
      const opp = must(
        await db
          .from("opportunities")
          .select("id, theme_id")
          .eq("id", prdRow.opportunity_id)
          .maybeSingle(),
      );
      const themeId = (opp as { theme_id?: string | null } | null)?.theme_id ?? null;
      if (themeId) {
        const sigs = must(
          await db
            .from("signals")
            .select("id, title, created_at")
            .eq("theme_id", themeId)
            .order("created_at", { ascending: true })
            .limit(1),
        );
        signalRow = firstBy((sigs ?? []) as SignalRow[]);
      }
    }

    // SW-7 (mission 3.4): the design station is real now (design_gate_status +
    // design_stage_enabled both ship) - this used to hardcode designOff:true
    // from before the station was built, which silently showed a real approved
    // design gate as "skipped, off for this workspace" (found live 2026-07-08).
    // Off is still honest when the workspace never turned the stage on; a
    // decided gate is present; an undecided gate on an enabled stage is pending.
    let designEvidence: { id: string; at: string | null; detail: string } | null = null;
    let designOff = true;
    if (prdRow) {
      const prdDesign = must(
        await db
          .from("prds")
          .select("design_gate_status, design_decided_at, workspace_id")
          .eq("id", prdRow.id)
          .maybeSingle(),
      ) as {
        design_gate_status: string | null;
        design_decided_at: string | null;
        workspace_id: string | null;
      } | null;
      if (prdDesign?.workspace_id) {
        const ws = must(
          await db
            .from("workspaces")
            .select("design_stage_enabled")
            .eq("id", prdDesign.workspace_id)
            .maybeSingle(),
        ) as { design_stage_enabled: boolean | null } | null;
        designOff = !ws?.design_stage_enabled;
      }
      if (!designOff && prdDesign?.design_gate_status) {
        designEvidence = {
          id: prdRow.id,
          at: prdDesign.design_decided_at,
          detail: `Design gate ${prdDesign.design_gate_status}`,
        };
      }
    }

    // Test has no dedicated substrate today (test attempts are not yet
    // first-class rows). We render it honestly: CI runs on the PR in this
    // build spine, so only a changeset that reached pr_open/merged carries
    // test evidence - 'committed' pushed a commit with no PR (no CI), and
    // 'abandoned' may never have left staging intent.
    const testChangeset =
      changesetRows.find((c) => c.status === "pr_open" || c.status === "merged") ?? null;
    const buildChangeset = changesetRows[0] ?? null;
    const mergedChangeset = changesetRows.find((c) => c.status === "merged") ?? null;
    const firstDecision = decisionRows[0] ?? null;

    const evidence: ChainEvidence = {
      signal: signalRow
        ? { id: signalRow.id, at: signalRow.created_at, detail: signalRow.title ?? "Signal" }
        : null,
      decision: firstDecision
        ? {
            id: firstDecision.id,
            at: firstDecision.created_at,
            detail: firstDecision.title ?? "Decision recorded",
          }
        : null,
      contract: prdRow
        ? { id: prdRow.id, at: prdRow.created_at, detail: prdRow.title ?? "Contract (spec)" }
        : null,
      design: designEvidence,
      designOff,
      build: buildChangeset
        ? {
            id: buildChangeset.id,
            at: buildChangeset.created_at,
            detail: buildChangeset.title || `Changeset on ${buildChangeset.status}`,
          }
        : null,
      test: testChangeset
        ? {
            id: testChangeset.id,
            at: testChangeset.updated_at,
            detail: `Tests ran (changeset ${testChangeset.status})`,
          }
        : null,
      merge: mergedChangeset
        ? {
            id: mergedChangeset.id,
            at: mergedChangeset.updated_at,
            detail: mergedChangeset.pr_url ? "Merged (PR)" : "Merged",
          }
        : null,
      deploy: deployRow
        ? {
            id: deployRow.id,
            at: deployRow.deployed_at ?? deployRow.created_at,
            detail: deployRow.deploy_url ? "Deployed (live URL)" : "Deploy succeeded",
          }
        : null,
      outcome: learningRow
        ? {
            id: learningRow.id,
            at: learningRow.created_at,
            detail: learningRow.verdict
              ? `Outcome: ${learningRow.verdict}`
              : (learningRow.summary ?? "Outcome recorded"),
          }
        : null,
    };

    return assembleChain(missionId, m.title ?? "Untitled mission", evidence);
  });

/** List recent missions for the chain picker, pinned to the active workspace
 * (RLS alone spans every workspace the caller belongs to - see resolveWorkspaceId). */
export const listChainMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<Array<{ id: string; title: string; status: string | null }>> => {
      const { supabase } = context;
      const db = supabase as unknown as SupabaseClient;
      const workspaceId = await resolveWorkspaceId(db);
      if (!workspaceId) return [];
      const rows = must(
        await db
          .from("missions")
          .select("id, title, status")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(25),
      );
      return (
        (rows ?? []) as Array<{ id: string; title: string | null; status: string | null }>
      ).map((m) => ({ id: m.id, title: m.title ?? "Untitled mission", status: m.status }));
    },
  );
