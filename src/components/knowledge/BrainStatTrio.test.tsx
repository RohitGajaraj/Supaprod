import { describe, expect, test, skip } from "bun:test";
import type { ReactElement } from "react";
import { deriveBrainStats, type BrainStats } from "./BrainStatTrio";
import type { ImpactLedgerResult } from "@/lib/pm-impact.functions";

describe("deriveBrainStats", () => {
  test("returns hasRecord: false when both decisionsTotal and measuredOutcomes are 0", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 0,
        measuredOutcomes: 0,
        outcomes: { hitRate: 0.8 },
        iceShiftTotal: 0,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    expect(result.hasRecord).toBe(false);
  });

  test("returns hasRecord: true when decisionsTotal > 0", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 0,
        decisionsTrend: [1, 0, 2, 0, 0, 0, 1, 0],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    expect(result.hasRecord).toBe(true);
  });

  test("returns hasRecord: true when measuredOutcomes > 0", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 0,
        measuredOutcomes: 3,
        outcomes: { hitRate: 0.67 },
        iceShiftTotal: 10,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    expect(result.hasRecord).toBe(true);
  });

  test("includes CALLS MADE cell with decisionsTotal", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 42,
        measuredOutcomes: 10,
        outcomes: { hitRate: 0.9 },
        iceShiftTotal: 100,
        decisionsTrend: [1, 2, 3],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    expect(result.hasRecord).toBe(true);
    expect((result as any).cells[0]).toEqual({
      value: "42",
      label: "CALLS MADE",
    });
  });

  test("includes VALIDATED cell when hitRate is not null", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 8,
        outcomes: { hitRate: 0.75 },
        iceShiftTotal: 50,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    const validatedCell = cells.find((c: any) => c.label === "VALIDATED");
    expect(validatedCell).toBeDefined();
    expect(validatedCell?.value).toBe("75%");
  });

  test("omits VALIDATED cell when hitRate is null", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 30,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    const validatedCell = cells.find((c: any) => c.label === "VALIDATED");
    expect(validatedCell).toBeUndefined();
  });

  test("rounds hitRate to nearest percent", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 4,
        outcomes: { hitRate: 0.667 },
        iceShiftTotal: 10,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    const validatedCell = cells.find((c: any) => c.label === "VALIDATED");
    expect(validatedCell?.value).toBe("67%");
  });

  test("includes ICE MOVED cell with sign prefix for positive values", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 8,
        outcomes: { hitRate: 0.8 },
        iceShiftTotal: 45,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    const iceCell = cells.find((c: any) => c.label === "ICE MOVED");
    expect(iceCell).toBeDefined();
    expect(iceCell?.value).toBe("+45");
  });

  test("includes ICE MOVED cell without sign prefix for negative values", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 8,
        outcomes: { hitRate: 0.8 },
        iceShiftTotal: -20,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    const iceCell = cells.find((c: any) => c.label === "ICE MOVED");
    expect(iceCell?.value).toBe("-20");
  });

  test("includes ICE MOVED cell with + sign for zero", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 8,
        outcomes: { hitRate: 0.8 },
        iceShiftTotal: 0,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    const iceCell = cells.find((c: any) => c.label === "ICE MOVED");
    expect(iceCell?.value).toBe("+0");
  });

  test("coalesces empty markdown to null", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 3,
        outcomes: { hitRate: 0.6 },
        iceShiftTotal: 10,
        decisionsTrend: [1, 0],
      } as ImpactLedgerResult["ledger"],
      markdown: "",
    } as ImpactLedgerResult);

    expect((result as any).markdown).toBeNull();
  });

  test("preserves non-empty markdown string", () => {
    const testMarkdown = "# Decision Record\n\n- Call 1: Success\n- Call 2: Failure";
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 2,
        measuredOutcomes: 2,
        outcomes: { hitRate: 0.5 },
        iceShiftTotal: 0,
        decisionsTrend: [1, 1],
      } as ImpactLedgerResult["ledger"],
      markdown: testMarkdown,
    } as ImpactLedgerResult);

    expect((result as any).markdown).toBe(testMarkdown);
  });

  test("includes decisionsTrend when hasRecord is true", () => {
    const trend = [0, 1, 2, 1, 0, 3, 2, 1];
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 8,
        outcomes: { hitRate: 0.75 },
        iceShiftTotal: 30,
        decisionsTrend: trend,
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    expect((result as any).decisionsTrend).toEqual(trend);
  });

  test("cell order is CALLS MADE, [VALIDATED if present], ICE MOVED", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 10,
        measuredOutcomes: 8,
        outcomes: { hitRate: 0.8 },
        iceShiftTotal: 50,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    expect(cells[0].label).toBe("CALLS MADE");
    expect(cells[1].label).toBe("VALIDATED");
    expect(cells[2].label).toBe("ICE MOVED");
  });

  test("cell order without VALIDATED is CALLS MADE, ICE MOVED", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 0,
        outcomes: { hitRate: null },
        iceShiftTotal: 10,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    expect(cells[0].label).toBe("CALLS MADE");
    expect(cells[1].label).toBe("ICE MOVED");
    expect(cells.length).toBe(2);
  });

  test("returns object with correct structure when hasRecord is true", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 8,
        measuredOutcomes: 6,
        outcomes: { hitRate: 0.75 },
        iceShiftTotal: 25,
        decisionsTrend: [1, 0, 2, 0, 1, 0, 1, 2],
      } as ImpactLedgerResult["ledger"],
      markdown: "# Record",
    } as ImpactLedgerResult);

    const typed = result as Extract<BrainStats, { hasRecord: true }>;
    expect(typed.hasRecord).toBe(true);
    expect(Array.isArray(typed.cells)).toBe(true);
    expect(typeof typed.markdown).toBe("string");
    expect(Array.isArray(typed.decisionsTrend)).toBe(true);
  });

  test("edge case: hitRate exactly 0", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 3,
        measuredOutcomes: 3,
        outcomes: { hitRate: 0 },
        iceShiftTotal: -10,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    const validatedCell = cells.find((c: any) => c.label === "VALIDATED");
    expect(validatedCell?.value).toBe("0%");
  });

  test("edge case: hitRate exactly 1", () => {
    const result = deriveBrainStats({
      ledger: {
        decisionsTotal: 5,
        measuredOutcomes: 5,
        outcomes: { hitRate: 1 },
        iceShiftTotal: 100,
        decisionsTrend: [],
      } as ImpactLedgerResult["ledger"],
      markdown: null,
    } as ImpactLedgerResult);

    const cells = (result as any).cells;
    const validatedCell = cells.find((c: any) => c.label === "VALIDATED");
    expect(validatedCell?.value).toBe("100%");
  });
});

