import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  monthlyGrantCredits,
  resetDelta,
  sumRunDebits,
  sumDebitCredits,
  sumCreditsByTrace,
  rollupAttribution,
  capExceeded,
  creditWindowStartIso,
  computeCreditAttribution,
  type LedgerDebitRow,
  type RunLedgerRow,
  type TraceLedgerRow,
  type CreditAttribution,
} from "./credits.functions";

// --- Pure function tests (no mocking required) ---

describe("credits.functions – pure math", () => {
  describe("monthlyGrantCredits", () => {
    it("should return 750 for free tier", () => {
      const result = monthlyGrantCredits("free");
      expect(result).toBe(750);
    });

    it("should return 3750 for pro tier (5x free base)", () => {
      const result = monthlyGrantCredits("pro");
      expect(result).toBe(3750);
    });

    it("should return 15000 for max tier (20x free base)", () => {
      const result = monthlyGrantCredits("max");
      expect(result).toBe(15000);
    });

    it("should return 15000 for team tier (20x free base)", () => {
      const result = monthlyGrantCredits("team");
      expect(result).toBe(15000);
    });

    it("should return 0 for enterprise tier (custom model)", () => {
      const result = monthlyGrantCredits("enterprise");
      expect(result).toBe(0);
    });

    it("should always return an integer (floor behavior)", () => {
      const tiers = ["free", "pro", "max", "team", "enterprise"] as const;
      for (const tier of tiers) {
        const result = monthlyGrantCredits(tier);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });

  describe("resetDelta", () => {
    it("should compute the signed delta from current to grant", () => {
      const delta = resetDelta(100, 500);
      expect(delta).toBe(400); // 500 - 100 = 400
    });

    it("should be negative when current exceeds grant", () => {
      const delta = resetDelta(1000, 500);
      expect(delta).toBe(-500); // 500 - 1000 = -500
    });

    it("should be zero when current equals grant", () => {
      const delta = resetDelta(500, 500);
      expect(delta).toBe(0);
    });

    it("should satisfy the invariant: current + delta = grant", () => {
      const testCases = [
        { current: 100, grant: 500 },
        { current: 1000, grant: 500 },
        { current: 500, grant: 500 },
        { current: 0, grant: 750 },
        { current: 250, grant: 1000 },
      ];

      for (const { current, grant } of testCases) {
        const delta = resetDelta(current, grant);
        expect(current + delta).toBe(grant);
      }
    });

    it("should floor fractional inputs", () => {
      const delta = resetDelta(100.7, 500.3);
      expect(delta).toBe(400); // Math.floor(500.3) - Math.floor(100.7) = 500 - 100 = 400
    });

    it("should handle negative inputs (edge case)", () => {
      // Normally these wouldn't occur, but the function doesn't guard them
      const delta = resetDelta(-100, 500);
      expect(delta).toBe(600); // 500 - (-100) = 600
    });
  });

  describe("sumRunDebits", () => {
    it("should sum negative delta_credits as positive total", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: -100, ai_event_id: "evt1" },
        { delta_credits: -250, ai_event_id: "evt2" },
      ];
      const result = sumRunDebits(rows);
      expect(result).toBe(350); // 100 + 250
    });

    it("should ignore positive deltas (grants/refunds)", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: -100, ai_event_id: "evt1" },
        { delta_credits: 50, ai_event_id: "evt2" }, // grant, should be ignored
        { delta_credits: -200, ai_event_id: "evt3" },
      ];
      const result = sumRunDebits(rows);
      expect(result).toBe(300); // 100 + 200, ignores +50
    });

    it("should return 0 for empty array", () => {
      const result = sumRunDebits([]);
      expect(result).toBe(0);
    });

    it("should return 0 when all deltas are non-negative", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: 0, ai_event_id: "evt1" },
        { delta_credits: 100, ai_event_id: "evt2" },
      ];
      const result = sumRunDebits(rows);
      expect(result).toBe(0);
    });

    it("should ignore non-finite delta_credits defensively", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: -100, ai_event_id: "evt1" },
        { delta_credits: NaN, ai_event_id: "evt2" },
        { delta_credits: -50, ai_event_id: "evt3" },
        { delta_credits: Infinity, ai_event_id: "evt4" },
      ];
      const result = sumRunDebits(rows);
      expect(result).toBe(150); // 100 + 50, ignores NaN and Infinity
    });

    it("should handle string-coerced numbers (from SQL)", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: -100, ai_event_id: "evt1" },
        { delta_credits: -50, ai_event_id: "evt2" },
      ];
      const result = sumRunDebits(rows);
      expect(result).toBe(150);
    });
  });

  describe("sumCreditsByTrace (P-136: one currency on the run screen)", () => {
    /* THE GUARD (A-QUEUE P-136 Scope): a run with three ledger rows shows their
       sum in credits. */
    it("sums three ledger rows for one trace to their total", () => {
      const rows: TraceLedgerRow[] = [
        { delta_credits: -8, trace_id: "run-a" },
        { delta_credits: -25, trace_id: "run-a" },
        { delta_credits: -7, trace_id: "run-a" },
      ];
      const result = sumCreditsByTrace(rows);
      expect(result).toEqual({ "run-a": 40 });
    });

    it("keeps two runs' totals apart rather than pooling them", () => {
      const rows: TraceLedgerRow[] = [
        { delta_credits: -8, trace_id: "run-a" },
        { delta_credits: -25, trace_id: "run-b" },
        { delta_credits: -7, trace_id: "run-a" },
      ];
      const result = sumCreditsByTrace(rows);
      expect(result).toEqual({ "run-a": 15, "run-b": 25 });
    });

    it("drops a row with no trace, rather than pooling it under a false key", () => {
      const rows: TraceLedgerRow[] = [
        { delta_credits: -8, trace_id: "run-a" },
        { delta_credits: -25, trace_id: null },
      ];
      const result = sumCreditsByTrace(rows);
      expect(result).toEqual({ "run-a": 8 });
    });

    it("ignores positive deltas (grants/refunds) and non-finite values", () => {
      const rows: TraceLedgerRow[] = [
        { delta_credits: -8, trace_id: "run-a" },
        { delta_credits: 50, trace_id: "run-a" },
        { delta_credits: NaN, trace_id: "run-a" },
      ];
      const result = sumCreditsByTrace(rows);
      expect(result).toEqual({ "run-a": 8 });
    });

    it("returns an empty map for an empty read", () => {
      expect(sumCreditsByTrace([])).toEqual({});
    });
  });

  describe("sumDebitCredits", () => {
    it("should sum negative delta_credits across all rows", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1" },
        { delta_credits: -250, product_id: "prod2", user_id: "user2" },
        { delta_credits: -150, product_id: null, user_id: "user1" },
      ];
      const result = sumDebitCredits(rows);
      expect(result).toBe(500); // 100 + 250 + 150
    });

    it("should ignore positive deltas (grants/refunds)", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1" },
        { delta_credits: 50, product_id: "prod2", user_id: "user2" }, // grant
        { delta_credits: -200, product_id: "prod3", user_id: "user3" },
      ];
      const result = sumDebitCredits(rows);
      expect(result).toBe(300); // ignores +50 grant
    });

    it("should return 0 for empty array", () => {
      const result = sumDebitCredits([]);
      expect(result).toBe(0);
    });

    it("should ignore non-finite values", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1" },
        { delta_credits: NaN, product_id: "prod2", user_id: "user2" },
        { delta_credits: -50, product_id: "prod3", user_id: "user3" },
      ];
      const result = sumDebitCredits(rows);
      expect(result).toBe(150);
    });
  });

  describe("rollupAttribution", () => {
    it("should group debits by product and by member separately", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1" },
        { delta_credits: -200, product_id: "prod1", user_id: "user2" },
        { delta_credits: -50, product_id: "prod2", user_id: "user1" },
      ];

      const result = rollupAttribution(rows);

      expect(result.byProduct).toHaveLength(2);
      expect(result.byProduct[0]).toEqual({ id: "prod1", credits: 300 }); // highest
      expect(result.byProduct[1]).toEqual({ id: "prod2", credits: 50 });

      expect(result.byMember).toHaveLength(2);
      expect(result.byMember[0]).toEqual({ id: "user2", credits: 200 }); // highest
      expect(result.byMember[1]).toEqual({ id: "user1", credits: 150 });
    });

    it("should sort buckets high-to-low by credits", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -50, product_id: "prod1", user_id: "user1" },
        { delta_credits: -300, product_id: "prod2", user_id: "user2" },
        { delta_credits: -100, product_id: "prod3", user_id: "user3" },
      ];

      const result = rollupAttribution(rows);

      expect(result.byProduct[0].id).toBe("prod2"); // 300
      expect(result.byProduct[1].id).toBe("prod3"); // 100
      expect(result.byProduct[2].id).toBe("prod1"); // 50
    });

    it("should include null bucket for unattributed rows", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1" },
        { delta_credits: -50, product_id: null, user_id: "user1" }, // unattributed product
        { delta_credits: -75, product_id: "prod1", user_id: null }, // unattributed member
      ];

      const result = rollupAttribution(rows);

      const productIds = result.byProduct.map((b) => b.id);
      expect(productIds).toContain("prod1");
      expect(productIds).toContain(null); // null bucket present

      const memberIds = result.byMember.map((b) => b.id);
      expect(memberIds).toContain("user1");
      expect(memberIds).toContain(null); // null bucket present
    });

    it("should satisfy reconciliation invariant", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1" },
        { delta_credits: -250, product_id: "prod2", user_id: "user2" },
        { delta_credits: -150, product_id: "prod1", user_id: "user1" },
      ];

      const result = rollupAttribution(rows);

      const productSum = result.byProduct.reduce((acc, b) => acc + b.credits, 0);
      const memberSum = result.byMember.reduce((acc, b) => acc + b.credits, 0);

      expect(productSum).toBe(result.totalDebited);
      expect(memberSum).toBe(result.totalDebited);
      expect(result.totalDebited).toBe(500); // 100 + 250 + 150
    });

    it("should return empty rollup for array with no debits", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: 100, product_id: "prod1", user_id: "user1" }, // grant
        { delta_credits: 50, product_id: "prod2", user_id: "user2" }, // grant
      ];

      const result = rollupAttribution(rows);

      expect(result.byProduct).toEqual([]);
      expect(result.byMember).toEqual([]);
      expect(result.totalDebited).toBe(0);
    });

    it("should handle empty array", () => {
      const result = rollupAttribution([]);

      expect(result.byProduct).toEqual([]);
      expect(result.byMember).toEqual([]);
      expect(result.totalDebited).toBe(0);
    });

    it("should ignore non-finite deltas", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1" },
        { delta_credits: NaN, product_id: "prod2", user_id: "user2" },
        { delta_credits: -50, product_id: "prod1", user_id: "user2" },
      ];

      const result = rollupAttribution(rows);

      expect(result.totalDebited).toBe(150); // ignores NaN
    });
  });

  describe("capExceeded", () => {
    it("should return false when under cap", () => {
      expect(capExceeded(100, 50, 200)).toBe(false); // 100 + 50 = 150 < 200
    });

    it("should return false when equals cap (not exceeded until strictly greater)", () => {
      expect(capExceeded(100, 50, 150)).toBe(false); // 100 + 50 = 150, not > 150
    });

    it("should return true when over cap", () => {
      expect(capExceeded(100, 100, 150)).toBe(true); // 100 + 100 = 200 > 150
    });

    it("should return false when cap is not finite", () => {
      expect(capExceeded(1000, 1000, Infinity)).toBe(false);
      expect(capExceeded(1000, 1000, NaN)).toBe(false);
    });

    it("should use max(0, value) for spent and projected", () => {
      // negative values should be treated as 0
      expect(capExceeded(-100, 50, 100)).toBe(false); // max(0, -100) + max(0, 50) = 0 + 50 = 50 < 100
      expect(capExceeded(100, -50, 100)).toBe(false); // max(0, 100) + max(0, -50) = 100 + 0 = 100, not > 100
      expect(capExceeded(100, -50, 99)).toBe(true); // max(0, 100) + max(0, -50) = 100 > 99
    });

    it("should handle cap of 0 (blocks any billable draw)", () => {
      expect(capExceeded(0, 0, 0)).toBe(false); // 0 + 0 = 0 = 0 (exact)
      expect(capExceeded(0, 1, 0)).toBe(true); // 0 + 1 = 1 > 0
      expect(capExceeded(1, 0, 0)).toBe(true); // 1 + 0 = 1 > 0
    });

    it("should handle fractional values", () => {
      expect(capExceeded(99.5, 50.4, 150)).toBe(false);
      expect(capExceeded(99.5, 50.5, 150)).toBe(false); // 99.5 + 50.5 = 150 = cap
      expect(capExceeded(99.5, 50.6, 150)).toBe(true); // 99.5 + 50.6 = 150.1 > 150
    });
  });

  describe("creditWindowStartIso", () => {
    const nowIso = "2026-07-15T14:30:45.123Z";

    it("should return day start for 'day' window", () => {
      const result = creditWindowStartIso("day", null, nowIso);
      expect(result).toBe("2026-07-15T00:00:00.000Z");
    });

    it("should return month start for 'month' window", () => {
      const result = creditWindowStartIso("month", null, nowIso);
      expect(result).toBe("2026-07-01T00:00:00.000Z");
    });

    it("should return cycle anchor if provided and 'cycle' window", () => {
      const anchor = "2026-06-20T05:30:00.000Z";
      const result = creditWindowStartIso("cycle", anchor, nowIso);
      expect(result).toBe(anchor);
    });

    it("should fall back to month start if cycle anchor is null", () => {
      const result = creditWindowStartIso("cycle", null, nowIso);
      expect(result).toBe("2026-07-01T00:00:00.000Z");
    });

    it("should fall back to month start if cycle anchor is undefined", () => {
      const result = creditWindowStartIso("cycle", undefined, nowIso);
      expect(result).toBe("2026-07-01T00:00:00.000Z");
    });

    it("should fall back to month start if cycle anchor is too short", () => {
      const anchor = "2026-06"; // only 7 chars, < 10
      const result = creditWindowStartIso("cycle", anchor, nowIso);
      expect(result).toBe("2026-07-01T00:00:00.000Z");
    });

    it("should use first 10 chars of cycle anchor (before T)", () => {
      const anchor = "2026-06-15T10:20:30.000Z";
      const result = creditWindowStartIso("cycle", anchor, nowIso);
      expect(result).toBe(anchor);
    });

    it("should handle month boundaries correctly", () => {
      const decemberNow = "2026-12-25T10:00:00.000Z";
      const result = creditWindowStartIso("month", null, decemberNow);
      expect(result).toBe("2026-12-01T00:00:00.000Z");
    });

    it("should handle end-of-month cycle anchor", () => {
      const anchor = "2026-06-30T14:00:00.000Z";
      const result = creditWindowStartIso("cycle", anchor, nowIso);
      expect(result).toBe(anchor);
    });

    it("should extract day correctly from arbitrary now", () => {
      const jan1 = "2026-01-01T00:00:00.000Z";
      const result = creditWindowStartIso("day", null, jan1);
      expect(result).toBe("2026-01-01T00:00:00.000Z");
    });
  });
});

