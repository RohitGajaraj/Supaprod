import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ResearchStatus } from "./ResearchActivity";
import {
  parseResearchStatus,
  summarySegments,
  ResearchActivityLine,
  ResearchSummaryRow,
} from "./ResearchActivity";

describe("parseResearchStatus", () => {
  it("should parse valid research status", () => {
    const result = parseResearchStatus({
      phase: "search",
      label: "Searching for results",
    });
    expect(result).toEqual({
      phase: "search",
      label: "Searching for results",
    });
  });

  it("should return null for invalid phase", () => {
    expect(parseResearchStatus({ phase: "invalid", label: "test" })).toBeNull();
  });

  it("should return null for missing phase", () => {
    expect(parseResearchStatus({ label: "test" })).toBeNull();
  });

  it("should return null for missing label", () => {
    expect(parseResearchStatus({ phase: "search" })).toBeNull();
  });

  it("should return null for non-string phase", () => {
    expect(parseResearchStatus({ phase: 123, label: "test" })).toBeNull();
  });

  it("should return null for non-string label", () => {
    expect(parseResearchStatus({ phase: "search", label: 123 })).toBeNull();
  });

  it("should return null for non-object input", () => {
    expect(parseResearchStatus("invalid")).toBeNull();
    expect(parseResearchStatus(null)).toBeNull();
    expect(parseResearchStatus(undefined)).toBeNull();
  });

  it("should accept all valid phases", () => {
    const phases: ResearchStatus["phase"][] = ["plan", "search", "read", "workspace", "synthesize"];
    for (const phase of phases) {
      const result = parseResearchStatus({ phase, label: "test" });
      expect(result).not.toBeNull();
      expect(result?.phase).toBe(phase);
    }
  });
});

describe("summarySegments", () => {
  it("should return empty array when all inputs are 0/false", () => {
    expect(summarySegments(0, 0, false)).toEqual([]);
  });

  it("should format singular query", () => {
    expect(summarySegments(1, 0, false)).toContain("Searched 1 query");
  });

  it("should format plural queries", () => {
    expect(summarySegments(3, 0, false)).toContain("Searched 3 queries");
  });

  it("should format singular source", () => {
    expect(summarySegments(0, 1, false)).toContain("Read 1 source");
  });

  it("should format plural sources", () => {
    expect(summarySegments(0, 5, false)).toContain("Read 5 sources");
  });

  it("should include workspace when true", () => {
    expect(summarySegments(0, 0, true)).toContain("Workspace");
  });

  it("should combine multiple segments in order", () => {
    const result = summarySegments(2, 3, true);
    expect(result.length).toBe(3);
    expect(result[0]).toBe("Searched 2 queries");
    expect(result[1]).toBe("Read 3 sources");
    expect(result[2]).toBe("Workspace");
  });

  it("should handle edge case: zero searches but multiple reads", () => {
    const result = summarySegments(0, 10, false);
    expect(result).toEqual(["Read 10 sources"]);
  });

  it("should handle edge case: multiple searches but zero reads", () => {
    const result = summarySegments(5, 0, false);
    expect(result).toEqual(["Searched 5 queries"]);
  });
});

describe("ResearchActivityLine", () => {
  it("should return null for empty statuses", () => {
    const result = ResearchActivityLine({ statuses: [] });
    expect(result).toBeNull();
  });

  it("should render with single status", () => {
    const statuses: ResearchStatus[] = [{ phase: "search", label: "Searching..." }];
    render(<ResearchActivityLine statuses={statuses} />);
    expect(screen.getByText("Searching...")).toBeDefined();
  });

  it("should show latest status label (DOM-rendered)", () => {
    const statuses: ResearchStatus[] = [
      { phase: "plan", label: "Planning" },
      { phase: "search", label: "Searching for sources" },
    ];
    render(<ResearchActivityLine statuses={statuses} />);
    // Verify the latest label is displayed in the DOM
    expect(screen.getByText("Searching for sources")).toBeDefined();
    // Ensure earlier label is NOT shown (only latest is active)
    expect(screen.queryByText("Planning")).toBeNull();
  });

  it("should accumulate done phases in summary (DOM-rendered)", () => {
    const statuses: ResearchStatus[] = [
      { phase: "search", label: "Searched" },
      { phase: "search", label: "Searched again" },
      { phase: "read", label: "Reading..." },
    ];
    render(<ResearchActivityLine statuses={statuses} />);
    // Verify accumulated done phases appear in the DOM summary
    expect(screen.getByText(/Searched 2 queries/)).toBeDefined();
    // Verify current phase label is shown
    expect(screen.getByText("Reading...")).toBeDefined();
  });

  it("should handle workspace in summary", () => {
    const statuses: ResearchStatus[] = [
      { phase: "workspace", label: "Checking workspace" },
      { phase: "synthesize", label: "Synthesizing..." },
    ];
    render(<ResearchActivityLine statuses={statuses} />);
    expect(screen.getByText("Synthesizing...")).toBeDefined();
    // Workspace should appear in the accumulated summary
    expect(screen.getByText(/Workspace/)).toBeDefined();
  });

  it("should render spinner and label with fade-up class", () => {
    const statuses: ResearchStatus[] = [{ phase: "search", label: "Searching" }];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);
    const rootDiv = container.querySelector(".fade-up");
    expect(rootDiv).toBeDefined();
    // Verify flex layout styling is applied
    expect(rootDiv?.style.display).toBe("flex");
  });

  it("should show spinner element", () => {
    const statuses: ResearchStatus[] = [{ phase: "search", label: "Searching" }];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);
    const spinner = container.querySelector(".spinner");
    expect(spinner).toBeDefined();
  });

  it("should truncate long labels with ellipsis", () => {
    const longLabel = "A".repeat(500); // Very long label
    const statuses: ResearchStatus[] = [{ phase: "search", label: longLabel }];
    const { container } = render(<ResearchActivityLine statuses={statuses} />);
    const labelSpan = container.querySelector("span[style*='text-overflow']");
    expect(labelSpan).toBeDefined();
    expect(labelSpan?.style.textOverflow).toBe("ellipsis");
    expect(labelSpan?.style.whiteSpace).toBe("nowrap");
  });
});

