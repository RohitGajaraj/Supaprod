import { describe, it, expect } from "bun:test";
import {
  monthlyGrantCredits,
  resetDelta,
  sumRunDebits,
  sumDebitCredits,
  rollupAttribution,
  capExceeded,
  creditWindowStartIso,
  type RunLedgerRow,
  type LedgerDebitRow,
  type CreditAttribution,
} from "../credits.functions";

describe("credits.functions", () => {
  // ─────────────────────────────────────────────────────────────
  // monthlyGrantCredits: tier → monthly INCLUDED allowance (or 0)
  // ─────────────────────────────────────────────────────────────
  describe("monthlyGrantCredits", () => {
    it("returns monthly grant for paid tiers (free=750, pro=3750, team/max=15000)", () => {
      // creditMonthlyBase = FREE_MONTHLY_CREDITS (750) * creditMultiplier
      // free: 1, pro: 5, max: 20, team: 20
      expect(monthlyGrantCredits("free")).toBe(750); // 750 * 1
      expect(monthlyGrantCredits("pro")).toBe(3750); // 750 * 5
      expect(monthlyGrantCredits("max")).toBe(15000); // 750 * 20
      expect(monthlyGrantCredits("team")).toBe(15000); // 750 * 20
    });

    it("returns 0 for enterprise (custom/no metered base)", () => {
      // Enterprise has creditMultiplier = null, so creditMonthlyBase is null
      // monthlyGrantCredits returns 0 for null or non-positive base
      expect(monthlyGrantCredits("enterprise")).toBe(0);
    });

    it("floors fractional monthly base to integer", () => {
      // The function applies Math.floor() to ensure integer result
      const result = monthlyGrantCredits("pro");
      expect(Number.isInteger(result)).toBe(true);
    });

    it("always returns a non-negative number", () => {
      const tiers = ["free", "pro", "team", "max", "enterprise"] as const;
      for (const tier of tiers) {
        expect(monthlyGrantCredits(tier)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // resetDelta: (currentIncluded, monthlyGrant) → signed delta
  // ─────────────────────────────────────────────────────────────
  describe("resetDelta", () => {
    it("returns positive delta when current < grant (top up)", () => {
      const delta = resetDelta(100, 200);
      expect(delta).toBe(100);
    });

    it("returns negative delta when current > grant (reset down)", () => {
      const delta = resetDelta(300, 200);
      expect(delta).toBe(-100);
    });

    it("returns 0 when current equals grant (no change)", () => {
      const delta = resetDelta(200, 200);
      expect(delta).toBe(0);
    });

    it("floors both values before computing delta", () => {
      const delta = resetDelta(100.9, 200.7);
      expect(delta).toBe(100); // Math.floor(200.7) - Math.floor(100.9) = 200 - 100
    });

    it("handles zero values", () => {
      expect(resetDelta(0, 100)).toBe(100);
      expect(resetDelta(100, 0)).toBe(-100);
      expect(resetDelta(0, 0)).toBe(0);
    });

    it("handles negative inputs (edge case)", () => {
      const delta = resetDelta(-50, 100);
      expect(delta).toBe(150);
    });

    it("satisfies the invariant: current + delta = grant (floored)", () => {
      const current = 150.3;
      const grant = 250.8;
      const delta = resetDelta(current, grant);
      expect(Math.floor(current) + delta).toBe(Math.floor(grant));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // sumRunDebits: RunLedgerRow[] → positive total of debit credits
  // ─────────────────────────────────────────────────────────────
  describe("sumRunDebits", () => {
    it("sums negative delta_credits as positive total", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: -10, ai_event_id: "evt-1" },
        { delta_credits: -20, ai_event_id: "evt-2" },
        { delta_credits: -5, ai_event_id: "evt-3" },
      ];
      expect(sumRunDebits(rows)).toBe(35);
    });

    it("ignores positive deltas (grants/refunds)", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: -10, ai_event_id: "evt-1" },
        { delta_credits: 50, ai_event_id: "evt-2" }, // grant, ignored
      ];
      expect(sumRunDebits(rows)).toBe(10);
    });

    it("returns 0 for empty array", () => {
      expect(sumRunDebits([])).toBe(0);
    });

    it("returns 0 when no debits present", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: 10, ai_event_id: "evt-1" },
        { delta_credits: 20, ai_event_id: "evt-2" },
      ];
      expect(sumRunDebits(rows)).toBe(0);
    });

    it("ignores non-finite values (NaN, Infinity)", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: -10, ai_event_id: "evt-1" },
        { delta_credits: NaN, ai_event_id: "evt-2" },
        { delta_credits: -Infinity, ai_event_id: "evt-3" },
        { delta_credits: -20, ai_event_id: "evt-4" },
      ];
      expect(sumRunDebits(rows)).toBe(30); // only -10 and -20
    });

    it("handles null ai_event_id", () => {
      const rows: RunLedgerRow[] = [
        { delta_credits: -10, ai_event_id: null },
        { delta_credits: -20, ai_event_id: null },
      ];
      expect(sumRunDebits(rows)).toBe(30);
    });

    it("always returns a non-negative number", () => {
      expect(sumRunDebits([{ delta_credits: -5, ai_event_id: "evt-1" }])).toBeGreaterThanOrEqual(0);
      expect(sumRunDebits([{ delta_credits: 5, ai_event_id: "evt-1" }])).toBeGreaterThanOrEqual(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // sumDebitCredits: LedgerDebitRow[] → positive total of debits
  // ─────────────────────────────────────────────────────────────
  describe("sumDebitCredits", () => {
    it("sums negative delta_credits as positive total", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -15, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: -25, product_id: "prod-b", user_id: "user-2" },
        { delta_credits: -10, product_id: "prod-a", user_id: "user-1" },
      ];
      expect(sumDebitCredits(rows)).toBe(50);
    });

    it("ignores positive deltas", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -20, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: 100, product_id: "prod-b", user_id: "user-2" }, // grant
      ];
      expect(sumDebitCredits(rows)).toBe(20);
    });

    it("returns 0 for empty array", () => {
      expect(sumDebitCredits([])).toBe(0);
    });

    it("ignores non-finite values", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: NaN, product_id: "prod-b", user_id: "user-2" },
        { delta_credits: Infinity, product_id: "prod-c", user_id: null },
        { delta_credits: -30, product_id: "prod-d", user_id: "user-3" },
      ];
      expect(sumDebitCredits(rows)).toBe(40);
    });

    it("handles null product_id and user_id", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: null, user_id: null },
        { delta_credits: -20, product_id: "prod-a", user_id: null },
        { delta_credits: -15, product_id: null, user_id: "user-1" },
      ];
      expect(sumDebitCredits(rows)).toBe(45);
    });

    it("matches sumRunDebits signature (both sum negative deltas)", () => {
      // Both functions have the same core logic but different input types
      const runRows: RunLedgerRow[] = [{ delta_credits: -10, ai_event_id: "evt-1" }];
      const ledgerRows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: "prod-a", user_id: "user-1" },
      ];
      expect(sumRunDebits(runRows)).toBe(sumDebitCredits(ledgerRows));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // rollupAttribution: LedgerDebitRow[] → { byProduct, byMember, totalDebited }
  // ─────────────────────────────────────────────────────────────
  describe("rollupAttribution", () => {
    it("groups by product and member separately", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: -20, product_id: "prod-a", user_id: "user-2" },
        { delta_credits: -15, product_id: "prod-b", user_id: "user-1" },
      ];
      const result = rollupAttribution(rows);
      expect(result.totalDebited).toBe(45);
      expect(result.byProduct).toHaveLength(2);
      expect(result.byMember).toHaveLength(2);
    });

    it("returns empty buckets for empty array", () => {
      const result = rollupAttribution([]);
      expect(result).toEqual({ byProduct: [], byMember: [], totalDebited: 0 });
    });

    it("sorts buckets by credits (high to low)", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -5, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: -30, product_id: "prod-b", user_id: "user-2" },
        { delta_credits: -15, product_id: "prod-c", user_id: "user-3" },
      ];
      const result = rollupAttribution(rows);
      expect(result.byProduct[0].credits).toBe(30);
      expect(result.byProduct[1].credits).toBe(15);
      expect(result.byProduct[2].credits).toBe(5);
    });

    it("handles null ids (unattributed) as separate bucket", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: null, user_id: null },
        { delta_credits: -20, product_id: "prod-a", user_id: "user-1" },
      ];
      const result = rollupAttribution(rows);
      expect(result.byProduct).toContainEqual({ id: null, credits: 10 });
      expect(result.byMember).toContainEqual({ id: null, credits: 10 });
    });

    it("ignores non-finite and positive deltas", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: NaN, product_id: "prod-b", user_id: "user-2" },
        { delta_credits: 50, product_id: "prod-c", user_id: "user-3" },
      ];
      const result = rollupAttribution(rows);
      expect(result.totalDebited).toBe(10);
      expect(result.byProduct).toHaveLength(1);
    });

    it("satisfies reconciliation invariant: sum(byProduct) === totalDebited", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: -20, product_id: "prod-b", user_id: "user-2" },
        { delta_credits: -15, product_id: "prod-a", user_id: "user-3" },
      ];
      const result = rollupAttribution(rows);
      const sumByProduct = result.byProduct.reduce((s, b) => s + b.credits, 0);
      expect(sumByProduct).toBe(result.totalDebited);
    });

    it("satisfies reconciliation invariant: sum(byMember) === totalDebited", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: -20, product_id: "prod-b", user_id: "user-2" },
        { delta_credits: -15, product_id: "prod-a", user_id: "user-3" },
      ];
      const result = rollupAttribution(rows);
      const sumByMember = result.byMember.reduce((s, b) => s + b.credits, 0);
      expect(sumByMember).toBe(result.totalDebited);
    });

    it("accumulates multiple debits from same product/member", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -10, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: -15, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: -5, product_id: "prod-a", user_id: "user-1" },
      ];
      const result = rollupAttribution(rows);
      expect(result.byProduct).toHaveLength(1);
      expect(result.byProduct[0]).toEqual({ id: "prod-a", credits: 30 });
      expect(result.byMember).toHaveLength(1);
      expect(result.byMember[0]).toEqual({ id: "user-1", credits: 30 });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // capExceeded: (spent, projected, cap) → boolean
  // ─────────────────────────────────────────────────────────────
  describe("capExceeded", () => {
    it("returns false when spent + projected <= cap", () => {
      expect(capExceeded(10, 20, 50)).toBe(false);
      expect(capExceeded(10, 20, 30)).toBe(false); // exactly equal
    });

    it("returns true when spent + projected > cap", () => {
      expect(capExceeded(20, 20, 30)).toBe(true);
    });

    it("treats non-finite cap as 'no cap' (always false)", () => {
      expect(capExceeded(1000, 1000, Infinity)).toBe(false);
      expect(capExceeded(1000, 1000, -Infinity)).toBe(false);
      expect(capExceeded(1000, 1000, NaN)).toBe(false);
    });

    it("cap of 0 blocks any billable draw", () => {
      expect(capExceeded(0, 1, 0)).toBe(true);
      expect(capExceeded(0, 0, 0)).toBe(false);
    });

    it("clamps negative spent/projected to 0", () => {
      // Math.max(0, spent) + Math.max(0, projected) > cap
      expect(capExceeded(-10, 20, 15)).toBe(true); // Math.max(0, -10) + Math.max(0, 20) = 20 > 15
      expect(capExceeded(-10, 20, 30)).toBe(false); // 0 + 20 = 20 <= 30
    });

    it("handles negative cap (treated as 0)", () => {
      // Non-finite check doesn't catch negative numbers; they are finite
      // So capExceeded(-100, 50, -10) → Math.max(0, -100) + Math.max(0, 50) = 50 > -10 → true
      expect(capExceeded(0, 1, -10)).toBe(true);
    });

    it("returns false when both spent and projected are negative", () => {
      expect(capExceeded(-5, -10, 100)).toBe(false); // 0 + 0 <= 100
    });

    it("handles zero cap strictly", () => {
      expect(capExceeded(0, 0, 0)).toBe(false); // 0 + 0 = 0, not > 0
      expect(capExceeded(0.1, 0, 0)).toBe(true); // 0.1 > 0
    });
  });

  // ─────────────────────────────────────────────────────────────
  // creditWindowStartIso: (windowKind, cycleAnchorIso, nowIso) → ISO start
  // ─────────────────────────────────────────────────────────────
  describe("creditWindowStartIso", () => {
    const now = "2026-07-24T14:30:45.123Z";

    it("returns day start (00:00:00Z) for 'day' window", () => {
      const result = creditWindowStartIso("day", null, now);
      expect(result).toBe("2026-07-24T00:00:00.000Z");
    });

    it("returns month start (01T00:00:00Z) for 'month' window", () => {
      const result = creditWindowStartIso("month", null, now);
      expect(result).toBe("2026-07-01T00:00:00.000Z");
    });

    it("returns cycle anchor when 'cycle' and anchor is present", () => {
      const anchor = "2026-06-15T10:30:00.000Z";
      const result = creditWindowStartIso("cycle", anchor, now);
      expect(result).toBe(anchor);
    });

    it("returns month start for 'cycle' when anchor is null/undefined", () => {
      expect(creditWindowStartIso("cycle", null, now)).toBe("2026-07-01T00:00:00.000Z");
      expect(creditWindowStartIso("cycle", undefined, now)).toBe("2026-07-01T00:00:00.000Z");
    });

    it("returns month start for 'cycle' when anchor is too short (< 10 chars)", () => {
      const result = creditWindowStartIso("cycle", "2026-07", now);
      expect(result).toBe("2026-07-01T00:00:00.000Z");
    });

    it("extracts month correctly for non-start-of-month timestamps", () => {
      const laterInMonth = "2026-07-31T23:59:59.999Z";
      const result = creditWindowStartIso("month", null, laterInMonth);
      expect(result).toBe("2026-07-01T00:00:00.000Z");
    });

    it("handles single-digit months and days correctly (zero-padded in ISO)", () => {
      const earlyInMonth = "2026-01-05T12:00:00.000Z";
      const result = creditWindowStartIso("day", null, earlyInMonth);
      expect(result).toBe("2026-01-05T00:00:00.000Z");
    });

    it("preserves anchor as-is (does not parse/validate)", () => {
      const invalidAnchor = "not-a-real-timestamp";
      const result = creditWindowStartIso("cycle", invalidAnchor, now);
      expect(result).toBe(invalidAnchor); // length >= 10, returned verbatim
    });

    it("day window ignores time precision in nowIso", () => {
      const withMicros = "2026-07-24T14:30:45.123456Z";
      const result = creditWindowStartIso("day", null, withMicros);
      expect(result).toBe("2026-07-24T00:00:00.000Z");
    });

    it("normalizes output to .000Z milliseconds", () => {
      expect(creditWindowStartIso("day", null, now)).toMatch(/\.000Z$/);
      expect(creditWindowStartIso("month", null, now)).toMatch(/\.000Z$/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Integration tests: cross-function invariants
  // ─────────────────────────────────────────────────────────────
  describe("cross-function invariants", () => {
    it("resetDelta satisfies: current + delta ≡ grant (floored)", () => {
      const testCases = [
        [100, 250],
        [0, 100],
        [150.7, 200.3],
        [-50, 100],
      ];
      for (const [current, grant] of testCases) {
        const delta = resetDelta(current, grant);
        expect(Math.floor(current) + delta).toBe(Math.floor(grant));
      }
    });

    it("attribution rollup satisfies: sum(byProduct) === sum(byMember) === totalDebited", () => {
      const rows: LedgerDebitRow[] = [
        { delta_credits: -100, product_id: "prod-a", user_id: "user-1" },
        { delta_credits: -50, product_id: "prod-b", user_id: "user-2" },
        { delta_credits: -75, product_id: "prod-a", user_id: "user-2" },
        { delta_credits: -25, product_id: null, user_id: "user-3" },
      ];
      const result = rollupAttribution(rows);
      const sumByProduct = result.byProduct.reduce((s, b) => s + b.credits, 0);
      const sumByMember = result.byMember.reduce((s, b) => s + b.credits, 0);
      expect(sumByProduct).toBe(result.totalDebited);
      expect(sumByMember).toBe(result.totalDebited);
      expect(result.totalDebited).toBe(250);
    });

    it("capExceeded consistently rejects overage across multiple calls", () => {
      const cap = 100;
      const calls = [
        { spent: 50, projected: 60 },
        { spent: 99, projected: 2 },
        { spent: 100, projected: 1 },
      ];
      for (const { spent, projected } of calls) {
        expect(capExceeded(spent, projected, cap)).toBe(true);
      }
    });

    it("capExceeded with infinite cap never rejects", () => {
      const cases = [
        { spent: 1_000_000, projected: 1_000_000, cap: Infinity },
        { spent: -Infinity, projected: Infinity, cap: Infinity },
      ];
      for (const { spent, projected, cap } of cases) {
        expect(capExceeded(spent, projected, cap)).toBe(false);
      }
    });
  });
});