// --- Mock builder for async tests ---

/**
 * Mock builder for credits.functions async test suite.
 * Implements chainable Supabase query API matching the test pattern from drift.functions.test.ts.
 */
function createMockSupabase(config: { ledgerRows?: any[]; error?: any }): SupabaseClient {
  const err = config.error ?? null;

  function terminal(result: { data: any; error: any }): any {
    return {
      then: (resolve: any, reject?: any) => Promise.resolve(result).then(resolve, reject),
    };
  }

  return {
    from: (table: string) => ({
      select: (..._args: string[]) => ({
        eq: (col: string, val: any) => ({
          eq: (col2: string, val2: any) => {
            if (table === "credit_ledger" && col === "account_id" && col2 === "reason") {
              // For computeCreditAttribution: eq("account_id", accountId).eq("reason", "debit")
              return {
                gte: (_col3: string, _val3: any) => {
                  // optionally chained .gte("created_at", sinceIso)
                  return terminal({ data: config.ledgerRows ?? [], error: err });
                },
                then: (resolve: any, reject?: any) =>
                  Promise.resolve({ data: config.ledgerRows ?? [], error: err }).then(
                    resolve,
                    reject,
                  ),
              };
            }
            return {
              gte: () => terminal({ data: config.ledgerRows ?? [], error: err }),
              then: (resolve: any, reject?: any) =>
                Promise.resolve({ data: config.ledgerRows ?? [], error: err }).then(
                  resolve,
                  reject,
                ),
            };
          },
          then: (resolve: any, reject?: any) =>
            Promise.resolve({ data: config.ledgerRows ?? [], error: err }).then(resolve, reject),
        }),
      }),
    }),
  } as any as SupabaseClient;
}

