import { describe, it, expect } from "bun:test";
import { barInsight } from "./Sketch";
import type { SketchBarDatum } from "./Sketch";

/**
 * Unit tests for SketchBarChart dependencies and logic.
 * Gap 1 Analysis: SketchBarChart uses React hooks (useState) which require
 * a render context. Unit testing with JSX mirrors is insufficient for
 * interactive behavior (hover/focus state swapping, race-guard logic).
 *
 * Strategy:
 * 1. Test the component's pure dependencies (barInsight, formatValue)
 * 2. Provide a skeleton for E2E/integration tests (requires @testing-library/react + DOM)
 * 3. Document the missing coverage: hover->activeIdx swapping, race-guard logic in onBlur
 */

describe("SketchBarChart dependencies — barInsight", () => {
  /**
   * SketchBarChart's insight text is derived from barInsight, so testing
   * barInsight thoroughly ensures the chart displays correct plain-language
   * descriptions of the data trends.
   */

  const sampleData: SketchBarDatum[] = [
    { label: "Mon", value: 10 },
    { label: "Tue", value: 25 },
    { label: "Wed", value: 15 },
    { label: "Thu", value: 30 },
  ];

  it("should identify upward trend in chart data", () => {
    const insight = barInsight(sampleData, (v) => String(Math.round(v)));
    expect(insight.toLowerCase()).toContain("up");
    expect(insight).toContain("peak");
    expect(insight).toContain("Thu"); // Peak day
  });

  it("should format insight with custom value formatter", () => {
    const customFormat = (v: number) => `$${v.toFixed(2)}`;
    const insight = barInsight(sampleData, customFormat);
    expect(insight).toContain("$");
  });

  it("should handle single bar (no trend)", () => {
    const singleData: SketchBarDatum[] = [{ label: "Only", value: 42 }];
    const insight = barInsight(singleData, (v) => String(v));
    expect(insight).toContain("One reading");
  });

  it("should detect downward trend", () => {
    const downData: SketchBarDatum[] = [
      { label: "Mon", value: 30 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 15 },
    ];
    const insight = barInsight(downData, (v) => String(Math.round(v)));
    expect(insight.toLowerCase()).toContain("down");
  });

  it("should detect flat trend", () => {
    const flatData: SketchBarDatum[] = [
      { label: "A", value: 100 },
      { label: "B", value: 101 },
      { label: "C", value: 100 },
    ];
    const insight = barInsight(flatData, (v) => String(Math.round(v)));
    expect(insight.toLowerCase()).toContain("flat");
  });

  it("should identify peak correctly", () => {
    const insight = barInsight(sampleData, (v) => String(Math.round(v)));
    expect(insight).toContain("30"); // Peak value
  });
});