describe("BrainStatTrio component states", () => {
  /**
   * IMPLEMENTATION NOTES: BrainStatTrio component uses useQuery to fetch
   * impact ledger data. Component-level tests require:
   * - Mock useQuery via mock.module pattern
   * - Mock useServerFn for the getFunctions
   * - Shallow element inspection
   *
   * Component structure:
   * - StatCell (lines 52-69): Renders one stat with label/value
   * - download() function (74-80): Exports markdown as .txt file
   * - Component render (84-179): Loading/error/empty/success states + download button
   */

  test.skip("renders PanelSkeleton when ledger.isLoading is true", () => {
    // TODO: Implement mock.module pattern for useQuery
    // EXPECTED: <PanelSkeleton /> component visible
  });

  test.skip("renders error card when ledger.isError is true", () => {
    // TODO: Implement mock.module pattern for useQuery
    // EXPECTED: Card with "Brain stats · failed to load" + error message + Retry button
  });

  test.skip("displays error message from query error", () => {
    // TODO: Implement mock.module pattern for useQuery
    // EXPECTED: (ledger.error as Error).message rendered
  });

  test.skip("renders empty state when hasRecord is false", () => {
    // TODO: Implement mock.module pattern for useQuery
    // EXPECTED: Card with "No decision record yet" message
  });

  test.skip("renders StatCell trio when hasRecord is true", () => {
    // TODO: Implement mock.module pattern for useQuery
    // EXPECTED: Three StatCell components for cells from deriveBrainStats
  });

  test.skip("displays decision trend sparkline when decisionsTrend is present", () => {
    // TODO: Implement mock.module pattern for useQuery
    // EXPECTED: Recharts ResponsiveContainer with AreaChart + Area
  });

  test.skip("renders markdown content when stats.markdown is present", () => {
    // TODO: Implement mock.module pattern for useQuery
    // EXPECTED: Rendered HTML from markdown string
  });

  test.skip("shows download button when markdown is present", () => {
    // TODO: Implement mock.module pattern for useQuery
    // EXPECTED: Button with download icon, onClick triggers download()
  });

  test.skip("download button initiates file download as .txt", () => {
    // TODO: Implement mock.module pattern + simulate click
    // EXPECTED: Creates blob, sets download href, triggers click
  });

  test.skip("hides download button when markdown is null", () => {
    // TODO: Implement mock.module pattern for useQuery with no markdown
    // EXPECTED: No download button rendered
  });

  test.skip("StatCell displays label and value correctly", () => {
    // TODO: Test StatCell component (line 52-69)
    // EXPECTED: Renders label in mono-caps + value in stat style
  });

  test.skip("calls refetch when Retry button is clicked in error state", () => {
    // TODO: Implement mock.module pattern + simulate click
    // EXPECTED: ledger.refetch() invoked
  });

  test.skip("renders markdown with correct line breaks and formatting", () => {
    // TODO: Implement mock.module pattern with known markdown
    // EXPECTED: Markdown rendered as proper HTML (h1, ul, li, etc.)
  });
});
