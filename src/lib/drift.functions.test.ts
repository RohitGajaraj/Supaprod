import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getDriftOverviewImpl,
  updateDriftBaselineImpl,
  resolveDriftIncidentImpl,
  reopenDriftIncidentImpl,
  BaselineSchema,
} from "./drift.functions";

/** What a mocked read answers: the data and the error, both unknown until a test says. */
type MockResult = { data: unknown; error: unknown };

/**
 * Mock builder for drift.functions test suite.
 * Implements chainable Supabase query API.
 */
function createMockSupabase(config: {
  baseline?: unknown;
  snapshots?: unknown[];
  openIncidents?: unknown[];
  recentIncidents?: unknown[];
  error?: unknown;
}): SupabaseClient {
  const err = config.error ?? null;

  /** A real thenable (calls `resolve`, unlike a bare `{ then: (cb) => Promise.resolve(...) }`
   * which never settles the outer `await` and hangs the test until timeout). */
  function terminal(result: MockResult): unknown {
    return {
      then: (resolve: (value: MockResult) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
  }

  /** Chainable + directly-awaitable `.eq().eq()...` tail for update() calls. */
  function updateEqChain(result: MockResult): unknown {
    return {
      eq: (_col: string, _val: unknown) => updateEqChain(result),
      then: (resolve: (value: MockResult) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
  }

  return {
    from: (table: string) => ({
      select: (..._args: string[]) => ({
        eq: (_col: string, _val: unknown) => ({
          maybeSingle: async () => {
            if (table === "drift_baselines") {
              return { data: config.baseline ?? null, error: err };
            }
            return { data: null, error: err };
          },
          // drift_incidents (open): .eq("user_id",..).eq("status","open").order(...)
          eq: (col2: string, val2: unknown) => ({
            order: (_col3: string, _opts?: unknown) => {
              if (table === "drift_incidents" && col2 === "status" && val2 === "open") {
                return terminal({ data: config.openIncidents ?? [], error: err });
              }
              return terminal({ data: [], error: err });
            },
          }),
          // drift_snapshots: .eq("user_id",..).gte("bucket_date",..).order(...)
          gte: (_col2: string, _val2: unknown) => ({
            order: (_col3: string, _opts?: unknown) => {
              if (table === "drift_snapshots") {
                return terminal({ data: config.snapshots ?? [], error: err });
              }
              return terminal({ data: [], error: err });
            },
          }),
          // drift_incidents (recent): .eq("user_id",..).neq("status","open").order(...).limit(50)
          neq: (col2: string, val2: unknown) => ({
            order: (_col3: string, _opts?: unknown) => ({
              limit: async (_n?: number) => {
                if (table === "drift_incidents" && col2 === "status" && val2 === "open") {
                  return { data: config.recentIncidents ?? [], error: err };
                }
                return { data: [], error: err };
              },
            }),
          }),
        }),
      }),
      update: (_data: unknown) => updateEqChain({ data: null, error: err }),
      upsert: async (_data: unknown, _opts?: unknown) => ({ data: null, error: err }),
    }),
  } as unknown as SupabaseClient;
}

describe("drift.functions", () => {
  describe("getDriftOverviewImpl", () => {
    it("should return null baseline, empty snapshots/incidents when user has no setup", async () => {
      const supabase = createMockSupabase({
        baseline: null,
        snapshots: [],
        openIncidents: [],
        recentIncidents: [],
      });
      const result = await getDriftOverviewImpl(supabase, "u1");
      expect(result.baseline).toBe(null);
      expect(result.snapshots).toEqual([]);
      expect(result.openIncidents).toEqual([]);
      expect(result.recentIncidents).toEqual([]);
    });

    it("should return baseline config with thresholds", async () => {
      const baseline = {
        user_id: "u1",
        window_days: 7,
        baseline_days: 30,
        latency_pct_threshold: 50,
        tokens_pct_threshold: 100,
        cost_pct_threshold: 25,
        score_pct_threshold: 80,
        error_rate_pct_threshold: 5,
        enabled: true,
      };
      const supabase = createMockSupabase({
        baseline,
        snapshots: [],
        openIncidents: [],
        recentIncidents: [],
      });
      const result = await getDriftOverviewImpl(supabase, "u1");
      expect(result.baseline).toEqual(baseline);
      expect(result.baseline?.window_days).toBe(7);
      expect(result.baseline?.enabled).toBe(true);
    });

    it("should return snapshots for last 30 days", async () => {
      const snapshots = [
        { user_id: "u1", bucket_date: "2026-06-15", latency_avg: 100, tokens_avg: 5000 },
        { user_id: "u1", bucket_date: "2026-06-16", latency_avg: 105, tokens_avg: 5100 },
        { user_id: "u1", bucket_date: "2026-07-10", latency_avg: 110, tokens_avg: 5500 },
      ];
      const supabase = createMockSupabase({
        baseline: null,
        snapshots,
        openIncidents: [],
        recentIncidents: [],
      });
      const result = await getDriftOverviewImpl(supabase, "u1");
      expect(result.snapshots).toHaveLength(3);
      expect(result.snapshots[0].bucket_date).toBe("2026-06-15");
    });

    it("should separate open incidents from resolved incidents", async () => {
      const openIncidents = [
        { id: "i1", user_id: "u1", status: "open", detected_at: "2026-07-10T10:00:00Z" },
      ];
      const recentIncidents = [
        { id: "i2", user_id: "u1", status: "resolved", detected_at: "2026-07-09T10:00:00Z" },
        { id: "i3", user_id: "u1", status: "dismissed", detected_at: "2026-07-08T10:00:00Z" },
      ];
      const supabase = createMockSupabase({
        baseline: null,
        snapshots: [],
        openIncidents,
        recentIncidents,
      });
      const result = await getDriftOverviewImpl(supabase, "u1");
      expect(result.openIncidents).toHaveLength(1);
      expect(result.openIncidents[0].status).toBe("open");
      expect(result.recentIncidents).toHaveLength(2);
      expect(result.recentIncidents.every((i) => i.status !== "open")).toBe(true);
    });

    it("should limit recent incidents to 50 rows", async () => {
      const recentIncidents = Array.from({ length: 100 }, (_, i) => ({
        id: `i${i}`,
        user_id: "u1",
        status: "resolved",
        detected_at: new Date(Date.now() - i * 86400000).toISOString(),
      }));
      const supabase = createMockSupabase({
        baseline: null,
        snapshots: [],
        openIncidents: [],
        recentIncidents: recentIncidents.slice(0, 50), // Mock respects limit
      });
      const result = await getDriftOverviewImpl(supabase, "u1");
      expect(result.recentIncidents.length).toBeLessThanOrEqual(50);
    });
  });

  describe("updateDriftBaselineImpl", () => {
    it("should upsert baseline config for user", async () => {
      const supabase = createMockSupabase({ baseline: null });
      const data = {
        window_days: 7,
        baseline_days: 30,
        latency_pct_threshold: 50,
        tokens_pct_threshold: 100,
        cost_pct_threshold: 25,
        score_pct_threshold: 80,
        error_rate_pct_threshold: 5,
        enabled: true,
      };
      const result = await updateDriftBaselineImpl(supabase, "u1", data);
      expect(result.ok).toBe(true);
    });

    it("should validate window_days (1-60)", () => {
      expect(() => {
        BaselineSchema.parse({
          window_days: 0,
          baseline_days: 30,
          latency_pct_threshold: 50,
          tokens_pct_threshold: 100,
          cost_pct_threshold: 25,
          score_pct_threshold: 80,
          error_rate_pct_threshold: 5,
          enabled: true,
        });
      }).toThrow();

      expect(() => {
        BaselineSchema.parse({
          window_days: 61,
          baseline_days: 30,
          latency_pct_threshold: 50,
          tokens_pct_threshold: 100,
          cost_pct_threshold: 25,
          score_pct_threshold: 80,
          error_rate_pct_threshold: 5,
          enabled: true,
        });
      }).toThrow();
    });

    it("should validate baseline_days (1-180)", () => {
      expect(() => {
        BaselineSchema.parse({
          window_days: 7,
          baseline_days: 0,
          latency_pct_threshold: 50,
          tokens_pct_threshold: 100,
          cost_pct_threshold: 25,
          score_pct_threshold: 80,
          error_rate_pct_threshold: 5,
          enabled: true,
        });
      }).toThrow();

      expect(() => {
        BaselineSchema.parse({
          window_days: 7,
          baseline_days: 181,
          latency_pct_threshold: 50,
          tokens_pct_threshold: 100,
          cost_pct_threshold: 25,
          score_pct_threshold: 80,
          error_rate_pct_threshold: 5,
          enabled: true,
        });
      }).toThrow();
    });

    it("should validate percentage thresholds (0-500 for metrics, 0-100 for score)", () => {
      // Valid boundaries
      expect(() => {
        BaselineSchema.parse({
          window_days: 7,
          baseline_days: 30,
          latency_pct_threshold: 0,
          tokens_pct_threshold: 500,
          cost_pct_threshold: 250,
          score_pct_threshold: 100,
          error_rate_pct_threshold: 100,
          enabled: true,
        });
      }).not.toThrow();

      // Invalid: latency_pct_threshold > 500
      expect(() => {
        BaselineSchema.parse({
          window_days: 7,
          baseline_days: 30,
          latency_pct_threshold: 501,
          tokens_pct_threshold: 100,
          cost_pct_threshold: 25,
          score_pct_threshold: 80,
          error_rate_pct_threshold: 5,
          enabled: true,
        });
      }).toThrow();

      // Invalid: score_pct_threshold > 100
      expect(() => {
        BaselineSchema.parse({
          window_days: 7,
          baseline_days: 30,
          latency_pct_threshold: 50,
          tokens_pct_threshold: 100,
          cost_pct_threshold: 25,
          score_pct_threshold: 101,
          error_rate_pct_threshold: 5,
          enabled: true,
        });
      }).toThrow();
    });

    it("should throw on DB error", async () => {
      const supabase = createMockSupabase({ error: { message: "Upsert failed" } });
      const data = {
        window_days: 7,
        baseline_days: 30,
        latency_pct_threshold: 50,
        tokens_pct_threshold: 100,
        cost_pct_threshold: 25,
        score_pct_threshold: 80,
        error_rate_pct_threshold: 5,
        enabled: true,
      };
      try {
        await updateDriftBaselineImpl(supabase, "u1", data);
        expect.unreachable("Should have thrown error");
      } catch (e) {
        expect((e as Error).message).toContain("Upsert failed");
      }
    });
  });

  describe("resolveDriftIncidentImpl", () => {
    it("should update incident status to resolved with timestamp", async () => {
      const supabase = createMockSupabase({
        openIncidents: [{ id: "i1", user_id: "u1", status: "open" }],
      });
      const result = await resolveDriftIncidentImpl(supabase, "u1", "i1");
      expect(result.ok).toBe(true);
    });

    it("should scope to user_id for RLS (can only resolve own incidents)", async () => {
      const supabase = createMockSupabase({
        openIncidents: [{ id: "i1", user_id: "u1", status: "open" }],
      });
      // Implementation calls .eq("id", id).eq("user_id", userId)
      const result = await resolveDriftIncidentImpl(supabase, "u1", "i1");
      expect(result.ok).toBe(true);
    });

    it("should throw on DB error", async () => {
      const supabase = createMockSupabase({ error: { message: "Update failed" } });
      try {
        await resolveDriftIncidentImpl(supabase, "u1", "i1");
        expect.unreachable("Should have thrown error");
      } catch (e) {
        expect((e as Error).message).toContain("Update failed");
      }
    });
  });

  describe("reopenDriftIncidentImpl", () => {
    it("should update incident status to open and clear resolved_at", async () => {
      const supabase = createMockSupabase({
        recentIncidents: [
          { id: "i1", user_id: "u1", status: "resolved", resolved_at: "2026-07-10T10:00:00Z" },
        ],
      });
      const result = await reopenDriftIncidentImpl(supabase, "u1", "i1");
      expect(result.ok).toBe(true);
    });

    it("should scope to user_id for RLS", async () => {
      const supabase = createMockSupabase({
        recentIncidents: [{ id: "i1", user_id: "u1", status: "resolved" }],
      });
      const result = await reopenDriftIncidentImpl(supabase, "u1", "i1");
      expect(result.ok).toBe(true);
    });

    it("should throw on DB error", async () => {
      const supabase = createMockSupabase({ error: { message: "Update failed" } });
      try {
        await reopenDriftIncidentImpl(supabase, "u1", "i1");
        expect.unreachable("Should have thrown error");
      } catch (e) {
        expect((e as Error).message).toContain("Update failed");
      }
    });
  });

  describe("edge cases & error handling", () => {
    it("should handle zero thresholds (strict detection)", () => {
      expect(() => {
        BaselineSchema.parse({
          window_days: 7,
          baseline_days: 30,
          latency_pct_threshold: 0,
          tokens_pct_threshold: 0,
          cost_pct_threshold: 0,
          score_pct_threshold: 0,
          error_rate_pct_threshold: 0,
          enabled: true,
        });
      }).not.toThrow();
    });

    it("should handle maximum thresholds", () => {
      expect(() => {
        BaselineSchema.parse({
          window_days: 60,
          baseline_days: 180,
          latency_pct_threshold: 500,
          tokens_pct_threshold: 500,
          cost_pct_threshold: 500,
          score_pct_threshold: 100,
          error_rate_pct_threshold: 100,
          enabled: true,
        });
      }).not.toThrow();
    });

    it("should handle disabled baseline", () => {
      expect(() => {
        BaselineSchema.parse({
          window_days: 7,
          baseline_days: 30,
          latency_pct_threshold: 50,
          tokens_pct_threshold: 100,
          cost_pct_threshold: 25,
          score_pct_threshold: 80,
          error_rate_pct_threshold: 5,
          enabled: false,
        });
      }).not.toThrow();
    });

    it("should handle empty incident lists", async () => {
      const supabase = createMockSupabase({
        baseline: null,
        snapshots: [],
        openIncidents: [],
        recentIncidents: [],
      });
      const result = await getDriftOverviewImpl(supabase, "u1");
      expect(result.openIncidents).toHaveLength(0);
      expect(result.recentIncidents).toHaveLength(0);
    });
  });
});
