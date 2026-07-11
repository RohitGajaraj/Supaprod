/**
 * EVALS-PRIMITIVE (v11 #29) — server adapter for the eval-HEALTH (trust) leg.
 *
 * Thin DB-to-helper bridge: loads the user's eval suites + their run history (the same
 * user-scoped RLS pattern as `evals.functions.ts`) and hands them to the PURE
 * `computeEvalHealth`. Returns the structured health report (pass rate, error rate, trend,
 * per-suite flakiness, a trust verdict) + a one-line summary. The reliability logic lives in
 * `evals/health.ts` so it is unit-tested and cannot drift. No migration, no AI/chokepoint.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeEvalHealth,
  computeSurfaceCalibration,
  summarizeEvalHealth,
  type EvalHealth,
  type EvalRunRow,
  type SuiteTitles,
  type SurfaceCalibration,
} from "@/lib/evals/health";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EvalHealthResult = {
  health: EvalHealth;
  summary: string;
  /** RPT-18: calibration score per AI surface, folded from the same run history `health`
   * pools by suite. Empty when there are no suites/runs yet — never fabricated. */
  calibrationBySurface: SurfaceCalibration[];
};

/**
 * Extracted logic for getEvalHealth - testable without TanStack wrappers.
 */
export async function getEvalHealthImpl(
  supabase: SupabaseClient,
  userId: string,
): Promise<EvalHealthResult> {
  const { data: suites, error: sErr } = await supabase
    .from("eval_suites")
    .select("id,name,surface")
    .eq("user_id", userId);
  if (sErr) throw new Error(sErr.message);

  const ids = (suites ?? []).map((s) => s.id);
  const titles: Record<string, string | null> = {};
  const surfaces: Record<string, string | null> = {};
  for (const s of suites ?? []) {
    titles[s.id] = (s as { name?: string | null }).name ?? null;
    surfaces[s.id] = (s as { surface?: string | null }).surface ?? null;
  }

  let runs: EvalRunRow[] = [];
  if (ids.length) {
    const { data, error: rErr } = await supabase
      .from("eval_runs")
      .select("suite_id,status,pass_count,fail_count,errored,total_cases,avg_score,created_at")
      .in("suite_id", ids)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (rErr) throw new Error(rErr.message);
    runs = (data ?? []) as unknown as EvalRunRow[];
  }

  const health = computeEvalHealth(runs, titles as SuiteTitles);
  const calibrationBySurface = computeSurfaceCalibration(runs, surfaces);
  return { health, summary: summarizeEvalHealth(health), calibrationBySurface };
}

export const getEvalHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EvalHealthResult> => {
    const { supabase, userId } = context;
    return getEvalHealthImpl(supabase, userId);
  });
