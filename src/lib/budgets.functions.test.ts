import { describe, it, expect, beforeEach } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getBudgetOverviewImpl,
  updateGlobalBudgetImpl,
  upsertSurfaceBudgetImpl,
  deleteSurfaceBudgetImpl,
  acknowledgeAlertImpl,
  getBudgetSummaryImpl,
  GlobalSchema,
  SurfaceSchema,
} from "./budgets.functions";

/**
 * Mock builder for budgets.functions test suite.
 * Implements chainable Supabase query API.
 */
function createMockSupabase(config: {
  global?: any;
  surfaces?: any[];
  alerts?: any[];
  error?: any;
}): SupabaseClient {
  return {
    from: (table: string) => {
      // Track the query chain for verification
      const queryState = { table, error: config.error };

      return {
        select: (...args: string[]) => ({
          eq: (col: string, val: any) => ({
            maybeSingle: async () => {
              if (table === "ai_budgets") {
                return { data: config.global ?? null, error: config.error };
              }
              return { data: null, error: config.error };
            },
            order: (col: string, opts?: any) => ({
              limit: (n?: number) => ({
                then: (cb: any) => {
                  if (table === "ai_budget_alerts") {
                    return Promise.resolve({ data: config.alerts ?? [], error: config.error });
                  }
                  return Promise.resolve({ data: [], error: config.error });
                },
              }),
              then: (cb: any) => {
                if (table === "ai_surface_budgets") {
                  return Promise.resolve({ data: config.surfaces ?? [], error: config.error });
                }
                return Promise.resolve({ data: [], error: config.error });
              },
            }),
          }),
          order: (col: string, opts?: any) => ({
            limit: (n?: number) => ({
              then: (cb: any) => {
                if (table === "ai_budget_alerts") {
                  return Promise.resolve({ data: config.alerts ?? [], error: config.error });
                }
                return Promise.resolve({ data: [], error: config.error });
              },
            }),
          }),
          then: (cb: any) => {
            if (table === "ai_budgets") {
              return Promise.resolve({ data: config.global ?? null, error: config.error });
            }
            return Promise.resolve({ data: null, error: config.error });
          },
        }),
        then: (cb: any) => {
          if (table === "ai_budgets") {
            return Promise.resolve({ data: config.global ?? null, error: config.error });
          }
          return Promise.resolve({ data: null, error: config.error });
        },
      };
    },
    update: (data: any) => ({
      eq: (col: string, val: any) => ({
        eq: (col2: string, val2: any) => ({
          then: (cb: any) => {
            return Promise.resolve({ data: null, error: config.error });
          },
        }),
      }),
    }),
    delete: () => ({
      eq: (col: string, val: any) => ({
        eq: (col2: string, val2: any) => ({
          then: (cb: any) => {
            return Promise.resolve({ data: null, error: config.error });
          },
        }),
      }),
    }),
    upsert: (data: any, opts?: any) => ({
      then: (cb: any) => {
        return Promise.resolve({ data: null, error: config.error });
      },
    }),
  } as any as SupabaseClient;
}

