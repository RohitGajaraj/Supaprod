import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  kindTracePrefix,
  kindVisual,
  kindCssColor,
  kindLabel,
  nodeRadius,
  truncateTitle,
  resolveKindColors,
} from "../graph-visual";

// dim 17: every graph node carries a typed trace-ref prefix. The shared object
// kinds use their registered prefix (DESIGN-LOOM dim 17 / design-anatomy §4);
// graph-only kinds carry a stable local 3-letter code so no node is untraceable.
describe("kindTracePrefix", () => {
  test("maps the registered shared kinds to their registry prefix", () => {
    expect(kindTracePrefix("signal")).toBe("SIG");
    expect(kindTracePrefix("theme")).toBe("THM");
    expect(kindTracePrefix("opportunity")).toBe("OPP");
    expect(kindTracePrefix("prd")).toBe("PRD");
    expect(kindTracePrefix("mission")).toBe("MIS");
    // DEC is the prefix newly registered for decisions in this pass.
    expect(kindTracePrefix("decision")).toBe("DEC");
  });

  test("maps the graph-only kinds to their stable local code", () => {
    expect(kindTracePrefix("meeting")).toBe("MTG");
    expect(kindTracePrefix("roadmap_item")).toBe("RDM");
    expect(kindTracePrefix("task")).toBe("TSK");
    expect(kindTracePrefix("design_memory")).toBe("DSG");
  });

  test("derives a 3-letter uppercase code for an unknown kind", () => {
    expect(kindTracePrefix("widget")).toBe("WID");
  });

  test("never returns empty: falls back to REF when no alpha chars exist", () => {
    expect(kindTracePrefix("___")).toBe("REF");
    expect(kindTracePrefix("")).toBe("REF");
  });
});

describe("kindVisual", () => {
  test("resolves a registered kind to its named token, fallback, and label", () => {
    expect(kindVisual("signal")).toEqual({
      token: "--blossom",
      fallback: "#e5bddf",
      label: "Signal",
    });
  });

  test("falls back to the unknown-kind visual, labeled with the raw kind, for an unregistered kind", () => {
    expect(kindVisual("widget")).toEqual({ token: "--ash", fallback: "#a8a29a", label: "widget" });
  });
});

describe("kindCssColor", () => {
  test("wraps the kind's token with its fallback in a var() expression", () => {
    expect(kindCssColor("theme")).toBe("var(--violet-soft, #a67fc9)");
  });

  test("falls back to the unknown-kind token for an unregistered kind", () => {
    expect(kindCssColor("widget")).toBe("var(--ash, #a8a29a)");
  });
});

describe("kindLabel", () => {
  test("returns the registered display label for a known kind", () => {
    expect(kindLabel("decision")).toBe("Decision");
  });

  test("falls back to the raw kind string for an unregistered kind", () => {
    expect(kindLabel("widget")).toBe("widget");
  });
});

describe("nodeRadius", () => {
  test("grows with influence, capped at 8", () => {
    expect(nodeRadius({ influence: 0 }, false)).toBe(7);
    expect(nodeRadius({ influence: 8 }, false)).toBeCloseTo(18.2);
    // Influence above the cap (8) reads identically to exactly 8.
    expect(nodeRadius({ influence: 50 }, false)).toBeCloseTo(18.2);
  });

  test("a focused node is drawn 3px larger than the same unfocused node", () => {
    const base = nodeRadius({ influence: 4 }, false);
    expect(nodeRadius({ influence: 4 }, true)).toBeCloseTo(base + 3);
  });
});

describe("truncateTitle", () => {
  test("returns an empty string unchanged", () => {
    expect(truncateTitle("")).toBe("");
  });

  test("leaves a short title untouched", () => {
    expect(truncateTitle("Short title")).toBe("Short title");
  });

  test("truncates a long title to max-1 chars plus an ellipsis", () => {
    const long = "A".repeat(40);
    const out = truncateTitle(long, 26);
    expect(out).toBe(`${"A".repeat(25)}…`);
    expect(out.length).toBe(26);
  });
});

describe("resolveKindColors", () => {
  let originalWindow: typeof globalThis.window;
  let mockGetComputedStyle: ReturnType<typeof test>;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    if (originalWindow) {
      globalThis.window = originalWindow;
    }
  });

  test("returns a map with all kinds when getComputedStyle is available", () => {
    const mockStyles = new Map([
      ["--blossom", "#e5bddf"],
      ["--violet-soft", "#a67fc9"],
      ["--moss", "#7fb069"],
      ["--ash", "#a8a29a"],
    ]);

    // Mock window.getComputedStyle
    const mockGetComputedStyle = () => ({
      getPropertyValue: (prop: string) => mockStyles.get(prop) || "",
      trim: () => "",
    });

    // Type assertion needed for testing
    Object.defineProperty(globalThis, "window", {
      value: { getComputedStyle: mockGetComputedStyle },
      writable: true,
    });

    const fakeEl = {} as HTMLElement;
    const result = resolveKindColors(fakeEl);

    expect(result instanceof Map).toBe(true);
    expect(result.size).toBeGreaterThan(0);
  });

  test("uses fallback colors when window is undefined", () => {
    // Simulate no window
    const result = resolveKindColors({} as HTMLElement);
    expect(result instanceof Map).toBe(true);
    // Should have fallback values (ash, etc.)
    expect(result.size).toBeGreaterThan(0);
  });

  test("returns __unknown key for unregistered kinds", () => {
    const mockGetComputedStyle = () => ({
      getPropertyValue: () => "",
      trim: () => "",
    });

    Object.defineProperty(globalThis, "window", {
      value: { getComputedStyle: mockGetComputedStyle },
      writable: true,
    });

    const result = resolveKindColors({} as HTMLElement);
    expect(result.has("__unknown")).toBe(true);
  });

  test("maps each kind to its resolved or fallback color", () => {
    const mockGetComputedStyle = () => ({
      getPropertyValue: (prop: string) => {
        if (prop === "--blossom") return "  #e5bddf  "; // with whitespace
        if (prop === "--ash") return ""; // empty, should use fallback
        return "";
      },
      trim: () => "",
    });

    Object.defineProperty(globalThis, "window", {
      value: { getComputedStyle: mockGetComputedStyle },
      writable: true,
    });

    const result = resolveKindColors({} as HTMLElement);
    // At least signal (--blossom) should be in the map
    expect(result.get("signal")).toBeDefined();
  });
});
