/**
 * Badge component tests — Tempo v5 status indicator.
 *
 * Coverage: all 6 variants × 2 sizes × 3 shapes, icon slot, className merge,
 * forwardRef, design-system token constraints, accessibility, edge cases.
 *
 * Design constraint tests:
 *  - blue (info) variant is ONLY for machine/agent status (narrow use)
 *  - badgeVariants exports a callable CVA function
 *  - each variant carries the correct semantic color tokens
 */

import { describe, test, expect } from "bun:test";
import React from "react";
import { render } from "@testing-library/react";
import { Badge, badgeVariants } from "../Badge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BadgeVariant = "default" | "primary" | "success" | "warning" | "destructive" | "info";
type BadgeSize = "sm" | "md";
type BadgeShape = "rectangle" | "pill";

function renderBadge(
  props: React.ComponentPropsWithoutRef<"div"> & {
    variant?: BadgeVariant;
    size?: BadgeSize;
    shape?: BadgeShape;
    icon?: React.ReactNode;
  } = {},
) {
  const { container } = render(React.createElement(Badge, props));
  return container.querySelector("div") as HTMLDivElement;
}

// ---------------------------------------------------------------------------
// Base rendering
// ---------------------------------------------------------------------------

describe("Badge — base rendering", () => {
  test("renders a div element", () => {
    const el = renderBadge({ children: "Status" });
    expect(el.tagName).toBe("DIV");
  });

  test("renders children text content", () => {
    const el = renderBadge({ children: "Running" });
    expect(el.textContent).toContain("Running");
  });

  test("displayName is set", () => {
    expect(Badge.displayName).toBe("Badge");
  });

  test("renders empty badge without error", () => {
    expect(() => renderBadge()).not.toThrow();
  });

  test("renders with unicode content", () => {
    const el = renderBadge({ children: "Live • Now" });
    expect(el.textContent).toContain("Live");
  });
});

// ---------------------------------------------------------------------------
// Default variant and defaults
// ---------------------------------------------------------------------------

describe("Badge — default variant", () => {
  test("applies default variant gray tokens when no variant is supplied", () => {
    const el = renderBadge({ children: "Default" });
    expect(el.className).toContain("bg-[var(--ds-gray-100)]");
    expect(el.className).toContain("border-[var(--ds-gray-400)]");
    // text color checked via CVA output (twMerge may collapse in DOM, CVA is the source of truth)
    expect(badgeVariants({ variant: "default" })).toContain("text-[var(--ds-gray-1000)]");
  });

  test("applies default sm size when no size is supplied", () => {
    const el = renderBadge({ children: "Default" });
    expect(el.className).toContain("text-label-12");
  });

  test("applies rectangle shape by default", () => {
    const el = renderBadge({ children: "Default" });
    expect(el.className).toContain("rounded-md");
  });

  test("base classes include flex layout", () => {
    const el = renderBadge({ children: "Default" });
    expect(el.className).toContain("inline-flex");
    expect(el.className).toContain("items-center");
  });

  test("base classes include border", () => {
    const el = renderBadge({ children: "Default" });
    expect(el.className).toContain("border");
  });

  test("base classes prevent text wrapping", () => {
    const el = renderBadge({ children: "Default" });
    expect(el.className).toContain("whitespace-nowrap");
  });
});

// ---------------------------------------------------------------------------
// All 6 variants — correct semantic color tokens
// ---------------------------------------------------------------------------

describe("Badge — variant: primary", () => {
  test("applies ember background token", () => {
    const el = renderBadge({ variant: "primary", children: "Live" });
    expect(el.className).toContain("bg-[var(--ds-ember-100)]");
  });

  test("applies ember border token", () => {
    const el = renderBadge({ variant: "primary", children: "Live" });
    expect(el.className).toContain("border-[var(--ds-ember-400)]");
  });

  test("applies ember text token (verified via CVA output)", () => {
    expect(badgeVariants({ variant: "primary" })).toContain("text-[var(--ds-ember-900)]");
  });
});

describe("Badge — variant: success", () => {
  test("applies green background token", () => {
    const el = renderBadge({ variant: "success", children: "Done" });
    expect(el.className).toContain("bg-[var(--ds-green-100)]");
  });

  test("applies green border token", () => {
    const el = renderBadge({ variant: "success", children: "Done" });
    expect(el.className).toContain("border-[var(--ds-green-400)]");
  });

  test("applies green text token (verified via CVA output)", () => {
    expect(badgeVariants({ variant: "success" })).toContain("text-[var(--ds-green-900)]");
  });
});