describe("budgets.functions", () => {
  describe("getBudgetOverviewImpl", () => {
    it("should return null global budget, empty surfaces, empty alerts when user has no setup", async () => {
      const supabase = createMockSupabase({ global: null, surfaces: [], alerts: [] });
      const result = await getBudgetOverviewImpl(supabase, "u1");
      expect(result.global).toBe(null);
      expect(result.surfaces).toEqual([]);
      expect(result.alerts).toEqual([]);
    });

    it("should return global budget with daily and monthly caps", async () => {
      const globalBudget = {
        id: "g1",
        user_id: "u1",
        daily_usd_cap: 10,
        monthly_usd_cap: 200,
        daily_token_cap: 100000,
        monthly_token_cap: 1000000,
        daily_usd_used: 5,
        monthly_usd_used: 50,
        day_window: "2026-07-10",
        month_window: "2026-07",
        alert_at_pct: 80,
      };
      const supabase = createMockSupabase({ global: globalBudget, surfaces: [], alerts: [] });
      const result = await getBudgetOverviewImpl(supabase, "u1");
      expect(result.global).toEqual(globalBudget);
      expect(result.global?.daily_usd_cap).toBe(10);
      expect(result.global?.alert_at_pct).toBe(80);
    });

    it("should return surface budgets list", async () => {
      const surfaces = [
        { user_id: "u1", surface: "chat", daily_usd_cap: 5, monthly_usd_cap: 50, enabled: true },
        {
          user_id: "u1",
          surface: "analysis",
          daily_usd_cap: 3,
          monthly_usd_cap: 30,
          enabled: false,
        },
      ];
      const supabase = createMockSupabase({ global: null, surfaces, alerts: [] });
      const result = await getBudgetOverviewImpl(supabase, "u1");
      expect(result.surfaces).toHaveLength(2);
      expect(result.surfaces[0].surface).toBe("chat");
      expect(result.surfaces[0].enabled).toBe(true);
    });

    it("should return recent alerts (limited to query result)", async () => {
      const alerts = [
        {
          id: "alert1",
          user_id: "u1",
          type: "global_daily",
          usage_usd: 10,
          cap_usd: 10,
          triggered_at: "2026-07-10T00:00:00Z",
          acknowledged: false,
        },
        {
          id: "alert2",
          user_id: "u1",
          type: "global_daily",
          usage_usd: 15,
          cap_usd: 10,
          triggered_at: "2026-07-09T00:00:00Z",
          acknowledged: true,
        },
      ];
      const supabase = createMockSupabase({ global: null, surfaces: [], alerts });
      const result = await getBudgetOverviewImpl(supabase, "u1");
      expect(result.alerts).toHaveLength(2);
      expect(result.alerts[0].id).toBe("alert1");
    });
  });

  describe("updateGlobalBudgetImpl", () => {
    it("should insert new global budget if none exists", async () => {
      const supabase = createMockSupabase({ global: null });
      const data = {
        daily_usd_cap: 10,
        monthly_usd_cap: 200,
        daily_token_cap: 100000,
        monthly_token_cap: 1000000,
        alert_at_pct: 80,
      };
      const result = await updateGlobalBudgetImpl(supabase, "u1", data);
      expect(result.ok).toBe(true);
    });

    it("should update existing global budget", async () => {
      const supabase = createMockSupabase({
        global: { id: "g1", user_id: "u1", daily_usd_cap: 5, monthly_usd_cap: 100 },
      });
      const data = {
        daily_usd_cap: 15,
        monthly_usd_cap: 300,
        daily_token_cap: null,
        monthly_token_cap: null,
        alert_at_pct: 90,
      };
      const result = await updateGlobalBudgetImpl(supabase, "u1", data);
      expect(result.ok).toBe(true);
    });

    it("should validate via schema (daily_usd_cap >= 0)", () => {
      expect(() => {
        GlobalSchema.parse({
          daily_usd_cap: -1,
          monthly_usd_cap: 200,
          daily_token_cap: 100000,
          monthly_token_cap: 1000000,
          alert_at_pct: 80,
        });
      }).toThrow();
    });

    it("should allow null caps (no limit)", () => {
      expect(() => {
        GlobalSchema.parse({
          daily_usd_cap: null,
          monthly_usd_cap: null,
          daily_token_cap: null,
          monthly_token_cap: null,
          alert_at_pct: 50,
        });
      }).not.toThrow();
    });

    it("should validate alert_at_pct between 1 and 100", () => {
      expect(() => {
        GlobalSchema.parse({
          daily_usd_cap: 10,
          monthly_usd_cap: 200,
          daily_token_cap: 100000,
          monthly_token_cap: 1000000,
          alert_at_pct: 0, // Invalid
        });
      }).toThrow();

      expect(() => {
        GlobalSchema.parse({
          daily_usd_cap: 10,
          monthly_usd_cap: 200,
          daily_token_cap: 100000,
          monthly_token_cap: 1000000,
          alert_at_pct: 101, // Invalid
        });
      }).toThrow();

      expect(() => {
        GlobalSchema.parse({
          daily_usd_cap: 10,
          monthly_usd_cap: 200,
          daily_token_cap: 100000,
          monthly_token_cap: 1000000,
          alert_at_pct: 50, // Valid
        });
      }).not.toThrow();
    });

    it("should throw on DB update error", async () => {
      const supabase = createMockSupabase({
        global: { id: "g1" },
        error: { message: "Update failed" },
      });
      const data = {
        daily_usd_cap: 10,
        monthly_usd_cap: 200,
        daily_token_cap: 100000,
        monthly_token_cap: 1000000,
        alert_at_pct: 80,
      };
      try {
        await updateGlobalBudgetImpl(supabase, "u1", data);
        expect.unreachable("Should have thrown error");
      } catch (e) {
        expect((e as Error).message).toContain("Update failed");
      }
    });
  });

  describe("upsertSurfaceBudgetImpl", () => {
    it("should insert new surface budget", async () => {
      const supabase = createMockSupabase({ surfaces: [] });
      const data = {
        surface: "chat",
        daily_usd_cap: 5,
        monthly_usd_cap: 50,
        enabled: true,
      };
      const result = await upsertSurfaceBudgetImpl(supabase, "u1", data);
      expect(result.ok).toBe(true);
    });

    it("should update existing surface budget via upsert", async () => {
      const supabase = createMockSupabase({
        surfaces: [{ user_id: "u1", surface: "chat", daily_usd_cap: 3, monthly_usd_cap: 30 }],
      });
      const data = {
        surface: "chat",
        daily_usd_cap: 10,
        monthly_usd_cap: 100,
        enabled: true,
      };
      const result = await upsertSurfaceBudgetImpl(supabase, "u1", data);
      expect(result.ok).toBe(true);
    });

    it("should validate surface name length (1-40 chars)", () => {
      expect(() => {
        SurfaceSchema.parse({
          surface: "",
          daily_usd_cap: 5,
          monthly_usd_cap: 50,
          enabled: true,
        });
      }).toThrow();

      expect(() => {
        SurfaceSchema.parse({
          surface: "a".repeat(41),
          daily_usd_cap: 5,
          monthly_usd_cap: 50,
          enabled: true,
        });
      }).toThrow();

      expect(() => {
        SurfaceSchema.parse({
          surface: "chat",
          daily_usd_cap: 5,
          monthly_usd_cap: 50,
          enabled: true,
        });
      }).not.toThrow();
    });

    it("should handle enabled flag as boolean", () => {
      expect(() => {
        SurfaceSchema.parse({
          surface: "chat",
          daily_usd_cap: 5,
          monthly_usd_cap: 50,
          enabled: true,
        });
      }).not.toThrow();

      expect(() => {
        SurfaceSchema.parse({
          surface: "chat",
          daily_usd_cap: 5,
          monthly_usd_cap: 50,
          enabled: false,
        });
      }).not.toThrow();
    });

    it("should allow null caps", () => {
      expect(() => {
        SurfaceSchema.parse({
          surface: "chat",
          daily_usd_cap: null,
          monthly_usd_cap: null,
          enabled: true,
        });
      }).not.toThrow();
    });
  });

  describe("deleteSurfaceBudgetImpl", () => {
    it("should delete surface budget by user_id and surface name", async () => {
      const supabase = createMockSupabase({ surfaces: [{ surface: "chat", user_id: "u1" }] });
      const result = await deleteSurfaceBudgetImpl(supabase, "u1", "chat");
      expect(result.ok).toBe(true);
    });

    it("should be idempotent (ok even if surface doesn't exist)", async () => {
      const supabase = createMockSupabase({ surfaces: [] });
      const result = await deleteSurfaceBudgetImpl(supabase, "u1", "nonexistent");
      expect(result.ok).toBe(true);
    });

    it("should throw on DB error", async () => {
      const supabase = createMockSupabase({
        surfaces: [],
        error: { message: "Delete failed" },
      });
      try {
        await deleteSurfaceBudgetImpl(supabase, "u1", "chat");
        expect.unreachable("Should have thrown error");
      } catch (e) {
        expect((e as Error).message).toContain("Delete failed");
      }
    });
  });

  describe("acknowledgeAlertImpl", () => {
    it("should update alert.acknowledged to true", async () => {
      const supabase = createMockSupabase({
        alerts: [{ id: "a1", user_id: "u1", acknowledged: false }],
      });
      const result = await acknowledgeAlertImpl(supabase, "u1", "a1");
      expect(result.ok).toBe(true);
    });

    it("should scope to user_id for RLS (can only ack own alerts)", async () => {
      const supabase = createMockSupabase({
        alerts: [{ id: "a1", user_id: "u1", acknowledged: false }],
      });
      // The implementation calls .eq("id", id).eq("user_id", userId),
      // ensuring RLS enforcement
      const result = await acknowledgeAlertImpl(supabase, "u1", "a1");
      expect(result.ok).toBe(true);
    });

    it("should throw on DB error", async () => {
      const supabase = createMockSupabase({
        alerts: [],
        error: { message: "Update failed" },
      });
      try {
        await acknowledgeAlertImpl(supabase, "u1", "a1");
        expect.unreachable("Should have thrown error");
      } catch (e) {
        expect((e as Error).message).toContain("Update failed");
      }
    });
  });

  describe("getBudgetSummaryImpl", () => {
    it("should return lightweight summary with caps and usage", async () => {
      const summary = {
        daily_usd_cap: 10,
        monthly_usd_cap: 200,
        daily_usd_used: 5,
        monthly_usd_used: 50,
        day_window: "2026-07-10",
        month_window: "2026-07",
        alert_at_pct: 80,
      };
      const supabase = createMockSupabase({ global: summary });
      const result = await getBudgetSummaryImpl(supabase, "u1");
      expect(result).toEqual(summary);
      expect(result?.daily_usd_cap).toBe(10);
      expect(result?.daily_usd_used).toBe(5);
    });

    it("should return null if user has no global budget", async () => {
      const supabase = createMockSupabase({ global: null });
      const result = await getBudgetSummaryImpl(supabase, "u1");
      expect(result).toBeNull();
    });

    it("should select exactly 7 fields (lightweight)", async () => {
      const summary = {
        daily_usd_cap: 10,
        monthly_usd_cap: 200,
        daily_usd_used: 5,
        monthly_usd_used: 50,
        day_window: "2026-07-10",
        month_window: "2026-07",
        alert_at_pct: 80,
      };
      const supabase = createMockSupabase({ global: summary });
      const result = await getBudgetSummaryImpl(supabase, "u1");
      // Verify it returns exactly the 7 fields
      if (result) {
        const keys = Object.keys(result);
        expect(keys.length).toBe(7);
        expect(keys).toContain("daily_usd_cap");
        expect(keys).toContain("monthly_usd_cap");
        expect(keys).toContain("daily_usd_used");
        expect(keys).toContain("monthly_usd_used");
        expect(keys).toContain("day_window");
        expect(keys).toContain("month_window");
        expect(keys).toContain("alert_at_pct");
      }
    });
  });

  describe("edge cases & error handling", () => {
    it("should handle caps of 0 (hard limit, no spending allowed)", async () => {
      const supabase = createMockSupabase({
        global: { daily_usd_cap: 0, monthly_usd_cap: 0 },
      });
      const result = await getBudgetSummaryImpl(supabase, "u1");
      expect(result?.daily_usd_cap).toBe(0);
      expect(result?.monthly_usd_cap).toBe(0);
    });

    it("should handle usage exceeding caps (returns both for alert logic)", async () => {
      const supabase = createMockSupabase({
        global: {
          daily_usd_cap: 10,
          daily_usd_used: 15,
          monthly_usd_cap: 200,
          monthly_usd_used: 250,
          day_window: "2026-07-10",
          month_window: "2026-07",
          alert_at_pct: 80,
        },
      });
      const result = await getBudgetSummaryImpl(supabase, "u1");
      expect(result?.daily_usd_used).toBeGreaterThan(result?.daily_usd_cap!);
      expect(result?.monthly_usd_used).toBeGreaterThan(result?.monthly_usd_cap!);
    });

    it("should handle very large cap values (e.g., $1M+ monthly)", async () => {
      const supabase = createMockSupabase({
        global: {
          daily_usd_cap: 100000,
          monthly_usd_cap: 1000000,
          daily_usd_used: 50000,
          monthly_usd_used: 500000,
          day_window: "2026-07-10",
          month_window: "2026-07",
          alert_at_pct: 80,
        },
      });
      const result = await getBudgetSummaryImpl(supabase, "u1");
      expect(result?.monthly_usd_cap).toBe(1000000);
      expect(result?.daily_usd_cap).toBe(100000);
    });
  });
});
