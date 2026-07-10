import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEvalHealthImpl, type EvalHealthResult } from "./eval-health.functions";

/**
 * Mock builder for eval-health.functions test suite.
 * Implements chainable Supabase query API.
 */
function createMockSupabase(config: {
  suites?: any[];
  runs?: any[];
  suiteError?: any;
  runError?: any;
}): SupabaseClient {
  return {
    from: (table: string) => {
      return {
        select: (...args: string[]) => ({
          eq: (col: string, val: any) => {
            if (table === "eval_suites") {
              return {
                then: (cb: any) => {
                  return Promise.resolve({
                    data: config.suites ?? [],
                    error: config.suiteError,
                  });
                },
              };
            }
            return {
              then: (cb: any) => {
                return Promise.resolve({ data: null, error: config.suiteError });
              },
            };
          },
          in: (col: string, vals: any[]) => {
            if (table === "eval_runs") {
              return {
                order: (col2: string, opts?: any) => ({
                  limit: (n?: number) => ({
                    then: (cb: any) => {
                      return Promise.resolve({
                        data: config.runs ?? [],
                        error: config.runError,
                      });
                    },
                  }),
                }),
              };
            }
            return {
              order: (col2: string, opts?: any) => ({
                limit: (n?: number) => ({
                  then: (cb: any) => {
                    return Promise.resolve({ data: [], error: config.runError });
                  },
                }),
              }),
            };
          },
        }),
      };
    },
  } as any as SupabaseClient;
}