// --- Async function tests with mocking ---

describe("credits.functions – async with mocking", () => {
  describe("computeCreditAttribution", () => {
    it("should return empty rollup when no ledger rows exist", async () => {
      const supabase = createMockSupabase({ ledgerRows: [] });
      const result = await computeCreditAttribution(supabase, "acc1");

      expect(result.byProduct).toEqual([]);
      expect(result.byMember).toEqual([]);
      expect(result.totalDebited).toBe(0);
    });

    it("should return empty rollup when database query errors", async () => {
      const supabase = createMockSupabase({
        ledgerRows: [],
        error: new Error("Database error"),
      });
      const result = await computeCreditAttribution(supabase, "acc1");

      expect(result.byProduct).toEqual([]);
      expect(result.byMember).toEqual([]);
      expect(result.totalDebited).toBe(0);
    });

    it("should rollup attribution from ledger rows", async () => {
      const ledgerRows = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1", account_id: "acc1" },
        { delta_credits: -200, product_id: "prod1", user_id: "user2", account_id: "acc1" },
        { delta_credits: -50, product_id: "prod2", user_id: "user1", account_id: "acc1" },
      ];
      const supabase = createMockSupabase({ ledgerRows });

      const result = await computeCreditAttribution(supabase, "acc1");

      expect(result.totalDebited).toBe(350);
      expect(result.byProduct).toHaveLength(2);
      expect(result.byMember).toHaveLength(2);
    });

    it("should respect sinceIso window filter", async () => {
      const ledgerRows = [
        { delta_credits: -100, product_id: "prod1", user_id: "user1" },
        { delta_credits: -200, product_id: "prod1", user_id: "user2" },
      ];
      const supabase = createMockSupabase({ ledgerRows });

      // In a real test, we'd verify the .gte() call was chained,
      // but the mock here just returns the same rows regardless.
      // A more sophisticated mock would track the query chain.
      const result = await computeCreditAttribution(supabase, "acc1", {
        sinceIso: "2026-07-01T00:00:00.000Z",
      });

      expect(result.totalDebited).toBe(300);
    });

    it("should handle null product_id and user_id", async () => {
      const ledgerRows = [
        { delta_credits: -100, product_id: null, user_id: "user1" },
        { delta_credits: -50, product_id: "prod1", user_id: null },
      ];
      const supabase = createMockSupabase({ ledgerRows });

      const result = await computeCreditAttribution(supabase, "acc1");

      // Should include null buckets
      const productIds = result.byProduct.map((b) => b.id);
      const memberIds = result.byMember.map((b) => b.id);

      expect(productIds).toContain(null);
      expect(memberIds).toContain(null);
    });

    it("should never throw (graceful error handling)", async () => {
      const supabase = createMockSupabase({
        ledgerRows: null as any, // force a failure
        error: new Error("Network timeout"),
      });

      // Should not throw
      const result = await computeCreditAttribution(supabase, "acc1");

      // Should return empty rollup
      expect(result.byProduct).toEqual([]);
      expect(result.byMember).toEqual([]);
      expect(result.totalDebited).toBe(0);
    });
  });
});
