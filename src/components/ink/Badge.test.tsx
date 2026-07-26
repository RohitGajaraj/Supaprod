import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import { Badge, badgeVariants } from "./Badge";

describe("Badge", () => {
  describe("render", () => {
    it("renders text content", () => {
      const { container } = render(<Badge>Active</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.textContent).toBe("Active");
    });

    it("renders with default variant, size, and shape", () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("bg-[var(--ds-gray-100)]");
      expect(badge?.className).toContain("text-label-12");
      expect(badge?.className).toContain("rounded-md");
    });
  });

  describe("variant", () => {
    it("renders primary variant with ember colors", () => {
      const { container } = render(<Badge variant="primary">Live</Badge>);
      const badge = container.querySelector("div");
      // CVA generates background color for primary variant
      expect(badge?.className).toContain("bg-[var(--ds-ember-100)]");
      // Border is also applied
      expect(badge?.className).toContain("border-[var(--ds-ember-400)]");
    });

    it("renders success variant", () => {
      const { container } = render(<Badge variant="success">Done</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("bg-[var(--ds-green-100)]");
      expect(badge?.className).toContain("border-[var(--ds-green-400)]");
    });

    it("renders warning variant", () => {
      const { container } = render(<Badge variant="warning">Queued</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("bg-[var(--ds-amber-100)]");
      expect(badge?.className).toContain("border-[var(--ds-amber-400)]");
    });

    it("renders destructive variant", () => {
      const { container } = render(<Badge variant="destructive">Failed</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("bg-[var(--ds-red-100)]");
      expect(badge?.className).toContain("border-[var(--ds-red-400)]");
    });

    it("renders info variant", () => {
      const { container } = render(<Badge variant="info">Running</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("bg-[var(--ds-blue-100)]");
      expect(badge?.className).toContain("border-[var(--ds-blue-400)]");
    });
  });

  describe("size", () => {
    it("renders small size", () => {
      const { container } = render(<Badge size="sm">Sm</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("text-label-12");
    });

    it("renders medium size", () => {
      const { container } = render(<Badge size="md">Md</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("text-label-12");
    });
  });

  describe("shape", () => {
    it("renders rectangle shape by default", () => {
      const { container } = render(<Badge>Rect</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("rounded-md");
    });

    it("renders pill shape", () => {
      const { container } = render(<Badge shape="pill">Pill</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("rounded-full");
    });
  });

  describe("icon", () => {
    it("renders icon before text", () => {
      const { container } = render(
        <Badge icon={<span data-testid="icon">★</span>}>With Icon</Badge>,
      );
      const icon = container.querySelector("[data-testid='icon']");
      const badge = container.querySelector("div");
      expect(icon).toBeTruthy();
      expect(badge?.textContent).toContain("With Icon");
      // Icon should be wrapped in flex-shrink-0 span
      expect(icon?.parentElement?.className).toContain("flex-shrink-0");
      // And that wrapper should be inside the badge
      expect(icon?.parentElement?.parentElement).toBe(badge);
    });

    it("does not render icon span when icon is undefined", () => {
      const { container } = render(<Badge>No Icon</Badge>);
      const iconSpans = container.querySelectorAll("span");
      // Should have no icon wrapper (flex-shrink-0 is only on icon span)
      const iconWithShrink = Array.from(iconSpans).find((s) =>
        s.className.includes("flex-shrink-0"),
      );
      expect(iconWithShrink).toBeFalsy();
    });
  });

  describe("className merge", () => {
    it("merges custom className with variant classes", () => {
      const { container } = render(<Badge className="custom-class">Merged</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("custom-class");
      expect(badge?.className).toContain("bg-[var(--ds-gray-100)]");
    });

    it("allows className override of variant styles", () => {
      const { container } = render(<Badge className="!bg-red-500">Override</Badge>);
      const badge = container.querySelector("div");
      expect(badge?.className).toContain("!bg-red-500");
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to div element", () => {
      const ref = { current: null };
      render(<Badge ref={ref}>Ref Test</Badge>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe("DIV");
    });
  });

  describe("HTMLAttributes", () => {
    it("accepts standard HTML attributes", () => {
      const { container } = render(
        <Badge data-testid="badge-test" id="badge-id" title="Test Badge">
          Attrs
        </Badge>,
      );
      const badge = container.querySelector("[data-testid='badge-test']");
      expect(badge).toBeTruthy();
      expect(badge?.id).toBe("badge-id");
      expect(badge?.title).toBe("Test Badge");
    });

    it("accepts aria attributes for accessibility", () => {
      const { container } = render(
        <Badge aria-label="Status badge" role="status">
          Live
        </Badge>,
      );
      const badge = container.querySelector("[role='status']");
      expect(badge?.getAttribute("aria-label")).toBe("Status badge");
    });
  });

  describe("badgeVariants", () => {
    it("generates correct classes for variant combinations", () => {
      const classes = badgeVariants({ variant: "success", size: "md", shape: "pill" });
      expect(classes).toContain("bg-[var(--ds-green-100)]");
      expect(classes).toContain("text-label-12");
      expect(classes).toContain("rounded-full");
    });

    it("returns default classes when no variants provided", () => {
      const classes = badgeVariants({});
      expect(classes).toContain("bg-[var(--ds-gray-100)]");
      expect(classes).toContain("text-label-12");
      expect(classes).toContain("rounded-md");
    });
  });
});
