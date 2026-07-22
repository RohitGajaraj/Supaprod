import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  describe("render", () => {
    it("renders as an inline block div", () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("inline-block");
    });

    it("renders with default medium size", () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("h-6");
      expect(spinner?.className).toContain("w-6");
      expect(spinner?.className).toContain("border-2");
    });

    it("renders with animation", () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("animate-spin");
    });
  });

  describe("size variants", () => {
    it("renders small size", () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("h-4");
      expect(spinner?.className).toContain("w-4");
      expect(spinner?.className).toContain("border-2");
    });

    it("renders medium size", () => {
      const { container } = render(<Spinner size="md" />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("h-6");
      expect(spinner?.className).toContain("w-6");
      expect(spinner?.className).toContain("border-2");
    });

    it("renders large size", () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("h-8");
      expect(spinner?.className).toContain("w-8");
      expect(spinner?.className).toContain("border-3");
    });
  });

  describe("border styles", () => {
    it("renders with border color", () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("border-[var(--ds-gray-400)]");
    });

    it("renders with top border color (dark side of rotation)", () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("border-t-[var(--ds-gray-600)]");
    });

    it("applies correct border width for small size", () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("border-2");
    });

    it("applies correct border width for large size", () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("border-3");
    });
  });

  describe("motion gating", () => {
    it("respects data-motion=off attribute to disable animation", () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector("div") as HTMLDivElement;

      // Set data-motion="off" to simulate reduced-motion preference
      spinner.setAttribute("data-motion", "off");

      expect(spinner.getAttribute("data-motion")).toBe("off");
      expect(spinner.className).toContain("data-[motion=off]:animate-none");
    });

    it("removes animation when motion is disabled", () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector("div");

      // The class should contain the rule even if motion is not off
      expect(spinner?.className).toContain("data-[motion=off]:animate-none");
    });

    it("uses lighter border color when motion is disabled", () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector("div");

      // When data-motion=off, the border-t should revert to the lighter gray
      expect(spinner?.className).toContain("data-[motion=off]:border-t-[var(--ds-gray-400)]");
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to div element", () => {
      const ref = { current: null };
      render(<Spinner ref={ref} />);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe("DIV");
    });

    it("allows access to DOM element via ref", () => {
      const ref = { current: null };
      render(<Spinner size="lg" ref={ref} />);
      expect(ref.current?.className).toContain("h-8");
      expect(ref.current?.className).toContain("w-8");
    });
  });

  describe("className merge", () => {
    it("merges custom className with default styles", () => {
      const { container } = render(<Spinner className="custom-spin" />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("custom-spin");
      expect(spinner?.className).toContain("animate-spin");
    });

    it("allows className override of default styles", () => {
      const { container } = render(<Spinner className="!animate-pulse" />);
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("!animate-pulse");
    });
  });

  describe("HTMLAttributes", () => {
    it("accepts standard HTML attributes", () => {
      const { container } = render(
        <Spinner data-testid="my-spinner" id="spinner-1" aria-label="Loading" />,
      );
      const spinner = container.querySelector("[data-testid='my-spinner']");
      expect(spinner).toBeTruthy();
      expect(spinner?.id).toBe("spinner-1");
      expect(spinner?.getAttribute("aria-label")).toBe("Loading");
    });

    it("accepts role attribute for accessibility", () => {
      const { container } = render(<Spinner role="status" aria-live="polite" />);
      const spinner = container.querySelector("[role='status']");
      expect(spinner?.getAttribute("aria-live")).toBe("polite");
    });

    it("renders properly when used as loading indicator with aria-live", () => {
      const { container } = render(
        <div>
          <span>Loading content...</span>
          <Spinner role="status" aria-live="polite" aria-label="Loading" />
        </div>,
      );

      const spinner = container.querySelector("[role='status']");
      expect(spinner?.getAttribute("aria-label")).toBe("Loading");
      expect(spinner?.getAttribute("aria-live")).toBe("polite");
    });
  });

  describe("color variants", () => {
    it("supports custom color via className", () => {
      const { container } = render(
        <Spinner className="border-[var(--ds-amber-400)] border-t-[var(--ds-amber-600)]" />,
      );
      const spinner = container.querySelector("div");
      expect(spinner?.className).toContain("border-[var(--ds-amber-400)]");
      expect(spinner?.className).toContain("border-t-[var(--ds-amber-600)]");
    });
  });

  describe("composition", () => {
    it("can be used inline with text", () => {
      const { container } = render(
        <div>
          <Spinner size="sm" />
          <span>Loading...</span>
        </div>,
      );

      const allDivs = container.querySelectorAll("div");
      // Find the spinner div (should be the innermost one)
      const spinner = Array.from(allDivs).find(
        (el) => el.querySelector === undefined || el.childNodes.length === 0,
      );
      const text = container.querySelector("span");

      expect(spinner).toBeTruthy();
      expect(spinner?.tagName).toBe("DIV");
      expect(text?.textContent).toBe("Loading...");
    });

    it("can be nested in flex layouts", () => {
      const { container } = render(
        <div className="flex items-center gap-2">
          <Spinner size="sm" />
          <span>Processing</span>
        </div>,
      );

      const spinner = container.querySelector("div div");
      expect(spinner).toBeTruthy();
    });
  });
});
