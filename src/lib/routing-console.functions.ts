/**
 * Admin routing console (/admin/routing) - architecture §10, brief §11.
 *
 * One row per real CallSurface (see the union in src/lib/ai/runtime.server.ts,
 * restated below as a plain const so this module does not import a
 * `.server.ts` file from a place it cannot reach). For each surface: the
 * current setting (Auto, a pinned model, or "no model" for surfaces with no
 * chat-model catalog entry), the resolved Auto model class (capability.ts),
 * live 7-day cost/latency/volume aggregates from `ai_events`, an eval score
 * where eval data exists for that (surface, model) pair, and an honest
 * recommendation: a cheaper live model sharing a capability with the current
 * model whose eval score on this surface is equal or better. No eval data
 * for the current model on this surface means the recommendation is null
 * with reason "no eval data yet" - never a guess dressed as a fact.
 *
 * WIRING NOTE (flagged for the ledger): pins persist under feature-flag keys
 * `routing.pin.<surface>` and the policy under `routing.policy` via the
 * existing admin_upsert_flag RPC - no migration needed. The AI runtime
 * chokepoint (runtime.server.ts / capability.ts) does not read these keys
 * yet; wiring the chokepoint to honor a pin is a follow-up step, not part
 * of this lane.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MODELS, DEFAULT_MODEL, type Model } from "@/lib/ai/models";
import {
  CAPABILITY_PREFERENCES,
  SURFACE_CAPABILITY,
  selectModelForCapability,
} from "@/lib/ai/capability";
import { priceFor } from "@/lib/ai/pricing";

/**
 * The 14 real CallSurface literals - restated from src/lib/ai/runtime.server.ts
 * (the `CallSurface` union) because that file is a `.server.ts`-adjacent
 * chokepoint this admin-only module does not otherwise need to import.
 * Keep this list in lockstep with that union; a drift here is cosmetic only
 * (it would just mean a surface is missing from the console table).
 */
export const ROUTING_SURFACES = [
  "agent",
  "chat",
  "copilot",
  "prd",
  "discovery",
  "studio",
  "brief",
  "eval",
  "judge",
  "embed",
  "scheduler",
  "sense",
  "decision",
  "test",
] as const;
export type RoutingSurface = (typeof ROUTING_SURFACES)[number];

/** Surfaces with no chat-model catalog entry at all: embeddings run on their
 * own governed pipeline (rag/embed.server.ts), never routed through the
 * chat capability system (capability.ts is explicit that `embedding` is
 * deliberately excluded). Nothing to pin here - this is "no model", not a
 * missing feature. */
const NO_MODEL_SURFACES: ReadonlySet<RoutingSurface> = new Set(["embed"]);

export type RoutingSetting =
  { kind: "auto" } | { kind: "pinned"; modelId: string } | { kind: "no-model" };

export type RoutingRecommendation = {
  modelId: string;
  reason: string;
} | null;

export type RoutingRow = {
  surface: RoutingSurface;
  setting: RoutingSetting;
  /** The model Auto mode would resolve to today for this surface, or null
   * when the surface has no model (embed) or nothing live is reachable. */
  autoModelId: string | null;
  /** Whether autoModelId came from platform capability routing
   * (SURFACE_CAPABILITY) or the plain consumer default - an honest label,
   * never implying more routing sophistication than exists. */
  autoModelSource: "capability" | "default" | "none";
  costPerTaskUsd7d: number | null;
  latencyP50Ms7d: number | null;
  callCount7d: number;
  evalScore: number | null;
  recommendation: RoutingRecommendation;
  recommendationReason: string | null;
};

export type RoutingPolicyMode = "auto-adopt" | "suggest" | "hold";

export type RoutingTableResult = {
  rows: RoutingRow[];
  policy: RoutingPolicyMode;
  /** Live models only, for the pin selector - never a hardcoded UI list. */
  liveModels: Array<{ id: string; label: string; provider: string; tier: string }>;
};

const FLAG_PIN_PREFIX = "routing.pin.";
const FLAG_POLICY_KEY = "routing.policy";

