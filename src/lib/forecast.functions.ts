import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  isForecastDue,
  summarizeForecastCalls,
  buildDeferPatch,
  buildSettlePatch,
  dueCheckFilter,
  type ForecastResolution,
  type ForecastCallSummary,
} from "./brain/forecast-resolution";

// FC-01, the grading half: the reads and writes behind the Learn desk's forecast
// group. Capture lives in decisions.functions.ts and is a separate
// responsibility with separate consumers, which is why this is its own module.
//
// Plan: docs/planning/initiatives/forecast-resolution-plan.md

export const FORECAST_COLS =
  "id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date," +
  "forecast_resolution,forecast_next_check_at,forecast_deferred_count," +
  "forecast_resolution_suggestion,workspace_id";

export type DueForecast = {
  id: string;
  title: string;
  claim: string;
  howWeWillKnow: string;
  horizonDate: string;
  daysLate: number;
  deferredCount: number;
  suggestion: { verdict: ForecastResolution; rationale: string; confidence: number } | null;
};

/**
 * WHY EVERY READ HERE FAILS SOFT.
 *
 * Migrations go live through Lovable the moment they are applied; app code goes
 * live separately when publish is clicked. Two switches, no enforced order, and
 * PostgREST answers an unknown column with an ERROR rather than a null. So a
 * throw here does not degrade the Learn desk, it breaks it, and it takes the
 * spec-outcome half down with it because both live on one route. Returning the
 * empty shape keeps the station standing.
 *
 * The writes below deliberately do NOT fail soft. A write that silently does
 * nothing is the defect deferOutcomeCheck was fixed for: the control said the
 * date moved while the row sat unchanged, which teaches people the button is
 * broken.
 */
export async function listDueForecastsImpl(
  db: SupabaseClient,
  nowIso: string,
): Promise<{ due: DueForecast[] }> {
  /**
   * No workspace filter, deliberately: RLS admits every workspace the caller
   * belongs to, so the desk is "every call anywhere that needs settling", which
   * matches listPendingOutcomes sitting beside it.
   */
  const { data, error } = await db
    .from("decisions")
    .select(FORECAST_COLS)
    .not("forecast_claim", "is", null)
    .is("forecast_resolution", null)
    .lte("forecast_horizon_date", nowIso)
    /**
     * `.or` and never a bare `.lte` on forecast_next_check_at. NULL is the
     * overwhelming majority, every forecast nobody deferred, and a bare
     * comparison drops NULLs in SQL. That would empty the desk of everything
     * except previously-deferred forecasts, which is the loudest possible way to
     * get this wrong and still look like it works. The same mistake shipped
     * twice on the spec queue; see the two comments inside listPendingOutcomes.
     */
    .or(dueCheckFilter(nowIso))
    .order("forecast_horizon_date", { ascending: true })
    .limit(12);
  if (error) return { due: [] };

  const nowMs = Date.parse(nowIso);
  const due = (data ?? [])
    // The SQL and the predicate agree by construction, but the predicate is the
    // authority: one rule, one place.
    .filter((r) => isForecastDue(r as never, nowIso))
    .map((r) => {
      const row = r as unknown as Record<string, unknown>;
      const horizon = String(row.forecast_horizon_date);
      const s = row.forecast_resolution_suggestion as {
        verdict?: string;
        rationale?: string;
        confidence?: number;
      } | null;
      return {
        id: String(row.id),
        title: String(row.title ?? ""),
        claim: String(row.forecast_claim ?? ""),
        howWeWillKnow: String(row.forecast_how_we_will_know ?? ""),
        horizonDate: horizon,
        daysLate: Math.floor((nowMs - Date.parse(horizon)) / 86_400_000),
        deferredCount: Number(row.forecast_deferred_count ?? 0),
        suggestion: s?.verdict
          ? {
              verdict: s.verdict as ForecastResolution,
              rationale: String(s.rationale ?? ""),
              confidence: Number(s.confidence ?? 0),
            }
          : null,
      };
    });
  return { due };
}

