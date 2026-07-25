import { describe, expect, test } from "bun:test";
import { Axes, Benchmark, NeedsHumanPoint, SeriesLine, Sparkline } from "../chart";

// Same convention as primitives.test.tsx: call components as plain
// functions and inspect the returned React element tree - no DOM renderer,
// no jsdom dependency exists anywhere in this repo.

describe("SeriesLine - the machine's exact series", () => {
  test("defaults to the teal stroke, one clean polyline, no jitter", () => {
    const el = SeriesLine({ data: [1, 5, 2, 8, 3], w: 200, h: 50 }) as any;
    expect(el.type).toBe("polyline");
    expect(el.props.stroke).toBe("var(--teal)");
    // exactly one vertex per data point - no interior jitter subdivisions
    expect(el.props.points.split(" ").length).toBe(5);
  });

  test("accepts a caller color override", () => {
    const el = SeriesLine({ data: [1, 2, 3], w: 100, h: 40, color: "var(--tangerine)" }) as any;
    expect(el.props.stroke).toBe("var(--tangerine)");
  });

  test("renders nothing for fewer than two points", () => {
    expect(SeriesLine({ data: [1], w: 100, h: 40 })).toBeNull();
  });
});

describe("Benchmark - the dashed reference line", () => {
  test("renders dashed cornflower by default", () => {
    const el = Benchmark({ data: [1, 2, 3, 4], value: 2.5, w: 100, h: 40 }) as any;
    expect(el.type).toBe("line");
    expect(el.props.stroke).toBe("var(--cornflower)");
    expect(el.props.strokeDasharray).toBe("4 3");
  });

  test("renders nothing when the value falls outside the data's range", () => {
    expect(Benchmark({ data: [1, 2, 3], value: 99, w: 100, h: 40 })).toBeNull();
  });
});

describe("NeedsHumanPoint - the one ember marker", () => {
  test("is ember and only ember", () => {
    const el = NeedsHumanPoint({ x: 10, y: 10 }) as any;
    expect(el.type).toBe("circle");
    expect(el.props.fill).toBe("var(--ember)");
  });
});

describe("Axes - slate grid, mono ash labels", () => {
  test("both axis lines are slate at 40% opacity", () => {
    const el = Axes({ w: 200, h: 100 }) as any;
    const children = el.props.children as any[];
    const [xAxis, yAxis] = children;
    for (const line of [xAxis, yAxis]) {
      expect(line.props.stroke).toBe("var(--slate)");
      expect(line.props.strokeOpacity).toBe(0.4);
    }
  });
});

describe("Sparkline - the obsidian replacement for SketchLine", () => {
  test("renders exactly one vertex per data point, a straight polyline", () => {
    const el = Sparkline({ data: [1, 4, 2, 6] }) as any;
    const children = el.props.children as any[];
    const polyline = children.find((c: any) => c && c.type === "polyline");
    expect(polyline.props.points.split(" ").length).toBe(4);
    expect(polyline.props.stroke).toBe("var(--teal)");
  });

  test("keeps SketchLine's prop shape: data, color, w, h, baseline", () => {
    const el = Sparkline({
      data: [1, 2, 3],
      color: "var(--tangerine)",
      w: 100,
      h: 30,
      baseline: 2,
    }) as any;
    const children = el.props.children as any[];
    const baselineLine = children.find((c: any) => c && c.type === "line");
    expect(baselineLine).toBeTruthy();
    expect(baselineLine.props.strokeDasharray).toBe("4 3");
  });

  test("renders nothing for fewer than two points", () => {
    expect(Sparkline({ data: [5] })).toBeNull();
  });
});