function blended(modelId: string): number {
  const p = priceFor(modelId);
  return (p.in_per_mtok + p.out_per_mtok) / 2;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// The parameter was a hand-written structural stub -- `{ from: (t: string) =>
// any }` -- which accepted any object with a `from` method and typed its result
// as `any`. On the ADMIN GATE, that meant neither the table name nor the
// selected column was checked: `.from("user_roles").select("role")` would have
// compiled just as happily against a table that does not exist, and a query
// that errors returns `data: null`, which this function reads as "not an admin"
// and refuses. So the failure mode was a permanently closed admin console with
// no error anywhere -- exactly the shape that is hardest to diagnose. Naming
// the real client type checks both.
async function assertAdmin(context: {
  supabase: SupabaseClient<Database>;
}): Promise<string | null> {
  const { data: adminRole } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("role", "admin")
    .maybeSingle();
  return adminRole ? null : "Forbidden";
}

export const getRoutingTable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RoutingTableResult | { error: string }> => {
    const forbidden = await assertAdmin(context);
    if (forbidden) return { error: forbidden };

    // Pins + policy live as feature flags (admin_list_flags is itself
    // has_role('admin')-gated at the DB, mirroring admin-platform.functions.ts).
    const { data: flagRows, error: flagErr } = await context.supabase.rpc("admin_list_flags");
    if (flagErr) return { error: flagErr.message };
    const flags = (flagRows ?? []) as Array<{ key: string; enabled: boolean; payload: unknown }>;

    const pins = new Map<string, string | null>();
    let policy: RoutingPolicyMode = "suggest";
    for (const f of flags) {
      if (f.key === FLAG_POLICY_KEY) {
        const mode = (f.payload as { mode?: string } | null)?.mode;
        if (mode === "auto-adopt" || mode === "suggest" || mode === "hold") policy = mode;
      } else if (f.key.startsWith(FLAG_PIN_PREFIX) && f.enabled) {
        const surface = f.key.slice(FLAG_PIN_PREFIX.length);
        const modelId = (f.payload as { modelId?: string | null } | null)?.modelId ?? null;
        pins.set(surface, modelId);
      }
    }

    // 7-day ai_events aggregates, grouped by surface. Aggregates are
    // optional context, never load-bearing: environments without the
    // service-role key (local dev) fall back to the caller's RLS client,
    // and a denied read degrades to empty aggregates, not a dead console.
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    async function readRows<T>(
      run: (
        client: typeof context.supabase,
      ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
    ): Promise<T[]> {
      try {
        const { data, error } = await run(supabaseAdmin as unknown as typeof context.supabase);
        if (!error && data) return data;
      } catch {
        /* service-role unavailable in this environment */
      }
      try {
        const { data } = await run(context.supabase);
        return data ?? [];
      } catch {
        return [];
      }
    }
    const eventRows = await readRows((c) =>
      c
        .from("ai_events")
        .select("surface, model, est_cost_usd, latency_ms, status")
        .gte("created_at", since)
        .limit(20_000),
    );

    type EventRow = {
      surface: string;
      model: string;
      est_cost_usd: number | null;
      latency_ms: number | null;
      status: string;
    };
    const bySurface = new Map<string, EventRow[]>();
    for (const r of (eventRows ?? []) as EventRow[]) {
      const list = bySurface.get(r.surface) ?? [];
      list.push(r);
      bySurface.set(r.surface, list);
    }

    // Eval scores per (surface, model): eval_runs doesn't carry surface directly,
    // so join through eval_suites (suite_id -> surface) in two reads.
    const suiteRows = await readRows((c) =>
      c.from("eval_suites").select("id, surface").limit(2000),
    );
    const suiteSurface = new Map<string, string>();
    for (const s of suiteRows as Array<{ id: string; surface: string }>) {
      suiteSurface.set(s.id, s.surface);
    }
    const runRows = await readRows((c) =>
      c
        .from("eval_runs")
        .select("suite_id, model, avg_score, status")
        .eq("status", "completed")
        .not("avg_score", "is", null)
        .limit(5000),
    );

    // avg_score averaged across runs, keyed "<surface>::<model>"
    const evalSum = new Map<string, { total: number; count: number }>();
    for (const r of (runRows ?? []) as Array<{
      suite_id: string;
      model: string;
      avg_score: number | null;
    }>) {
      const surface = suiteSurface.get(r.suite_id);
      if (!surface || r.avg_score === null) continue;
      const key = `${surface}::${r.model}`;
      const cur = evalSum.get(key) ?? { total: 0, count: 0 };
      cur.total += r.avg_score;
      cur.count += 1;
      evalSum.set(key, cur);
    }
    const evalScoreFor = (surface: string, modelId: string): number | null => {
      const e = evalSum.get(`${surface}::${modelId}`);
      return e ? e.total / e.count : null;
    };

    const liveModels = MODELS.filter((m) => m.live);

    const rows: RoutingRow[] = ROUTING_SURFACES.map((surface) => {
      const pinned = pins.get(surface);
      const noModel = NO_MODEL_SURFACES.has(surface);

      let autoModelId: string | null = null;
      let autoModelSource: RoutingRow["autoModelSource"] = "none";
      if (!noModel) {
        const capability = SURFACE_CAPABILITY[surface];
        if (capability) {
          autoModelId = selectModelForCapability({
            capability,
            catalog: MODELS,
            isAvailable: (m) => m.live,
          });
          autoModelSource = autoModelId ? "capability" : "none";
        } else {
          autoModelId = liveModels.some((m) => m.id === DEFAULT_MODEL) ? DEFAULT_MODEL : null;
          autoModelSource = autoModelId ? "default" : "none";
        }
      }

      const setting: RoutingSetting = noModel
        ? { kind: "no-model" }
        : pinned
          ? { kind: "pinned", modelId: pinned }
          : { kind: "auto" };

      const currentModelId = setting.kind === "pinned" ? setting.modelId : autoModelId;

      const events = bySurface.get(surface) ?? [];
      const okEvents = events.filter((e) => e.status === "ok");
      const costs = okEvents.map((e) => Number(e.est_cost_usd || 0));
      const latencies = okEvents.map((e) => e.latency_ms || 0).filter((n) => n > 0);
      const costPerTaskUsd7d = costs.length
        ? costs.reduce((a, b) => a + b, 0) / costs.length
        : null;
      const latencyP50Ms7d = median(latencies);
      const callCount7d = events.length;

      const evalScore = currentModelId ? evalScoreFor(surface, currentModelId) : null;

      let recommendation: RoutingRecommendation = null;
      let recommendationReason: string | null = null;
      if (noModel) {
        recommendationReason = "This surface has no model to route.";
      } else if (!currentModelId) {
        recommendationReason = "No live model resolves for this surface yet.";
      } else if (evalScore === null) {
        recommendationReason = "no eval data yet";
      } else {
        const currentModel = MODELS.find((m) => m.id === currentModelId);
        const currentPrice = blended(currentModelId);
        const currentCaps = new Set(currentModel?.capabilities ?? []);
        const candidates = liveModels.filter(
          (m) =>
            m.id !== currentModelId &&
            (m.capabilities ?? []).some((c) => currentCaps.has(c)) &&
            blended(m.id) < currentPrice,
        );
        let best: { modelId: string; score: number; price: number } | null = null;
        for (const cand of candidates) {
          const score = evalScoreFor(surface, cand.id);
          if (score === null || score < evalScore) continue;
          const price = blended(cand.id);
          if (!best || price < best.price) best = { modelId: cand.id, score, price };
        }
        if (best) {
          recommendation = {
            modelId: best.modelId,
            reason: `Same or better eval score (${best.score.toFixed(0)} vs ${evalScore.toFixed(0)}), cheaper per token.`,
          };
        } else if (candidates.some((c) => evalScoreFor(surface, c.id) === null)) {
          recommendationReason = "no eval data yet";
        } else {
          recommendationReason = "No cheaper model matches this eval score today.";
        }
      }

      return {
        surface,
        setting,
        autoModelId,
        autoModelSource,
        costPerTaskUsd7d,
        latencyP50Ms7d,
        callCount7d,
        evalScore,
        recommendation,
        recommendationReason,
      };
    });

    return {
      rows,
      policy,
      liveModels: liveModels.map((m) => ({
        id: m.id,
        label: m.label,
        provider: m.provider,
        tier: m.tier,
      })),
    };
  });

const SetPinSchema = z.object({
  surface: z.enum(ROUTING_SURFACES),
  modelId: z.string().min(1).nullable(),
});

export const setSurfacePin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetPinSchema.parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    const forbidden = await assertAdmin(context);
    if (forbidden) return { error: forbidden };

    if (NO_MODEL_SURFACES.has(data.surface)) {
      return { error: "This surface has no model to pin." };
    }
    if (data.modelId && !MODELS.some((m) => m.id === data.modelId && m.live)) {
      return { error: "Unknown or non-live model." };
    }

    const { error } = await context.supabase.rpc("admin_upsert_flag", {
      _key: `${FLAG_PIN_PREFIX}${data.surface}`,
      _enabled: data.modelId !== null,
      _payload: { modelId: data.modelId },
    });
    if (error) return { error: error.message };
    return { ok: true };
  });

const SetPolicySchema = z.object({
  mode: z.enum(["auto-adopt", "suggest", "hold"]),
});

export const setRoutingPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetPolicySchema.parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    const forbidden = await assertAdmin(context);
    if (forbidden) return { error: forbidden };

    const { error } = await context.supabase.rpc("admin_upsert_flag", {
      _key: FLAG_POLICY_KEY,
      _enabled: true,
      _payload: { mode: data.mode },
    });
    if (error) return { error: error.message };
    return { ok: true };
  });

// Re-export for the route/components to reference the preference table
// without reaching into capability.ts directly (keeps the console's data
// dependency surface small and greppable).
export { CAPABILITY_PREFERENCES };
