import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { PanelSkeleton } from "./PanelSkeleton";

describe("PanelSkeleton", () => {
  test("renders as a div with role=status for a11y live region", () => {
    const el = PanelSkeleton({});
    expect((el.props as { role?: string })?.role).toBe("status");
    expect(el.type).toBe("div");
  });

  test("has flex column layout with 12px gap", () => {
    const el = PanelSkeleton({});
    const styles = (el.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.display).toBe("flex");
    expect(styles.flexDirection).toBe("column");
    expect(styles.gap).toBe(12);
  });

  test("renders successfully with default rows", () => {
    const el = PanelSkeleton({});
    expect(el).toBeDefined();
    expect(el.type).toBe("div");
  });

  test("renders successfully with custom row heights", () => {
    const el = PanelSkeleton({ rows: [40, 80, 120] });
    expect(el).toBeDefined();
    expect(el.type).toBe("div");
  });

  test("accepts and renders single custom row", () => {
    const el = PanelSkeleton({ rows: [100] });
    expect(el).toBeDefined();
    expect(el.type).toBe("div");
  });

  test("component renders without crashing", () => {
    expect(() => {
      PanelSkeleton({});
      PanelSkeleton({ rows: [50] });
      PanelSkeleton({ rows: [100, 200, 300] });
    }).not.toThrow();
  });

  test("renders with skeleton loading UX (gap, layout)", () => {
    const el = PanelSkeleton({});
    const styles = (el.props as { style?: Record<string, unknown> })?.style ?? {};
    // Verify the layout structure is in place for loading skeleton
    expect(styles.display).toBe("flex");
    expect(styles.gap).toBe(12);
  });
});
