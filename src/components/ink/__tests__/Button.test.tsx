import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "../Button";
import { describe, test, expect } from "bun:test";

describe("Button Component", () => {
  describe("Rendering", () => {
    test("renders as a button element by default", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeTruthy();
      expect(button.tagName).toBe("BUTTON");
    });

    test("renders as a child element when asChild=true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole("link", { name: /link button/i });
      expect(link).toBeTruthy();
      expect(link.tagName).toBe("A");
    });

    test("renders with correct text content", () => {
      render(<Button>Submit Form</Button>);
      expect(screen.getByText("Submit Form")).toBeTruthy();
    });

    test("renders with icon and text content", () => {
      render(
        <Button>
          <span data-testid="icon">→</span>
          Next
        </Button>
      );
      expect(screen.getByTestId("icon")).toBeTruthy();
      expect(screen.getByText("Next")).toBeTruthy();
    });
  });

  describe("Variants", () => {
    test("applies default variant by default", () => {
      const { container } = render(<Button>Default</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("bg-[var(--ds-gray-1000)]");
      expect(button?.className).toContain("text-[var(--ds-background-100)]");
    });

    test("applies primary variant", () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("bg-[var(--ds-ember-600)]");
      expect(button?.className).toContain("text-[var(--ds-background-100)]");
    });

    test("applies secondary variant", () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("border-[var(--ds-gray-400)]");
      expect(button?.className).toContain("text-[var(--ds-gray-1000)]");
      expect(button?.className).toContain("bg-transparent");
    });

    test("applies ghost variant", () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("text-[var(--ds-gray-1000)]");
      expect(button?.className).toContain("bg-transparent");
    });

    test("applies destructive variant", () => {
      const { container } = render(<Button variant="destructive">Delete</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("bg-[var(--ds-red-600)]");
      expect(button?.className).toContain("text-[var(--ds-background-100)]");
    });

    test("applies link variant", () => {
      const { container } = render(<Button variant="link">Link</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("text-[var(--ds-blue-600)]");
      expect(button?.className).toContain("underline");
    });
  });

  describe("Sizes", () => {
    test("applies sm size", () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("px-3");
      expect(button?.className).toContain("py-2");
    });

    test("applies md size by default", () => {
      const { container } = render(<Button>Medium</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("px-4");
      expect(button?.className).toContain("py-2");
    });

    test("applies lg size", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("px-4");
      expect(button?.className).toContain("py-3");
    });
  });

  describe("Full Width", () => {
    test("does not apply w-full by default", () => {
      const { container } = render(<Button>Default Width</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("w-auto");
    });

    test("applies w-full when fullWidth=true", () => {
      const { container } = render(<Button fullWidth>Full Width</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("w-full");
    });
  });

  describe("Interaction", () => {
    test("supports disabled state", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button.hasAttribute("disabled")).toBe(true);
      expect(button.className).toContain("disabled:opacity-50");
      expect(button.className).toContain("disabled:cursor-not-allowed");
    });

    test("receives focus on keyboard navigation", () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole("button");
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    test("applies focus ring styling", () => {
      const { container } = render(<Button>Focused</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("focus-visible:ring-[2px]");
      expect(button?.className).toContain("focus-visible:ring-offset-2");
    });
  });

  describe("Composition with children", () => {
    test("renders multiple child nodes", () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Label</span>
        </Button>
      );
      expect(screen.getByText("Icon")).toBeTruthy();
      expect(screen.getByText("Label")).toBeTruthy();
    });

    test("applies gap between children", () => {
      const { container } = render(
        <Button>
          <span>A</span>
          <span>B</span>
        </Button>
      );
      const button = container.querySelector("button");
      expect(button?.className).toContain("gap-2");
    });
  });

  describe("Accessibility", () => {
    test("has correct button role", () => {
      render(<Button>Accessible Button</Button>);
      expect(screen.getByRole("button")).toBeTruthy();
    });

    test("supports aria-label", () => {
      render(<Button aria-label="Close dialog">×</Button>);
      expect(screen.getByLabelText("Close dialog")).toBeTruthy();
    });

    test("respects aria-disabled", () => {
      render(<Button aria-disabled="true">Disabled</Button>);
      expect(screen.getByRole("button").getAttribute("aria-disabled")).toBe("true");
    });
  });

  describe("Forward Ref", () => {
    test("forwards ref to button element", () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("Edge Cases", () => {
    test("handles empty content gracefully", () => {
      const { container } = render(<Button />);
      const button = container.querySelector("button");
      expect(button).toBeTruthy();
    });

    test("handles very long text content", () => {
      const longText = "A".repeat(200);
      render(<Button>{longText}</Button>);
      expect(screen.getByText(longText)).toBeTruthy();
    });

    test("handles className prop alongside variant styles", () => {
      const { container } = render(
        <Button className="custom-class">Styled</Button>
      );
      const button = container.querySelector("button");
      expect(button?.className).toContain("custom-class");
      expect(button?.className).toContain("bg-[var(--ds-gray-1000)]");
    });
  });
});

describe("buttonVariants CVA", () => {
  test("exports buttonVariants function", () => {
    expect(typeof buttonVariants).toBe("function");
  });

  test("generates variant classes", () => {
    const classes = buttonVariants({ variant: "primary", size: "lg" });
    expect(classes).toContain("bg-[var(--ds-ember-600)]");
    expect(classes).toContain("px-4");
    expect(classes).toContain("py-3");
  });

  test("handles undefined variant gracefully", () => {
    const classes = buttonVariants({});
    expect(classes).toBeTruthy();
    expect(typeof classes).toBe("string");
  });

  test("combines variant with fullWidth", () => {
    const classes = buttonVariants({
      variant: "secondary",
      fullWidth: true,
    });
    expect(classes).toContain("w-full");
    expect(classes).toContain("border-[var(--ds-gray-400)]");
  });
});
