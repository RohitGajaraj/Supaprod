import { describe, it, expect } from "bun:test";
import {
  kindVisual,
  kindCssColor,
  kindLabel,
  kindTracePrefix,
  nodeRadius,
  truncateTitle,
  computeReducedMotion,
  KIND_VISUAL,
} from "./graph-visual";

describe("computeReducedMotion", () => {
  it("should return true when media query matches", () => {
    expect(computeReducedMotion(true, undefined)).toBe(true);
  });

  it("should return true when data-motion is 'off'", () => {
    expect(computeReducedMotion(false, "off")).toBe(true);
  });

  it("should return true when both are enabled", () => {
    expect(computeReducedMotion(true, "off")).toBe(true);
  });

  it("should return false when neither is enabled", () => {
    expect(computeReducedMotion(false, undefined)).toBe(false);
  });

  it("should return false when data-motion is empty string", () => {
    expect(computeReducedMotion(false, "")).toBe(false);
  });

  it("should return false when data-motion is other value", () => {
    expect(computeReducedMotion(false, "on")).toBe(false);
  });

  it("should be case-sensitive for data-motion", () => {
    expect(computeReducedMotion(false, "OFF")).toBe(false);
  });

  it("should prioritize media query in OR logic", () => {
    // True || false = true
    expect(computeReducedMotion(true, undefined)).toBe(true);
    // False || false = false
    expect(computeReducedMotion(false, undefined)).toBe(false);
  });
});

