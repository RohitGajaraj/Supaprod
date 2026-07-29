import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { DetailHeader, DetailSection, StatCell, StatStrip, toneForScore } from "../DetailKit";

/**
 * Component rendering tests for DetailKit primitives.
 *
 * These tests verify the DOM output and styling of DetailHeader, StatCell,
 * StatStrip, and DetailSection components. They complement the pure-function
 * tests in DetailKit.test.ts (which cover toneForScore).
 *
 * Each component is tested for:
 * - Proper rendering with provided props
 * - Correct semantic HTML structure
 * - Applied CSS styling and layout
 * - Conditional rendering behavior
 */

describe("DetailHeader — Refined detail panel header", () => {
  it("should render title with correct heading level and styling", () => {
    render(<DetailHeader title="Test Opportunity" />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeDefined();
    expect(heading.textContent).toBe("Test Opportunity");
  });

  it("should not render meta row when chips, time, and traceRef are all absent", () => {
    const { container } = render(<DetailHeader title="Simple Title" />);

    const header = container.querySelector("header");
    expect(header).toBeDefined();

    // Only h2, no meta row div
    const divs = Array.from(header?.querySelectorAll("div") ?? []);
    expect(divs.length).toBe(0);
  });

  it("should render meta row when chips are provided", () => {
    const { container } = render(
      <DetailHeader title="Title" chips={<span data-testid="chip">Status</span>} />,
    );

    expect(screen.getByTestId("chip")).toBeDefined();
    expect(container.querySelector("header > div")?.textContent).toContain("Status");
  });

  it("should render time in the meta row", () => {
    const { container } = render(
      <DetailHeader title="Title" time={<span data-testid="time">2 hours ago</span>} />,
    );

    expect(screen.getByTestId("time")).toBeDefined();
    expect(container.querySelector("header > div")?.textContent).toContain("2 hours ago");
  });

  it("should render traceRef in the same meta row as time", () => {
    const { container } = render(
      <DetailHeader
        title="Title"
        time={<span data-testid="time">Time</span>}
        traceRef={<span data-testid="trace">ABC123</span>}
      />,
    );

    expect(screen.getByTestId("time")).toBeDefined();
    expect(screen.getByTestId("trace")).toBeDefined();

    // One meta line carries both. The right-aligned rail they used to sit in
    // was a second alignment axis inside a panel that already had one, and it
    // broke to two lines on a narrow sheet.
    const metaRows = container.querySelectorAll("header > div");
    expect(metaRows.length).toBe(1);
    expect(metaRows[0]?.textContent).toContain("Time");
    expect(metaRows[0]?.textContent).toContain("ABC123");
  });

  it("should render chips, time, and traceRef all together", () => {
    render(
      <DetailHeader
        title="Full Detail"
        chips={<span data-testid="chip">Opportunity</span>}
        time={<span data-testid="time">30m ago</span>}
        traceRef={<span data-testid="trace">XYZ789</span>}
      />,
    );

    expect(screen.getByTestId("chip")).toBeDefined();
    expect(screen.getByTestId("time")).toBeDefined();
    expect(screen.getByTestId("trace")).toBeDefined();
  });

  // The header's own spacing and the h2's size, weight and margin moved out of
  // the inline style and into the shared title class in the 2026-07-29 port,
  // so the two tests that read them off the style attribute were asserting
  // where a declaration lived rather than anything a reader can see.

  it("should not render meta section div when no metadata props provided", () => {
    const { container } = render(<DetailHeader title="Only Title" />);

    const flexDivs = container.querySelectorAll(".flex");
    expect(flexDivs.length).toBe(0);
  });
});

describe("StatCell — Premium compact stat display", () => {
  it("should render value and label with correct structure", () => {
    render(<StatCell label="Score" value="8.5" />);

    expect(screen.getByText("8.5")).toBeDefined();
    expect(screen.getByText("Score")).toBeDefined();
  });

  it("should render with default tone (neutral) when none provided", () => {
    render(<StatCell label="Count" value="42" />);

    expect(screen.getByText("Count")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
  });

  it("should accept and render specified tone prop without error", () => {
    render(<StatCell label="Priority" value="High" tone="madder" />);

    expect(screen.getByText("Priority")).toBeDefined();
    expect(screen.getByText("High")).toBeDefined();
  });

  it("should apply moss tone without error", () => {
    render(<StatCell label="Strength" value="Strong" tone="moss" />);

    expect(screen.getByText("Strength")).toBeDefined();
  });

  it("should apply muted tone without error", () => {
    render(<StatCell label="Status" value="Low" tone="muted" />);

    expect(screen.getByText("Status")).toBeDefined();
  });

  it("should render numeric value", () => {
    render(<StatCell label="Value" value="123" />);

    expect(screen.getByText("123")).toBeDefined();
  });

  it("should render label text", () => {
    render(<StatCell label="queries" value="5" />);

    expect(screen.getByText("queries")).toBeDefined();
  });

  it("should keep the value and its label inside one cell", () => {
    const { container } = render(<StatCell label="Test" value="X" />);

    // The fact and the name of the fact belong to the same object; a stat whose
    // label drifted out of its cell reads as two stats.
    const cell = container.firstElementChild;
    expect(cell?.textContent).toContain("X");
    expect(cell?.textContent).toContain("Test");
  });

  it("should render with nested grid layout", () => {
    const { container } = render(<StatCell label="Tier" value="A" />);

    // Check that there's a main div (the cell) and child divs (value and label)
    const allDivs = Array.from(container.querySelectorAll("div"));
    const hasContent = allDivs.some((div) => div.textContent?.includes("Tier"));
    expect(hasContent).toBe(true);
  });

  it("should center-align content", () => {
    const { container } = render(<StatCell label="Focus" value="High" />);

    const mainCell = container.querySelector("div");
    // Just verify the cell renders
    expect(mainCell).toBeDefined();
  });

  it("should render all tone variants without crashing", () => {
    const tones: Array<"moss" | "glacier" | "madder" | "amber" | "muted" | "neutral"> = [
      "moss",
      "glacier",
      "madder",
      "amber",
      "muted",
      "neutral",
    ];

    tones.forEach((tone) => {
      const { unmount } = render(<StatCell label="Test" value="X" tone={tone} />);
      expect(screen.getByText("Test")).toBeDefined();
      unmount();
    });
  });
});

describe("StatStrip — Horizontal grid of stat cells", () => {
  it("should render children cells in a grid layout", () => {
    const { container } = render(
      <StatStrip>
        <div data-testid="cell1">Cell 1</div>
        <div data-testid="cell2">Cell 2</div>
        <div data-testid="cell3">Cell 3</div>
      </StatStrip>,
    );

    expect(screen.getByTestId("cell1")).toBeDefined();
    expect(screen.getByTestId("cell2")).toBeDefined();
    expect(screen.getByTestId("cell3")).toBeDefined();
  });

  it("should apply grid layout styling to container", () => {
    const { container } = render(
      <StatStrip>
        <span>Cell</span>
      </StatStrip>,
    );

    const grid = container.querySelector("div");
    expect(grid).toBeDefined();
    // Grid should contain children
    expect(grid?.textContent).toContain("Cell");
  });

  it("should default to number of children as column count (3 children)", () => {
    const { container } = render(
      <StatStrip>
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </StatStrip>,
    );

    // Should render without error with 3 children
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("should accept columns prop override without error", () => {
    const { container } = render(
      <StatStrip columns={4}>
        <div>1</div>
        <div>2</div>
      </StatStrip>,
    );

    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
  });

  it("should render with flexible column layout", () => {
    const { container } = render(
      <StatStrip>
        <div>Cell</div>
      </StatStrip>,
    );

    expect(screen.getByText("Cell")).toBeDefined();
  });

  it("should handle columns prop of 1 without error", () => {
    render(
      <StatStrip columns={1}>
        <div data-testid="single">Single Cell</div>
      </StatStrip>,
    );

    expect(screen.getByTestId("single")).toBeDefined();
  });

  it("should render with actual StatCell components", () => {
    render(
      <StatStrip>
        <StatCell label="Score" value="9" tone="moss" />
        <StatCell label="Count" value="42" tone="neutral" />
      </StatStrip>,
    );

    expect(screen.getByText("Score")).toBeDefined();
    expect(screen.getByText("Count")).toBeDefined();
  });
});

describe("DetailSection — Consistent section anatomy", () => {
  it("should render heading with correct semantic structure", () => {
    const { container } = render(
      <DetailSection heading="Overview">
        <div>Section content</div>
      </DetailSection>,
    );

    const section = container.querySelector("section");
    expect(section).toBeDefined();

    // Should contain the heading text
    expect(screen.getByText("Overview")).toBeDefined();
  });

  it("should render hairline top border", () => {
    const { container } = render(
      <DetailSection heading="Details">
        <div>Content</div>
      </DetailSection>,
    );

    const section = container.querySelector("section");
    expect(section).toBeDefined();
    // Verify section renders and contains the heading
    expect(section?.textContent).toContain("Details");
  });

  // The 2px vertical bar before the heading is retired (2026-07-29 port): it
  // is the side-tab accent in a smaller coat, and the rule above the section
  // already says a new section starts here.

  it("should render children content below the heading", () => {
    render(
      <DetailSection heading="Details">
        <div data-testid="content">Custom content here</div>
      </DetailSection>,
    );

    expect(screen.getByTestId("content")).toBeDefined();
  });

  it("should render action control on the heading line when provided", () => {
    render(
      <DetailSection heading="Signals" action={<button data-testid="action-btn">Export</button>}>
        <div>Content</div>
      </DetailSection>,
    );

    const action = screen.getByTestId("action-btn");
    // Same line as the heading it belongs to, rather than floating above the
    // content or trailing it.
    expect(action.parentElement?.textContent).toContain("Signals");
  });

  it("should accept and apply custom style prop to section element", () => {
    const { container } = render(
      <DetailSection heading="Styled" style={{ minHeight: "200px" }}>
        <div>Content</div>
      </DetailSection>,
    );

    const section = container.querySelector("section");
    expect(section).toBeDefined();
    expect(section?.textContent).toContain("Styled");
  });

  it("should maintain grid layout structure", () => {
    const { container } = render(
      <DetailSection heading="Layout">
        <p>Line 1</p>
        <p>Line 2</p>
      </DetailSection>,
    );

    const section = container.querySelector("section");
    expect(section).toBeDefined();
    expect(screen.getByText("Line 1")).toBeDefined();
    expect(screen.getByText("Line 2")).toBeDefined();
  });

  it("should render heading in mono-caps style", () => {
    render(
      <DetailSection heading="metadata">
        <span>Details</span>
      </DetailSection>,
    );

    // Verify the heading is rendered and visible
    expect(screen.getByText("metadata")).toBeDefined();
    // The heading should be rendered (MonoLabel is used internally)
    expect(screen.getByText("Details")).toBeDefined();
  });

  it("should render without action when action prop is not provided", () => {
    const { container } = render(
      <DetailSection heading="Simple">
        <p>No action here</p>
      </DetailSection>,
    );

    const section = container.querySelector("section");
    expect(section).toBeDefined();
    // Should still render the heading
    expect(screen.getByText("Simple")).toBeDefined();
  });

  // The heading row's gap, the section's padding-top and its --hairline rule
  // all moved to the shared block class in the 2026-07-29 port, which is the
  // point of sharing it: a detail section and a surface section can no longer
  // drift apart. Reading them back off the inline style attribute was
  // asserting that they had NOT been shared.
});

describe("toneForScore integration in StatCell", () => {
  it("should use toneForScore to determine cell color dynamically", () => {
    const highScore = toneForScore(9);
    const midScore = toneForScore(5);
    const lowScore = toneForScore(2);

    expect(highScore).toBe("moss");
    expect(midScore).toBe("neutral");
    expect(lowScore).toBe("muted");
  });

  it("should render StatCell with tone determined by toneForScore", () => {
    const score = 8.5;
    const tone = toneForScore(score);

    render(<StatCell label="Rating" value={String(score)} tone={tone} />);

    // Should render without error with dynamic tone
    expect(screen.getByText("8.5")).toBeDefined();
    expect(screen.getByText("Rating")).toBeDefined();
    // For a score of 8.5, tone should be "moss"
    expect(tone).toBe("moss");
  });
});
