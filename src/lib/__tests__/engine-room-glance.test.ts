import { describe, it, expect } from "bun:test";
import {
  buildSpendGlance,
  buildQualityGlance,
  buildSafetyGlance,
  buildRecordGlance,
  zeroFillDaily,
} from "../engine-room-glance";

describe("engine-room-glance builders (LOOM honesty law: real numbers or none)", () => {
  it("reads the budget meter, cap and used from the same row, window named (one truth)", () => {
    const spend = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 40 },
      costThisWeek: 10,
    });
    expect(spend.verdict).toBe("$40 of $100 monthly cap");
    expect(spend.state).toBe("healthy");
  });

  it("flags Spend as watch when usage crosses 80% of the cap", () => {
    const spend = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 81 },
      costThisWeek: 20,
    });
    expect(spend.state).toBe("watch");
    expect(spend.verdict).toBe("$81 of $100 monthly cap");
  });

  it("falls back to the daily cap, labeled daily, when no monthly cap exists", () => {
    const spend = buildSpendGlance({
      global: { daily_usd_cap: 20, monthly_usd_cap: null, daily_usd_used: 5 },
      costThisWeek: 9,
    });
    expect(spend.verdict).toBe("$5.00 of $20 daily cap");
    expect(spend.state).toBe("healthy");
  });

  it("reports spend honestly with no cap configured, window labeled", () => {
    const spend = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: null },
      costThisWeek: 12,
    });
    expect(spend.state).toBe("healthy");
    expect(spend.verdict).toBe("$12 this week · no cap set");
  });

  it("never rounds a small real amount to a fabricated $0", () => {
    const spend = buildSpendGlance({ global: null, costThisWeek: 0.01 });
    expect(spend.verdict).toBe("$0.01 this week · no cap set");
  });

  it("flags Quality as watch when a suite falls below its own pass threshold", () => {
    const quality = buildQualityGlance({
      suites: [
        { pass_threshold: 90, last_run: { avg_score: 82 } },
        { pass_threshold: 80, last_run: { avg_score: 88 } },
      ],
      driftOpenCount: 0,
    });
    expect(quality.state).toBe("watch");
    expect(quality.verdict).toBe("Evals 82 / 88 · no drift");
  });

  it("flags Quality as watch when drift is open even with passing scores", () => {
    const quality = buildQualityGlance({
      suites: [{ pass_threshold: 80, last_run: { avg_score: 91 } }],
      driftOpenCount: 2,
    });
    expect(quality.state).toBe("watch");
    expect(quality.verdict).toBe("Evals 91 · drift open");
  });

  it("says 'no eval suites yet' honestly instead of inventing scores", () => {
    const quality = buildQualityGlance({ suites: [], driftOpenCount: 0 });
    expect(quality.state).toBe("healthy");
    expect(quality.verdict).toBe("No eval suites yet · no drift");
  });

  it("flags Safety as watch on any open incident", () => {
    const safety = buildSafetyGlance({
      rules: [{ enabled: true }, { enabled: true }, { enabled: false }],
      incidentCount: 1,
    });
    expect(safety.state).toBe("watch");
    expect(safety.verdict).toBe("2 guardrails on · 1 incident");
  });

  it("keeps Safety healthy with zero incidents", () => {
    const safety = buildSafetyGlance({ rules: [{ enabled: true }], incidentCount: 0 });
    expect(safety.state).toBe("healthy");
    expect(safety.verdict).toBe("1 guardrail on · 0 incidents");
  });

  it("reports Record as healthy when the ledger verifies, window named", () => {
    const record = buildRecordGlance({ traceCount: 1284, ledgerVerifies: true });
    expect(record.state).toBe("healthy");
    expect(record.verdict).toBe("1,284 runs this week · ledger intact");
  });

  it("surfaces an unverified ledger honestly without changing room state", () => {
    const record = buildRecordGlance({ traceCount: 3, ledgerVerifies: false });
    expect(record.verdict).toBe("3 runs this week · ledger unverified");
  });
});

describe("zeroFillDaily (OBS-15)", () => {
  const ASOF = Date.parse("2026-07-03T12:00:00Z");

  it("zero-fills every day when the sparse series is empty", () => {
    expect(zeroFillDaily([], 7, ASOF)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("places a real value at its own day, oldest first, without shifting a gap day next to its neighbor", () => {
    // Spend happened only on day 1 (2026-06-27) and day 7 (2026-07-03) of the
    // window; the 5 days between must stay real zeros, not be collapsed out.
    const daily = [
      { day: "2026-06-27", cost: 12 },
      { day: "2026-07-03", cost: 40 },
    ];
    expect(zeroFillDaily(daily, 7, ASOF)).toEqual([12, 0, 0, 0, 0, 0, 40]);
  });

  it("ignores a bucket entry outside the requested window", () => {
    const daily = [
      { day: "2026-06-01", cost: 999 }, // outside a 7-day window ending at ASOF
      { day: "2026-07-01", cost: 5 },
    ];
    const filled = zeroFillDaily(daily, 7, ASOF);
    expect(filled.reduce((a, b) => a + b, 0)).toBe(5);
  });
});
