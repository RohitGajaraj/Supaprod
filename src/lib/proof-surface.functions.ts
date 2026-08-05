/**
 * PRF-01 — the proof surface (moat metrics panel).
 *
 * The Gauntlet, MOAT-METRIC, and the AFD-12 materialized views already exist
 * and are composed as-is by the /admin/proof route (GauntletMetricsPanel +
 * getMoatMetrics). This file adds the three pieces that don't exist anywhere
 * yet: a babysitting-tax trend, a supersessions-caught count, and an FS-01
 * prediction hit-rate probe. Admin-gated like getMoatMetrics (workspace-wide
 * data via supabaseAdmin, bypassing RLS on purpose — this is a global rollup,
 * not a per-user read). Every number is honest when sparse: "not enough data
 * yet", never an invented figure.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isSupersessionRelation } from "@/lib/trust-ledger.functions";
import { trendOf, type Trend } from "@/lib/gauntlet-metrics";
import { SUPERSESSION_RELATIONS } from "@/lib/trust-ledger.functions";

// `insights.resolution`/`kind` (FS-01) predate the generated types; same
// relaxed-typing pattern as sink.server.ts / scout's targets.server.ts.
const db = supabaseAdmin as unknown as SupabaseClient;

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WEEKS = 8;

export type BabysittingTax = {
  /** Gated (human-decided) approval requests per week, oldest to newest. */
  weeklyGated: number[];
  /** "down" = fewer gated calls landing on you lately — the tax is easing. */
  trend: Trend;
  tableReady: boolean;
};

export type SupersessionsCaught = {
  /** Active supersedes/contradicts edges in the last 60 days. */
  total: number;
  last30d: number;
  trend: Trend;
};

export type PredictionHitRate = {
  rate: number | null;
  hits: number;
  total: number;
  /** False until FS-01 (prediction contracts + calibration) ships. */
  tableReady: boolean;
};

export type ProofSurfaceExtras = {
  babysittingTax: BabysittingTax;
  supersessionsCaught: SupersessionsCaught;
  predictionHitRate: PredictionHitRate;
};

export const getProofSurfaceExtras = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProofSurfaceExtras | { error: string }> => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return { error: "Forbidden" };

    const [babysittingTax, supersessionsCaught, predictionHitRate] = await Promise.all([
      computeBabysittingTax(),
      computeSupersessionsCaught(),
      computePredictionHitRate(),
    ]);
    return { babysittingTax, supersessionsCaught, predictionHitRate };
  });