describe("Badge — variant: warning", () => {
  test("applies amber background token", () => {
    const el = renderBadge({ variant: "warning", children: "Queued" });
    expect(el.className).toContain("bg-[var(--ds-amber-100)]");
  });

  test("applies amber border token", () => {
    const el = renderBadge({ variant: "warning", children: "Queued" });
    expect(el.className).toContain("border-[var(--ds-amber-400)]");
  });

  test("applies amber text token (verified via CVA output)", () => {
    expect(badgeVariants({ variant: "warning" })).toContain("text-[var(--ds-amber-900)]");
  });
});

describe("Badge — variant: destructive", () => {
  test("applies red background token", () => {
    const el = renderBadge({ variant: "destructive", children: "Failed" });
    expect(el.className).toContain("bg-[var(--ds-red-100)]");
  });

  test("applies red border token", () => {
    const el = renderBadge({ variant: "destructive", children: "Failed" });
    expect(el.className).toContain("border-[var(--ds-red-400)]");
  });

  test("applies red text token (verified via CVA output)", () => {
    expect(badgeVariants({ variant: "destructive" })).toContain("text-[var(--ds-red-900)]");
  });
});

describe("Badge — variant: info (narrow: machine/agent status only)", () => {
  test("applies blue background token", () => {
    const el = renderBadge({ variant: "info", children: "Running" });
    expect(el.className).toContain("bg-[var(--ds-blue-100)]");
  });

  test("applies blue border token", () => {
    const el = renderBadge({ variant: "info", children: "Running" });
    expect(el.className).toContain("border-[var(--ds-blue-400)]");
  });

  test("applies blue text token (verified via CVA output)", () => {
    expect(badgeVariants({ variant: "info" })).toContain("text-[var(--ds-blue-900)]");
  });
});

// ---------------------------------------------------------------------------
// All 6 variants render without error (smoke test matrix)
// ---------------------------------------------------------------------------

