import { describe, expect, test, it } from "bun:test";
import { render, screen } from "@testing-library/react";
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
  });

  describe("chips prop", () => {
    it("renders chips when provided", () => {
      const { container } = render(
        <DetailHeader title="Title" chips={<div data-testid="chip">Status Badge</div>} />,
      );
      expect(container.querySelector('[data-testid="chip"]')).toBeTruthy();
    });

    it("does not render a meta line when chips are undefined and nothing else is passed", () => {
      const { container } = render(<DetailHeader title="Title" chips={undefined} />);
      // No chips, traceRef or time: a header with a dangling empty line under
      // the title is the bug this guards.
      expect(container.querySelector("header > div")).toBeNull();
    });
  });

  describe("traceRef prop", () => {
    it("renders traceRef when provided", () => {
      const { container } = render(
        <DetailHeader title="Title" traceRef={<span data-testid="trace">trace-123</span>} />,
      );
      expect(container.querySelector('[data-testid="trace"]')).toBeTruthy();
    });
  });

  describe("time prop", () => {
    it("renders time when provided", () => {
      const { container } = render(
        <DetailHeader title="Title" time={<span data-testid="time">2026-07-24</span>} />,
      );
      expect(container.querySelector('[data-testid="time"]')).toBeTruthy();
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

  // The two-sided flex rail that pushed time and trace to the right edge is
  // gone (2026-07-29 port): it was a second alignment axis inside a panel that
  // already had one, and it broke to two lines on a narrow sheet. Everything
  // the header carries now sits on ONE meta line under the title, so the tests
  // that pinned marginLeft: auto, the .flex.flex-wrap class, the 8px and 10px
  // gaps, and the h2's inline font size, weight and colour were describing a
  // layout that no longer exists. What a reader depends on is that each piece
  // is present and legible, which the tests above assert.
  describe("one meta line", () => {
    it("puts chips, time and traceRef on the same line under the title", () => {
      const { container } = render(
        <DetailHeader
          title="Title"
          chips={<span>Backlog</span>}
          time={<span>2026-07-24</span>}
          traceRef={<span>ref-123</span>}
        />,
      );
      const metaLines = container.querySelectorAll("header > div");
      expect(metaLines.length).toBe(1);
      expect(metaLines[0]?.textContent).toContain("Backlog");
      expect(metaLines[0]?.textContent).toContain("2026-07-24");
      expect(metaLines[0]?.textContent).toContain("ref-123");
    });

    it("never leaves a dangling separator when a piece is missing", () => {
      const { container } = render(<DetailHeader title="Title" time={<span>2026-07-24</span>} />);
      const meta = container.querySelector("header > div")?.textContent ?? "";
      expect(meta.trim()).toBe("2026-07-24");
    });
  });
});

describe("StatCell", () => {
  describe("render", () => {
    it("renders value text", () => {
      const { container } = render(<StatCell label="Strength" value="8" />);
      expect(container.textContent).toContain("8");
    });

    it("renders the label as given", () => {
      render(<StatCell label="Strength" value="8" />);
      expect(screen.getByText("Strength")).toBeDefined();
    });
  });

  // The bordered, tinted, centred tile is gone (2026-07-29 port): a bordered
  // cell inside a bordered sheet is a card in a card, and nineteen of them in
  // one region is nineteen bordered containers against a cap of one. The cell
  // is now the shared `Cell` primitive, tinted and never bordered, styled from
  // the stylesheet rather than inline. So the assertions that pinned the
  // border, the radius, the padding, text-align, display: grid, the 3px gap,
  // font-variant-numeric, a 15px font size, the mono label face, the uppercase
  // label and the retired --moss / --madder / --text-primary / --text-muted /
  // --ds-gray-1000 tone tokens were all describing the wrapper. What a reader
  // depends on is that the fact and its name both render, and that a tone
  // never eats them.
  describe("tone prop", () => {
    it("renders the value and the label under every tone", () => {
      const tones = ["moss", "glacier", "madder", "amber", "muted", "neutral"] as const;
      for (const tone of tones) {
        const { unmount } = render(<StatCell label="Strength" value="8.5" tone={tone} />);
        expect(screen.getByText("8.5"), `value missing under tone ${tone}`).toBeDefined();
        expect(screen.getByText("Strength"), `label missing under tone ${tone}`).toBeDefined();
        unmount();
      }
    });
  });

  describe("value formatting", () => {
    it("renders numeric values without formatting", () => {
      const { container } = render(<StatCell label="Count" value="1234" />);
      expect(container.textContent).toContain("1234");
    });

    it("renders a word value as a word, not as data", () => {
      const { container } = render(<StatCell label="Lane" value="Backlog" />);
      expect(container.textContent).toContain("Backlog");
      // Mono is for numbers, durations, counts, costs, identifiers and
      // timestamps, and for nothing else: a lane name is a word.
      //
      // Asserted on `[data-num]` rather than on `.sp-num`, which is the class
      // the retired system painted. Meridian's `Num` carries `data-num` as the
      // SEMANTIC hook for exactly this reason, stated in its own header: a
      // guard that reads a Tailwind class is testing the paint, and the paint
      // has now changed twice. The claim here is "this is data", not "this
      // wears that class".
      expect(container.querySelector("[data-num]")).toBeNull();
    });

    it("renders a numeric value as data, so figures line up column to column", () => {
      const { container } = render(<StatCell label="Cost" value="$0.04" />);
      expect(container.querySelector("[data-num]")?.textContent).toBe("$0.04");
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

  // display: grid and the 6px gap moved out of the inline style and into the
  // shared grid class in the 2026-07-29 port, so those two assertions were
  // pinning where a declaration lived rather than what the strip does. The
  // column count, which is the strip's one real job (three stats read across,
  // never 2 + 1), is still written inline and is still asserted above.

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
      // Sentence case, as given. The mono caps heading is retired: mono is for
      // data and a section heading is prose.
      expect(container.textContent).toContain("Properties");
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

  // Two things were deliberately killed in the 2026-07-29 port, and their
  // tests went with them: the mono caps heading (mono is for data, and a
  // section heading is prose) and the 2px vertical bar before it (the side-tab
  // accent in a smaller coat, when the rule above the section already says a
  // new section starts here). The heading's inline font size and letter
  // spacing went to the stylesheet in the same move.

  describe("action prop", () => {
    it("renders action when provided", () => {
      const { container } = render(
        <DetailSection heading="Heading" action={<button data-testid="action">Edit</button>}>
          <div>Content</div>
        </DetailSection>,
      );
      expect(container.querySelector('[data-testid="action"]')).toBeTruthy();
    });

    it("puts the action on the heading line, not above or below the content", () => {
      render(
        <DetailSection heading="Heading" action={<button>Action</button>}>
          <div>Content</div>
        </DetailSection>,
      );
      const action = screen.getByRole("button", { name: "Action" });
      expect(action.parentElement?.textContent).toContain("Heading");
    });

    it("renders no control at all when action is undefined", () => {
      render(
        <DetailSection heading="Heading">
          <div>Content</div>
        </DetailSection>,
      );
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  // The rule, the padding, the gap and display: grid all moved to the shared
  // block class in the 2026-07-29 port, which is the point of sharing it: a
  // detail section and a surface section can no longer drift apart. Asserting
  // them inline was asserting that they had NOT been shared.

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

    it("a custom style never costs the heading or the content", () => {
      render(
        <DetailSection heading="Section" style={{ marginBottom: "20px" }}>
          <div>Content</div>
        </DetailSection>,
      );
      expect(screen.getByText("Section")).toBeDefined();
      expect(screen.getByText("Content")).toBeDefined();
    });
  });
});
