/**
 * Spinner component tests — Tempo v5 animated loading indicator.
 *
 * Coverage: size variants, class composition, reduced-motion gate,
 * forwardRef, accessibility, edge cases.
 *
 * TDD approach: tests were written to describe behavior first.
 * Every class assertion targets a documented design token so a
 * rename of the token will surface here before it surfaces in the UI.
 */

import { describe, test, expect } from "bun:test";
import React from "react";
import { render } from "@testing-library/react";
import { Spinner } from "../Spinner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSpinner(props: React.ComponentPropsWithoutRef<"div"> & { size?: "sm" | "md" | "lg" } = {}) {
  const { container } = render(React.createElement(Spinner, props));
  return container.querySelector("div") as HTMLDivElement;
}

// ---------------------------------------------------------------------------
// Rendering — base element
// ---------------------------------------------------------------------------

describe("Spinner — base rendering", () => {
  test("renders a single div element", () => {
    const { container } = render(React.createElement(Spinner, null));
    expect(container.querySelectorAll("div")).toHaveLength(1);
  });

  test("renders nothing else — no extra wrappers", () => {
    const { container } = render(React.createElement(Spinner, null));
    // The top-level container div is RTL's own; the one child is our spinner
    expect(container.firstElementChild?.tagName).toBe("DIV");
    expect(container.firstElementChild?.children).toHaveLength(0);
  });

  test("displayName is set", () => {
    expect(Spinner.displayName).toBe("Spinner");
  });
});

// ---------------------------------------------------------------------------
// Class composition — design-system tokens
// ---------------------------------------------------------------------------

describe("Spinner — class tokens", () => {
  test("applies inline-block layout class", () => {
    const el = renderSpinner();
    expect(el.className).toContain("inline-block");
  });

  test("applies rounded-full (pill shape)", () => {
    const el = renderSpinner();
    expect(el.className).toContain("rounded-full");
  });

  test("applies animate-spin by default", () => {
    const el = renderSpinner();
    expect(el.className).toContain("animate-spin");
  });

  test("applies gray border color tokens", () => {
    const el = renderSpinner();
    expect(el.className).toContain("border-[var(--ds-gray-400)]");
  });

  test("applies contrasting top-border color token for the spinning arc", () => {
    const el = renderSpinner();
    expect(el.className).toContain("border-t-[var(--ds-gray-600)]");
  });
});

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

