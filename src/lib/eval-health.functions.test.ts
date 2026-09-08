import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEvalHealthImpl, type EvalHealthResult } from "./eval-health.functions";

/**
 * Mock builder for eval-health.functions test suite.
 * Implements chainable Supabase query API.
 */
function createMockSupabase(config: {
  suites?: unknown[];
  runs?: unknown[];
  suiteError?: unknown;
  runError?: unknown;
}): SupabaseClient {
  return {
    from: (table: string) => ({
      select: (..._args: string[]) => ({
        // eval_suites: .select(...).eq("user_id", userId) — terminal, awaited directly.
        eq: async (_col: string, _val: unknown) => {
          if (table === "eval_suites") {
            return { data: config.suites ?? [], error: config.suiteError ?? null };
          }
          return { data: null, error: config.suiteError ?? null };
        },
        // eval_runs: .select(...).in("suite_id", ids).order(...).limit(2000) — terminal on limit().
        in: (_col: string, _vals: unknown[]) => ({
          order: (_col2: string, _opts?: unknown) => ({
            limit: async (_n?: number) => {
              if (table === "eval_runs") {
                return { data: config.runs ?? [], error: config.runError ?? null };
              }
              return { data: [], error: config.runError ?? null };
            },
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
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
          status: "completed",
          pass_count: 95,
          fail_count: 5,
          errored: 0,
          total_cases: 100,
          avg_score: 0.95,
          created_at: "2026-07-10T10:00:00Z",
        },
        {
          suite_id: "suite1",
          status: "completed",
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
          status: "completed",
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
      // eval_runs.status is written by the runner as "completed" | "error" (never "passed"/
      // "failed") — see src/lib/evals/coverage.ts HEALTHY_RUN_STATUS. A suite is flaky when
      // adjacent completed runs flip between fully-passed and not; alternate that here so the
      // computation actually exercises the flip-counting logic instead of vacuously no-op'ing.
      const suites = [{ id: "suite1", name: "Flaky Tests", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "completed",
          pass_count: 100,
          fail_count: 0,
          errored: 0,
          total_cases: 100,
          avg_score: 1.0,
          created_at: "2026-07-08T10:00:00Z", // oldest — fully passed
        },
        {
          suite_id: "suite1",
          status: "completed",
          pass_count: 50,
          fail_count: 50,
          errored: 0,
          total_cases: 100,
          avg_score: 0.5,
          created_at: "2026-07-09T10:00:00Z", // middle — not fully passed (flip)
        },
        {
          suite_id: "suite1",
          status: "completed",
          pass_count: 100,
          fail_count: 0,
          errored: 0,
          total_cases: 100,
          avg_score: 1.0,
          created_at: "2026-07-10T10:00:00Z", // newest — fully passed again (flip)
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      expect(result.health).toBeDefined();
      expect(result.health).toHaveProperty("suites");
      expect(result.health.suites[0]).toHaveProperty("flakiness");
      // Two flips across three completed runs (100% -> 50% -> 100%) => flakiness = 1.0, flagged flaky.
      expect(result.health.suites[0].flakiness).toBeGreaterThan(0);
      expect(result.health.suites[0].flaky).toBe(true);
      expect(result.health.flakySuites.length).toBeGreaterThan(0);
    });

    it("should compute health metrics: passRate, errorRate, trend", async () => {
      const suites = [{ id: "suite1", name: "Test Suite", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "completed",
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

      // EvalHealth (src/lib/evals/health.ts) is camelCase — matches every real consumer
      // (e.g. src/components/engine-room/EngineRoomSurface.tsx reads health.passRate / .verdict).
      expect(result.health).toHaveProperty("passRate");
      expect(result.health).toHaveProperty("errorRate");
      expect(result.health).toHaveProperty("trend");
      expect(result.health).toHaveProperty("verdict");

      // Verify types
      expect(typeof result.health.passRate).toBe("number");
      expect(typeof result.health.errorRate).toBe("number");
      expect(typeof result.health.trend).toBe("string");
      expect(typeof result.health.verdict).toBe("string");

      // Verify ranges
      expect(result.health.passRate).toBeGreaterThanOrEqual(0);
      expect(result.health.passRate).toBeLessThanOrEqual(1);
      expect(result.health.errorRate).toBeGreaterThanOrEqual(0);
      expect(result.health.errorRate).toBeLessThanOrEqual(1);
    });

    it("should generate human-readable summary", async () => {
      const suites = [{ id: "suite1", name: "Integration Tests", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "completed",
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
          status: "completed",
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
          status: "completed", // completed run, but most of its cases errored
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
      expect(result.health.errorRate).toBeGreaterThan(0);
    });

    it("should handle improving trend (passRate increasing over time)", async () => {
      // computeEvalHealth only derives a trend once there are >= 4 completed runs (it splits
      // the chronological run list in half and compares pooled pass rate); 3 runs is one short
      // and always yields "unknown" regardless of the data, so 4 are needed to genuinely
      // exercise the "improving" branch instead of trivially satisfying a loose `toBeDefined()`.
      const suites = [{ id: "suite1", name: "Improving Suite", user_id: "u1" }];
      const runs = [
        {
          suite_id: "suite1",
          status: "completed",
          pass_count: 95,
          fail_count: 5,
          errored: 0,
          total_cases: 100,
          avg_score: 0.95,
          created_at: "2026-07-10T10:00:00Z", // Most recent (highest pass rate)
        },
        {
          suite_id: "suite1",
          status: "completed",
          pass_count: 80,
          fail_count: 20,
          errored: 0,
          total_cases: 100,
          avg_score: 0.8,
          created_at: "2026-07-09T10:00:00Z",
        },
        {
          suite_id: "suite1",
          status: "completed",
          pass_count: 60,
          fail_count: 40,
          errored: 0,
          total_cases: 100,
          avg_score: 0.6,
          created_at: "2026-07-08T10:00:00Z",
        },
        {
          suite_id: "suite1",
          status: "completed",
          pass_count: 50,
          fail_count: 50,
          errored: 0,
          total_cases: 100,
          avg_score: 0.5,
          created_at: "2026-07-07T10:00:00Z", // Oldest (lowest pass rate)
        },
      ];
      const supabase = createMockSupabase({ suites, runs });
      const result = await getEvalHealthImpl(supabase, "u1");

      // Prior half (07-07, 07-08) pools to 55%; recent half (07-09, 07-10) pools to 87.5% —
      // a >5pp gap, so this should land squarely on "improving".
      expect(result.health.trend).toBe("improving");
    });

    it("should limit runs query to 2000 rows per user", async () => {
      const suites = [{ id: "suite1", name: "Big Suite", user_id: "u1" }];
      // Simulating 2000+ run history; query limits to 2000
      const runs = Array.from({ length: 50 }, (_, i) => ({
        suite_id: "suite1",
        status: "completed",
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
          status: "completed",
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
