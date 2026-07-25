import { describe, expect, test, it } from "bun:test";
import { render } from "@testing-library/react";
import { toneForScore, DetailHeader, StatCell, StatStrip, DetailSection } from "./DetailKit";

describe("toneForScore", () => {
  describe("happy path: three scoring tiers", () => {
    test("score 10 (strong) returns moss", () => {
      expect(toneForScore(10)).toBe("moss");
    });

    test("score 8 (strong boundary) returns moss", () => {
      expect(toneForScore(8)).toBe("moss");
    });

    test("score 7 (strong floor) returns moss", () => {
      expect(toneForScore(7)).toBe("moss");
    });

    test("score 6 (mid tier) returns neutral", () => {
      expect(toneForScore(6)).toBe("neutral");
    });

    test("score 5 (mid-range) returns neutral", () => {
      expect(toneForScore(5)).toBe("neutral");
    });

    test("score 4 (mid floor) returns neutral", () => {
      expect(toneForScore(4)).toBe("neutral");
    });

    test("score 3 (low tier) returns muted", () => {
      expect(toneForScore(3)).toBe("muted");
    });

    test("score 1 (low boundary) returns muted", () => {
      expect(toneForScore(1)).toBe("muted");
    });

    test("score 0 (zero) returns muted", () => {
      expect(toneForScore(0)).toBe("muted");
    });
  });

  describe("boundary conditions: threshold boundaries are exact", () => {
    test("boundary at 7.0: just below 7 (6.9) returns neutral", () => {
      expect(toneForScore(6.9)).toBe("neutral");
    });

    test("boundary at 7.0: exactly 7 returns moss", () => {
      expect(toneForScore(7.0)).toBe("moss");
    });

    test("boundary at 7.0: just above 7 (7.1) returns moss", () => {
      expect(toneForScore(7.1)).toBe("moss");
    });

    test("boundary at 4.0: just below 4 (3.9) returns muted", () => {
      expect(toneForScore(3.9)).toBe("muted");
    });

    test("boundary at 4.0: exactly 4 returns neutral", () => {
      expect(toneForScore(4.0)).toBe("neutral");
    });

    test("boundary at 4.0: just above 4 (4.1) returns neutral", () => {
      expect(toneForScore(4.1)).toBe("neutral");
    });
  });

  describe("edge cases: extreme and unusual values", () => {
    test("negative score returns muted", () => {
      expect(toneForScore(-5)).toBe("muted");
    });

    test("very high score (100) returns moss", () => {
      expect(toneForScore(100)).toBe("moss");
    });

    test("fractional precision in strong tier (7.5) returns moss", () => {
      expect(toneForScore(7.5)).toBe("moss");
    });

    test("fractional precision in mid tier (4.5) returns neutral", () => {
      expect(toneForScore(4.5)).toBe("neutral");
    });

    test("fractional precision in low tier (2.5) returns muted", () => {
      expect(toneForScore(2.5)).toBe("muted");
    });

    test("very small positive (0.001) returns muted", () => {
      expect(toneForScore(0.001)).toBe("muted");
    });
  });

  describe("return type consistency: always returns exactly one of the three tones", () => {
    test("does not return undefined", () => {
      expect(toneForScore(5)).toBeDefined();
    });

    test("does not return null", () => {
      expect(toneForScore(5)).not.toBeNull();
    });

    test("returned value is always a string", () => {
      expect(typeof toneForScore(5)).toBe("string");
    });

    test("all tier returns are in the valid StatTone union", () => {
      const validTones = ["moss", "neutral", "muted"];
      const testScores = [10, 7, 6, 4, 3, 0];
      testScores.forEach((score) => {
        const result = toneForScore(score);
        expect(validTones).toContain(result);
      });
    });
  });

  describe("semantic correctness: tones match their intended strength signal", () => {
    test("moss (strong) is returned only for scores >= 7", () => {
      const mossScores = [7, 7.5, 8, 9, 10];
      mossScores.forEach((score) => {
        expect(toneForScore(score)).toBe("moss");
      });
      // Verify scores below 7 do NOT return moss
      expect(toneForScore(6.99)).not.toBe("moss");
      expect(toneForScore(0)).not.toBe("moss");
    });

    test("neutral (mid) is returned only for 4 <= score < 7", () => {
      const neutralScores = [4, 4.5, 5, 5.5, 6, 6.9];
      neutralScores.forEach((score) => {
        expect(toneForScore(score)).toBe("neutral");
      });
      // Verify boundaries
      expect(toneForScore(3.99)).not.toBe("neutral");
      expect(toneForScore(7.0)).not.toBe("neutral");
    });

    test("muted (low) is returned only for scores < 4", () => {
      const mutedScores = [0, 1, 2, 3, 3.5, 3.99];
      mutedScores.forEach((score) => {
        expect(toneForScore(score)).toBe("muted");
      });
      // Verify boundary
      expect(toneForScore(4.0)).not.toBe("muted");
    });
  });
});