export async function settleForecastImpl(
  db: SupabaseClient,
  input: { decisionId: string; resolution: ForecastResolution; rationale: string },
  nowIso: string,
): Promise<{ ok: true }> {
  const patch = buildSettlePatch({
    resolution: input.resolution,
    rationale: input.rationale,
    nowIso,
    agentSlug: null,
  });
  /**
   * CHECKED, BECAUSE supabase-js RESOLVES A REFUSED WRITE. An RLS refusal comes
   * back as success with zero rows, so without `.select()` and an empty check
   * this would report a settled forecast that is still sitting on the desk.
   */
  const { data: rows, error } = await db
    .from("decisions")
    .update(patch)
    .eq("id", input.decisionId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) {
    throw new Error("The verdict did not land. You may not have rights on this decision.");
  }
  return { ok: true };
}

export async function deferForecastCheckImpl(
  db: SupabaseClient,
  input: { decisionId: string; days: number },
  nowMs: number,
): Promise<{ checkBy: string; deferredCount: number }> {
  // Read the count first so the increment is honest. Two people deferring the
  // same forecast in the same second is not worth a transaction here: the worst
  // outcome is a count one low on a field nothing gates on.
  const { data: before } = await db
    .from("decisions")
    .select("forecast_deferred_count")
    .eq("id", input.decisionId)
    .maybeSingle();
  const priorCount =
    (before as { forecast_deferred_count?: number | null } | null)?.forecast_deferred_count ?? 0;

  const patch = buildDeferPatch({ days: input.days, priorCount, nowMs });
  const { data: rows, error } = await db
    .from("decisions")
    .update(patch)
    .eq("id", input.decisionId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) {
    throw new Error("The check date did not move. You may not have rights on this decision.");
  }
  return { checkBy: patch.forecast_next_check_at, deferredCount: patch.forecast_deferred_count };
}

/**
 * The oversight half of the auto-settle gate, mirroring listAgentSettledOutcomes.
 * An agent verdict is only reversible if somebody can see it, so the slug column
 * that makes the set filterable gets a surface.
 */
export type AgentSettledForecast = {
  id: string;
  title: string | null;
  forecast_claim: string | null;
  forecast_resolution: string | null;
  forecast_resolution_rationale: string | null;
  forecast_resolved_at: string | null;
  forecast_resolved_by_agent_slug: string | null;
};

export async function listAgentSettledForecastsImpl(
  db: SupabaseClient,
): Promise<{ settled: AgentSettledForecast[] }> {
  const { data, error } = await db
    .from("decisions")
    .select(
      "id,title,forecast_claim,forecast_resolution,forecast_resolution_rationale," +
        "forecast_resolved_at,forecast_resolved_by_agent_slug",
    )
    .not("forecast_resolved_by_agent_slug", "is", null)
    .order("forecast_resolved_at", { ascending: false })
    .limit(8);
  if (error) return { settled: [] };
  return { settled: (data ?? []) as unknown as AgentSettledForecast[] };
}

export async function getForecastCallRateImpl(db: SupabaseClient): Promise<ForecastCallSummary> {
  const { data, error } = await db
    .from("decisions")
    .select("forecast_resolution")
    .not("forecast_resolution", "is", null)
    .neq("forecast_resolution", "inconclusive")
    .order("forecast_resolved_at", { ascending: false })
    .limit(10);
  if (error) return summarizeForecastCalls([]);
  return summarizeForecastCalls(
    ((data ?? []) as Array<{ forecast_resolution: string | null }>).map((r) => ({
      resolution: r.forecast_resolution,
    })),
  );
}

// The server functions are thin wrappers, so every branch above stays reachable
// from a test without a database or an auth context.

export const listDueForecasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    listDueForecastsImpl(context.supabase as unknown as SupabaseClient, new Date().toISOString()),
  );

export const settleForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        resolution: z.enum(["hit", "miss", "inconclusive"]),
        rationale: z.string().min(1).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) =>
    settleForecastImpl(
      context.supabase as unknown as SupabaseClient,
      data,
      new Date().toISOString(),
    ),
  );

export const deferForecastCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        days: z.number().int().min(1).max(365).default(14),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) =>
    deferForecastCheckImpl(context.supabase as unknown as SupabaseClient, data, Date.now()),
  );

export const listAgentSettledForecasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    listAgentSettledForecastsImpl(context.supabase as unknown as SupabaseClient),
  );

export const getForecastCallRate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    getForecastCallRateImpl(context.supabase as unknown as SupabaseClient),
  );
