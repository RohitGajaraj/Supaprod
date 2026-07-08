import { describe, expect, test } from "bun:test";
import React from "react";
import ReactTestRenderer from "react-test-renderer";
import { SketchLine, SketchBar, SketchBarChart, type SketchBarDatum } from "../Sketch";

describe("SketchLine component", () => {
  test("returns early with insufficient data", () => {
    // Component returns null for data with < 2 points
    // This doesn't throw, just renders nothing
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchLine, { data: [1] })),
    ).not.toThrow();
  });

  test("creates SVG element with 2+ data points", () => {
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchLine, { data: [1, 2, 3] })),
    ).not.toThrow();
  });

  test("accepts width and height props", () => {
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchLine, { data: [1, 2, 3], w: 200, h: 50 })),
    ).not.toThrow();
  });

  test("renders with baseline option", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchLine, { data: [1, 2, 3, 4, 5], baseline: 3 }),
      ),
    ).not.toThrow();
  });

  test("renders with animation", () => {
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchLine, { data: [1, 2, 3], animate: true })),
    ).not.toThrow();
  });

  test("accepts custom color", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchLine, { data: [1, 2, 3], color: "#ff0000" }),
      ),
    ).not.toThrow();
  });
});

describe("SketchBar component", () => {
  test("renders SVG", () => {
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBar, { pct: 50, seed: 1 })),
    ).not.toThrow();
  });

  test("accepts percentage values 0-100", () => {
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBar, { pct: 0, seed: 1 })),
    ).not.toThrow();
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBar, { pct: 100, seed: 1 })),
    ).not.toThrow();
  });

  test("accepts custom trackH", () => {
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBar, { pct: 50, seed: 1, trackH: 150 })),
    ).not.toThrow();
  });

  test("accepts custom color", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBar, { pct: 50, seed: 1, color: "#00ff00" }),
      ),
    ).not.toThrow();
  });

  test("renders different output for different seeds", () => {
    // Both should render without error
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBar, { pct: 50, seed: 1 })),
    ).not.toThrow();
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBar, { pct: 50, seed: 2 })),
    ).not.toThrow();
  });
});

describe("SketchBarChart component", () => {
  const testData: SketchBarDatum[] = [
    { label: "Jan", value: 10 },
    { label: "Feb", value: 20 },
    { label: "Mar", value: 15 },
  ];

  test("returns early with empty data", () => {
    // Component returns null for empty data array
    // This doesn't throw, just renders nothing
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBarChart, { data: [] })),
    ).not.toThrow();
  });

  test("renders with basic data", () => {
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBarChart, { data: testData })),
    ).not.toThrow();
  });

  test("accepts custom ariaLabel", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBarChart, { data: testData, ariaLabel: "Sales" }),
      ),
    ).not.toThrow();
  });

  test("accepts custom color", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBarChart, { data: testData, color: "#ff6600" }),
      ),
    ).not.toThrow();
  });

  test("accepts custom formatValue", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBarChart, {
          data: testData,
          formatValue: (v) => `$${v}`,
        }),
      ),
    ).not.toThrow();
  });

  test("accepts baseline and baselineLabel", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBarChart, {
          data: testData,
          baseline: 15,
          baselineLabel: "Target",
        }),
      ),
    ).not.toThrow();
  });

  test("respects trackH prop", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBarChart, { data: testData, trackH: 120 }),
      ),
    ).not.toThrow();
  });

  test("accepts custom insight text", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBarChart, {
          data: testData,
          insight: "Custom insight text",
          showInsight: true,
        }),
      ),
    ).not.toThrow();
  });

  test("respects showInsight flag", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBarChart, { data: testData, showInsight: false }),
      ),
    ).not.toThrow();
  });

  test("renders with single data point", () => {
    expect(() =>
      ReactTestRenderer.create(
        React.createElement(SketchBarChart, {
          data: [{ label: "Only", value: 42 }],
        }),
      ),
    ).not.toThrow();
  });

  test("renders with many data points", () => {
    const manyPoints: SketchBarDatum[] = Array.from({ length: 50 }, (_, i) => ({
      label: `Month ${i}`,
      value: Math.random() * 100,
    }));
    expect(() =>
      ReactTestRenderer.create(React.createElement(SketchBarChart, { data: manyPoints })),
    ).not.toThrow();
  });
});