describe("DetailHeader", () => {
  describe("render", () => {
    it("renders title text", () => {
      const { container } = render(<DetailHeader title="Opportunity Review" />);
      expect(container.textContent).toContain("Opportunity Review");
    });

    it("renders as h2 element", () => {
      const { container } = render(<DetailHeader title="Test Title" />);
      const heading = container.querySelector("h2");
      expect(heading?.textContent).toBe("Test Title");
    });

    it("applies correct heading styles", () => {
      const { container } = render(<DetailHeader title="Styled Title" />);
      const heading = container.querySelector("h2");
      expect(heading?.style.fontSize).toBe("18px");
      expect(heading?.style.fontWeight).toBe("600");
      expect(heading?.style.color).toBe("var(--text-primary)");
    });
  });

  describe("chips prop", () => {
    it("renders chips when provided", () => {
      const { container } = render(
        <DetailHeader title="Title" chips={<div data-testid="chip">Status Badge</div>} />,
      );
      expect(container.querySelector('[data-testid="chip"]')).toBeTruthy();
    });

    it("does not render chips section when chips prop is undefined", () => {
      const { container } = render(<DetailHeader title="Title" chips={undefined} />);
      // Meta row should not be rendered if no chips, traceRef, or time
      expect(container.querySelectorAll("header > div").length).toBe(1); // Only title
    });

    it("renders chips in flex row layout", () => {
      const { container } = render(<DetailHeader title="Title" chips={<span>Chip1</span>} />);
      const metaRow = container.querySelector(".flex.flex-wrap");
      expect(metaRow).toBeTruthy();
    });
  });

  describe("traceRef prop", () => {
    it("renders traceRef when provided", () => {
      const { container } = render(
        <DetailHeader title="Title" traceRef={<span data-testid="trace">trace-123</span>} />,
      );
      expect(container.querySelector('[data-testid="trace"]')).toBeTruthy();
    });

    it("positions traceRef on the right", () => {
      const { container } = render(<DetailHeader title="Title" traceRef={<span>trace</span>} />);
      const rightSection = container.querySelector("span[style*='marginLeft']");
      expect(rightSection?.style.marginLeft).toBe("auto");
    });
  });

  describe("time prop", () => {
    it("renders time when provided", () => {
      const { container } = render(
        <DetailHeader title="Title" time={<span data-testid="time">2026-07-24</span>} />,
      );
      expect(container.querySelector('[data-testid="time"]')).toBeTruthy();
    });

    it("positions time on the right", () => {
      const { container } = render(<DetailHeader title="Title" time={<span>2026-07-24</span>} />);
      const rightSection = container.querySelector("span[style*='marginLeft']");
      expect(rightSection).toBeTruthy();
    });

    it("renders time and traceRef together", () => {
      const { container } = render(
        <DetailHeader
          title="Title"
          time={<span data-testid="time">2026-07-24</span>}
          traceRef={<span data-testid="trace">ref-123</span>}
        />,
      );
      expect(container.querySelector('[data-testid="time"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="trace"]')).toBeTruthy();
    });
  });

  describe("metadata rendering logic", () => {
    it("renders meta section when only chips are provided", () => {
      const { container } = render(<DetailHeader title="Title" chips={<span>Chip</span>} />);
      const metaSection = container.querySelector("header > div:nth-child(2)");
      expect(metaSection).toBeTruthy();
    });

    it("renders meta section when only time is provided", () => {
      const { container } = render(<DetailHeader title="Title" time={<span>2026-07-24</span>} />);
      const metaSection = container.querySelector("header > div:nth-child(2)");
      expect(metaSection).toBeTruthy();
    });

    it("renders meta section when only traceRef is provided", () => {
      const { container } = render(<DetailHeader title="Title" traceRef={<span>ref</span>} />);
      const metaSection = container.querySelector("header > div:nth-child(2)");
      expect(metaSection).toBeTruthy();
    });

    it("does not render meta section when no optional props are provided", () => {
      const { container } = render(<DetailHeader title="Title" />);
      const header = container.querySelector("header");
      // Should only have the h2 title, no meta row
      expect(header?.children.length).toBe(1);
    });
  });

  describe("styling and spacing", () => {
    it("applies correct gap to title and meta row", () => {
      const { container } = render(<DetailHeader title="Title" time={<span>Time</span>} />);
      const header = container.querySelector("header");
      expect(header?.style.gap).toBe("10px");
    });

    it("applies correct gap between chips and time/trace", () => {
      const { container } = render(
        <DetailHeader title="Title" chips={<span>Chip</span>} time={<span>Time</span>} />,
      );
      const metaRow = container.querySelector(".flex.flex-wrap");
      expect(metaRow?.style.gap).toBe("8px");
    });
  });
});