describe("kindVisual", () => {
  it("should return visual for known kind", () => {
    const visual = kindVisual("decision");

    expect(visual).toBeDefined();
    expect(visual.token).toBe("--ember-soft");
    expect(visual.fallback).toBe("#ffa477");
    expect(visual.label).toBe("Decision");
  });

  it("should return visual for all registered kinds", () => {
    const kinds = [
      "decision",
      "signal",
      "theme",
      "opportunity",
      "prd",
      "roadmap_item",
      "task",
      "meeting",
      "mission",
      "design_memory",
    ];

    for (const kind of kinds) {
      const visual = kindVisual(kind);
      expect(visual.token).toBeDefined();
      expect(visual.fallback).toBeDefined();
      expect(visual.label).toBeDefined();
    }
  });

  it("should return unknown visual with kind label for unregistered kind", () => {
    const visual = kindVisual("custom_kind");

    expect(visual.token).toBe("--ash");
    expect(visual.fallback).toBe("#a8a29a");
    expect(visual.label).toBe("custom_kind");
  });

  it("should preserve token structure", () => {
    const visual = kindVisual("signal");

    expect(visual.token).toMatch(/^--/);
    expect(visual.fallback).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("kindCssColor", () => {
  it("should return CSS var with fallback", () => {
    const color = kindCssColor("decision");

    expect(color).toBe("var(--ember-soft, #ffa477)");
  });

  it("should work for all registered kinds", () => {
    for (const kind of Object.keys(KIND_VISUAL)) {
      const color = kindCssColor(kind);
      expect(color).toMatch(/^var\(--[\w-]+, #[0-9a-f]{6}\)$/);
    }
  });

  it("should generate valid CSS for unregistered kind", () => {
    const color = kindCssColor("unknown");

    expect(color).toBe("var(--ash, #a8a29a)");
  });

  it("should be usable in CSS", () => {
    const color = kindCssColor("signal");

    expect(color).toContain("var(");
    expect(color).toContain("--");
  });
});

describe("kindLabel", () => {
  it("should return label for known kind", () => {
    expect(kindLabel("decision")).toBe("Decision");
    expect(kindLabel("signal")).toBe("Signal");
    expect(kindLabel("task")).toBe("Task");
  });

  it("should return kind name for unknown kind", () => {
    expect(kindLabel("custom")).toBe("custom");
  });

  it("should handle empty kind", () => {
    const label = kindLabel("");

    expect(typeof label).toBe("string");
  });

  it("should be human-readable", () => {
    const label = kindLabel("design_memory");

    expect(label).toBe("Design");
  });
});

describe("kindTracePrefix", () => {
  it("should return registered prefix for known kind", () => {
    expect(kindTracePrefix("signal")).toBe("SIG");
    expect(kindTracePrefix("theme")).toBe("THM");
    expect(kindTracePrefix("mission")).toBe("MIS");
  });

  it("should return all 3-letter prefixes", () => {
    const prefixes = [
      ["signal", "SIG"],
      ["theme", "THM"],
      ["opportunity", "OPP"],
      ["prd", "PRD"],
      ["mission", "MIS"],
      ["decision", "DEC"],
      ["meeting", "MTG"],
      ["roadmap_item", "RDM"],
      ["task", "TSK"],
      ["design_memory", "DSG"],
    ];

    for (const [kind, expected] of prefixes) {
      expect(kindTracePrefix(kind)).toBe(expected);
    }
  });

  it("should generate prefix for unknown kind from letters", () => {
    const prefix = kindTracePrefix("foobar");

    expect(prefix).toBe("FOO");
    expect(prefix.length).toBe(3);
  });

  it("should strip non-letter characters", () => {
    const prefix = kindTracePrefix("foo_bar_baz");

    expect(prefix).not.toContain("_");
    expect(prefix.length).toBeLessThanOrEqual(3);
  });

  it("should uppercase result", () => {
    const prefix = kindTracePrefix("foobar");

    expect(prefix).toBe(prefix.toUpperCase());
  });

  it("should return REF for empty or no-letter kind", () => {
    expect(kindTracePrefix("123")).toBe("REF");
    expect(kindTracePrefix("   ")).toBe("REF");
  });
});

describe("nodeRadius", () => {
  it("should return base radius for non-focus node with zero influence", () => {
    const radius = nodeRadius({ influence: 0 }, false);

    expect(radius).toBe(7);
  });

  it("should increase with influence", () => {
    const r0 = nodeRadius({ influence: 0 }, false);
    const r4 = nodeRadius({ influence: 4 }, false);
    const r8 = nodeRadius({ influence: 8 }, false);

    expect(r4).toBeGreaterThan(r0);
    expect(r8).toBeGreaterThan(r4);
  });

  it("should add bonus for focus node", () => {
    const unfocused = nodeRadius({ influence: 5 }, false);
    const focused = nodeRadius({ influence: 5 }, true);

    expect(focused).toBe(unfocused + 3);
  });

  it("should cap influence at 8", () => {
    const r8 = nodeRadius({ influence: 8 }, false);
    const r100 = nodeRadius({ influence: 100 }, false);

    expect(r100).toBe(r8);
  });

  it("should scale by 1.4", () => {
    // base = 7 + Math.min(influence, 8) * 1.4
    const r1 = nodeRadius({ influence: 1 }, false);
    expect(r1).toBe(7 + 1.4);

    const r5 = nodeRadius({ influence: 5 }, false);
    expect(r5).toBe(7 + 5 * 1.4);
  });

  it("should return positive numbers", () => {
    expect(nodeRadius({ influence: 0 }, false)).toBeGreaterThan(0);
    expect(nodeRadius({ influence: 100 }, true)).toBeGreaterThan(0);
  });
});

describe("truncateTitle", () => {
  it("should not truncate short strings", () => {
    expect(truncateTitle("hello", 10)).toBe("hello");
  });

  it("should truncate long strings", () => {
    const result = truncateTitle("hello world this is long", 10);

    expect(result.length).toBeLessThanOrEqual(10);
    expect(result).toContain("…");
  });

  it("should default max to 26", () => {
    const short = "a".repeat(25);
    const long = "a".repeat(30);

    expect(truncateTitle(short)).toBe(short);
    expect(truncateTitle(long)).toContain("…");
  });

  it("should preserve prefix of string", () => {
    const result = truncateTitle("hello world", 8);

    expect(result).toContain("hello");
  });

  it("should handle empty string", () => {
    expect(truncateTitle("", 10)).toBe("");
  });

  it("should use ellipsis character", () => {
    const result = truncateTitle("very long string", 5);

    expect(result).toContain("…");
  });

  it("should not exceed max length including ellipsis", () => {
    const result = truncateTitle("hello world test", 10);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("should handle max=1", () => {
    const result = truncateTitle("hello", 1);

    expect(result).toBe("…");
  });

  it("should handle exactly at boundary", () => {
    expect(truncateTitle("hello", 5)).toBe("hello");
  });
});