async function computeBabysittingTax(): Promise<BabysittingTax> {
  const since = new Date(Date.now() - WEEKS * WEEK_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from("agent_approvals")
    .select("created_at")
    .gte("created_at", since)
    .limit(20000);
  if (error) {
    return { weeklyGated: [], trend: "flat", tableReady: false };
  }

  const rows = (data ?? []) as { created_at: string }[];
  const buckets = new Array(WEEKS).fill(0) as number[];
  const now = Date.now();
  for (const r of rows) {
    const age = now - +new Date(r.created_at);
    const weekIdx = WEEKS - 1 - Math.floor(age / WEEK_MS);
    if (weekIdx >= 0 && weekIdx < WEEKS) buckets[weekIdx]++;
  }
  // Most recent 4 weeks average vs the prior 4 — a falling count means fewer
  // gated calls are landing on you, i.e. the tax is easing.
  const recent = buckets.slice(4).reduce((a, b) => a + b, 0) / 4;
  const prior = buckets.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  return { weeklyGated: buckets, trend: trendOf(recent, prior), tableReady: true };
}


/**
 * The workspaces whose rows must never reach a PUBLIC counter.
 *
 * THE DEFECT THIS CLOSES, found 2026-08-05 by a launch audit. /proof is the
 * Trust Ledger, the page whose entire argument is "receipts, not claims". It was
 * printing "Supaprod called N of the last M calls right" over a population that
 * included the seeded demo workspaces, and rendering 14 seeded decisions under
 * "Recent public decisions".
 *
 * The rule was already written down, in landing.functions.ts: "the public
 * counters exclude seeded sample/demo workspaces... inflating never is." These
 * two counters were the ones that never got it, because they aggregate tables
 * (insights, artifact_lineage) rather than reading decisions, where the filter
 * already lived.
 *
 * Matched by FLAG and by NAME. The flag is authoritative, but "Sample workspace"
 * shipped with is_sample false for months, which is exactly why 14 rows leaked
 * past a filter that existed and looked correct. Belt and braces on a public
 * number is cheap; a wrong number on this page is not.
 */
async function sampleWorkspaceIds(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .or('is_sample.eq.true,name.in.("Sample workspace","Demo workspace","Sample sandbox")')
    .limit(1000);
  return (data ?? []).map((w) => (w as { id: string }).id);
}

/** Exported: reused by proof-share.functions.ts for the PUBLIC redacted scorecard (RPT-30). */
export async function computeSupersessionsCaught(): Promise<SupersessionsCaught> {
  const since30 = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const since60 = new Date(Date.now() - 60 * DAY_MS).toISOString();
  const excluded = await sampleWorkspaceIds();
  // Seeded workspaces never count toward a public number. Same static-shape
  // reason as computePredictionHitRate below: a never-matching sentinel instead
  // of a conditional reassignment.
  const notIn = excluded.length
    ? `(${excluded.join(",")})`
    : "(00000000-0000-0000-0000-000000000000)";
  const { data, error } = await supabaseAdmin
    .from("artifact_lineage")
    .select("relation,valid_to,created_at")
    .in("relation", [...SUPERSESSION_RELATIONS])
    .gte("created_at", since60)
    .not("workspace_id", "in", notIn)
    .limit(20000);
  if (error) return { total: 0, last30d: 0, trend: "flat" };

  const rows = (data ?? []) as {
    relation: string | null;
    valid_to: string | null;
    created_at: string;
  }[];
  const active = rows.filter(
    (r) => isSupersessionRelation(r.relation) && !(r.valid_to && r.valid_to.trim() !== ""),
  );
  const last30d = active.filter((r) => r.created_at >= since30).length;
  const prior30d = active.length - last30d;
  return { total: active.length, last30d, trend: trendOf(last30d, prior30d) };
}

// FS-01 (prediction contracts + calibration) shipped after this file was first
// written: `calibrate-tick` scores expired `insights` rows (kind in
// prediction/risk) into `insights.resolution` ('hit'|'miss'|'inconclusive').
// Reads workspace-wide via supabaseAdmin, matching this file's other two
// metrics, and still degrades to "not enough data yet" on any error (a
// pre-migration environment, or a future shape change) rather than throwing.
/** Exported: reused by proof-share.functions.ts for the PUBLIC redacted scorecard (RPT-30). */
export async function computePredictionHitRate(): Promise<PredictionHitRate> {
  try {
    const excluded = await sampleWorkspaceIds();
    // The calibration number on /proof must be OUR record, never the demo's.
    // The filter is applied unconditionally with a never-matching sentinel when
    // there are no sample workspaces, so the builder chain keeps ONE static
    // shape. Reassigning `q` inside an if made the inferred Postgrest type
    // recurse past TypeScript's instantiation depth (TS2589).
    const notIn = excluded.length
      ? `(${excluded.join(",")})`
      : "(00000000-0000-0000-0000-000000000000)";
    const { data, error } = await db
      .from("insights")
      .select("resolution")
      .in("kind", ["prediction", "risk"])
      .not("resolution", "is", null)
      .neq("resolution", "inconclusive")
      .not("workspace_id", "in", notIn)
      .limit(5000);
    if (error) return { rate: null, hits: 0, total: 0, tableReady: false };
    const rows = (data ?? []) as { resolution: string }[];
    const total = rows.length;
    const hits = rows.filter((r) => r.resolution === "hit").length;
    return { rate: total > 0 ? hits / total : null, hits, total, tableReady: true };
  } catch {
    return { rate: null, hits: 0, total: 0, tableReady: false };
  }
}