describe("StatCell", () => {
  describe("render", () => {
    it("renders value text", () => {
      const { container } = render(<StatCell label="Strength" value="8" />);
      expect(container.textContent).toContain("8");
    });

    it("renders label text in uppercase", () => {
      const { container } = render(<StatCell label="Strength" value="8" />);
      const labelDiv = Array.from(container.querySelectorAll("div")).find(
        (d) => d.textContent === "STRENGTH",
      );
      expect(labelDiv).toBeTruthy();
    });

    it("renders label with mono font", () => {
      const { container } = render(<StatCell label="Strength" value="8" />);
      const labelDiv = container.querySelector("div:last-child");
      expect(labelDiv?.style.fontFamily).toBe("var(--font-mono)");
    });
  });

  describe("tone prop", () => {
    it("applies moss tone color when tone='moss'", () => {
      const { container } = render(<StatCell label="Strong" value="9" tone="moss" />);
      const valueDiv = container.querySelector("div:first-child");
      expect(valueDiv?.style.color).toBe("var(--moss)");
    });

    it("applies glacier tone color when tone='glacier'", () => {
      const { container } = render(<StatCell label="Data" value="42" tone="glacier" />);
      const valueDiv = container.querySelector("div:first-child");
      expect(valueDiv?.style.color).toBe("var(--ds-gray-1000)");
    });

    it("applies neutral tone color by default", () => {
      const { container } = render(<StatCell label="Default" value="5" />);
      const valueDiv = container.querySelector("div:first-child");
      expect(valueDiv?.style.color).toBe("var(--text-primary)");
    });

    it("applies madder tone color when tone='madder'", () => {
      const { container } = render(<StatCell label="Risk" value="7" tone="madder" />);
      const valueDiv = container.querySelector("div:first-child");
      expect(valueDiv?.style.color).toBe("var(--madder)");
    });

    it("applies muted tone color when tone='muted'", () => {
      const { container } = render(<StatCell label="Low" value="2" tone="muted" />);
      const valueDiv = container.querySelector("div:first-child");
      expect(valueDiv?.style.color).toBe("var(--text-muted)");
    });

    it("applies tone to background tint", () => {
      const { container } = render(<StatCell label="Strong" value="8" tone="moss" />);
      const cellDiv = container.querySelector("div:first-of-type");
      expect(cellDiv?.style.background).toContain("color-mix");
      expect(cellDiv?.style.background).toContain("var(--moss)");
    });
  });

  describe("styling", () => {
    it("renders as rounded cell with border", () => {
      const { container } = render(<StatCell label="Test" value="5" />);
      const cell = container.querySelector("div:first-of-type");
      expect(cell?.style.borderRadius).toBe("var(--radius-control)");
      expect(cell?.style.border).toBe("1px solid var(--hairline)");
    });

    it("applies padding and text-center", () => {
      const { container } = render(<StatCell label="Test" value="5" />);
      const cell = container.querySelector("div:first-of-type");
      expect(cell?.style.padding).toBe("6px 8px");
      expect(cell?.style.textAlign).toBe("center");
    });

    it("renders as grid layout with gap", () => {
      const { container } = render(<StatCell label="Test" value="5" />);
      const cell = container.querySelector("div:first-of-type");
      expect(cell?.style.display).toBe("grid");
      expect(cell?.style.gap).toBe("3px");
    });
  });

  describe("value formatting", () => {
    it("renders numeric values without formatting", () => {
      const { container } = render(<StatCell label="Count" value="1234" />);
      expect(container.textContent).toContain("1234");
    });

    it("applies tabular-nums for numeric alignment", () => {
      const { container } = render(<StatCell label="Metrics" value="999" />);
      const valueDiv = container.querySelector("div:first-child");
      expect(valueDiv?.style.fontVariantNumeric).toBe("tabular-nums");
    });

    it("renders long values in large font", () => {
      const { container } = render(<StatCell label="Long" value="Very long value" />);
      const valueDiv = container.querySelector("div:first-child");
      expect(valueDiv?.style.fontSize).toBe("15px");
    });
  });
});

