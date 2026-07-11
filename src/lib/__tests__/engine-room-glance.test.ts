import { describe, it, expect } from "bun:test";
import {
  buildSpendGlance,
  buildQualityGlance,
  buildSafetyGlance,
  buildRecordGlance,
  zeroFillDaily,
  ROOM_TAB_META,
  tabLabel,
  type RoomKey,
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

  it("reads the pass-rate report (the room's own source) with the scope labeled", () => {
    const quality = buildQualityGlance({
      passRate: 0.75,
      totalRuns: 12,
      verdict: "watch",
      driftOpenCount: 0,
    });
    expect(quality.state).toBe("watch");
    expect(quality.verdict).toBe("Pass rate 75% across 12 runs · no drift");
  });

  it("flags Quality as watch when drift is open even with a healthy pass rate", () => {
    const quality = buildQualityGlance({
      passRate: 0.95,
      totalRuns: 1,
      verdict: "healthy",
      driftOpenCount: 2,
    });
    expect(quality.state).toBe("watch");
    expect(quality.verdict).toBe("Pass rate 95% across 1 run · drift open");
  });

  it("stays healthy when the report is healthy and no drift is open", () => {
    const quality = buildQualityGlance({
      passRate: 0.92,
      totalRuns: 20,
      verdict: "healthy",
      driftOpenCount: 0,
    });
    expect(quality.state).toBe("healthy");
    expect(quality.verdict).toBe("Pass rate 92% across 20 runs · no drift");
  });

  it("says 'no eval runs yet' honestly instead of inventing a rate", () => {
    const quality = buildQualityGlance({
      passRate: null,
      totalRuns: 0,
      verdict: "no-data",
      driftOpenCount: 0,
    });
    expect(quality.state).toBe("healthy");
    expect(quality.verdict).toBe("No eval runs yet · no drift");
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

describe("Engine Room naming model (plain outcome on top, technical trace beneath)", () => {
  const rooms: RoomKey[] = ["spend", "quality", "safety", "record"];

  it("gives every tab a plain label, a technical term, and a one-line descriptor", () => {
    for (const room of rooms) {
      const tabs = ROOM_TAB_META[room];
      expect(tabs.length).toBeGreaterThan(0);
      for (const t of tabs) {
        expect(t.id.length).toBeGreaterThan(0);
        expect(t.label.length).toBeGreaterThan(0);
        expect(t.technical.length).toBeGreaterThan(0);
        expect(t.descriptor.length).toBeGreaterThan(0);
        // The plain label is a real rename, never the raw id echoed back.
        expect(t.label.toLowerCase()).not.toBe(t.id.toLowerCase());
      }
    }
  });

  it("keeps the exact ?view= ids the room bodies switch on", () => {
    expect(ROOM_TAB_META.spend.map((t) => t.id)).toEqual([
      // The activation funnel moved to admin observability (IA 2026-07-11):
      // Spend answers only the cost question.
      "trend",
      "by-agent",
      "caps",
      "usage",
    ]);
    expect(ROOM_TAB_META.quality.map((t) => t.id)).toEqual([
      "score",
      "calibration",
      "suites",
      "drift",
      // RPT-50: the self-improvement engine rides Quality as "What to fix".
      "self-improvement",
      "prompts",
      "proof",
    ]);
    expect(ROOM_TAB_META.safety.map((t) => t.id)).toEqual([
      "rules",
      "controls",
      "team",
      "house-rules",
      "routines",
      "incidents",
    ]);
    expect(ROOM_TAB_META.record.map((t) => t.id)).toEqual([
      // RPT-31: the verification cockpit opens the Record room; receipts is
      // the merged Trust Ledger home (IA 2026-07-11, tamper seal lives there).
      "verify",
      "receipts",
      "traces",
      "approvals",
      "support",
    ]);
  });

  it("resolves the plain outcome label and falls back to the id when unknown", () => {
    expect(tabLabel("quality", "score")).toBe("Right now");
    expect(tabLabel("quality", "drift")).toBe("Is it slipping?");
    expect(tabLabel("record", "receipts")).toBe("Paper trail");
    expect(tabLabel("spend", "nonexistent")).toBe("nonexistent");
  });
});

describe("Engine Room recommended action (derived from real state, watch only)", () => {
  it("adds a plain next step when Spend is on watch, none when healthy", () => {
    const watch = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 90 },
      costThisWeek: 20,
    });
    expect(watch.state).toBe("watch");
    expect((watch.action ?? "").length).toBeGreaterThan(0);
    const healthy = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 10 },
      costThisWeek: 5,
    });
    expect(healthy.action).toBeUndefined();
  });

  it("points Quality at the right plain tab depending on whether drift is open", () => {
    const drift = buildQualityGlance({
      passRate: 0.95,
      totalRuns: 3,
      verdict: "healthy",
      driftOpenCount: 1,
    });
    expect(drift.action).toContain("Is it slipping?");
    const failing = buildQualityGlance({
      passRate: 0.4,
      totalRuns: 10,
      verdict: "at-risk",
      driftOpenCount: 0,
    });
    expect(failing.action).toContain("What we test");
  });

  it("points Safety at What went wrong on an open incident", () => {
    const safety = buildSafetyGlance({ rules: [{ enabled: true }], incidentCount: 2 });
    expect(safety.action).toContain("What went wrong");
  });

  it("leaves a healthy Record with no next step", () => {
    const record = buildRecordGlance({ traceCount: 10, ledgerVerifies: true });
    expect(record.action).toBeUndefined();
  });
});
