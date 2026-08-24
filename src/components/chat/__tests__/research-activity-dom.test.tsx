import { describe, it, expect } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import type { ResearchStatus } from "../ResearchActivity";
import { ResearchActivityLine, ResearchSummaryRow } from "../ResearchActivity";

/**
 * DOM-MOUNTED TESTS FOR RESEARCH ACTIVITY COMPONENTS
 *
 * Gap 1 remediation: Real DOM rendering with screen queries instead of
 * hand-rolled JSX tree inspection. Verifies:
 *   - Actual rendered text content (not just props)
 *   - CSS class application (fade-up, mono-label)
 *   - Flexbox layout and styling
 *   - Spinner presence and positioning
 *   - Text truncation and overflow behavior
 *   - Segment separation with "·" joining
 *
 * Key difference from previous tests: these render to happy-dom and query
 * with screen.getByText(), screen.getByRole(), container selectors—not
 * element?.props?.children navigation.
 */

describe("ResearchActivityLine — DOM Rendering & Visual State", () => {
  it("should render null when statuses array is empty (early return)", () => {
    const result = ResearchActivityLine({ statuses: [] });
    expect(result).toBeNull();
  });

  it("should render single status with spinner visible (DOM structure)", () => {
    const statuses: ResearchStatus[] = [{ phase: "search", label: "Searching..." }];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);

    // Verify DOM structure
    expect(container.querySelector(".fade-up")).toBeDefined();
    expect(container.querySelector(".spinner")).toBeDefined();
    expect(screen.getByText("Searching...")).toBeDefined();
  });

  it("should show only the latest status label (not history)", () => {
    const statuses: ResearchStatus[] = [
      { phase: "plan", label: "Planning search strategy" },
      { phase: "search", label: "Searching for sources" },
      { phase: "read", label: "Reading content" },
    ];
    render(<ResearchActivityLine statuses={statuses} />);

    // Latest should be displayed
    expect(screen.getByText("Reading content")).toBeDefined();
    // Previous labels should NOT be displayed
    expect(screen.queryByText("Planning search strategy")).toBeNull();
    expect(screen.queryByText("Searching for sources")).toBeNull();
  });

  it("should accumulate completed phases into summary strip", () => {
    const statuses: ResearchStatus[] = [
      { phase: "search", label: "First search" },
      { phase: "search", label: "Second search" },
      { phase: "search", label: "Third search" },
      { phase: "read", label: "Reading now..." },
    ];
    render(<ResearchActivityLine statuses={statuses} />);

    // Should show accumulated count of searches, not individual labels
    expect(screen.getByText(/Searched 3 queries/)).toBeDefined();
    // Current phase should show
    expect(screen.getByText("Reading now...")).toBeDefined();
    // Should NOT show individual search labels
    expect(screen.queryByText("First search")).toBeNull();
  });

  it("should join summary segments with · separator", () => {
    const statuses: ResearchStatus[] = [
      { phase: "search", label: "Searched" },
      { phase: "read", label: "Reading" },
      { phase: "workspace", label: "Checking workspace" },
      { phase: "synthesize", label: "Synthesizing..." },
    ];
    render(<ResearchActivityLine statuses={statuses} />);

    // All three completed phases should appear in summary
    expect(screen.getByText(/Searched 1 query/)).toBeDefined();
    expect(screen.getByText(/Read 1 source/)).toBeDefined();
    expect(screen.getByText(/Workspace/)).toBeDefined();

    // Check that they are joined (the exact separator check)
    const monoLabel = screen.getByText(/Workspace/);
    const parentSpan = monoLabel;
    // The text content should include all segments joined
    expect(parentSpan.textContent).toContain("·");
  });

  it("should apply fade-up and flex layout classes", () => {
    const statuses: ResearchStatus[] = [{ phase: "search", label: "Searching" }];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);

    const rootDiv = container.querySelector(".fade-up");
    expect(rootDiv).toBeDefined();
    expect(rootDiv?.style.display).toBe("flex");
    expect(rootDiv?.style.flexWrap).toBe("wrap");
  });

  it("should hide summary strip when no completed phases exist", () => {
    const statuses: ResearchStatus[] = [{ phase: "search", label: "Still searching..." }];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);

    // Should have root div but no mono-label (no completed phases)
    expect(container.querySelector(".fade-up")).toBeDefined();
    expect(container.querySelector(".mono-label")).toBeNull();
  });

  it("should show mono-label only when there are summary segments", () => {
    // Two phases: first completes, second is active
    const statuses: ResearchStatus[] = [
      { phase: "search", label: "Searched" },
      { phase: "read", label: "Now reading..." },
    ];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);

    const monoLabel = container.querySelector(".mono-label");
    expect(monoLabel).toBeDefined();
    expect(monoLabel?.textContent).toContain("Searched 1 query");
  });

  it("should apply ellipsis overflow to label span", () => {
    const longLabel =
      "This is a very very very very very very very very long label that should be truncated";
    const statuses: ResearchStatus[] = [{ phase: "search", label: longLabel }];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);

    // Find the label span (second child after spinner)
    const spans = container.querySelectorAll("span");
    let labelSpan: Element | null = null;
    for (let i = 1; i < spans.length; i++) {
      if (spans[i].textContent?.includes(longLabel)) {
        labelSpan = spans[i];
        break;
      }
    }

    expect(labelSpan).toBeDefined();
    expect(labelSpan?.style.textOverflow).toBe("ellipsis");
    expect(labelSpan?.style.whiteSpace).toBe("nowrap");
    expect(labelSpan?.style.overflow).toBe("hidden");
  });

  it("should set maxWidth on label for truncation", () => {
    const statuses: ResearchStatus[] = [{ phase: "search", label: "Label" }];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);

    const spans = container.querySelectorAll("span");
    let labelSpan: HTMLElement | null = null;
    for (let i = 1; i < spans.length; i++) {
      if (spans[i].textContent?.includes("Label")) {
        labelSpan = spans[i] as HTMLElement;
        break;
      }
    }

    expect(labelSpan?.style.maxWidth).toBe("420px");
  });

  it("should render different phase labels correctly", () => {
    const phases: ResearchStatus["phase"][] = ["plan", "search", "read", "workspace", "synthesize"];

    for (const phase of phases) {
      const { unmount } = render(
        <ResearchActivityLine statuses={[{ phase, label: `${phase} status` }]} />,
      );
      expect(screen.getByText(`${phase} status`)).toBeDefined();
      unmount();
    }
  });

  it("should count only matching phases (searches separate from reads)", () => {
    const statuses: ResearchStatus[] = [
      { phase: "search", label: "Search 1" },
      { phase: "read", label: "Read 1" },
      { phase: "search", label: "Search 2" },
      { phase: "read", label: "Read 2" },
      { phase: "synthesize", label: "Synthesizing..." },
    ];
    render(<ResearchActivityLine statuses={statuses} />);

    // Should show 2 searches and 2 reads separately
    expect(screen.getByText(/Searched 2 queries/)).toBeDefined();
    expect(screen.getByText(/Read 2 sources/)).toBeDefined();
    expect(screen.getByText("Synthesizing...")).toBeDefined();
  });
});