describe("StatStrip", () => {
  describe("render", () => {
    it("renders children", () => {
      const { container } = render(
        <StatStrip>
          <div data-testid="cell">Cell 1</div>
          <div data-testid="cell">Cell 2</div>
        </StatStrip>,
      );
      expect(container.querySelectorAll('[data-testid="cell"]')).toHaveLength(2);
    });

    it("renders as grid", () => {
      const { container } = render(
        <StatStrip>
          <div>Cell</div>
        </StatStrip>,
      );
      const grid = container.querySelector("div:first-of-type");
      expect(grid?.style.display).toBe("grid");
    });
  });

  describe("columns prop", () => {
    it("uses explicit columns count when provided", () => {
      const { container } = render(
        <StatStrip columns={3}>
          <div>Cell 1</div>
          <div>Cell 2</div>
        </StatStrip>,
      );
      const grid = container.querySelector("div:first-of-type");
      expect(grid?.style.gridTemplateColumns).toContain("repeat(3");
    });

    it("defaults to child count when columns not provided", () => {
      const { container } = render(
        <StatStrip>
          <div>Cell 1</div>
          <div>Cell 2</div>
          <div>Cell 3</div>
        </StatStrip>,
      );
      const grid = container.querySelector("div:first-of-type");
      expect(grid?.style.gridTemplateColumns).toContain("repeat(3");
    });

    it("handles single child without explicit columns", () => {
      const { container } = render(
        <StatStrip>
          <div>Only cell</div>
        </StatStrip>,
      );
      const grid = container.querySelector("div:first-of-type");
      expect(grid?.style.gridTemplateColumns).toContain("repeat(1");
    });

    it("guarantees at least 1 column", () => {
      const { container } = render(
        <StatStrip columns={0}>
          <div>Cell</div>
        </StatStrip>,
      );
      const grid = container.querySelector("div:first-of-type");
      expect(grid?.style.gridTemplateColumns).toContain("repeat(1");
    });
  });

  describe("spacing", () => {
    it("applies 6px gap between cells", () => {
      const { container } = render(
        <StatStrip>
          <div>Cell 1</div>
          <div>Cell 2</div>
        </StatStrip>,
      );
      const grid = container.querySelector("div:first-of-type");
      expect(grid?.style.gap).toBe("6px");
    });
  });

  describe("conditional rendering", () => {
    it("handles conditional children correctly", () => {
      const showSecondCell = true;
      const { container } = render(
        <StatStrip>
          <div>Cell 1</div>
          {showSecondCell && <div>Cell 2</div>}
        </StatStrip>,
      );
      expect(container.querySelectorAll("div > div").length).toBeGreaterThan(1);
    });
  });
});

