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
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isSupersessionRelation } from "@/lib/trust-ledger.functions";
import { trendOf, type Trend } from "@/lib/gauntlet-metrics";

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

async function computeSupersessionsCaught(): Promise<SupersessionsCaught> {
  const since30 = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const since60 = new Date(Date.now() - 60 * DAY_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from("artifact_lineage")
    .select("relation,valid_to,created_at")
    .in("relation", ["supersedes", "contradicts"])
    .gte("created_at", since60)
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

// FS-01 (prediction contracts + calibration, docs/strategy/v12-self-improving-os.md
// §4.2) is mid-build on another lane as of this writing — no `predictions` table
// exists yet and its exact shape may still change. Probe the planned shape and
// degrade to "not enough data yet" on ANY error (not just a missing-relation
// code): a schema mismatch during active development must never crash this
// panel. Once FS-01 ships, this card starts reading real numbers automatically
// if the shape matches, or needs a one-line column-name update if it doesn't.
async function computePredictionHitRate(): Promise<PredictionHitRate> {
  try {
    const { data, error } = await supabaseAdmin
      .from("predictions" as never)
      .select("outcome")
      .not("outcome", "is", null)
      .limit(2000);
    if (error) return { rate: null, hits: 0, total: 0, tableReady: false };
    const rows = (data ?? []) as { outcome: string }[];
    const total = rows.length;
    const hits = rows.filter((r) => r.outcome === "hit").length;
    return { rate: total > 0 ? hits / total : null, hits, total, tableReady: true };
  } catch {
    return { rate: null, hits: 0, total: 0, tableReady: false };
  }
}