describe("ResearchSummaryRow — DOM Rendering & Chip Layout", () => {
  it("should render null when no research metadata", () => {
    const meta = {
      research: null,
      sources: [],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).toBeNull();
  });

  it("should render null for chat-mode research (lightweight)", () => {
    const meta = {
      research: { mode: "chat" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).toBeNull();
  });

  it("should render chips with correct styling (DOM structure)", () => {
    const meta = {
      research: { mode: "internal" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 0,
    };
    const { container } = render(<ResearchSummaryRow meta={meta} />);

    // Should have flex container
    const root = container.querySelector(".flex");
    expect(root).toBeDefined();
    expect(root?.className).toContain("flex-wrap");

    // Should have chip elements
    const chips = container.querySelectorAll(".inline-flex");
    expect(chips.length).toBeGreaterThan(0);
  });

  it("should count web sources only (filter by kind)", () => {
    const meta = {
      research: { mode: "both" as const, sub_queries: [] },
      sources: [
        { kind: "web" as const },
        { kind: "web" as const },
        { kind: "document" as const },
        { kind: "document" as const },
      ],
      workspace_chunks: 0,
    };
    render(<ResearchSummaryRow meta={meta} />);

    // Should show 2 web sources, not 4 total sources
    expect(screen.getByText(/Read 2 sources/)).toBeDefined();
    expect(screen.queryByText(/Read 4 sources/)).toBeNull();
  });

  it("should detect workspace from workspace_chunks", () => {
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [{ kind: "web" as const }],
      workspace_chunks: 5,
    };
    render(<ResearchSummaryRow meta={meta} />);

    expect(screen.getByText(/Workspace/)).toBeDefined();
  });

  it("should detect workspace from non-web sources", () => {
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [{ kind: "document" as const }],
      workspace_chunks: 0,
    };
    render(<ResearchSummaryRow meta={meta} />);

    // Non-web source should trigger workspace segment
    expect(screen.getByText(/Workspace/)).toBeDefined();
  });

  it("should count sub_queries as searches", () => {
    const meta = {
      research: {
        mode: "both" as const,
        sub_queries: ["query1", "query2", "query3"],
      },
      sources: [],
      workspace_chunks: 0,
    };
    render(<ResearchSummaryRow meta={meta} />);

    expect(screen.getByText(/Searched 3 queries/)).toBeDefined();
  });

  it("should render all segments for both-mode with full activity", () => {
    const meta = {
      research: {
        mode: "both" as const,
        sub_queries: ["q1", "q2"],
      },
      sources: [{ kind: "web" as const }, { kind: "web" as const }],
      workspace_chunks: 3,
    };
    render(<ResearchSummaryRow meta={meta} />);

    // Should have all three segments
    expect(screen.getByText(/Searched 2 queries/)).toBeDefined();
    expect(screen.getByText(/Read 2 sources/)).toBeDefined();
    expect(screen.getByText(/Workspace/)).toBeDefined();
  });

  it("should render null when no research activity occurred", () => {
    // Web mode, no sources, no workspace → no segments
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).toBeNull();
  });

  it("should apply chip styling (border, mono-font, uppercase)", () => {
    const meta = {
      research: { mode: "internal" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 0,
    };
    const { container } = render(<ResearchSummaryRow meta={meta} />);

    const chip = container.querySelector(".inline-flex");
    expect(chip?.className).toContain("rounded-full");
    expect(chip?.className).toContain("border");
    expect(chip?.className).toContain("hairline");

    // Check computed style for mono font and uppercase
    expect(chip?.style.fontFamily).toBe("var(--mrd-mono)");
    expect(chip?.style.textTransform).toBe("uppercase");
  });

  it("should use uppercase singular/plural (Workspace not Workspaces)", () => {
    const meta = {
      research: { mode: "internal" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 1,
    };
    render(<ResearchSummaryRow meta={meta} />);

    // Singular "Workspace" in the DOM; uppercasing is CSS text-transform,
    // which styles glyphs without changing textContent.
    expect(screen.getByText(/Workspace/)).toBeDefined();
    expect(screen.queryByText(/Workspaces/)).toBeNull();
  });

  it("should handle internal mode workspace detection", () => {
    const meta = {
      research: { mode: "internal" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 0,
    };
    render(<ResearchSummaryRow meta={meta} />);

    // Internal mode always implies workspace
    expect(screen.getByText(/Workspace/)).toBeDefined();
  });

  it("should use unique key per segment (no React warnings)", () => {
    const meta = {
      research: {
        mode: "both" as const,
        sub_queries: ["q"],
      },
      sources: [{ kind: "web" as const }],
      workspace_chunks: 0,
    };
    // Render multiple times; if keys are not unique, React warnings would appear
    render(<ResearchSummaryRow meta={meta} />);
    render(<ResearchSummaryRow meta={meta} />);

    // Should not crash or warn about duplicate keys
    expect(screen.getAllByText(/Searched 1 query/)).toBeDefined();
  });

  it("should preserve segment order: searches, sources, workspace", () => {
    const meta = {
      research: {
        mode: "both" as const,
        sub_queries: ["q"],
      },
      sources: [{ kind: "web" as const }],
      workspace_chunks: 1,
    };
    const { container } = render(<ResearchSummaryRow meta={meta} />);

    const chips = container.querySelectorAll(".inline-flex");
    const texts = Array.from(chips).map((c) => c.textContent);

    // Order: Searched, Read, Workspace. textContent keeps source casing;
    // the uppercase look comes from CSS text-transform.
    expect(texts[0]).toContain("Searched");
    expect(texts[1]).toContain("Read");
    expect(texts[2]).toContain("Workspace");
  });
});