describe("Spinner — size variants", () => {
  test("defaults to md size when no size prop is given", () => {
    const el = renderSpinner();
    expect(el.className).toContain("h-6");
    expect(el.className).toContain("w-6");
  });

  test("sm: applies 16px (h-4 w-4) dimensions", () => {
    const el = renderSpinner({ size: "sm" });
    expect(el.className).toContain("h-4");
    expect(el.className).toContain("w-4");
  });

  test("md: applies 24px (h-6 w-6) dimensions", () => {
    const el = renderSpinner({ size: "md" });
    expect(el.className).toContain("h-6");
    expect(el.className).toContain("w-6");
  });

  test("lg: applies 32px (h-8 w-8) dimensions", () => {
    const el = renderSpinner({ size: "lg" });
    expect(el.className).toContain("h-8");
    expect(el.className).toContain("w-8");
  });

  test("sm: applies 2px border thickness", () => {
    const el = renderSpinner({ size: "sm" });
    expect(el.className).toContain("border-2");
  });

  test("lg: applies 3px border thickness (border-3)", () => {
    const el = renderSpinner({ size: "lg" });
    expect(el.className).toContain("border-3");
  });

  test("invalid size prop does not crash (TypeScript prevents it, runtime graceful)", () => {
    // At runtime, an unknown size would fall through to undefined; test that no exception is thrown.
    expect(() =>
      render(React.createElement(Spinner, { size: "xl" as never })),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Reduced-motion gate — data-motion=off
// ---------------------------------------------------------------------------

describe("Spinner — data-motion=off reduces motion", () => {
  test("carries data-[motion=off]:animate-none class in the class string", () => {
    // The Tailwind class is applied statically; the browser activates it when
    // the element has data-motion="off". We verify the class is present in the
    // compiled class list so the CSS hook can fire.
    const el = renderSpinner();
    expect(el.className).toContain("data-[motion=off]:animate-none");
  });

  test("carries data-[motion=off]:border-t-[var(--ds-gray-400)] for static fallback arc", () => {
    const el = renderSpinner();
    expect(el.className).toContain("data-[motion=off]:border-t-[var(--ds-gray-400)]");
  });

  test("when data-motion=off attribute is set, element still renders", () => {
    const { container } = render(
      React.createElement(Spinner, { "data-motion": "off" }),
    );
    expect(container.querySelector("div")).toBeTruthy();
  });

  test("data-motion=off attribute is forwarded through ...props spread", () => {
    const { container } = render(
      React.createElement(Spinner, { "data-motion": "off" }),
    );
    const el = container.querySelector("div");
    expect(el?.getAttribute("data-motion")).toBe("off");
  });
});

// ---------------------------------------------------------------------------
// Custom className merging
// ---------------------------------------------------------------------------

describe("Spinner — className prop", () => {
  test("merges a custom className alongside default classes", () => {
    const el = renderSpinner({ className: "my-custom-spinner" });
    expect(el.className).toContain("my-custom-spinner");
    expect(el.className).toContain("animate-spin");
  });

  test("custom className does not strip default size classes", () => {
    const el = renderSpinner({ className: "text-red-500", size: "lg" });
    expect(el.className).toContain("h-8");
    expect(el.className).toContain("text-red-500");
  });

  test("custom className can override border color via Tailwind merge", () => {
    // twMerge lets a later border-t class win
    const el = renderSpinner({ className: "border-t-blue-500" });
    // The custom class must appear in the final class string
    expect(el.className).toContain("border-t-blue-500");
  });

  test("handles empty string className without error", () => {
    expect(() => renderSpinner({ className: "" })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// forwardRef
// ---------------------------------------------------------------------------

describe("Spinner — forwardRef", () => {
  test("forwards ref to the underlying div element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(React.createElement(Spinner, { ref }));
    expect(ref.current).toBeTruthy();
    expect(ref.current?.tagName).toBe("DIV");
  });

  test("ref is stable across re-renders", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender } = render(React.createElement(Spinner, { ref }));
    const firstEl = ref.current;
    rerender(React.createElement(Spinner, { ref, size: "lg" }));
    // Same DOM node (reconciled), not a fresh mount
    expect(ref.current).toBe(firstEl);
  });
});

// ---------------------------------------------------------------------------
// Extra HTML props passthrough
// ---------------------------------------------------------------------------

describe("Spinner — props passthrough", () => {
  test("passes arbitrary data attributes through", () => {
    const el = renderSpinner({ "data-testid": "my-spinner" } as never);
    expect(el.getAttribute("data-testid")).toBe("my-spinner");
  });

  test("passes aria-label through for screen reader context", () => {
    const el = renderSpinner({ "aria-label": "Loading" } as never);
    expect(el.getAttribute("aria-label")).toBe("Loading");
  });

  test("passes aria-hidden through for decorative-only usage", () => {
    const el = renderSpinner({ "aria-hidden": "true" } as never);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("passes id prop through", () => {
    const el = renderSpinner({ id: "page-loader" } as never);
    expect(el.id).toBe("page-loader");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("Spinner — edge cases", () => {
  test("renders without any props", () => {
    expect(() => render(React.createElement(Spinner, null))).not.toThrow();
  });

  test("multiple Spinners in the same tree are independent", () => {
    const { container } = render(
      React.createElement(
        "div",
        null,
        React.createElement(Spinner, { size: "sm" }),
        React.createElement(Spinner, { size: "lg" }),
      ),
    );
    // RTL wraps in a root div; our outer div wraps the two spinners
    const spinners = container.querySelectorAll("[class*='inline-block']");
    expect(spinners).toHaveLength(2);
    expect((spinners[0] as HTMLElement).className).toContain("h-4");
    expect((spinners[1] as HTMLElement).className).toContain("h-8");
  });
});