describe("DetailSection", () => {
  describe("render", () => {
    it("renders heading text", () => {
      const { container } = render(
        <DetailSection heading="Properties">
          <div>Content</div>
        </DetailSection>,
      );
      expect(container.textContent).toContain("PROPERTIES");
    });

    it("renders children content", () => {
      const { container } = render(
        <DetailSection heading="Details">
          <div data-testid="content">Section content</div>
        </DetailSection>,
      );
      expect(container.querySelector('[data-testid="content"]')).toBeTruthy();
    });

    it("renders as section element", () => {
      const { container } = render(
        <DetailSection heading="Test">
          <div>Content</div>
        </DetailSection>,
      );
      const section = container.querySelector("section");
      expect(section).toBeTruthy();
    });
  });

  describe("heading styling", () => {
    it("renders heading with mono caps style", () => {
      const { container } = render(
        <DetailSection heading="Section">
          <div>Content</div>
        </DetailSection>,
      );
      const headingElement = Array.from(container.querySelectorAll("span")).find(
        (s) => s.textContent === "SECTION",
      );
      expect(headingElement?.className).toContain("uppercase");
    });

    it("renders accent bar before heading", () => {
      const { container } = render(
        <DetailSection heading="Test">
          <div>Content</div>
        </DetailSection>,
      );
      const bar = container.querySelector("span[style*='height: 11px']");
      expect(bar).toBeTruthy();
      expect(bar?.style.width).toBe("2px");
      expect(bar?.style.borderRadius).toBe("999px");
    });

    it("applies correct heading typography", () => {
      const { container } = render(
        <DetailSection heading="Typography Test">
          <div>Content</div>
        </DetailSection>,
      );
      const monoLabel = container.querySelector("span[style*='font-size']");
      expect(monoLabel?.style.fontSize).toBe("10px");
      expect(monoLabel?.style.letterSpacing).toBe("0.1em");
    });
  });

  describe("action prop", () => {
    it("renders action when provided", () => {
      const { container } = render(
        <DetailSection heading="Heading" action={<button data-testid="action">Edit</button>}>
          <div>Content</div>
        </DetailSection>,
      );
      expect(container.querySelector('[data-testid="action"]')).toBeTruthy();
    });

    it("positions action on the right of heading", () => {
      const { container } = render(
        <DetailSection heading="Heading" action={<button>Action</button>}>
          <div>Content</div>
        </DetailSection>,
      );
      const headingRow = container.querySelector(".flex.items-center.justify-between");
      expect(headingRow).toBeTruthy();
    });

    it("does not render action container when action is undefined", () => {
      const { container } = render(
        <DetailSection heading="Heading">
          <div>Content</div>
        </DetailSection>,
      );
      const headingRow = container.querySelector(".flex.items-center.justify-between");
      // The container is still there but action is not
      const action = headingRow?.querySelector("button");
      expect(action).toBeFalsy();
    });
  });

  describe("styling", () => {
    it("applies border-top divider", () => {
      const { container } = render(
        <DetailSection heading="Section">
          <div>Content</div>
        </DetailSection>,
      );
      const section = container.querySelector("section");
      expect(section?.style.borderTop).toBe("1px solid var(--hairline)");
    });

    it("applies padding and gap", () => {
      const { container } = render(
        <DetailSection heading="Section">
          <div>Content</div>
        </DetailSection>,
      );
      const section = container.querySelector("section");
      expect(section?.style.paddingTop).toBe("15px");
      expect(section?.style.gap).toBe("10px");
    });

    it("renders as grid display", () => {
      const { container } = render(
        <DetailSection heading="Section">
          <div>Content</div>
        </DetailSection>,
      );
      const section = container.querySelector("section");
      expect(section?.style.display).toBe("grid");
    });
  });

  describe("custom style prop", () => {
    it("applies custom styles", () => {
      const { container } = render(
        <DetailSection heading="Section" style={{ marginBottom: "20px" }}>
          <div>Content</div>
        </DetailSection>,
      );
      const section = container.querySelector("section");
      expect(section?.style.marginBottom).toBe("20px");
    });

    it("merges custom styles with defaults", () => {
      const { container } = render(
        <DetailSection heading="Section" style={{ marginBottom: "20px" }}>
          <div>Content</div>
        </DetailSection>,
      );
      const section = container.querySelector("section");
      // Defaults should still apply
      expect(section?.style.borderTop).toBe("1px solid var(--hairline)");
      // Custom should apply
      expect(section?.style.marginBottom).toBe("20px");
    });
  });

  describe("spacing between sections", () => {
    it("applies correct gap to section children", () => {
      const { container } = render(
        <DetailSection heading="Section">
          <div data-testid="child1">Content 1</div>
          <div data-testid="child2">Content 2</div>
        </DetailSection>,
      );
      const section = container.querySelector("section");
      expect(section?.style.gap).toBe("10px");
    });
  });
});
