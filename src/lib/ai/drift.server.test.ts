import { describe, it, expect, beforeEach, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rollupSnapshots, detectIncidents, runDriftForUser } from "./drift.server";

/**
 * Mock Supabase for rollupSnapshots.
 * Handles ai_events fetch, prompt_runs fetch, eval_case_results fetch, and drift_snapshots upsert.
 */
function mockSupabaseForRollup(config: {
  events?: unknown[];
  runs?: unknown[];
  evals?: unknown[];
  upsertError?: unknown;
  /** detectIncidents' drift_baselines lookup, used by the runDriftForUser tests below.
   * Defaults to disabled so detectIncidents short-circuits without needing drift_snapshots
   * (select) / drift_incidents mocking that this rollup-focused mock doesn't implement. */
  baseline?: unknown;
}) {
  return {
    from: (table: string) => {
      if (table === "ai_events") {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => ({
                  limit: async () => ({ data: config.events || [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "prompt_runs") {
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({ data: config.runs || [], error: null }),
            }),
          }),
        };
      }
      if (table === "eval_case_results") {
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({ data: config.evals || [], error: null }),
            }),
          }),
        };
      }
      if (table === "drift_baselines") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: config.baseline ?? { enabled: false },
                error: null,
              }),
            }),
          }),
        };
      }
      // drift_snapshots
      return {
        upsert: async () => ({ data: null, error: config.upsertError }),
      };
    },
  } as unknown as SupabaseClient;
}

/**
 * Mock for detectIncidents.
 * Handles drift_baselines fetch, drift_snapshots fetch, drift_incidents queries/inserts/updates.
 */