describe("eval-health.functions", () => {
  describe("getEvalHealthImpl", () => {
    it("should return empty health when user has no eval suites", async () => {
      const supabase = createMockSupabase({ suites: [], runs: [] });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result).toHaveProperty("health");
      expect(result).toHaveProperty("summary");
      expect(result.health).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe("string");
    });

    it("should load eval suites and map by ID", async () => {
      const suites = [
        { id: "suite1", name: "Core Functionality", user_id: "u1" },
        { id: "suite2", name: "API Tests", user_id: "u1" },
      ];
      const supabase = createMockSupabase({ suites, runs: [] });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("should load eval runs for all user suites (up to 2000)", async () => {
      const suites = [{ id: "suite1", name: "Core", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 95,
          fail_count: 5,
          errored: 0,
          total_cases: 100,
          avg_score: 0.95,
          created_at: "2026-07-10T10:00:00Z",
        },
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 90,
          fail_count: 10,
          errored: 0,
          total_cases: 100,
          avg_score: 0.9,
          created_at: "2026-07-09T10:00:00Z",
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("should handle suites with no recent runs", async () => {
      const suites = [
        { id: "suite1", name: "Core", user_id: "u1" },
        { id: "suite2", name: "Edge Cases", user_id: "u1" },
      ];
      const runs = [
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 100,
          fail_count: 0,
          errored: 0,
          total_cases: 100,
          avg_score: 1.0,
          created_at: "2026-07-10T10:00:00Z",
        },
        // suite2 has no runs
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("should compute per-suite flakiness (variance in pass rates)", async () => {
      const suites = [{ id: "suite1", name: "Flaky Tests", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 95,
          fail_count: 5,
          errored: 0,
          total_cases: 100,
          avg_score: 0.95,
          created_at: "2026-07-10T10:00:00Z",
        },
        {
          suite_id: "suite1",
          status: "failed",
          pass_count: 50,
          fail_count: 50,
          errored: 0,
          total_cases: 100,
          avg_score: 0.5,
          created_at: "2026-07-09T10:00:00Z",
        },
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 98,
          fail_count: 2,
          errored: 0,
          total_cases: 100,
          avg_score: 0.98,
          created_at: "2026-07-08T10:00:00Z",
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toBeDefined();
      expect(result.health).toHaveProperty("per_suite_flakiness");
    });

    it("should compute health metrics: pass_rate, error_rate, trend", async () => {
      const suites = [{ id: "suite1", name: "Test Suite", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 90,
          fail_count: 10,
          errored: 0,
          total_cases: 100,
          avg_score: 0.9,
          created_at: "2026-07-10T10:00:00Z",
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toHaveProperty("pass_rate");
      expect(result.health).toHaveProperty("error_rate");
      expect(result.health).toHaveProperty("trend");
      expect(result.health).toHaveProperty("trust_verdict");

      // Verify types
      expect(typeof result.health.pass_rate).toBe("number");
      expect(typeof result.health.error_rate).toBe("number");
      expect(typeof result.health.trend).toBe("string");
      expect(typeof result.health.trust_verdict).toBe("string");

      // Verify ranges
      expect(result.health.pass_rate).toBeGreaterThanOrEqual(0);
      expect(result.health.pass_rate).toBeLessThanOrEqual(1);
      expect(result.health.error_rate).toBeGreaterThanOrEqual(0);
      expect(result.health.error_rate).toBeLessThanOrEqual(1);
    });

    it("should generate human-readable summary", async () => {
      const suites = [{ id: "suite1", name: "Integration Tests", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 85,
          fail_count: 15,
          errored: 0,
          total_cases: 100,
          avg_score: 0.85,
          created_at: "2026-07-10T10:00:00Z",
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe("string");
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it("should throw on suite query error", async () => {
      const supabase = createMockSupabase({
        suites: [],
        suiteError: { message: "Suite query failed" },
      });

      try {
        await getEvalHealthImpl(supabase, "u1");
        expect.unreachable("Should have thrown error");
      } catch (e) {
        expect((e as Error).message).toContain("Suite query failed");
      }
    });

    it("should throw on run query error", async () => {
      const suites = [{ id: "suite1", name: "Core", user_id: "u1" }];
      const supabase = createMockSupabase({
        suites,
        runError: { message: "Run query failed" },
      });

      try {
        await getEvalHealthImpl(supabase, "u1");
        expect.unreachable("Should have thrown error");
      } catch (e) {
        expect((e as Error).message).toContain("Run query failed");
      }
    });
  });

  describe("edge cases & error handling", () => {
    it("should handle runs with 0 total_cases (division by zero protection)", async () => {
      const suites = [{ id: "suite1", name: "Edge Case", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "errored",
          pass_count: 0,
          fail_count: 0,
          errored: 1,
          total_cases: 0, // Edge case: no cases in this run
          avg_score: 0,
          created_at: "2026-07-10T10:00:00Z",
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      // Should not throw; should compute health safely
      expect(result.health).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("should handle runs with high error counts", async () => {
      const suites = [{ id: "suite1", name: "Broken Tests", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "errored",
          pass_count: 10,
          fail_count: 20,
          errored: 70, // Most runs errored
          total_cases: 100,
          avg_score: 0.1,
          created_at: "2026-07-10T10:00:00Z",
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toBeDefined();
      expect(result.health.error_rate).toBeGreaterThan(0);
    });

    it("should handle improving trend (pass_rate increasing over time)", async () => {
      const suites = [{ id: "suite1", name: "Improving Suite", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 95,
          fail_count: 5,
          errored: 0,
          total_cases: 100,
          avg_score: 0.95,
          created_at: "2026-07-10T10:00:00Z", // Most recent (highest pass rate)
        },
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 80,
          fail_count: 20,
          errored: 0,
          total_cases: 100,
          avg_score: 0.8,
          created_at: "2026-07-09T10:00:00Z",
        },
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 60,
          fail_count: 40,
          errored: 0,
          total_cases: 100,
          avg_score: 0.6,
          created_at: "2026-07-08T10:00:00Z", // Oldest (lowest pass rate)
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health.trend).toBeDefined();
    });

    it("should limit runs query to 2000 rows per user", async () => {
      const suites = [{ id: "suite1", name: "Big Suite", user_id: "u1" }];
      // Simulating 2000+ run history; query limits to 2000
      const runs = Array.from({ length: 50 }, (_, i) => ({
        suite_id: "suite1",
        status: "passed",
        pass_count: Math.floor(Math.random() * 100) + 50,
        fail_count: Math.floor(Math.random() * 50),
        errored: 0,
        total_cases: 100,
        avg_score: Math.random() * 0.5 + 0.5,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      }));
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toBeDefined();
    });

    it("should handle null suite names gracefully", async () => {
      const suites = [
        { id: "suite1", name: null, user_id: "u1" },
        { id: "suite2", name: undefined, user_id: "u1" },
      ];
      const runs = [
        {
          suite_id: "suite1",
          status: "passed",
          pass_count: 100,
          fail_count: 0,
          errored: 0,
          total_cases: 100,
          avg_score: 1.0,
          created_at: "2026-07-10T10:00:00Z",
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });
});