describe("ResearchSummaryRow", () => {
  it("should return null when no research meta", () => {
    const meta = {
      research: null,
      sources: [],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).toBeNull();
  });

  it("should return null for chat-mode research (no real research)", () => {
    const meta = {
      research: { mode: "chat", sub_queries: [] },
      sources: [],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).toBeNull();
  });

  it("should render for internal mode with no sources", () => {
    const meta = {
      research: {
        mode: "internal" as const,
        sub_queries: [],
      },
      sources: [],
      workspace_chunks: 0,
    };
    render(<ResearchSummaryRow meta={meta} />);
    // Should render a container with segments
    expect(document.body.textContent).toContain("Workspace");
  });

  it("should count web sources only (DOM-rendered)", () => {
    const meta = {
      research: { mode: "both" as const, sub_queries: [] },
      sources: [{ kind: "web" as const }, { kind: "web" as const }, { kind: "document" as const }],
      workspace_chunks: 0,
    };
    render(<ResearchSummaryRow meta={meta} />);
    // Should render summary with 2 web sources counted
    expect(screen.getByText(/Read 2 sources/)).toBeDefined();
  });

  it("should include workspace chunks in workspace detection (DOM-rendered)", () => {
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 5,
    };
    render(<ResearchSummaryRow meta={meta} />);
    // Workspace chunks should trigger workspace segment
    expect(screen.getByText(/Workspace/)).toBeDefined();
  });

  it("should detect workspace from non-web sources (DOM-rendered)", () => {
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [{ kind: "document" as const }],
      workspace_chunks: 0,
    };
    render(<ResearchSummaryRow meta={meta} />);
    // Non-web sources should trigger workspace segment
    expect(screen.getByText(/Workspace/)).toBeDefined();
  });

  it("should render when web research has web sources", () => {
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [{ kind: "web" as const }],
      workspace_chunks: 0,
    };
    render(<ResearchSummaryRow meta={meta} />);
    // Web research with web sources should render
    expect(screen.getByText(/Read 1 source/)).toBeDefined();
  });

  it("should handle both mode with multiple source types (DOM-rendered)", () => {
    const meta = {
      research: {
        mode: "both" as const,
        sub_queries: ["query1", "query2"],
      },
      sources: [
        { kind: "web" as const },
        { kind: "document" as const },
        { kind: "document" as const },
      ],
      workspace_chunks: 3,
    };
    render(<ResearchSummaryRow meta={meta} />);
    // Should include searched queries, read web sources, and workspace
    expect(screen.getByText(/Searched 2 queries/)).toBeDefined();
    expect(screen.getByText(/Read 1 source/)).toBeDefined();
    expect(screen.getByText(/Workspace/)).toBeDefined();
  });

  it("should render segments with correct styling and structure", () => {
    const meta = {
      research: { mode: "internal" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 1,
    };
    const { container } = render(<ResearchSummaryRow meta={meta} />);
    // Verify the container has flex layout
    const rootDiv = container.querySelector(".flex");
    expect(rootDiv).toBeDefined();
    // Verify segments are rendered as spans with proper styling
    const segments = container.querySelectorAll("span.inline-flex");
    expect(segments.length).toBeGreaterThan(0);
  });
});
