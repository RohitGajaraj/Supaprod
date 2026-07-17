import { describe, test, expect } from "bun:test";
import { deriveBrainStats, type BrainStats } from "../BrainStatTrio";
import type { ImpactLedgerResult } from "@/lib/pm-impact.functions";

describe("deriveBrainStats", () => {
  test("returns { hasRecord: false } when no decisions and no outcomes", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 0,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 0,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result);
    expect(stats).toEqual({ hasRecord: false });
  });

  test("returns { hasRecord: true } when decisionsTotal > 0", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 0,
        decisionsTrend: [1, 2, 1, 0, 0, 0, 0, 0],
      },
      markdown: "# Record",
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    expect(stats.hasRecord).toBe(true);
    expect(stats.cells[0]).toEqual({ value: "5", label: "CALLS MADE" });
  });

  test("returns { hasRecord: true } when measuredOutcomes > 0", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 0,
        measuredOutcomes: 3,
        outcomes: { hitRate: 0.75 },
        iceShiftTotal: 100,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    expect(stats.hasRecord).toBe(true);
  });

  test("includes VALIDATED cell when hitRate is not null", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 8,
        outcomes: { hitRate: 0.875 },
        iceShiftTotal: 50,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    const validatedCell = stats.cells.find((c) => c.label === "VALIDATED");
    expect(validatedCell).toEqual({ value: "88%", label: "VALIDATED" });
  });

  test("omits VALIDATED cell when hitRate is null", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 50,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    const validatedCell = stats.cells.find((c) => c.label === "VALIDATED");
    expect(validatedCell).toBeUndefined();
  });

  test("clamps hitRate to 0-1 range and rounds to percent", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 10,
        outcomes: { hitRate: 0.5555 },
        iceShiftTotal: 0,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    const validatedCell = stats.cells.find((c) => c.label === "VALIDATED");
    expect(validatedCell?.value).toBe("56%");
  });

  test("renders positive iceShiftTotal with + prefix", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 150,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    const iceCell = stats.cells.find((c) => c.label === "ICE MOVED");
    expect(iceCell?.value).toBe("+150");
  });

  test("renders negative iceShiftTotal with - prefix", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: -75,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    const iceCell = stats.cells.find((c) => c.label === "ICE MOVED");
    expect(iceCell?.value).toBe("-75");
  });

  test("renders zero iceShiftTotal with + prefix", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 0,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    const iceCell = stats.cells.find((c) => c.label === "ICE MOVED");
    expect(iceCell?.value).toBe("+0");
  });

  test("preserves markdown when present", () => {
    const markdown = "# My Decision Record\n\nThis is my record.";
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 3,
        measuredOutcomes: 2,
        outcomes: { hitRate: 0.67 },
        iceShiftTotal: 100,
        decisionsTrend: [1, 1, 1, 0, 0, 0, 0, 0],
      },
      markdown,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    expect(stats.markdown).toBe(markdown);
  });

  test("converts empty markdown string to null", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 3,
        measuredOutcomes: 2,
        outcomes: { hitRate: 0.67 },
        iceShiftTotal: 100,
        decisionsTrend: [],
      },
      markdown: "",
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    expect(stats.markdown).toBeNull();
  });

  test("preserves decisionsTrend array", () => {
    const trend = [5, 3, 4, 2, 1, 0, 1, 2];
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 18,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 0,
        decisionsTrend: trend,
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    expect(stats.decisionsTrend).toEqual(trend);
  });

  test("cell order is CALLS MADE, [VALIDATED if hitRate], ICE MOVED", () => {
    const result: ImpactLedgerResult = {
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 10,
        outcomes: { hitRate: 0.8 },
        iceShiftTotal: 200,
        decisionsTrend: [],
      },
      markdown: null,
    };

    const stats = deriveBrainStats(result) as Extract<BrainStats, { hasRecord: true }>;
    expect(stats.cells.map((c) => c.label)).toEqual(["CALLS MADE", "VALIDATED", "ICE MOVED"]);
  });
});