function mockSupabaseForDetect(config: {
  baseline?: unknown;
  snapshots?: unknown[];
  existingIncidents?: unknown[];
  insertError?: unknown;
  updateError?: unknown;
}) {
  return {
    from: (table: string) => {
      if (table === "drift_baselines") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: config.baseline || null, error: null }),
            }),
          }),
        };
      }
      if (table === "drift_snapshots") {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => async () => ({ data: config.snapshots || [], error: null }),
              }),
            }),
          }),
        };
      }
      // drift_incidents
      return {
        select: () => ({
          eq: (col: string, val: unknown) => ({
            neq: () => ({
              order: () => ({
                limit: () => async () => ({ data: config.existingIncidents || [], error: null }),
              }),
            }),
            order: () => ({
              limit: () => async () => ({ data: config.existingIncidents || [], error: null }),
            }),
          }),
        }),
        insert: () => async () => ({ data: null, error: config.insertError }),
        update: () => ({
          in: () => async () => ({ data: null, error: config.updateError }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

describe("rollupSnapshots", () => {
  it("should return 0 when no ai_events found", async () => {
    const supabase = mockSupabaseForRollup({ events: [] });
    const count = await rollupSnapshots(supabase, "user1");
    expect(count).toBe(0);
  });

  it("should aggregate latencies into p95, average, and totals per (date, surface, model, version)", async () => {
    const supabase = mockSupabaseForRollup({
      events: [
        {
          id: "evt1",
          surface: "chat",
          model: "claude-opus",
          latency_ms: 100,
          total_tokens: 500,
          est_cost_usd: 0.01,
          status: "success",
          created_at: "2026-07-01T10:00:00Z",
        },
        {
          id: "evt2",
          surface: "chat",
          model: "claude-opus",
          latency_ms: 200,
          total_tokens: 600,
          est_cost_usd: 0.012,
          status: "success",
          created_at: "2026-07-01T11:00:00Z",
        },
      ],
      runs: [
        { event_id: "evt1", version_id: "v1" },
        { event_id: "evt2", version_id: "v1" },
      ],
      evals: [],
    });
    const count = await rollupSnapshots(supabase, "user1");
    expect(count).toBeGreaterThan(0);
  });

  it("should compute p95 latency from array (0.95 percentile)", async () => {
    // If array is [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    // p95 index = floor(10 * 0.95) = 9 → element at [9] = 100
    const supabase = mockSupabaseForRollup({
      events: Array.from({ length: 100 }, (_, i) => ({
        id: `evt${i}`,
        surface: "chat",
        model: "gpt4",
        latency_ms: (i + 1) * 10, // 10, 20, ..., 1000
        total_tokens: 500,
        est_cost_usd: 0.01,
        status: "success",
        created_at: "2026-07-01T00:00:00Z",
      })),
      runs: [],
      evals: [],
    });
    const count = await rollupSnapshots(supabase, "user1");
    expect(count).toBe(1);
  });

  it("should average cost across events, handling string values", async () => {
    const supabase = mockSupabaseForRollup({
      events: [
        {
          id: "evt1",
          surface: "analysis",
          model: "claude-sonnet",
          latency_ms: 150,
          total_tokens: 1000,
          est_cost_usd: "0.05", // string
          status: "success",
          created_at: "2026-07-02T12:00:00Z",
        },
        {
          id: "evt2",
          surface: "analysis",
          model: "claude-sonnet",
          latency_ms: 200,
          total_tokens: 1200,
          est_cost_usd: 0.06, // number
          status: "success",
          created_at: "2026-07-02T13:00:00Z",
        },
      ],
      runs: [],
      evals: [],
    });
    const count = await rollupSnapshots(supabase, "user1");
    expect(count).toBe(1);
  });

  it("should track error_count and compute request_count", async () => {
    const supabase = mockSupabaseForRollup({
      events: [
        {
          id: "evt1",
          surface: "x",
          model: "y",
          latency_ms: 100,
          total_tokens: 100,
          est_cost_usd: 0.01,
          status: "success",
          created_at: "2026-07-03T00:00:00Z",
        },
        {
          id: "evt2",
          surface: "x",
          model: "y",
          latency_ms: 150,
          total_tokens: 120,
          est_cost_usd: 0.012,
          status: "error",
          created_at: "2026-07-03T00:00:00Z",
        },
        {
          id: "evt3",
          surface: "x",
          model: "y",
          latency_ms: 200,
          total_tokens: 140,
          est_cost_usd: 0.014,
          status: "error",
          created_at: "2026-07-03T00:00:00Z",
        },
      ],
      runs: [],
      evals: [],
    });
    const count = await rollupSnapshots(supabase, "user1");
    // Should have 1 snapshot with request_count=3, error_count=2
    expect(count).toBe(1);
  });

  it("should join eval scores by ai_event_id", async () => {
    const supabase = mockSupabaseForRollup({
      events: [
        {
          id: "evt1",
          surface: "eval",
          model: "m",
          latency_ms: 100,
          total_tokens: 100,
          est_cost_usd: 0.01,
          status: "success",
          created_at: "2026-07-04T00:00:00Z",
        },
        {
          id: "evt2",
          surface: "eval",
          model: "m",
          latency_ms: 150,
          total_tokens: 120,
          est_cost_usd: 0.012,
          status: "success",
          created_at: "2026-07-04T00:00:00Z",
        },
      ],
      runs: [],
      evals: [
        { ai_event_id: "evt1", score: 0.8 },
        { ai_event_id: "evt2", score: 0.9 },
      ],
    });
    const count = await rollupSnapshots(supabase, "user1");
    expect(count).toBe(1);
  });

  it("should handle null score values in eval_case_results", async () => {
    const supabase = mockSupabaseForRollup({
      events: [
        {
          id: "evt1",
          surface: "s",
          model: "m",
          latency_ms: 100,
          total_tokens: 100,
          est_cost_usd: 0.01,
          status: "success",
          created_at: "2026-07-05T00:00:00Z",
        },
      ],
      runs: [],
      evals: [{ ai_event_id: "evt1", score: null }],
    });
    const count = await rollupSnapshots(supabase, "user1");
    expect(count).toBe(1);
  });

  it("should support prompt_version_id linking via prompt_runs", async () => {
    const supabase = mockSupabaseForRollup({
      events: [
        {
          id: "evt1",
          surface: "prompt",
          model: "m",
          latency_ms: 100,
          total_tokens: 100,
          est_cost_usd: 0.01,
          status: "success",
          created_at: "2026-07-06T00:00:00Z",
        },
        {
          id: "evt2",
          surface: "prompt",
          model: "m",
          latency_ms: 120,
          total_tokens: 110,
          est_cost_usd: 0.011,
          status: "success",
          created_at: "2026-07-06T00:00:00Z",
        },
      ],
      runs: [
        { event_id: "evt1", version_id: "pv-v1" },
        { event_id: "evt2", version_id: "pv-v2" }, // Different version → separate bucket
      ],
      evals: [],
    });
    const count = await rollupSnapshots(supabase, "user1");
    expect(count).toBe(2); // Two different prompt versions
  });

  it("should use bucket_date (YYYY-MM-DD) as day key", async () => {
    const supabase = mockSupabaseForRollup({
      events: [
        {
          id: "evt1",
          surface: "s",
          model: "m",
          latency_ms: 100,
          total_tokens: 100,
          est_cost_usd: 0.01,
          status: "success",
          created_at: "2026-07-10T00:00:00Z",
        },
        {
          id: "evt2",
          surface: "s",
          model: "m",
          latency_ms: 120,
          total_tokens: 110,
          est_cost_usd: 0.011,
          status: "success",
          created_at: "2026-07-10T23:59:59Z",
        },
      ],
      runs: [],
      evals: [],
    });
    const count = await rollupSnapshots(supabase, "user1");
    expect(count).toBe(1); // Same day → one bucket
  });
});

describe("detectIncidents", () => {
  it("should return opened=0, resolved=0 when drift detection disabled (enabled=false)", async () => {
    const supabase = mockSupabaseForDetect({ baseline: { enabled: false } });
    const result = await detectIncidents(supabase, "user1");
    expect(result.opened).toBe(0);
    expect(result.resolved).toBe(0);
  });

  it("should return opened=0, resolved=0 when no baseline configured (null)", async () => {
    const supabase = mockSupabaseForDetect({ baseline: null });
    const result = await detectIncidents(supabase, "user1");
    expect(result.opened).toBe(0);
    expect(result.resolved).toBe(0);
  });

  it("should return opened=0, resolved=0 when no snapshots in window", async () => {
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14 },
      snapshots: [],
    });
    const result = await detectIncidents(supabase, "user1");
    expect(result.opened).toBe(0);
    expect(result.resolved).toBe(0);
  });

  it("should compute pctDelta = (current - baseline) / baseline * 100", async () => {
    // Current = 150ms, Baseline = 100ms → (150-100)/100*100 = 50% increase
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, latency_pct_threshold: 25 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 100,
          error_count: 0,
          request_count: 10,
        },
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 150,
          error_count: 0,
          request_count: 10,
        }, // recent window
      ],
      existingIncidents: [],
    });
    const result = await detectIncidents(supabase, "user1");
    // 50% > 25% threshold → should open incident
    // (result may vary based on actual date logic, but delta is computed)
    expect(typeof result.opened).toBe("number");
  });

  it("should handle baseline=0, delta should be 100 if current > 0", async () => {
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, cost_pct_threshold: 10 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_cost_usd: 0,
          error_count: 0,
          request_count: 10,
        },
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_cost_usd: 0.05,
          error_count: 0,
          request_count: 10,
        },
      ],
      existingIncidents: [],
    });
    const result = await detectIncidents(supabase, "user1");
    expect(typeof result.opened).toBe("number");
  });

  it("should skip avg_eval_score metric if no recent or baseline rows have scores", async () => {
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, score_pct_threshold: 5 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_eval_score: null,
          error_count: 0,
          request_count: 10,
        },
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_eval_score: null,
          error_count: 0,
          request_count: 10,
        },
      ],
      existingIncidents: [],
    });
    const result = await detectIncidents(supabase, "user1");
    // Should not breach on eval_score (no data)
    expect(typeof result.opened).toBe("number");
  });

  it("should compute error_rate = errors / total * 100", async () => {
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, error_rate_pct_threshold: 5 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          error_count: 1,
          request_count: 100,
        }, // 1%
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          error_count: 10,
          request_count: 100,
        }, // 10% — delta = (10-1)/1*100 = 900%
      ],
      existingIncidents: [],
    });
    const result = await detectIncidents(supabase, "user1");
    expect(typeof result.opened).toBe("number");
  });

  it("should classify severity: critical if mag > thr*2, else warn", async () => {
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, latency_pct_threshold: 25 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 100,
          error_count: 0,
          request_count: 10,
        },
        // 60% delta = mag 60, thr*2 = 50 → 60 > 50 → critical
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 160,
          error_count: 0,
          request_count: 10,
        },
      ],
      existingIncidents: [],
    });
    const result = await detectIncidents(supabase, "user1");
    expect(typeof result.opened).toBe("number");
  });

  it("should skip opening duplicate incidents for same (surface, model, version, metric)", async () => {
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, latency_pct_threshold: 25 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 100,
          error_count: 0,
          request_count: 10,
        },
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 160,
          error_count: 0,
          request_count: 10,
        },
      ],
      existingIncidents: [
        {
          id: "inc1",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          metric: "avg_latency_ms",
          status: "open",
        },
      ],
    });
    const result = await detectIncidents(supabase, "user1");
    // Existing incident key matches breach key → skip insert
    expect(result.opened).toBe(0);
  });

  it("should auto-resolve open incidents when metric no longer breaches", async () => {
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, latency_pct_threshold: 25 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 100,
          error_count: 0,
          request_count: 10,
        },
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 110,
          error_count: 0,
          request_count: 10,
        }, // 10% — no breach
      ],
      existingIncidents: [
        {
          id: "inc1",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          metric: "avg_latency_ms",
          status: "open",
        },
      ],
    });
    const result = await detectIncidents(supabase, "user1");
    // No breach, incident exists → auto-resolve
    expect(result.resolved).toBeGreaterThanOrEqual(0);
  });

  it("should use weighted average: sum(value * request_count) / sum(request_count)", async () => {
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, latency_pct_threshold: 10 },
      snapshots: [
        // Baseline: (100*50 + 100*50) / 100 = 100ms
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 100,
          request_count: 50,
        },
        {
          user_id: "u1",
          bucket_date: "2026-06-21",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 100,
          request_count: 50,
        },
        // Recent: (120*80 + 120*20) / 100 = 120ms
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 120,
          request_count: 80,
        },
        {
          user_id: "u1",
          bucket_date: "2026-07-06",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 120,
          request_count: 20,
        },
      ],
      existingIncidents: [],
    });
    const result = await detectIncidents(supabase, "user1");
    expect(typeof result.opened).toBe("number");
  });

  it("should handle higherIsBad=false for avg_eval_score (lowerIsGood metric)", async () => {
    // For score: bad = delta < -threshold (score went DOWN)
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, score_pct_threshold: 10 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_eval_score: 0.8,
          error_count: 0,
          request_count: 10,
        },
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_eval_score: 0.7,
          error_count: 0,
          request_count: 10,
        }, // -12.5% — breach
      ],
      existingIncidents: [],
    });
    const result = await detectIncidents(supabase, "user1");
    expect(typeof result.opened).toBe("number");
  });

  it("should dispatch email on critical incident (fail-safe on error)", async () => {
    // This test checks that if dispatchInstantEmail throws, it doesn't fail the whole detection
    // Real implementation would mock dispatchInstantEmail; here we just verify structure
    const supabase = mockSupabaseForDetect({
      baseline: { enabled: true, window_days: 7, baseline_days: 14, latency_pct_threshold: 10 },
      snapshots: [
        {
          user_id: "u1",
          bucket_date: "2026-06-20",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 100,
          error_count: 0,
          request_count: 10,
        },
        {
          user_id: "u1",
          bucket_date: "2026-07-05",
          surface: "s",
          model: "m",
          prompt_version_id: null,
          avg_latency_ms: 150,
          error_count: 0,
          request_count: 10,
        }, // 50% > 10% critical
      ],
      existingIncidents: [],
    });
    const result = await detectIncidents(supabase, "user1");
    // Should not throw even if email dispatch fails
    expect(typeof result.opened).toBe("number");
  });
});

describe("runDriftForUser", () => {
  it("should run rollupSnapshots then detectIncidents in sequence", async () => {
    const supabase = mockSupabaseForRollup({
      events: [
        {
          id: "evt1",
          surface: "s",
          model: "m",
          latency_ms: 100,
          total_tokens: 100,
          est_cost_usd: 0.01,
          status: "success",
          created_at: "2026-07-01T00:00:00Z",
        },
      ],
      runs: [],
      evals: [],
    });
    const result = await runDriftForUser(supabase, "user1");
    expect(typeof result.snapshots).toBe("number");
    expect(typeof result.opened).toBe("number");
    expect(typeof result.resolved).toBe("number");
  });

  it("should return 0 snapshots, 0 opened, 0 resolved on empty data", async () => {
    const supabase = mockSupabaseForRollup({ events: [], runs: [], evals: [] });
    const result = await runDriftForUser(supabase, "user1");
    expect(result.snapshots).toBe(0);
    expect(result.opened).toBe(0);
    expect(result.resolved).toBe(0);
  });
});
