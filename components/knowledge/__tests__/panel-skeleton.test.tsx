import { describe, test, expect } from "bun:test";
import { render } from "@testing-library/react";
import { PanelSkeleton } from "../PanelSkeleton";

describe("PanelSkeleton", () => {
  test("renders default rows [64, 120, 120]", () => {
    const { container } = render(<PanelSkeleton />);
    const skeletonRows = container.querySelectorAll("div[aria-hidden='true']");
    expect(skeletonRows.length).toBe(3);
  });

  test("renders custom rows when provided", () => {
    const { container } = render(<PanelSkeleton rows={[100, 150]} />);
    const skeletonRows = container.querySelectorAll("div[aria-hidden='true']");
    expect(skeletonRows.length).toBe(2);
  });

  test("sets correct height for each row", () => {
    const { container } = render(<PanelSkeleton rows={[64, 120, 80]} />);
    const skeletonRows = container.querySelectorAll("div[aria-hidden='true']");
    expect((skeletonRows[0] as HTMLElement).style.height).toBe("64px");
    expect((skeletonRows[1] as HTMLElement).style.height).toBe("120px");
    expect((skeletonRows[2] as HTMLElement).style.height).toBe("80px");
  });

  test("sets width 100% for non-last rows", () => {
    const { container } = render(<PanelSkeleton rows={[64, 120, 80]} />);
    const skeletonRows = container.querySelectorAll("div[aria-hidden='true']");
    expect((skeletonRows[0] as HTMLElement).style.width).toBe("100%");
    expect((skeletonRows[1] as HTMLElement).style.width).toBe("100%");
  });

  test("sets width 70% for last row", () => {
    const { container } = render(<PanelSkeleton rows={[64, 120, 80]} />);
    const skeletonRows = container.querySelectorAll("div[aria-hidden='true']");
    expect((skeletonRows[2] as HTMLElement).style.width).toBe("70%");
  });

  test("sets width 70% for last row even with single row", () => {
    const { container } = render(<PanelSkeleton rows={[100]} />);
    const skeletonRows = container.querySelectorAll("div[aria-hidden='true']");
    expect((skeletonRows[0] as HTMLElement).style.width).toBe("70%");
  });

  test("applies border-radius-card style", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const skeletonRow = container.querySelector("div[aria-hidden='true']");
    expect((skeletonRow as HTMLElement).style.borderRadius).toBe("var(--radius-card)");
  });

  test("applies shimmer animation", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const skeletonRow = container.querySelector("div[aria-hidden='true']");
    expect((skeletonRow as HTMLElement).style.animation).toContain("cadShimmer");
  });

  test("sets animation duration to 1.6s", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const skeletonRow = container.querySelector("div[aria-hidden='true']");
    expect((skeletonRow as HTMLElement).style.animation).toContain("1.6s");
  });

  test("sets animation to linear infinite", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const skeletonRow = container.querySelector("div[aria-hidden='true']");
    expect((skeletonRow as HTMLElement).style.animation).toContain("linear");
    expect((skeletonRow as HTMLElement).style.animation).toContain("infinite");
  });

  test("applies gradient background", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const skeletonRow = container.querySelector("div[aria-hidden='true']");
    const bgStyle = (skeletonRow as HTMLElement).style.background;
    expect(bgStyle).toContain("linear-gradient");
    expect(bgStyle).toContain("90deg");
  });

  test("includes role='status' on container", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const roleContainer = container.querySelector("[role='status']");
    expect(roleContainer).toBeDefined();
  });

  test("includes sr-only loading text", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const srText = container.querySelector(".sr-only");
    expect(srText?.textContent).toContain("Loading");
  });

  test("sets display flex and flexDirection column on container", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const roleContainer = container.querySelector("[role='status']") as HTMLElement;
    expect(roleContainer.style.display).toBe("flex");
    expect(roleContainer.style.flexDirection).toBe("column");
  });

  test("sets gap 12 on container", () => {
    const { container } = render(<PanelSkeleton rows={[64]} />);
    const roleContainer = container.querySelector("[role='status']") as HTMLElement;
    expect(roleContainer.style.gap).toBe("12px");
  });

  test("handles empty rows array", () => {
    const { container } = render(<PanelSkeleton rows={[]} />);
    const skeletonRows = container.querySelectorAll("div[aria-hidden='true']");
    expect(skeletonRows.length).toBe(0);
  });
});
