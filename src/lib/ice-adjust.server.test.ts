import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { autoAdjustIce } from "./ice-adjust.server";

/**
 * Mock builder for the primary Supabase client passed as `autoAdjustIce`'s
 * first argument — only ever used for the `opportunities` table (select +
 * eq + single, update + eq). Every chained method is a real async function
 * (or an object whose terminal method is), so `await` always resolves to a
 * concrete `{ data, error }` / `{ error }` value rather than a bare function
 * or a non-thenable object.
 */
function mockSupabase(config: { opp?: unknown; oppErr?: unknown }) {
  return {
    from: (table: string) => {
      if (table !== "opportunities") {
        throw new Error(`mockSupabase: unexpected table "${table}"`);
      }
      return {
        select: (_cols: string) => ({
          eq: (_col: string, _val: unknown) => ({
            single: async () => ({ data: config.opp, error: config.oppErr ?? null }),
          }),
        }),
        update: (_data: unknown) => ({
          eq: async (_col: string, _val: unknown) => ({ error: null }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

/**
 * Mock builder for the service-role admin client (`autoAdjustIce`'s third
 * argument). `product_analytics` and `ice_adjustments` only grant
 * INSERT/SELECT to service_role (20260626230000_product_analytics.sql), so
 * production always reads/writes them through supabaseAdmin; tests inject
 * this mock via the same parameter. Tracks inserted rows so provenance
 * writes are assertable, not just assumed.
 */
function mockAdmin(config: { rows?: unknown; rowsErr?: unknown }) {
  const inserted: unknown[] = [];
  const client = {
    __inserted: inserted,
    from: (table: string) => {
      if (table === "product_analytics") {
        return {
          select: (_cols: string) => ({
            eq: (_col: string, _val: unknown) => ({
              eq: (_col2: string, _val2: unknown) => ({
                gte: (_col3: string, _val3: unknown) => ({
                  order: async (_col4: string, _opts: unknown) => ({
                    data: config.rows,
                    error: config.rowsErr ?? null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "ice_adjustments") {
        return {
          insert: async (row: unknown) => {
            inserted.push(row);
            return { data: null, error: null };
          },
        };
      }
      throw new Error(`mockAdmin: unexpected table "${table}"`);
    },
  };
  return client as unknown as SupabaseClient & { __inserted: unknown[] };
}

describe("autoAdjustIce", () => {
  describe("ICE scoring formula", () => {
    it("should compute impact = clamp(floor(log10(users+1)*3.5), 1, 10)", async () => {
      // 9 total users, 2 days → floor(log10(10)*3.5) = floor(3.5) = 3
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 1,
          confidence: 5,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: [
          { cohort_date: "2026-07-01", distinct_users: 0, event_count: 10 },
          { cohort_date: "2026-07-02", distinct_users: 9, event_count: 15 },
        ],
      });

      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.newImpact).toBe(3);
      } else {
        throw new Error("expected an adjusted result (deltaImpact=2 >= 1)");
      }
    });

    it("should compute confidence = clamp(round(min(days/14, 1)*10), 1, 10)", async () => {
      // 70 total users, 7 days → round(min(7/14,1)*10) = 5
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 5,
          confidence: 5,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: Array.from({ length: 7 }, (_, i) => ({
          cohort_date: `2026-07-${String(i + 1).padStart(2, "0")}`,
          distinct_users: 10,
          event_count: 20,
        })),
      });

      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      // deltaImpact = |6-5| = 1 >= 1, so this is not skipped even though
      // confidence itself is unchanged (5 -> 5).
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.newConfidence).toBe(5);
        expect(result.newImpact).toBe(6);
      } else {
        throw new Error("expected an adjusted result (deltaImpact=1 >= 1)");
      }
    });
  });

  describe("delta threshold (≥1 point skip guard)", () => {
    it("should skip update when deltaImpact < 1 and deltaConfidence < 1", async () => {
      // 10 users, 1 day → newImpact=3, newConfidence=1 — both equal to current.
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 3,
          confidence: 1,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: [{ cohort_date: "2026-07-01", distinct_users: 10, event_count: 20 }],
      });

      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "skipped" in result && result.skipped) {
        expect(result.reason).toContain("delta < 1");
      } else {
        throw new Error("expected a skipped result (both deltas are 0)");
      }
      expect(admin.__inserted.length).toBe(0);
    });

    it("should update when at least one delta is ≥ 1", async () => {
      // 1400 total users, 14 days → newImpact=10, newConfidence=10.
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 3,
          confidence: 5,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: Array.from({ length: 14 }, (_, i) => ({
          cohort_date: `2026-06-${String(i + 17).padStart(2, "0")}`,
          distinct_users: 100,
          event_count: 50,
        })),
      });

      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.newImpact).toBe(10);
        expect(result.newConfidence).toBe(10);
        expect(Math.abs(result.newImpact - result.oldImpact)).toBeGreaterThanOrEqual(1);
      } else {
        throw new Error("expected an adjusted result (deltaImpact=7, deltaConfidence=5)");
      }
      expect(admin.__inserted.length).toBe(1);
    });
  });

  describe("error handling", () => {
    it("should return error when opportunity not found", async () => {
      // No oppErr and no opp row → falls through to the "opportunity not
      // found" fallback message (oppErr?.message ?? "opportunity not found").
      const supabase = mockSupabase({});
      const admin = mockAdmin({});
      const result = await autoAdjustIce(supabase, "nonexistent", admin);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("opportunity not found");
      }
    });

    it("should skip when posthog_event is null", async () => {
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 5,
          confidence: 5,
          ease: 5,
          posthog_event: null,
        },
      });
      const admin = mockAdmin({});
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "skipped" in result && result.skipped) {
        expect(result.reason).toContain("no posthog_event");
      } else {
        throw new Error("expected a skipped result (no posthog_event linked)");
      }
    });

    it("should skip when product_analytics has no rows", async () => {
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 5,
          confidence: 5,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({ rows: [] });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "skipped" in result && result.skipped) {
        expect(result.reason).toContain("no analytics data");
      } else {
        throw new Error("expected a skipped result (empty product_analytics rows)");
      }
    });

    it("should return error on product_analytics query failure", async () => {
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 5,
          confidence: 5,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({ rowsErr: { message: "Query timeout" } });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("timeout");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle zero distinct_users across all rows", async () => {
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 5,
          confidence: 5,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: [
          { cohort_date: "2026-07-01", distinct_users: 0, event_count: 0 },
          { cohort_date: "2026-07-02", distinct_users: 0, event_count: 0 },
        ], // totalUsers = 0 → log10(1)*3.5 = 0 → clamped to 1
      });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.newImpact).toBe(1);
        expect(result.sampleUsers).toBe(0);
      } else {
        throw new Error("expected an adjusted result (deltaImpact=4 >= 1)");
      }
    });

    it("should handle undefined/null distinct_users or event_count per row", async () => {
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 5,
          confidence: 5,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: [
          { cohort_date: "2026-07-01", distinct_users: null, event_count: null },
          { cohort_date: "2026-07-02", distinct_users: 5, event_count: 10 },
        ], // null coerced to 0, then 5 → totalUsers = 5, totalEvents = 10
      });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.newImpact).toBe(2);
        expect(result.sampleUsers).toBe(5);
        expect(result.sampleEvents).toBe(10);
      } else {
        throw new Error("expected an adjusted result (deltaImpact=3 >= 1)");
      }
    });

    it("should use row count (not date uniqueness) as dataDays", async () => {
      // If the same date appears twice, it counts as 2 days (pure row count).
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 5,
          confidence: 5,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: Array.from({ length: 21 }, () => ({
          cohort_date: "2026-07-01", // all same date
          distinct_users: 1,
          event_count: 1,
        })), // 21 rows → dataDays = 21 → min(21/14, 1)*10 = 10
      });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.newConfidence).toBe(10);
        expect(result.sampleUsers).toBe(21);
      } else {
        throw new Error("expected an adjusted result (deltaConfidence=5 >= 1)");
      }
    });

    it("should clamp newImpact to [1, 10] range", async () => {
      // Very large user count should cap at 10.
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 1,
          confidence: 1,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: [{ cohort_date: "2026-07-01", distinct_users: 10000, event_count: 100000 }],
      });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.newImpact).toBe(10);
      } else {
        throw new Error("expected an adjusted result (deltaImpact=9 >= 1)");
      }
    });

    it("should clamp newConfidence to [1, 10] range", async () => {
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 5,
          confidence: 1,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: Array.from({ length: 30 }, (_, i) => ({
          cohort_date: `2026-06-${String(i + 1).padStart(2, "0")}`,
          distinct_users: 10,
          event_count: 20,
        })), // 30 days → min(30/14, 1)*10 = 10, then clamped
      });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.newConfidence).toBe(10);
      } else {
        throw new Error("expected an adjusted result (deltaConfidence=9 >= 1)");
      }
    });
  });

  describe("result shape validation", () => {
    it("should return ok=true, adjusted=true with old/new scores and reason on successful update", async () => {
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 2,
          confidence: 2,
          ease: 5,
          posthog_event: "sign_up",
        },
      });
      const admin = mockAdmin({
        rows: [
          { cohort_date: "2026-07-01", distinct_users: 100, event_count: 50 },
          { cohort_date: "2026-07-02", distinct_users: 150, event_count: 75 },
        ],
      });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.oldImpact).toBe(2);
        expect(result.newImpact).toBe(8);
        expect(result.oldConfidence).toBe(2);
        expect(result.newConfidence).toBe(1);
        expect(result.sampleUsers).toBe(250);
        expect(result.sampleEvents).toBe(125);
        expect(typeof result.reason).toBe("string");
        // Provenance row must actually be written to ice_adjustments.
        expect(admin.__inserted.length).toBe(1);
        expect(admin.__inserted[0]).toMatchObject({
          opportunity_id: "opp1",
          workspace_id: "ws1",
          feature_event: "sign_up",
          old_impact: 2,
          new_impact: 8,
          old_confidence: 2,
          new_confidence: 1,
          sample_users: 250,
          sample_events: 125,
        });
      } else {
        throw new Error("expected an adjusted result (deltaImpact=6 >= 1)");
      }
    });

    it("should include provenance reason with user count, days, and metric change", async () => {
      const supabase = mockSupabase({
        opp: {
          id: "opp1",
          workspace_id: "ws1",
          impact: 3,
          confidence: 3,
          ease: 5,
          posthog_event: "demo_requested",
        },
      });
      const admin = mockAdmin({
        rows: [
          { cohort_date: "2026-07-01", distinct_users: 50, event_count: 100 },
          { cohort_date: "2026-07-02", distinct_users: 75, event_count: 150 },
        ],
      });
      const result = await autoAdjustIce(supabase, "opp1", admin);
      expect(result.ok).toBe(true);
      if (result.ok && "adjusted" in result && result.adjusted) {
        expect(result.reason).toContain("distinct users");
        expect(result.reason).toContain("days");
        expect(result.reason).toContain("demo_requested");
        expect(result.reason).toContain("Impact 3→7");
        expect(admin.__inserted[0].reason).toBe(result.reason);
      } else {
        throw new Error("expected an adjusted result (deltaImpact=4 >= 1)");
      }
    });
  });
});