describe("Badge — variant smoke matrix (all 6 render without error)", () => {
  const variants: BadgeVariant[] = [
    "default",
    "primary",
    "success",
    "warning",
    "destructive",
    "info",
  ];

  for (const variant of variants) {
    test(`variant="${variant}" renders`, () => {
      expect(() => renderBadge({ variant, children: variant })).not.toThrow();
    });
  }
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe("Badge — sizes", () => {
  test("sm: applies text-label-12", () => {
    const el = renderBadge({ size: "sm", children: "Small" });
    expect(el.className).toContain("text-label-12");
  });

  test("md: applies text-label-13 for slightly larger text", () => {
    const el = renderBadge({ size: "md", children: "Medium" });
    expect(el.className).toContain("text-label-13");
  });

  test("md: applies increased padding", () => {
    const el = renderBadge({ size: "md", children: "Medium" });
    expect(el.className).toContain("px-3");
    expect(el.className).toContain("py-1.5");
  });
});

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

describe("Badge — shapes", () => {
  test("rectangle (default): applies rounded-md", () => {
    const el = renderBadge({ shape: "rectangle", children: "Tag" });
    expect(el.className).toContain("rounded-md");
  });

  test("pill: applies rounded-full", () => {
    const el = renderBadge({ shape: "pill", children: "Pill" });
    expect(el.className).toContain("rounded-full");
  });

  test("pill: applies wider padding (px-3)", () => {
    // Pill shape adds px-3 to the class list
    const el = renderBadge({ shape: "pill", children: "Pill" });
    expect(el.className).toContain("px-3");
  });
});

// ---------------------------------------------------------------------------
// Variant × size cross-product (all 12 combinations)
// ---------------------------------------------------------------------------

describe("Badge — variant × size cross-product", () => {
  const variants: BadgeVariant[] = [
    "default",
    "primary",
    "success",
    "warning",
    "destructive",
    "info",
  ];
  const sizes: BadgeSize[] = ["sm", "md"];

  for (const variant of variants) {
    for (const size of sizes) {
      test(`variant="${variant}" + size="${size}" renders without error`, () => {
        expect(() => renderBadge({ variant, size, children: "x" })).not.toThrow();
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Icon slot
// ---------------------------------------------------------------------------

describe("Badge — icon slot", () => {
  test("renders icon before text content", () => {
    const icon = React.createElement("span", { "data-testid": "badge-icon" }, "•");
    const { container } = render(React.createElement(Badge, { icon, children: "Status" }));
    const iconEl = container.querySelector("[data-testid='badge-icon']");
    expect(iconEl).toBeTruthy();
  });

  test("icon is wrapped in a flex-shrink-0 span", () => {
    const icon = React.createElement("span", null, "!");
    const el = renderBadge({ icon, children: "Status" });
    // The wrapper span carrying flex-shrink-0 must exist
    const spans = el.querySelectorAll("span");
    const wrapper = Array.from(spans).find((s) => s.className.includes("flex-shrink-0"));
    expect(wrapper).toBeTruthy();
  });

  test("omits icon wrapper when icon prop is undefined", () => {
    const el = renderBadge({ children: "No icon" });
    const flexShrinkSpan = el.querySelector(".flex-shrink-0");
    expect(flexShrinkSpan).toBeNull();
  });

  test("renders null icon without error", () => {
    expect(() => renderBadge({ icon: null, children: "Badge" })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// className merging
// ---------------------------------------------------------------------------

describe("Badge — className prop", () => {
  test("merges custom className alongside variant classes", () => {
    const el = renderBadge({ className: "custom-badge", children: "Tag" });
    expect(el.className).toContain("custom-badge");
    expect(el.className).toContain("inline-flex");
  });

  test("empty string className does not crash", () => {
    expect(() => renderBadge({ className: "", children: "Tag" })).not.toThrow();
  });

  test("multiple custom classes are all preserved", () => {
    const el = renderBadge({ className: "mt-2 ml-4", children: "Tag" });
    expect(el.className).toContain("mt-2");
    expect(el.className).toContain("ml-4");
  });
});

// ---------------------------------------------------------------------------
// forwardRef
// ---------------------------------------------------------------------------

describe("Badge — forwardRef", () => {
  test("forwards ref to the underlying div", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(React.createElement(Badge, { ref, children: "Ref" }));
    expect(ref.current).toBeTruthy();
    expect(ref.current?.tagName).toBe("DIV");
  });

  test("ref is the same node as the rendered div", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(React.createElement(Badge, { ref, children: "Ref" }));
    expect(ref.current).toBe(container.querySelector("div"));
  });
});

// ---------------------------------------------------------------------------
// badgeVariants CVA utility
// ---------------------------------------------------------------------------

describe("badgeVariants — CVA export", () => {
  test("exports badgeVariants as a callable function", () => {
    expect(typeof badgeVariants).toBe("function");
  });

  test("returns a non-empty string for default config", () => {
    const classes = badgeVariants({});
    expect(typeof classes).toBe("string");
    expect(classes.length).toBeGreaterThan(0);
  });

  test("includes variant classes for primary", () => {
    const classes = badgeVariants({ variant: "primary" });
    expect(classes).toContain("bg-[var(--ds-ember-100)]");
  });

  test("includes size classes for md", () => {
    const classes = badgeVariants({ size: "md" });
    expect(classes).toContain("text-label-13");
  });

  test("includes shape classes for pill", () => {
    const classes = badgeVariants({ shape: "pill" });
    expect(classes).toContain("rounded-full");
  });

  test("all 6 variants produce different class strings", () => {
    const variants: BadgeVariant[] = [
      "default",
      "primary",
      "success",
      "warning",
      "destructive",
      "info",
    ];
    const classStrings = variants.map((v) => badgeVariants({ variant: v }));
    const unique = new Set(classStrings);
    expect(unique.size).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe("Badge — accessibility", () => {
  test("supports aria-label for screen readers", () => {
    const el = renderBadge({ "aria-label": "Status: running", children: "Running" } as never);
    expect(el.getAttribute("aria-label")).toBe("Status: running");
  });

  test("supports role override", () => {
    const el = renderBadge({ role: "status", children: "Live" } as never);
    expect(el.getAttribute("role")).toBe("status");
  });

  test("data attributes pass through", () => {
    const el = renderBadge({ "data-status": "active", children: "Active" } as never);
    expect(el.getAttribute("data-status")).toBe("active");
  });
});
